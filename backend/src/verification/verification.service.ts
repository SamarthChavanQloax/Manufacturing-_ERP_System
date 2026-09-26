import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Invoice,
  InvoiceBox,
  InvoiceMatch,
  InvoiceBoxMatch,
  Box,
  BoxPacking,
  Part,
  GateRiskAnalysis,
} from '../entities';
import { GateRiskService } from '../ai/gate-risk.service';

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
    @InjectRepository(GateRiskAnalysis)
    private riskAnalysisRepo: Repository<GateRiskAnalysis>,
    @Inject(forwardRef(() => GateRiskService))
    private gateRiskService: GateRiskService,
  ) {}

  private getLegacyDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    return { dateStr, timeStr };
  }

  async startVerification(invoiceBarcode: string, userId: number) {
    const barcodeStr = String(invoiceBarcode).trim();
    const invoice = await this.invoiceRepo.findOne({
      where: { barcode: barcodeStr },
    });
    if (!invoice) {
      // Log failed scan attempt
      try {
        await this.gateRiskService.logScan({
          invoice_barcode: barcodeStr,
          scanned_barcode: barcodeStr,
          scan_type: 'invoice',
          is_valid: false,
          failure_reason: 'Invoice Number Not Found',
          user_id: userId,
        });
      } catch (e) {}

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

    // Log valid invoice gate start scan
    try {
      await this.gateRiskService.logScan({
        match_id: savedMatch.id,
        invoice_barcode: invoice.barcode,
        scanned_barcode: invoice.barcode,
        scan_type: 'invoice',
        is_valid: true,
        user_id: userId,
      });

      // Run initial AI Gate Risk Analysis
      await this.gateRiskService.analyzeGateTransaction({
        match_id: savedMatch.id,
        invoice_barcode: invoice.barcode,
        user_id: userId,
      });
    } catch (e) {
      console.error('[VerificationService] AI Gate Risk Analysis error:', e);
    }

    return {
      ...savedMatch,
      invoice_match_id: savedMatch.id,
    };
  }

  async findAll() {
    const matches = await this.invoiceMatchRepo.find({ order: { id: 'DESC' } });
    return Promise.all(
      matches.map(async (m) => {
        let partNumber = '';
        let partDesc = '';
        const invoice = await this.invoiceRepo.findOne({
          where: { barcode: m.invoice_number },
        });
        if (invoice) {
          const part = await this.partRepo.findOne({ where: { id: invoice.part_id } });
          if (part) {
            partNumber = (part.part_number || '').trim();
            partDesc = (part.part_description || '').trim();
          }
        }

        // Fetch risk summary if exists
        let riskScore = 0;
        let riskLevel = 'LOW';
        let reviewStatus = 'not_required';
        const riskAnalysis = await this.riskAnalysisRepo.findOne({
          where: [{ match_id: m.id }, { invoice_barcode: m.invoice_number }],
        });
        if (riskAnalysis) {
          riskScore = riskAnalysis.risk_score;
          riskLevel = riskAnalysis.risk_level;
          reviewStatus = riskAnalysis.review_status;
        }

        return {
          ...m,
          part_number: partNumber,
          part_description: partDesc,
          risk_score: riskScore,
          risk_level: riskLevel,
          review_status: reviewStatus,
        };
      }),
    );
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

    // Fetch live AI Risk Analysis
    let aiRisk: any = null;
    try {
      aiRisk = await this.gateRiskService.getRiskForMatch(matchId);
    } catch (e) {
      console.warn('[VerificationService] Could not compute AI risk for match #' + matchId, e);
    }

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
      ai_risk: aiRisk,
    };
  }

  async scanBox(matchId: number, boxBarcode: string, userId: number) {
    const barcodeStr = String(boxBarcode).trim();
    const match = await this.invoiceMatchRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Verification record not found');

    const invoice = await this.invoiceRepo.findOne({
      where: { barcode: match.invoice_number },
    });
    if (!invoice) throw new BadRequestException('Invoice not found');

    // Verify box barcode is mapped to this invoice in invoice_box
    const validInvoiceBox = await this.invoiceBoxRepo.findOne({
      where: { invoice_id: invoice.id, box_id: Number(barcodeStr) },
    });
    if (!validInvoiceBox) {
      // Log failed scan attempt
      try {
        await this.gateRiskService.logScan({
          match_id: match.id,
          invoice_barcode: invoice.barcode,
          scanned_barcode: barcodeStr,
          scan_type: 'box',
          is_valid: false,
          failure_reason: 'Box barcode not found in this invoice',
          user_id: userId,
        });
        // Refresh risk analysis
        await this.gateRiskService.analyzeGateTransaction({
          match_id: match.id,
          invoice_barcode: invoice.barcode,
          user_id: userId,
        });
      } catch (e) {}

      throw new BadRequestException('Error : Box barcode not found in this invoice !!!!');
    }

    // Check if already scanned
    const alreadyScanned = await this.invoiceBoxMatchRepo.findOne({
      where: { invoice_id: invoice.id, box_id: Number(barcodeStr) },
    });
    if (alreadyScanned) {
      // Log duplicate scan attempt
      try {
        await this.gateRiskService.logScan({
          match_id: match.id,
          invoice_barcode: invoice.barcode,
          scanned_barcode: barcodeStr,
          scan_type: 'box',
          is_valid: false,
          failure_reason: 'Box barcode already scanned',
          user_id: userId,
        });
        await this.gateRiskService.analyzeGateTransaction({
          match_id: match.id,
          invoice_barcode: invoice.barcode,
          user_id: userId,
        });
      } catch (e) {}

      throw new BadRequestException('Error : Box barcode already scanned for this invoice');
    }

    const { dateStr, timeStr } = this.getLegacyDateTime();

    const boxMatch = this.invoiceBoxMatchRepo.create({
      box_id: Number(barcodeStr),
      invoice_id: invoice.id,
      created_by: userId,
      created_date: dateStr,
      created_time: timeStr,
      status: 'pending',
    });

    await this.invoiceBoxMatchRepo.save(boxMatch);

    // Log successful box scan
    try {
      await this.gateRiskService.logScan({
        match_id: match.id,
        invoice_barcode: invoice.barcode,
        scanned_barcode: barcodeStr,
        scan_type: 'box',
        is_valid: true,
        user_id: userId,
      });
      await this.gateRiskService.analyzeGateTransaction({
        match_id: match.id,
        invoice_barcode: invoice.barcode,
        user_id: userId,
      });
    } catch (e) {}

    // Check if all boxes are scanned
    const totalExpected = await this.invoiceBoxRepo.count({ where: { invoice_id: invoice.id } });
    const totalScanned = await this.invoiceBoxMatchRepo.count({ where: { invoice_id: invoice.id } });

    const isComplete = totalExpected > 0 && totalScanned >= totalExpected;
    if (isComplete) {
      match.status = 'verified';
      await this.invoiceMatchRepo.save(match);
    }

    const gateOutCode = invoice && isComplete ? `${invoice.invoice_number}4000${match.id}` : '';

    return {
      success: true,
      matched: true,
      message: 'Added Successfully',
      completed: isComplete,
      remaining: Math.max(0, totalExpected - totalScanned),
      clearance_code: gateOutCode,
      gate_out_code: gateOutCode,
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
