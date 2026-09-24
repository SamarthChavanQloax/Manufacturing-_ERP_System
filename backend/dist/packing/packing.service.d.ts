import { Repository } from 'typeorm';
import { Packing, Part } from '../entities';
export declare class PackingService {
    private packingRepo;
    private partRepo;
    constructor(packingRepo: Repository<Packing>, partRepo: Repository<Part>);
    private getLegacyDateTime;
    createSingle(partId: number, partQty: number, userId: number): Promise<{
        remaining_stock: number;
        part_number: string;
        part_description: string;
        id: number;
        barcode: string;
        part_id: number;
        part_qty: number;
        packing_details: Date;
        packing_name: string;
        created_by: number;
        created_time: string;
        created_date: string;
        status: string;
    }>;
    createBulk(partId: number, partQty: number, packingQty: number, userId: number): Promise<any[]>;
    findAll(fromDate?: string, toDate?: string): Promise<any[]>;
    findOne(id: number): Promise<any>;
    delete(id: number): Promise<import("typeorm").DeleteResult>;
}
