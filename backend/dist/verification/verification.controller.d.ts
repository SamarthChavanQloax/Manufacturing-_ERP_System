import { VerificationService } from './verification.service';
export declare class VerificationController {
    private verificationService;
    constructor(verificationService: VerificationService);
    start(body: {
        invoice_barcode?: string;
        invoice_number?: string;
    }, req: any): Promise<{
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
    getAll(): Promise<import("../entities").InvoiceMatch[]>;
    getOne(id: string): Promise<{
        match: import("../entities").InvoiceMatch;
        invoice: import("../entities").Invoice;
        expected_boxes_count: number;
        scanned_boxes_count: number;
        checked: boolean;
        is_complete: boolean;
        gate_out_code: string;
        clearance_code: string;
        scanned_boxes: any[];
    }>;
    scanBox(body: {
        match_id?: number;
        invoice_match_id?: number;
        box_barcode?: string;
        box_id?: string;
    }, req: any): Promise<{
        success: boolean;
        matched: boolean;
        message: string;
        completed: boolean;
        remaining: number;
    }>;
    returnInvoice(body: {
        match_id?: number;
        invoice_match_id?: number;
        invoice_barcode?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
