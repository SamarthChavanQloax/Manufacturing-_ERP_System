import { Repository } from 'typeorm';
import { Part, Packing, Box, Invoice, UserInfo } from '../entities';
export declare class DashboardService {
    private partRepo;
    private packingRepo;
    private boxRepo;
    private invoiceRepo;
    private userRepo;
    constructor(partRepo: Repository<Part>, packingRepo: Repository<Packing>, boxRepo: Repository<Box>, invoiceRepo: Repository<Invoice>, userRepo: Repository<UserInfo>);
    getStats(): Promise<{
        newOrders: number;
        bounceRate: string;
        userRegistrations: number;
        uniqueVisitors: number;
        systemCounts: {
            parts: number;
            packings: number;
            boxes: number;
            invoices: number;
            users: number;
        };
    }>;
}
