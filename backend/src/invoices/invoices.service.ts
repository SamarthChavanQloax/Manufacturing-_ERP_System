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
        const boxPackings = await this.boxPackingRepo.find({ where: { box_id: box.id } });
        for (const bp of boxPackings) {
          boxQty += bp.part_qty || 0;
        }
      }
      totalPartQty += boxQty;
      boxesWithDetails.push({
        ...ib,
        box_barcode: ib.box_id,
        box_name: box?.box_name || '',
        box_qty: boxQty,
      });
    }

    return {
      invoice,
      part,
      total_part_qty: totalPartQty,
      boxes: boxesWithDetails,
    };
  }

  async addBoxToInvoice(invoiceId: number, boxBarcode: string, userId: number) {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // 1. Verify box barcode exists and is pending
    const box = await this.boxRepo.findOne({
      where: { barcode: String(boxBarcode), status: 'pending' },
    });
    if (!box) {
      throw new BadRequestException('Error : Box barcode not found or already used in another invoice !!!!');
    }

    // 2. Get box packing
    const boxPackings = await this.boxPackingRepo.find({ where: { box_id: box.id } });
    if (!boxPackings || boxPackings.length === 0) {
      throw new BadRequestException('Error 403 : Box barcode contains no packing items !!!!');
    }

    // 3. Verify box part matches invoice part
    const boxPartId = boxPackings[0].part_id;
    if (boxPartId !== invoice.part_id) {
      throw new BadRequestException('Error 405 : Packing Part Number Mismatch Please Try Again');
    }

    // 4. Calculate total quantity
    let currentInvoiceTotal = 0;
    const existingInvoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
    for (const eib of existingInvoiceBoxes) {
      const b = await this.boxRepo.findOne({ where: { barcode: String(eib.box_id) } });
      if (b) {
        const bps = await this.boxPackingRepo.find({ where: { box_id: b.id } });
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

    const invoiceBox = this.invoiceBoxRepo.create({
      box_id: Number(box.barcode),
      invoice_id: invoice.id,
      created_by: userId,
      created_date: dateStr,
      created_time: timeStr,
      status: 'used',
    });

    await this.invoiceBoxRepo.save(invoiceBox);

    // Update box status to used
    box.status = 'used';
    await this.boxRepo.save(box);

    return { success: true, message: 'Box Added to Invoice Successfully' };
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
