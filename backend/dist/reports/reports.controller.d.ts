import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getGateOutReport(): Promise<any[]>;
}
