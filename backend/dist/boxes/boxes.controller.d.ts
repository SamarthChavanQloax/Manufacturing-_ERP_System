import { BoxesService } from './boxes.service';
export declare class BoxesController {
    private boxesService;
    constructor(boxesService: BoxesService);
    create(body: {
        box_name: string;
        customer_id?: number;
        box_size?: string;
    }, req: any): Promise<import("../entities").Box>;
    getAll(fromDate?: string, toDate?: string): Promise<{
        part_qty: number;
        id: number;
        barcode: string;
        box_name: string;
        box_size: string;
        customer_id: number;
        created_by: number;
        created_date: string;
        created_time: string;
        status: string;
        lock_status: string;
    }[]>;
    getOne(id: string): Promise<{
        box: import("../entities").Box;
        customer: import("../entities").Customer;
        total_part_qty: number;
        items: any[];
    }>;
    addPacking(body: {
        box_id: number;
        pack_id?: string;
        barcode?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    lockBox(body: {
        box_id: number;
    }): Promise<{
        success: boolean;
        lock_status: string;
        message: string;
    }>;
}
