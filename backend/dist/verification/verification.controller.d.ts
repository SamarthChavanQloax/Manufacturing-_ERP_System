import { VerificationService } from './verification.service';
export declare class VerificationController {
    private verificationService;
    constructor(verificationService: VerificationService);
    start(invoiceBarcode: string, req: any): Promise<import("../entities").InvoiceMatch>;
    getAll(): Promise<import("../entities").InvoiceMatch[]>;
    getOne(id: string): Promise<{
        match: import("../entities").InvoiceMatch;
        invoice: import("../entities").Invoice;
        expected_boxes_count: number;
        scanned_boxes_count: number;
        checked: boolean;
        gate_out_code: string;
        scanned_boxes: any[];
    }>;
    scanBox(body: {
        match_id: number;
        box_barcode: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        completed: boolean;
    }>;
    returnInvoice(body: {
        match_id: number;
        invoice_barcode: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
