import { Repository } from 'typeorm';
import { Box, BoxPacking, Packing, Part, Customer } from '../entities';
export declare class BoxesService {
    private boxRepo;
    private boxPackingRepo;
    private packingRepo;
    private partRepo;
    private customerRepo;
    constructor(boxRepo: Repository<Box>, boxPackingRepo: Repository<BoxPacking>, packingRepo: Repository<Packing>, partRepo: Repository<Part>, customerRepo: Repository<Customer>);
    private getLegacyDateTime;
    create(data: {
        box_name: string;
        customer_id?: number;
        box_size?: string;
    }, userId: number): Promise<Box>;
    findAll(fromDate?: string, toDate?: string): Promise<{
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
    findOne(id: number): Promise<{
        box: Box;
        customer: Customer;
        total_part_qty: number;
        items: any[];
    }>;
    addPackingToBox(boxId: number, packBarcode: string, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    lockBox(boxId: number): Promise<{
        success: boolean;
        lock_status: string;
        message: string;
    }>;
}
