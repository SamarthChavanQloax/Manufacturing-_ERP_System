import { Repository } from 'typeorm';
import { InvoiceMatch, Invoice, InvoiceBox, Box, BoxPacking, Packing, Part } from '../entities';
export declare class ReportsService {
    private invoiceMatchRepo;
    private invoiceRepo;
    private invoiceBoxRepo;
    private boxRepo;
    private boxPackingRepo;
    private packingRepo;
    private partRepo;
    constructor(invoiceMatchRepo: Repository<InvoiceMatch>, invoiceRepo: Repository<Invoice>, invoiceBoxRepo: Repository<InvoiceBox>, boxRepo: Repository<Box>, boxPackingRepo: Repository<BoxPacking>, packingRepo: Repository<Packing>, partRepo: Repository<Part>);
    getGateOutReport(): Promise<any[]>;
}
