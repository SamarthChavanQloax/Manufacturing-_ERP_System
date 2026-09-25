import { PartsService } from './parts.service';
export declare class PartsController {
    private partsService;
    constructor(partsService: PartsService);
    getAll(search?: string, page?: string, limit?: string): Promise<{
        items: import("../entities").Part[];
        total: number;
    }>;
    getSimple(): Promise<import("../entities").Part[]>;
    getStock(search?: string, page?: string, limit?: string): Promise<{
        items: any[];
        total: number;
    }>;
    create(body: {
        part_number: string;
        part_desc: string;
        qty: number;
    }, req: any): Promise<import("../entities").Part>;
    update(id: string, body: {
        part_number?: string;
        part_desc?: string;
        qty?: number;
    }): Promise<import("../entities").Part>;
}
