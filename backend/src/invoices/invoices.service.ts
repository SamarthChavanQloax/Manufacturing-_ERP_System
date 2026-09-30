import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceBox, Box, BoxPacking, Packing, Part, UserInfo } from '../entities';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private mismatchAttempts = new Map<string, { count: number; firstAttempt: number; lastAttempt: number; boxBarcodes: string[] }>();

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceBox)
    private invoiceBoxRepo: Repository<InvoiceBox>,
    @InjectRepository(Box)
    private boxRepo: Repository<Box>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(UserInfo)
    private userRepo: Repository<UserInfo>,
    private notificationService: NotificationService,
  ) {}

  private getLegacyDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    return { dateStr, timeStr };
  }

  async create(data: { invoice_number: string; part_id: number; qty: number }, userId: number) {
    if (!data.invoice_number || !data.part_id || !data.qty) {
      throw new BadRequestException('Invoice number, Part, and Quantity are required');
    }

    if (data.invoice_number.trim().length > 20) {
      throw new BadRequestException('Error : Invoice Number must not exceed 20 characters');
    }

    const existing = await this.invoiceRepo.findOne({
      where: { invoice_number: data.invoice_number.trim() },
    });
    if (existing) {
      throw new BadRequestException('Error : Invoice Number Already Exists');
    }

    const count = await this.invoiceRepo.count();
    const barcode = String(300000 + count);
    const { dateStr, timeStr } = this.getLegacyDateTime();

    const invoice = this.invoiceRepo.create({
      barcode,
      invoice_number: data.invoice_number.trim(),
      part_id: Number(data.part_id),
      qty: Number(data.qty),
      created_by: userId,
      created_date: timeStr,
      created_time: dateStr,
      status: 'pending',
      lock_status: 'no',
      status_new: 'pending',
    });

    return this.invoiceRepo.save(invoice);
  }

  async findAll(fromDate?: string, toDate?: string) {
    let query = this.invoiceRepo.createQueryBuilder('i');

    if (fromDate && toDate) {
      query = query.where('i.created_time >= :fromDate AND i.created_time <= :toDate', {
        fromDate,
        toDate,
      });
    }

    const invoices = await query.orderBy('i.id', 'DESC').getMany();

    const result = await Promise.all(
      invoices.map(async (inv) => {
        const part = await this.partRepo.findOne({ where: { id: inv.part_id } });
        return {
          ...inv,
          part_number: part?.part_number || '',
          part_description: part?.part_description || '',
        };
      }),
    );

    return result;
  }

  async findOne(id: number) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const part = await this.partRepo.findOne({ where: { id: invoice.part_id } });
    const invoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });

    let totalPartQty = 0;
    const boxesWithDetails: any[] = [];

    for (const ib of invoiceBoxes) {
      const box = await this.boxRepo.findOne({ where: { barcode: String(ib.box_id) } });
      let boxQty = 0;
      if (box) {
        const boxPackings = await this.boxPackingRepo.find({
          where: [{ box_id: box.id }, { box_id: Number(box.barcode) }],
        });
        for (const bp of boxPackings) {
          boxQty += bp.part_qty || 0;
        }
      }
      totalPartQty += boxQty;
      boxesWithDetails.push({
        ...ib,
        box_barcode: ib.box_id,
        box_name: (box?.box_name || '').trim(),
        box_qty: boxQty,
      });
    }

    return {
      invoice,
      part: part ? { ...part, part_number: (part.part_number || '').trim() } : null,
      total_part_qty: totalPartQty,
      boxes: boxesWithDetails,
    };
  }

  async addBoxToInvoice(invoiceId: number, boxBarcode: string, userId: number) {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.lock_status === 'yes') {
      throw new BadRequestException('Error: Invoice is already locked');
    }

    const cleanBoxBarcode = String(boxBarcode).trim();

    // 1. Verify box barcode exists and is pending
    const box = await this.boxRepo.findOne({
      where: { barcode: cleanBoxBarcode, status: 'pending' },
    });
    if (!box) {
      throw new BadRequestException('Error : Box barcode not found or already used in another invoice !!!!');
    }

    // Step Restriction: Box must be finalized & locked by the box operator first
    if (box.lock_status !== 'yes') {
      throw new BadRequestException(
        `Error: Box #${box.barcode} is still Unlocked / Open! The box station operator must verify and lock (seal) this box before it can be added to an invoice.`,
      );
    }

    // 2. Get box packing using safe dual ID / barcode lookup
    const boxPackings = await this.boxPackingRepo.find({
      where: [{ box_id: box.id }, { box_id: Number(box.barcode) }],
    });
    if (!boxPackings || boxPackings.length === 0) {
      throw new BadRequestException('Error 403 : Box barcode contains no packing items !!!!');
    }

    // 3. Verify box part matches invoice part
    const boxPartId = boxPackings[0].part_id;
    const invoicePart = await this.partRepo.findOne({ where: { id: invoice.part_id } });
    const isPartMatch =
      boxPartId === invoice.part_id ||
      (invoicePart && box.box_name.trim() === invoicePart.part_number.trim());

    if (!isPartMatch) {
      throw new BadRequestException('Error 405 : Packing Part Number Mismatch Please Try Again');
    }

    // 4. Calculate total quantity
    let currentInvoiceTotal = 0;
    const existingInvoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
    for (const eib of existingInvoiceBoxes) {
      const b = await this.boxRepo.findOne({ where: { barcode: String(eib.box_id) } });
      if (b) {
        const bps = await this.boxPackingRepo.find({
          where: [{ box_id: b.id }, { box_id: Number(b.barcode) }],
        });
        for (const bp of bps) {
          currentInvoiceTotal += bp.part_qty || 0;
        }
      }
    }

    let thisBoxQty = 0;
    for (const bp of boxPackings) {
      thisBoxQty += bp.part_qty || 0;
    }

    const remainingQty = Math.max(0, invoice.qty - currentInvoiceTotal);
    const excessQty = (currentInvoiceTotal + thisBoxQty) - invoice.qty;

    if (currentInvoiceTotal + thisBoxQty > invoice.qty) {
      const attemptKey = `inv_${invoice.id}_user_${userId}`;
      const now = Date.now();
      const existingAttempt = this.mismatchAttempts.get(attemptKey);

      let attemptCount = 1;
      if (existingAttempt && now - existingAttempt.lastAttempt < 15 * 60 * 1000) {
        attemptCount = existingAttempt.count + 1;
        existingAttempt.count = attemptCount;
        existingAttempt.lastAttempt = now;
        if (!existingAttempt.boxBarcodes.includes(box.barcode)) {
          existingAttempt.boxBarcodes.push(box.barcode);
        }
      } else {
        this.mismatchAttempts.set(attemptKey, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          boxBarcodes: [box.barcode],
        });
      }

      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (attemptCount >= 2) {
        await this.sendQuantityMismatchRiskNotification({
          invoice,
          invoicePart,
          box,
          thisBoxQty,
          currentInvoiceTotal,
          remainingQty,
          excessQty,
          boxPackings,
          user,
          userId,
          attemptCount,
        });

        this.logger.warn(
          `Security Alert: Repeated Qty Mismatch (Attempt #${attemptCount}) by user ${userId} on Invoice ${invoice.invoice_number}`,
        );

        throw new BadRequestException(
          `Error 406 : Repeated Part Qty Mismatch (Attempt #${attemptCount})! Box #${box.barcode} contains ${thisBoxQty} pcs, which exceeds the remaining invoice capacity of ${remainingQty} pcs (Part: ${invoicePart?.part_number || 'N/A'}). A high-risk security alert has been dispatched to administrators.`,
        );
      }

      throw new BadRequestException(
        `Error 406 : Part Qty Mismatch! Adding box #${box.barcode} (${thisBoxQty} pcs) exceeds invoice quantity (${currentInvoiceTotal}/${invoice.qty} pcs filled, only ${remainingQty} pcs remaining).`,
      );
    }

    const { dateStr, timeStr } = this.getLegacyDateTime();

    // 7. Map box to invoice inside a transaction
    await this.invoiceRepo.manager.transaction(async (transactionManager) => {
      const invoiceBox = transactionManager.create(InvoiceBox, {
        box_id: Number(box.barcode),
        invoice_id: invoice.id,
        created_by: userId,
        created_date: dateStr,
        created_time: timeStr,
        status: 'pending',
      });
      await transactionManager.save(InvoiceBox, invoiceBox);

      // Update box status to used
      box.status = 'used';
      await transactionManager.save(Box, box);

      // Update box_packing status to used (matching legacy update_data_new("box_packing", ...))
      for (const bp of boxPackings) {
        bp.status = 'used';
        await transactionManager.save(BoxPacking, bp);
      }
    });

    // Reset attempt tracker upon successful addition
    this.mismatchAttempts.delete(`inv_${invoice.id}_user_${userId}`);

    return { success: true, message: 'Box Added to Invoice Successfully' };
  }

  async lockInvoice(invoiceId: number) {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const invoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
    if (!invoiceBoxes || invoiceBoxes.length === 0) {
      throw new BadRequestException('Error: Cannot lock an empty invoice! Please scan and map locked boxes first.');
    }

    invoice.lock_status = 'yes';
    await this.invoiceRepo.save(invoice);
    return { success: true, lock_status: 'yes', message: 'Invoice Locked Successfully' };
  }

  async delete(id: number) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Revert all associated boxes to pending
    const invoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
    for (const ib of invoiceBoxes) {
      const box = await this.boxRepo.findOne({ where: { barcode: String(ib.box_id) } });
      if (box) {
        box.status = 'pending';
        await this.boxRepo.save(box);
      }
      await this.invoiceBoxRepo.delete(ib.id);
    }

    return this.invoiceRepo.delete(id);
  }

  /**
   * Dispatches an explainable, evidence-backed security risk notification to administrators
   * when repeated quantity mismatch attempts occur during invoice box mapping.
   * Conforms strictly to AGENTS.md Explainability Standard.
   */
  private async sendQuantityMismatchRiskNotification(params: {
    invoice: Invoice;
    invoicePart: Part | null;
    box: Box;
    thisBoxQty: number;
    currentInvoiceTotal: number;
    remainingQty: number;
    excessQty: number;
    boxPackings: BoxPacking[];
    user: UserInfo | null;
    userId: number;
    attemptCount: number;
  }) {
    const {
      invoice,
      invoicePart,
      box,
      thisBoxQty,
      currentInvoiceTotal,
      remainingQty,
      excessQty,
      boxPackings,
      user,
      userId,
      attemptCount,
    } = params;

    const operatorName = user?.user_name || `Operator #${userId}`;
    const operatorEmail = user?.user_email || 'N/A';
    const operatorRole = user?.type || 'invoice';

    const partNum = (invoicePart?.part_number || box.box_name || 'N/A').trim();
    const partDesc = invoicePart?.part_description || 'N/A';
    const partModel = invoicePart?.model || 'N/A';
    const partHsn = invoicePart?.hsn_code || 'N/A';

    // Retrieve full pack details for all packings inside this box
    const packList: Array<{
      pack_id: number;
      part_qty: number;
      created_date: string;
      created_time: string;
      created_by: number;
      packer_name?: string;
    }> = [];

    for (const bp of boxPackings) {
      const packerUser = await this.userRepo.findOne({ where: { id: bp.created_by } });
      packList.push({
        pack_id: bp.pack_id,
        part_qty: bp.part_qty,
        created_date: bp.created_date,
        created_time: bp.created_time,
        created_by: bp.created_by,
        packer_name: packerUser?.user_name || `User #${bp.created_by}`,
      });
    }

    const priority = attemptCount >= 3 ? 'CRITICAL' : 'HIGH';
    const riskScore = attemptCount >= 3 ? 92 : 82;

    const packSummaryLines = packList
      .map(
        (p) =>
          `  - Pack Barcode #${p.pack_id}: ${p.part_qty} pcs (Packed by ${p.packer_name} on ${p.created_date} ${p.created_time})`,
      )
      .join('\n');

    const notificationMessage = `Repeated quantity mismatch attempts detected in Invoice Box Mapping section.

1. OPERATOR & ATTEMPT DETAILS:
   - User Name: ${operatorName}
   - User ID: ${userId} | Role: ${operatorRole.toUpperCase()} | Email: ${operatorEmail}
   - Attempts: ${attemptCount} consecutive failed attempts within 15 minutes.

2. INVOICE & PART DETAILS:
   - Invoice Number: ${invoice.invoice_number} (Barcode: ${invoice.barcode})
   - Part Number: ${partNum}
   - Part Description: ${partDesc}
   - Model / HSN: ${partModel} / ${partHsn}
   - Invoice Required Qty: ${invoice.qty} pcs
   - Currently Filled Qty: ${currentInvoiceTotal} pcs
   - Remaining Allowed Qty: ${remainingQty} pcs

3. SCANNED BOX DETAILS:
   - Box Barcode: #${box.barcode}
   - Box Part Identifier: ${box.box_name}
   - Box Total Qty: ${thisBoxQty} pcs
   - Excess Above Invoice: +${excessQty} pcs overflow (Exceeds remaining capacity)
   - Box Status: ${box.status} | Sealed/Locked: ${box.lock_status}

4. PACK DETAILS INSIDE THIS BOX (${packList.length} packs):
${packSummaryLines || '  - No individual pack details found'}

5. MANDATORY AI EXPLAINABILITY & AUDIT TRAIL (AGENTS.md):
   - What Happened: User ${operatorName} repeatedly attempted to assign Box #${box.barcode} containing ${thisBoxQty} pcs to Invoice ${invoice.invoice_number}, exceeding the allowed balance.
   - Root Cause: Physical box quantity (${thisBoxQty} pcs) exceeds remaining permitted invoice balance (${remainingQty} pcs) by +${excessQty} items.
   - Risk Assessment: Score ${riskScore}/100 (${priority}). Potential mislabeling, over-shipment risk, or inventory dispatch anomaly.
   - Recommended Human Action: Supervisor must inspect Box #${box.barcode} and verify physical counts against the packing slip before re-authorizing invoice assignment.`;

    const metadata = {
      alert_category: 'INVOICE_QUANTITY_MISMATCH',
      attempt_count: attemptCount,
      risk_score: riskScore,
      risk_level: priority,
      operator: {
        id: userId,
        name: operatorName,
        email: operatorEmail,
        role: operatorRole,
      },
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        barcode: invoice.barcode,
        required_qty: invoice.qty,
        current_filled_qty: currentInvoiceTotal,
        remaining_allowed_qty: remainingQty,
        excess_qty: excessQty,
      },
      part: {
        id: invoice.part_id,
        part_number: partNum,
        description: partDesc,
        model: partModel,
        hsn: partHsn,
      },
      box: {
        id: box.id,
        barcode: box.barcode,
        box_name: box.box_name,
        total_qty: thisBoxQty,
        lock_status: box.lock_status,
      },
      packings: packList,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.notificationService.createNotification({
        recipient_role: 'admin',
        type: 'INVOICE_QTY_MISMATCH_RISK',
        priority,
        title: `🚨 Risk Alert: Repeated Box Qty Mismatch on Invoice ${invoice.invoice_number} (Attempt #${attemptCount})`,
        message: notificationMessage,
        entity_type: 'invoice',
        entity_id: invoice.invoice_number,
        action_url: `/add_box_to_invoice/${invoice.id}`,
        dedup_key: `mismatch_inv_${invoice.id}_user_${userId}`,
        metadata,
      });

      this.logger.log(
        `Successfully logged Risk Notification for Invoice #${invoice.invoice_number} (Operator: ${operatorName}, Attempt #${attemptCount})`,
      );
    } catch (err: any) {
      this.logger.error('Failed to create quantity mismatch notification:', err?.message || err);
    }
  }
}
