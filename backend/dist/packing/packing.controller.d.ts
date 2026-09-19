import { PackingService } from './packing.service';
export declare class PackingController {
    private packingService;
    constructor(packingService: PackingService);
    createSingle(body: {
        part_id: number;
        part_qty: number;
    }, req: any): Promise<{
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
    createBulk(body: {
        part_id: number;
        part_qty: number;
        packing_qty: number;
    }, req: any): Promise<any[]>;
    getAll(fromDate?: string, toDate?: string): Promise<any[]>;
    getOne(id: string): Promise<any>;
    delete(id: string): Promise<import("typeorm").DeleteResult>;
}
