import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
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
