import { Repository } from 'typeorm';
import { Part, Packing, BoxPacking, Invoice } from '../entities';
export declare class PartsService {
    private partRepo;
    private packingRepo;
    private boxPackingRepo;
    private invoiceRepo;
    constructor(partRepo: Repository<Part>, packingRepo: Repository<Packing>, boxPackingRepo: Repository<BoxPacking>, invoiceRepo: Repository<Invoice>);
    findAll(search?: string, page?: number, limit?: number): Promise<{
        items: Part[];
        total: number;
    }>;
    getAllSimple(): Promise<Part[]>;
    findOne(id: number): Promise<Part>;
    create(data: {
        part_number: string;
        part_desc: string;
        qty: number;
    }, userId?: number): Promise<Part>;
    getStockList(search?: string, page?: number, limit?: number): Promise<{
        items: any[];
        total: number;
    }>;
    update(id: number, data: {
        part_number?: string;
        part_desc?: string;
        qty?: number;
    }): Promise<Part>;
}
