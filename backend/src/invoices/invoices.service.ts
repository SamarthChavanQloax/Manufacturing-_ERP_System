import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceBox, Box, BoxPacking, Packing, Part } from '../entities';

@Injectable()
export class InvoicesService {
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

    if (currentInvoiceTotal + thisBoxQty > invoice.qty) {
      throw new BadRequestException('Error 406 : Part Qty Mismatch, adding this box exceeds invoice quantity');
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

    return { success: true, message: 'Box Added to Invoice Successfully' };
  }

  async lockInvoice(invoiceId: number) {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

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
}
