import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceBox, InvoiceMatch, InvoiceBoxMatch, Box, BoxPacking, Part } from '../entities';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceBox)
    private invoiceBoxRepo: Repository<InvoiceBox>,
    @InjectRepository(InvoiceMatch)
    private invoiceMatchRepo: Repository<InvoiceMatch>,
    @InjectRepository(InvoiceBoxMatch)
    private invoiceBoxMatchRepo: Repository<InvoiceBoxMatch>,
    @InjectRepository(Box)
    private boxRepo: Repository<Box>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
  ) {}

  private getLegacyDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    return { dateStr, timeStr };
  }

  async startVerification(invoiceBarcode: string, userId: number) {
    const invoice = await this.invoiceRepo.findOne({
      where: { barcode: String(invoiceBarcode).trim() },
    });
    if (!invoice) {
      throw new BadRequestException('Error : Invoice Number Not Found !!!');
    }

    const existingMatch = await this.invoiceMatchRepo.findOne({
      where: { invoice_number: invoice.barcode },
    });
    if (existingMatch) {
      throw new BadRequestException(
        'Error : Invoice Number Already In Verification Process , Please Select Invoice Number From Following Table !!!',
      );
    }

    const { dateStr, timeStr } = this.getLegacyDateTime();

    const match = this.invoiceMatchRepo.create({
      invoice_number: invoice.barcode,
      total_stock: invoice.qty,
      created_by: userId,
      created_time: dateStr,
      created_date: timeStr,
      status: 'pending',
    });

    const savedMatch = await this.invoiceMatchRepo.save(match);

    invoice.status = 'used';
    await this.invoiceRepo.save(invoice);

    return {
      ...savedMatch,
      invoice_match_id: savedMatch.id,
    };
  }

  async findAll() {
    return this.invoiceMatchRepo.find({ order: { id: 'DESC' } });
  }

  async findOne(matchId: number) {
    const match = await this.invoiceMatchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Verification record not found');

    const invoice = await this.invoiceRepo.findOne({
      where: { barcode: match.invoice_number },
    });

    let expectedBoxes: any[] = [];
    let scannedBoxes: any[] = [];
    let isMatched = false;

    if (invoice) {
      const invoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
      expectedBoxes = invoiceBoxes;

      scannedBoxes = await this.invoiceBoxMatchRepo.find({ where: { invoice_id: invoice.id } });

      if (expectedBoxes.length > 0 && scannedBoxes.length >= expectedBoxes.length) {
        isMatched = true;
      }
    }

    const gateOutCode = invoice ? `${invoice.invoice_number}4000${match.id}` : '';

    return {
      match,
      invoice,
      expected_boxes_count: expectedBoxes.length,
      scanned_boxes_count: scannedBoxes.length,
      checked: isMatched,
      is_complete: isMatched,
      gate_out_code: gateOutCode,
      clearance_code: gateOutCode,
      scanned_boxes: scannedBoxes,
    };
  }

  async scanBox(matchId: number, boxBarcode: string, userId: number) {
    const match = await this.invoiceMatchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Verification record not found');

    const invoice = await this.invoiceRepo.findOne({
      where: { barcode: match.invoice_number },
    });
    if (!invoice) throw new BadRequestException('Invoice not found');

    // Verify box barcode is mapped to this invoice in invoice_box
    const validInvoiceBox = await this.invoiceBoxRepo.findOne({
      where: { invoice_id: invoice.id, box_id: Number(boxBarcode) },
    });
    if (!validInvoiceBox) {
      throw new BadRequestException('Error : Box barcode not found in this invoice !!!!');
    }

    // Check if already scanned
    const alreadyScanned = await this.invoiceBoxMatchRepo.findOne({
      where: { invoice_id: invoice.id, box_id: Number(boxBarcode) },
    });
    if (alreadyScanned) {
      throw new BadRequestException('Error : Box barcode already scanned for this invoice');
    }

    const { dateStr, timeStr } = this.getLegacyDateTime();

    const boxMatch = this.invoiceBoxMatchRepo.create({
      box_id: Number(boxBarcode),
      invoice_id: invoice.id,
      created_by: userId,
      created_date: dateStr,
      created_time: timeStr,
      status: 'pending',
    });

    await this.invoiceBoxMatchRepo.save(boxMatch);

    // Check if all boxes are scanned
    const totalExpected = await this.invoiceBoxRepo.count({ where: { invoice_id: invoice.id } });
    const totalScanned = await this.invoiceBoxMatchRepo.count({ where: { invoice_id: invoice.id } });

    if (totalExpected > 0 && totalScanned >= totalExpected) {
      match.status = 'verified';
      await this.invoiceMatchRepo.save(match);
    }

    return {
      success: true,
      matched: true,
      message: 'Added Successfully',
      completed: totalExpected > 0 && totalScanned >= totalExpected,
      remaining: Math.max(0, totalExpected - totalScanned),
    };
  }

  async returnInvoice(matchId: number, invoiceBarcode?: string) {
    const match = await this.invoiceMatchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Verification record not found');

    const barcode = invoiceBarcode || match.invoice_number;
    const invoice = await this.invoiceRepo.findOne({
      where: { barcode },
    });
    if (invoice) {
      invoice.status = 'pending';
      await this.invoiceRepo.save(invoice);

      await this.invoiceBoxMatchRepo.delete({ invoice_id: invoice.id });
    }

    await this.invoiceMatchRepo.delete(matchId);
    return { success: true, message: 'Invoice Returned Successfully' };
  }
}
