import { Repository } from 'typeorm';
import { Part, Packing, Box, BoxPacking, Invoice, InvoiceBox, InvoiceMatch, UserInfo } from '../entities';
export declare class DashboardService {
    private partRepo;
    private packingRepo;
    private boxRepo;
    private boxPackingRepo;
    private invoiceRepo;
    private invoiceBoxRepo;
    private invoiceMatchRepo;
    private userRepo;
    constructor(partRepo: Repository<Part>, packingRepo: Repository<Packing>, boxRepo: Repository<Box>, boxPackingRepo: Repository<BoxPacking>, invoiceRepo: Repository<Invoice>, invoiceBoxRepo: Repository<InvoiceBox>, invoiceMatchRepo: Repository<InvoiceMatch>, userRepo: Repository<UserInfo>);
    private getTrendDates;
    getStats(role?: string, userId?: number): Promise<{
        role: string;
        roleTitle: string;
        roleDesc: string;
        summary: {
            todayPackedUnits: number;
            todayPackingBatches: number;
            pendingPackingsCount: number;
            pendingPackingsQty: number;
            usedPackingsCount: number;
            usedPackingsQty: number;
            totalPackingsCount: number;
            todayBoxesCount?: undefined;
            unlockedBoxesCount?: undefined;
            lockedBoxesCount?: undefined;
            totalBoxesCount?: undefined;
            totalItemsInBoxes?: undefined;
            availablePackingsToBox?: undefined;
            todayInvoicesCount?: undefined;
            pendingInvoicesCount?: undefined;
            usedInvoicesCount?: undefined;
            totalInvoicesCount?: undefined;
            availableLockedBoxesCount?: undefined;
            todayGatePassesCount?: undefined;
            pendingGateVerificationsCount?: undefined;
            verifiedGatePassesCount?: undefined;
            totalGatePassesCount?: undefined;
        };
        charts: {
            dailyTrend: {
                date: string;
                label: string;
                batches: number;
                units: number;
            }[];
            statusDistribution: {
                name: string;
                value: number;
                color: string;
            }[];
        };
        alerts: any[];
        recentActivities: {
            id: string;
            title: string;
            description: string;
            timeStr: string;
            status: string;
            badge: string;
            badgeColor: string;
        }[];
        systemCounts?: undefined;
        todayStats?: undefined;
        stockDistribution?: undefined;
        productionTrends?: undefined;
        pipeline?: undefined;
    } | {
        role: string;
        roleTitle: string;
        roleDesc: string;
        summary: {
            todayBoxesCount: number;
            unlockedBoxesCount: number;
            lockedBoxesCount: number;
            totalBoxesCount: number;
            totalItemsInBoxes: number;
            availablePackingsToBox: number;
            todayPackedUnits?: undefined;
            todayPackingBatches?: undefined;
            pendingPackingsCount?: undefined;
            pendingPackingsQty?: undefined;
            usedPackingsCount?: undefined;
            usedPackingsQty?: undefined;
            totalPackingsCount?: undefined;
            todayInvoicesCount?: undefined;
            pendingInvoicesCount?: undefined;
            usedInvoicesCount?: undefined;
            totalInvoicesCount?: undefined;
            availableLockedBoxesCount?: undefined;
            todayGatePassesCount?: undefined;
            pendingGateVerificationsCount?: undefined;
            verifiedGatePassesCount?: undefined;
            totalGatePassesCount?: undefined;
        };
        charts: {
            dailyTrend: {
                date: string;
                label: string;
                boxesCreated: number;
            }[];
            statusDistribution: {
                name: string;
                value: number;
                color: string;
            }[];
        };
        alerts: any[];
        recentActivities: {
            id: string;
            title: string;
            description: string;
            timeStr: string;
            status: string;
            badge: string;
            badgeColor: string;
        }[];
        systemCounts?: undefined;
        todayStats?: undefined;
        stockDistribution?: undefined;
        productionTrends?: undefined;
        pipeline?: undefined;
    } | {
        role: string;
        roleTitle: string;
        roleDesc: string;
        summary: {
            todayInvoicesCount: number;
            pendingInvoicesCount: number;
            usedInvoicesCount: number;
            totalInvoicesCount: number;
            availableLockedBoxesCount: number;
            todayPackedUnits?: undefined;
            todayPackingBatches?: undefined;
            pendingPackingsCount?: undefined;
            pendingPackingsQty?: undefined;
            usedPackingsCount?: undefined;
            usedPackingsQty?: undefined;
            totalPackingsCount?: undefined;
            todayBoxesCount?: undefined;
            unlockedBoxesCount?: undefined;
            lockedBoxesCount?: undefined;
            totalBoxesCount?: undefined;
            totalItemsInBoxes?: undefined;
            availablePackingsToBox?: undefined;
            todayGatePassesCount?: undefined;
            pendingGateVerificationsCount?: undefined;
            verifiedGatePassesCount?: undefined;
            totalGatePassesCount?: undefined;
        };
        charts: {
            dailyTrend: {
                date: string;
                label: string;
                invoicesCreated: number;
                targetUnits: number;
            }[];
            statusDistribution: {
                name: string;
                value: number;
                color: string;
            }[];
        };
        alerts: any[];
        recentActivities: {
            id: string;
            title: string;
            description: string;
            timeStr: string;
            status: string;
            badge: string;
            badgeColor: string;
        }[];
        systemCounts?: undefined;
        todayStats?: undefined;
        stockDistribution?: undefined;
        productionTrends?: undefined;
        pipeline?: undefined;
    } | {
        role: string;
        roleTitle: string;
        roleDesc: string;
        summary: {
            todayGatePassesCount: number;
            pendingGateVerificationsCount: number;
            verifiedGatePassesCount: number;
            totalGatePassesCount: number;
            todayPackedUnits?: undefined;
            todayPackingBatches?: undefined;
            pendingPackingsCount?: undefined;
            pendingPackingsQty?: undefined;
            usedPackingsCount?: undefined;
            usedPackingsQty?: undefined;
            totalPackingsCount?: undefined;
            todayBoxesCount?: undefined;
            unlockedBoxesCount?: undefined;
            lockedBoxesCount?: undefined;
            totalBoxesCount?: undefined;
            totalItemsInBoxes?: undefined;
            availablePackingsToBox?: undefined;
            todayInvoicesCount?: undefined;
            pendingInvoicesCount?: undefined;
            usedInvoicesCount?: undefined;
            totalInvoicesCount?: undefined;
            availableLockedBoxesCount?: undefined;
        };
        charts: {
            dailyTrend: {
                date: string;
                label: string;
                gatePasses: number;
            }[];
            statusDistribution: {
                name: string;
                value: number;
                color: string;
            }[];
        };
        alerts: any[];
        recentActivities: {
            id: string;
            title: string;
            description: string;
            timeStr: string;
            status: string;
            badge: string;
            badgeColor: string;
        }[];
        systemCounts?: undefined;
        todayStats?: undefined;
        stockDistribution?: undefined;
        productionTrends?: undefined;
        pipeline?: undefined;
    } | {
        role: string;
        roleTitle: string;
        roleDesc: string;
        systemCounts: {
            parts: number;
            packings: number;
            boxes: number;
            invoices: number;
            users: number;
            lockedBoxes: number;
            unlockedBoxes: number;
            pendingInvoices: number;
            verifiedGatePasses: number;
            pendingGatePasses: number;
        };
        todayStats: {
            date: string;
            packingsCount: number;
            packedUnits: number;
            boxesCount: number;
            invoicesCount: number;
            gatePassesCount: number;
        };
        stockDistribution: {
            rawStock: number;
            fgStock: number;
            boxStock: number;
            invStock: number;
            totalStock: number;
            chartData: {
                name: string;
                value: number;
                color: string;
            }[];
        };
        productionTrends: {
            date: string;
            label: string;
            packings: number;
            unitsPacked: number;
        }[];
        pipeline: {
            id: number;
            stage: string;
            shortTitle: string;
            count: number;
            quantity: number;
            unit: string;
            status: string;
            color: string;
            bg: string;
        }[];
        alerts: any[];
        recentActivities: any[];
        summary?: undefined;
        charts?: undefined;
    }>;
}
