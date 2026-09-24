import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private invoicesService;
    constructor(invoicesService: InvoicesService);
    create(body: {
        invoice_number: string;
        part_id: number;
        qty: number;
    }, req: any): Promise<import("../entities").Invoice>;
    getAll(fromDate?: string, toDate?: string): Promise<{
        part_number: string;
        part_description: string;
        id: number;
        barcode: string;
        invoice_number: string;
        created_by: number;
        created_date: string;
        created_time: string;
        status: string;
        lock_status: string;
        qty: number;
        part_id: number;
        status_new: string;
    }[]>;
    getOne(id: string): Promise<{
        invoice: import("../entities").Invoice;
        part: {
            part_number: string;
            id: number;
            part_description: string;
            qty: number;
            customer_id: number;
            revision_date: string;
            customer_part_id: number;
            revision_no: string;
            diagram: string;
            model: string;
            part_family: string;
            created_id: number;
            date: string;
            time: string;
            timestamp: Date;
            deleted: number;
            revision_remark: string;
            hsn_code: string;
            uom: string;
            safety_stock: string;
        };
        total_part_qty: number;
        boxes: any[];
    }>;
    addBox(body: {
        invoice_id: number;
        box_id?: string;
        box_barcode?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    lockInvoice(body: {
        invoice_id: number;
    }): Promise<{
        success: boolean;
        lock_status: string;
        message: string;
    }>;
    delete(id: string): Promise<import("typeorm").DeleteResult>;
}
