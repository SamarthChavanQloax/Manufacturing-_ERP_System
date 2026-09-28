import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Packing,
  Box,
  BoxPacking,
  Invoice,
  InvoiceBox,
  InvoiceMatch,
  Customer,
  Part,
  GateScanLog,
} from '../entities';

export type BarcodeType = 'PACKING' | 'BOX' | 'INVOICE' | 'UNKNOWN';

export type BarcodeValidationStatus =
  | 'VALID'
  | 'INVALID_FORMAT'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'UNAUTHORIZED'
  | 'ALREADY_PROCESSED'
  | 'PENDING';

export interface BarcodeValidationResult {
  barcode: string;
  type: BarcodeType;
  validation_status: BarcodeValidationStatus;
  is_valid: boolean;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface BulkBarcodeResult {
  summary: {
    scanned_count: number;
    unique_count: number;
    duplicate_count: number;
    valid_count: number;
    invalid_count: number;
    unauthorized_count: number;
  };
  results: BarcodeValidationResult[];
}

@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(Box)
    private boxRepo: Repository<Box>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceBox)
    private invoiceBoxRepo: Repository<InvoiceBox>,
    @InjectRepository(InvoiceMatch)
    private invoiceMatchRepo: Repository<InvoiceMatch>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(GateScanLog)
    private scanLogRepo: Repository<GateScanLog>,
  ) {}

  /**
   * Role-Aware Barcode Permission Guard
   */
  private isRolePermitted(role: string, type: BarcodeType): boolean {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return true;

    switch (type) {
      case 'PACKING':
        return ['packing', 'box'].includes(r);
      case 'BOX':
        return ['box', 'packing', 'invoice', 'gate'].includes(r);
      case 'INVOICE':
        return ['invoice', 'gate'].includes(r);
      default:
        return true;
    }
  }

  /**
   * Validate a single detected/scanned barcode against the ERP database.
   */
  async validateBarcode(
    barcodeStr: string,
    user: { userId?: number; type?: string; name?: string; username?: string },
    preferredType?: string,
    matchId?: number,
  ): Promise<BarcodeValidationResult> {
    const timestamp = new Date().toISOString();
    const role = (user?.type || 'gate').toLowerCase();
    const barcode = String(barcodeStr || '').trim();

    if (!barcode || barcode.length < 3) {
      return {
        barcode,
        type: 'UNKNOWN',
        validation_status: 'INVALID_FORMAT',
        is_valid: false,
        message: 'Barcode string is too short or empty.',
        timestamp,
      };
    }

    // 1. Try Invoice Lookup
    if (!preferredType || preferredType.toLowerCase() === 'invoice' || preferredType === 'auto') {
      const invoice = await this.invoiceRepo.findOne({
        where: [{ barcode }, { invoice_number: barcode }],
      });

      if (invoice) {
        if (!this.isRolePermitted(role, 'INVOICE')) {
          return {
            barcode,
            type: 'INVOICE',
            validation_status: 'UNAUTHORIZED',
            is_valid: false,
            message: `Your role "${role.toUpperCase()}" is not permitted to process Invoice barcodes.`,
            timestamp,
          };
        }

        const match = await this.invoiceMatchRepo.findOne({
          where: { invoice_number: invoice.barcode },
        });
        const mappedBoxes = await this.invoiceBoxRepo.find({
          where: { invoice_id: invoice.id },
        });

        let partDescription = 'Standard Part';
        if (invoice.part_id) {
          const part = await this.partRepo.findOne({ where: { id: invoice.part_id } });
          if (part) partDescription = `${part.part_number} (${part.part_description})`;
        }

        const isVerified = match?.status === 'verified';
        return {
          barcode,
          type: 'INVOICE',
          validation_status: isVerified ? 'ALREADY_PROCESSED' : 'VALID',
          is_valid: true,
          message: `Invoice ${invoice.barcode} verified (${partDescription}, ${invoice.qty} pcs, ${mappedBoxes.length} box(es)). Gate status: ${match ? match.status.toUpperCase() : 'Not at gate'}.`,
          details: {
            id: invoice.id,
            barcode: invoice.barcode,
            invoice_number: invoice.invoice_number,
            status: invoice.status,
            lock_status: invoice.lock_status,
            target_qty: invoice.qty,
            part: partDescription,
            box_count: mappedBoxes.length,
            gate_status: match ? match.status : 'Pending Entry',
          },
          timestamp,
        };
      }
    }

    // 2. Try Box Lookup
    if (!preferredType || preferredType.toLowerCase() === 'box' || preferredType === 'auto') {
      const box = await this.boxRepo.findOne({
        where: { barcode },
      });

      if (box) {
        if (!this.isRolePermitted(role, 'BOX')) {
          return {
            barcode,
            type: 'BOX',
            validation_status: 'UNAUTHORIZED',
            is_valid: false,
            message: `Your role "${role.toUpperCase()}" is not permitted to process Box barcodes.`,
            timestamp,
          };
        }

        const packings = await this.boxPackingRepo.find({ where: { box_id: box.id } });
        const invoiceMapping = await this.invoiceBoxRepo.findOne({ where: { box_id: box.id } });

        let customerName = 'Generic Customer';
        if (box.customer_id) {
          const cust = await this.customerRepo.findOne({ where: { id: box.customer_id } });
          if (cust) customerName = cust.customer_name;
        }

        const isLocked = box.lock_status === 'yes' || box.status === 'locked';
        return {
          barcode,
          type: 'BOX',
          validation_status: 'VALID',
          is_valid: true,
          message: `Box ${box.barcode} verified (Customer: ${customerName}, Part: ${box.box_name}, Lock: ${isLocked ? 'Sealed' : 'Open'}).`,
          details: {
            id: box.id,
            barcode: box.barcode,
            part_name: box.box_name,
            customer: customerName,
            lock_status: isLocked ? 'Locked (Sealed)' : 'Unlocked (Open)',
            packed_items_count: packings.length,
            mapped_invoice_id: invoiceMapping ? invoiceMapping.invoice_id : null,
          },
          timestamp,
        };
      }
    }

    // 3. Try Packing Lookup
    if (!preferredType || preferredType.toLowerCase() === 'packing' || preferredType === 'auto') {
      const packing = await this.packingRepo.findOne({
        where: { barcode },
      });

      if (packing) {
        if (!this.isRolePermitted(role, 'PACKING')) {
          return {
            barcode,
            type: 'PACKING',
            validation_status: 'UNAUTHORIZED',
            is_valid: false,
            message: `Your role "${role.toUpperCase()}" is not permitted to process Packing barcodes.`,
            timestamp,
          };
        }

        const boxPacking = await this.boxPackingRepo.findOne({ where: { pack_id: packing.id } });
        let partInfo = `Part ID #${packing.part_id}`;
        if (packing.part_id) {
          const part = await this.partRepo.findOne({ where: { id: packing.part_id } });
          if (part) partInfo = `${part.part_number} (${part.part_description})`;
        }

        const isAlreadyPacked = !!boxPacking;
        return {
          barcode,
          type: 'PACKING',
          validation_status: isAlreadyPacked ? 'ALREADY_PROCESSED' : 'VALID',
          is_valid: !isAlreadyPacked,
          message: isAlreadyPacked
            ? `Packing ${packing.barcode} is already assigned to Box #${boxPacking.box_id}.`
            : `Packing ${packing.barcode} verified (${partInfo}, ${packing.part_qty} pcs). Ready for box packing.`,
          details: {
            id: packing.id,
            barcode: packing.barcode,
            part: partInfo,
            qty: packing.part_qty,
            status: packing.status,
            box_id: boxPacking ? boxPacking.box_id : null,
          },
          timestamp,
        };
      }
    }

    // Not Found in ERP
    return {
      barcode,
      type: 'UNKNOWN',
      validation_status: 'NOT_FOUND',
      is_valid: false,
      message: `Barcode "${barcode}" was not found in active ERP records (checked Invoices, Boxes, and Packings).`,
      timestamp,
    };
  }

  /**
   * Bulk-scanning verification with duplicate suppression and batch metrics.
   */
  async bulkValidate(
    barcodes: string[],
    user: any,
    preferredType?: string,
  ): Promise<BulkBarcodeResult> {
    const rawList = Array.isArray(barcodes) ? barcodes : [];
    const seen = new Set<string>();
    const results: BarcodeValidationResult[] = [];

    let duplicateCount = 0;
    let validCount = 0;
    let invalidCount = 0;
    let unauthorizedCount = 0;

    for (const raw of rawList) {
      const code = String(raw).trim();
      if (!code) continue;

      if (seen.has(code)) {
        duplicateCount++;
        results.push({
          barcode: code,
          type: 'UNKNOWN',
          validation_status: 'DUPLICATE',
          is_valid: false,
          message: `Duplicate detected: Barcode "${code}" was already scanned in this session.`,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      seen.add(code);
      const res = await this.validateBarcode(code, user, preferredType);
      results.push(res);

      if (res.validation_status === 'VALID') validCount++;
      else if (res.validation_status === 'UNAUTHORIZED') unauthorizedCount++;
      else invalidCount++;
    }

    return {
      summary: {
        scanned_count: rawList.length,
        unique_count: seen.size,
        duplicate_count: duplicateCount,
        valid_count: validCount,
        invalid_count: invalidCount,
        unauthorized_count: unauthorizedCount,
      },
      results,
    };
  }
}
