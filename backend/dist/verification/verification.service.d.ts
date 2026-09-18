import { Repository } from 'typeorm';
import { Invoice, InvoiceBox, InvoiceMatch, InvoiceBoxMatch, Box, BoxPacking, Part } from '../entities';
export declare class VerificationService {
    private invoiceRepo;
    private invoiceBoxRepo;
    private invoiceMatchRepo;
    private invoiceBoxMatchRepo;
    private boxRepo;
    private boxPackingRepo;
    private partRepo;
    constructor(invoiceRepo: Repository<Invoice>, invoiceBoxRepo: Repository<InvoiceBox>, invoiceMatchRepo: Repository<InvoiceMatch>, invoiceBoxMatchRepo: Repository<InvoiceBoxMatch>, boxRepo: Repository<Box>, boxPackingRepo: Repository<BoxPacking>, partRepo: Repository<Part>);
    private getLegacyDateTime;
    startVerification(invoiceBarcode: string, userId: number): Promise<{
        invoice_match_id: number;
        id: number;
        barcode: string;
        invoice_number: string;
        created_by: number;
        created_date: string;
        created_time: string;
        status: string;
        total_stock: number;
    }>;
    findAll(): Promise<InvoiceMatch[]>;
    findOne(matchId: number): Promise<{
        match: InvoiceMatch;
        invoice: Invoice;
        expected_boxes_count: number;
        scanned_boxes_count: number;
        checked: boolean;
        is_complete: boolean;
        gate_out_code: string;
        clearance_code: string;
        scanned_boxes: any[];
    }>;
    scanBox(matchId: number, boxBarcode: string, userId: number): Promise<{
        success: boolean;
        matched: boolean;
        message: string;
        completed: boolean;
        remaining: number;
    }>;
    returnInvoice(matchId: number, invoiceBarcode?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
