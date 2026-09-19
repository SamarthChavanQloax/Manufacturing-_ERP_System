import { Repository } from 'typeorm';
import { Invoice, InvoiceBox, Box, BoxPacking, Packing, Part } from '../entities';
export declare class InvoicesService {
    private invoiceRepo;
    private invoiceBoxRepo;
    private boxRepo;
    private boxPackingRepo;
    private packingRepo;
    private partRepo;
    constructor(invoiceRepo: Repository<Invoice>, invoiceBoxRepo: Repository<InvoiceBox>, boxRepo: Repository<Box>, boxPackingRepo: Repository<BoxPacking>, packingRepo: Repository<Packing>, partRepo: Repository<Part>);
    private getLegacyDateTime;
    create(data: {
        invoice_number: string;
        part_id: number;
        qty: number;
    }, userId: number): Promise<Invoice>;
    findAll(fromDate?: string, toDate?: string): Promise<{
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
    findOne(id: number): Promise<{
        invoice: Invoice;
        part: Part;
        total_part_qty: number;
        boxes: any[];
    }>;
    addBoxToInvoice(invoiceId: number, boxBarcode: string, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    delete(id: number): Promise<import("typeorm").DeleteResult>;
}
