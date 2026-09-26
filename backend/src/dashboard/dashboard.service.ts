import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Part,
  Packing,
  Box,
  BoxPacking,
  Invoice,
  InvoiceBox,
  InvoiceMatch,
  UserInfo,
} from '../entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(Box)
    private boxRepo: Repository<Box>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceBox)
    private invoiceBoxRepo: Repository<InvoiceBox>,
    @InjectRepository(InvoiceMatch)
    private invoiceMatchRepo: Repository<InvoiceMatch>,
    @InjectRepository(UserInfo)
    private userRepo: Repository<UserInfo>,
  ) {}

  private getTrendDates(days = 7): string[] {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  async getStats(role = 'admin', userId?: number) {
    const today = new Date().toISOString().split('T')[0];
    const trendDates = this.getTrendDates(7);

    // Common DB counts
    const [partsCount, packingCount, boxCount, invoiceCount, usersCount] =
      await Promise.all([
        this.partRepo.count(),
        this.packingRepo.count(),
        this.boxRepo.count(),
        this.invoiceRepo.count(),
        this.userRepo.count(),
      ]);

    const lockedBoxesCount = await this.boxRepo.count({
      where: { lock_status: 'yes' },
    });
    const unlockedBoxesCount = Math.max(0, boxCount - lockedBoxesCount);

    const verifiedMatchesCount = await this.invoiceMatchRepo.count({
      where: { status: 'verified' },
    });
    const pendingMatchesCount = await this.invoiceMatchRepo.count({
      where: { status: 'pending' },
    });
    const pendingInvoicesCount = await this.invoiceRepo.count({
      where: { status: 'pending' },
    });
    const usedInvoicesCount = Math.max(0, invoiceCount - pendingInvoicesCount);

    // =========================================================================
    // 1. PACKING ROLE
    // =========================================================================
    if (role === 'packing') {
      const pendingPackingsCount = await this.packingRepo.count({
        where: { status: 'pending' },
      });
      const usedPackingsCount = Math.max(0, packingCount - pendingPackingsCount);

      const pendingStockRes = await this.packingRepo
        .createQueryBuilder('pk')
        .select('COALESCE(SUM(pk.part_qty), 0)', 'total')
        .where('pk.status = :status', { status: 'pending' })
        .getRawOne();
      const pendingPackingsQty = Number(pendingStockRes?.total) || 0;

      const usedStockRes = await this.packingRepo
        .createQueryBuilder('pk')
        .select('COALESCE(SUM(pk.part_qty), 0)', 'total')
        .where('pk.status = :status', { status: 'used' })
        .getRawOne();
      const usedPackingsQty = Number(usedStockRes?.total) || 0;

      // Today's packings
      const todayPackings = await this.packingRepo
        .createQueryBuilder('pk')
        .where('pk.created_time LIKE :today OR pk.created_date LIKE :today', {
          today: `%${today}%`,
        })
        .getMany();

      const todayPackingBatches = todayPackings.length;
      const todayPackedUnits = todayPackings.reduce(
        (acc, p) => acc + (Number(p.part_qty) || 0),
        0,
      );

      // 7-day packing trend
      const recentPackings = await this.packingRepo.find({
        order: { id: 'DESC' },
        take: 300,
      });

      const trendMap: { [d: string]: { count: number; qty: number } } = {};
      trendDates.forEach((d) => (trendMap[d] = { count: 0, qty: 0 }));

      recentPackings.forEach((pk) => {
        let dt = '';
        if (pk.created_time && pk.created_time.includes('-')) {
          dt = pk.created_time.trim().split(' ')[0];
        } else if (pk.created_date && pk.created_date.includes('-')) {
          dt = pk.created_date.trim().split(' ')[0];
        } else if (pk.packing_details) {
          dt = new Date(pk.packing_details).toISOString().split('T')[0];
        }
        if (dt && trendMap[dt]) {
          trendMap[dt].count += 1;
          trendMap[dt].qty += Number(pk.part_qty) || 0;
        }
      });

      const packingTrends = trendDates.map((dt) => {
        const dObj = new Date(dt);
        return {
          date: dt,
          label: dObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          batches: trendMap[dt]?.count || 0,
          units: trendMap[dt]?.qty || 0,
        };
      });

      // Recent packing records
      const recentList = await this.packingRepo.find({
        order: { id: 'DESC' },
        take: 8,
      });

      const recentActivities = recentList.map((pk) => ({
        id: `pk-${pk.id}`,
        title: `FG Packing Sticker #${pk.barcode}`,
        description: `Quantity: ${pk.part_qty} units (Status: ${pk.status === 'pending' ? 'Ready on Shelf' : 'Packed in Box'})`,
        timeStr: pk.created_time ? `${pk.created_time} ${pk.created_date || ''}` : 'Recent',
        status: pk.status,
        badge: pk.status === 'pending' ? 'Ready on Shelf' : 'In Box',
        badgeColor: pk.status === 'pending' ? '#16a34a' : '#0284c7',
      }));

      // Alerts
      const alerts: any[] = [];
      if (pendingPackingsCount > 0) {
        alerts.push({
          id: 'pending-shelf',
          type: 'info',
          title: `${pendingPackingsCount} Packed Batches on Shelf`,
          message: `Total of ${pendingPackingsQty.toLocaleString()} units waiting on FG shelf to be packed into master boxes.`,
          actionUrl: '/view_packing',
          actionText: 'View Shelf Packings',
        });
      }

      return {
        role: 'packing',
        roleTitle: 'Finished Goods Packing Station',
        roleDesc: 'Scan finished parts and generate 100k+ barcode labels for shelf storage',
        summary: {
          todayPackedUnits,
          todayPackingBatches,
          pendingPackingsCount,
          pendingPackingsQty,
          usedPackingsCount,
          usedPackingsQty,
          totalPackingsCount: packingCount,
        },
        charts: {
          dailyTrend: packingTrends,
          statusDistribution: [
            { name: 'Ready on Shelf', value: pendingPackingsCount, color: '#16a34a' },
            { name: 'Packed in Boxes', value: usedPackingsCount, color: '#0284c7' },
          ].filter((d) => d.value > 0),
        },
        alerts,
        recentActivities,
      };
    }

    // =========================================================================
    // 2. BOX ROLE
    // =========================================================================
    if (role === 'box') {
      const todayBoxes = await this.boxRepo
        .createQueryBuilder('b')
        .where('b.created_date LIKE :today OR b.created_time LIKE :today', {
          today: `%${today}%`,
        })
        .getCount();

      const totalItemsInBoxesRes = await this.boxPackingRepo
        .createQueryBuilder('bp')
        .select('COALESCE(SUM(bp.part_qty), 0)', 'total')
        .getRawOne();
      const totalItemsInBoxes = Number(totalItemsInBoxesRes?.total) || 0;

      const availablePackingsToBox = await this.packingRepo.count({
        where: { status: 'pending' },
      });

      // 7-day box trend
      const recentBoxes = await this.boxRepo.find({
        order: { id: 'DESC' },
        take: 200,
      });

      const trendMap: { [d: string]: number } = {};
      trendDates.forEach((d) => (trendMap[d] = 0));

      recentBoxes.forEach((b) => {
        let dt = '';
        if (b.created_date && b.created_date.includes('-')) {
          dt = b.created_date.trim().split(' ')[0];
        } else if (b.created_time && b.created_time.includes('-')) {
          dt = b.created_time.trim().split(' ')[0];
        }
        if (dt && trendMap[dt] !== undefined) {
          trendMap[dt] += 1;
        }
      });

      const boxTrends = trendDates.map((dt) => {
        const dObj = new Date(dt);
        return {
          date: dt,
          label: dObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          boxesCreated: trendMap[dt] || 0,
        };
      });

      const recentList = await this.boxRepo.find({
        order: { id: 'DESC' },
        take: 8,
      });

      const recentActivities = recentList.map((b) => ({
        id: `box-${b.id}`,
        title: `Master Box #${b.barcode}`,
        description: `Part: ${b.box_name || 'Gasket'} | Status: ${b.lock_status === 'yes' ? 'Sealed & Locked' : 'Open / Unlocked'}`,
        timeStr: b.created_date ? `${b.created_date} ${b.created_time || ''}` : 'Recent',
        status: b.lock_status,
        badge: b.lock_status === 'yes' ? 'Sealed & Locked' : 'Open / Unlocked',
        badgeColor: b.lock_status === 'yes' ? '#16a34a' : '#d97706',
      }));

      const alerts: any[] = [];
      if (unlockedBoxesCount > 0) {
        alerts.push({
          id: 'unlocked-boxes',
          type: 'warning',
          title: `${unlockedBoxesCount} Open Master Box${unlockedBoxesCount > 1 ? 'es' : ''}`,
          message: 'Boxes must be packed and locked before they can be mapped to commercial invoices.',
          actionUrl: '/view_box',
          actionText: 'Lock Master Boxes',
        });
      }
      if (availablePackingsToBox > 0) {
        alerts.push({
          id: 'ready-to-box',
          type: 'info',
          title: `${availablePackingsToBox} Packed Batches Ready for Boxing`,
          message: 'Finished goods items on shelf are ready to be scanned into master carton boxes.',
          actionUrl: '/create_box',
          actionText: 'Create & Fill Box',
        });
      }

      return {
        role: 'box',
        roleTitle: 'Master Carton Packing Station',
        roleDesc: 'Scan finished packing barcodes into master carton boxes (200k+) and seal containers',
        summary: {
          todayBoxesCount: todayBoxes,
          unlockedBoxesCount,
          lockedBoxesCount,
          totalBoxesCount: boxCount,
          totalItemsInBoxes,
          availablePackingsToBox,
        },
        charts: {
          dailyTrend: boxTrends,
          statusDistribution: [
            { name: 'Sealed & Locked', value: lockedBoxesCount, color: '#16a34a' },
            { name: 'Open / Being Packed', value: unlockedBoxesCount, color: '#d97706' },
          ].filter((d) => d.value > 0),
        },
        alerts,
        recentActivities,
      };
    }

    // =========================================================================
    // 3. INVOICE ROLE
    // =========================================================================
    if (role === 'invoice') {
      const todayInvoices = await this.invoiceRepo
        .createQueryBuilder('i')
        .where('i.created_date LIKE :today OR i.created_time LIKE :today', {
          today: `%${today}%`,
        })
        .getCount();

      const readyLockedBoxes = await this.boxRepo.count({
        where: { lock_status: 'yes', status: 'pending' },
      });

      // 7-day invoice trend
      const recentInvoices = await this.invoiceRepo.find({
        order: { id: 'DESC' },
        take: 200,
      });

      const trendMap: { [d: string]: { count: number; qty: number } } = {};
      trendDates.forEach((d) => (trendMap[d] = { count: 0, qty: 0 }));

      recentInvoices.forEach((inv) => {
        let dt = '';
        if (inv.created_date && inv.created_date.includes('-')) {
          dt = inv.created_date.trim().split(' ')[0];
        } else if (inv.created_time && inv.created_time.includes('-')) {
          dt = inv.created_time.trim().split(' ')[0];
        }
        if (dt && trendMap[dt]) {
          trendMap[dt].count += 1;
          trendMap[dt].qty += Number(inv.qty) || 0;
        }
      });

      const invoiceTrends = trendDates.map((dt) => {
        const dObj = new Date(dt);
        return {
          date: dt,
          label: dObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          invoicesCreated: trendMap[dt]?.count || 0,
          targetUnits: trendMap[dt]?.qty || 0,
        };
      });

      const recentList = await this.invoiceRepo.find({
        order: { id: 'DESC' },
        take: 8,
      });

      const recentActivities = recentList.map((inv) => ({
        id: `inv-${inv.id}`,
        title: `Invoice #${inv.invoice_number} (Barcode: ${inv.barcode})`,
        description: `Target: ${inv.qty} units | Status: ${inv.status === 'pending' ? 'Pending Box Mapping' : 'Boxes Mapped / Sent to Gate'}`,
        timeStr: inv.created_date ? `${inv.created_date} ${inv.created_time || ''}` : 'Recent',
        status: inv.status,
        badge: inv.status === 'pending' ? 'Pending Boxes' : 'Boxes Mapped',
        badgeColor: inv.status === 'pending' ? '#d97706' : '#16a34a',
      }));

      const alerts: any[] = [];
      if (pendingInvoicesCount > 0) {
        alerts.push({
          id: 'pending-inv',
          type: 'warning',
          title: `${pendingInvoicesCount} Invoices Pending Box Mapping`,
          message: 'Commercial invoices require master boxes to be mapped to fulfill target dispatch quantities.',
          actionUrl: '/create_invoice',
          actionText: 'Map Boxes to Invoices',
        });
      }
      if (readyLockedBoxes > 0) {
        alerts.push({
          id: 'ready-boxes',
          type: 'info',
          title: `${readyLockedBoxes} Sealed Boxes Available`,
          message: 'Sealed master cartons are ready in warehouse to be assigned to active dispatch orders.',
          actionUrl: '/create_invoice',
          actionText: 'Assign Boxes',
        });
      }

      return {
        role: 'invoice',
        roleTitle: 'Dispatch & Billing Station',
        roleDesc: 'Create commercial dispatch orders (300k+) and map sealed master carton boxes',
        summary: {
          todayInvoicesCount: todayInvoices,
          pendingInvoicesCount,
          usedInvoicesCount,
          totalInvoicesCount: invoiceCount,
          availableLockedBoxesCount: readyLockedBoxes,
        },
        charts: {
          dailyTrend: invoiceTrends,
          statusDistribution: [
            { name: 'Pending Box Mapping', value: pendingInvoicesCount, color: '#d97706' },
            { name: 'Boxes Mapped / Sent to Gate', value: usedInvoicesCount, color: '#16a34a' },
          ].filter((d) => d.value > 0),
        },
        alerts,
        recentActivities,
      };
    }

    // =========================================================================
    // 4. GATE ROLE
    // =========================================================================
    if (role === 'gate') {
      const todayGatePasses = await this.invoiceMatchRepo
        .createQueryBuilder('im')
        .where('im.created_date LIKE :today OR im.created_time LIKE :today', {
          today: `%${today}%`,
        })
        .getCount();

      // 7-day gate clearances trend
      const recentMatches = await this.invoiceMatchRepo.find({
        order: { id: 'DESC' },
        take: 200,
      });

      const trendMap: { [d: string]: number } = {};
      trendDates.forEach((d) => (trendMap[d] = 0));

      recentMatches.forEach((m) => {
        let dt = '';
        if (m.created_date && m.created_date.includes('-')) {
          dt = m.created_date.trim().split(' ')[0];
        } else if (m.created_time && m.created_time.includes('-')) {
          dt = m.created_time.trim().split(' ')[0];
        }
        if (dt && trendMap[dt] !== undefined) {
          trendMap[dt] += 1;
        }
      });

      const gateTrends = trendDates.map((dt) => {
        const dObj = new Date(dt);
        return {
          date: dt,
          label: dObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          gatePasses: trendMap[dt] || 0,
        };
      });

      const recentList = await this.invoiceMatchRepo.find({
        order: { id: 'DESC' },
        take: 8,
      });

      const recentActivities = recentList.map((m) => ({
        id: `gate-${m.id}`,
        title: `Gate Clearance Pass #${m.invoice_number}`,
        description: `Status: ${m.status === 'verified' ? 'Cleared & Dispatched' : 'Physical Verification in Progress'}`,
        timeStr: m.created_date ? `${m.created_date} ${m.created_time || ''}` : 'Recent',
        status: m.status,
        badge: m.status === 'verified' ? 'Cleared & Pass Issued' : 'Scanning Boxes',
        badgeColor: m.status === 'verified' ? '#16a34a' : '#0284c7',
      }));

      const alerts: any[] = [];
      if (pendingMatchesCount > 0) {
        alerts.push({
          id: 'gate-pending',
          type: 'warning',
          title: `${pendingMatchesCount} Invoice${pendingMatchesCount > 1 ? 's' : ''} in Verification Queue`,
          message: 'Vehicles waiting at exit gate. Security officer must scan physical box barcodes to issue clearance pass.',
          actionUrl: '/verify_invoice',
          actionText: 'Scan & Clear Gate Pass',
        });
      }

      return {
        role: 'gate',
        roleTitle: 'Security Exit Gate',
        roleDesc: 'Verify physical master boxes against invoice barcodes and issue official vehicle exit passes',
        summary: {
          todayGatePassesCount: todayGatePasses,
          pendingGateVerificationsCount: pendingMatchesCount,
          verifiedGatePassesCount: verifiedMatchesCount,
          totalGatePassesCount: verifiedMatchesCount + pendingMatchesCount,
        },
        charts: {
          dailyTrend: gateTrends,
          statusDistribution: [
            { name: 'Cleared & Dispatched', value: verifiedMatchesCount, color: '#16a34a' },
            { name: 'Pending Box Scan', value: pendingMatchesCount, color: '#0284c7' },
          ].filter((d) => d.value > 0),
        },
        alerts,
        recentActivities,
      };
    }

    // =========================================================================
    // 5. ADMIN ROLE (FULL SYSTEM OVERVIEW)
    // =========================================================================
    // Stage 1: Raw / Master Parts Stock
    const rawStockRes = await this.partRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.qty), 0)', 'total')
      .getRawOne();
    const rawStock = Number(rawStockRes?.total) || 0;

    // Stage 2: FG Rack Stock (pending in packing)
    const fgStockRes = await this.packingRepo
      .createQueryBuilder('pk')
      .select('COALESCE(SUM(pk.part_qty), 0)', 'total')
      .where('pk.status = :status', { status: 'pending' })
      .getRawOne();
    const fgStock = Number(fgStockRes?.total) || 0;

    // Stage 3: Box Packed Stock (pending in box_packing)
    const boxStockRes = await this.boxPackingRepo
      .createQueryBuilder('bp')
      .select('COALESCE(SUM(bp.part_qty), 0)', 'total')
      .where('bp.status = :status', { status: 'pending' })
      .getRawOne();
    const boxStock = Number(boxStockRes?.total) || 0;

    // Stage 4: Invoiced / Ready Stock (pending in invoice)
    const invStockRes = await this.invoiceRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.qty), 0)', 'total')
      .where('i.status = :status', { status: 'pending' })
      .getRawOne();
    const invStock = Number(invStockRes?.total) || 0;

    const totalSystemStock = rawStock + fgStock + boxStock + invStock;

    // Today's packings
    const todayPackings = await this.packingRepo
      .createQueryBuilder('pk')
      .where('pk.created_time LIKE :today OR pk.created_date LIKE :today', {
        today: `%${today}%`,
      })
      .getMany();
    const todayPackingCount = todayPackings.length;
    const todayPackedQty = todayPackings.reduce(
      (acc, p) => acc + (Number(p.part_qty) || 0),
      0,
    );

    const todayBoxesCount = await this.boxRepo
      .createQueryBuilder('b')
      .where('b.created_date LIKE :today OR b.created_time LIKE :today', {
        today: `%${today}%`,
      })
      .getCount();

    const todayInvoicesCount = await this.invoiceRepo
      .createQueryBuilder('i')
      .where('i.created_date LIKE :today OR i.created_time LIKE :today', {
        today: `%${today}%`,
      })
      .getCount();

    const todayGatePassesCount = await this.invoiceMatchRepo
      .createQueryBuilder('im')
      .where('im.created_time LIKE :today OR im.created_date LIKE :today', {
        today: `%${today}%`,
      })
      .getCount();

    // 7-day trend
    const recentPackings = await this.packingRepo.find({
      order: { id: 'DESC' },
      take: 200,
    });
    const packingTrendMap: { [date: string]: { count: number; qty: number } } =
      {};
    trendDates.forEach((dt) => {
      packingTrendMap[dt] = { count: 0, qty: 0 };
    });

    recentPackings.forEach((pk) => {
      let dtStr = '';
      if (pk.created_time && pk.created_time.includes('-')) {
        dtStr = pk.created_time.trim().split(' ')[0];
      } else if (pk.created_date && pk.created_date.includes('-')) {
        dtStr = pk.created_date.trim().split(' ')[0];
      } else if (pk.packing_details) {
        dtStr = new Date(pk.packing_details).toISOString().split('T')[0];
      }

      if (dtStr && packingTrendMap[dtStr]) {
        packingTrendMap[dtStr].count += 1;
        packingTrendMap[dtStr].qty += Number(pk.part_qty) || 0;
      }
    });

    const productionTrends = trendDates.map((dt) => {
      const dObj = new Date(dt);
      return {
        date: dt,
        label: dObj.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        packings: packingTrendMap[dt]?.count || 0,
        unitsPacked: packingTrendMap[dt]?.qty || 0,
      };
    });

    // 5-Stage Pipeline
    const pipeline = [
      {
        id: 1,
        stage: 'Parts Catalog',
        shortTitle: 'Part Master',
        count: partsCount,
        quantity: rawStock,
        unit: 'parts cataloged',
        status: 'Available',
        color: '#0284c7',
        bg: '#e0f2fe',
      },
      {
        id: 2,
        stage: 'FG Packed',
        shortTitle: 'FG Rack (100k+)',
        count: packingCount,
        quantity: fgStock,
        unit: 'pcs on shelf',
        status: 'Ready for Box',
        color: '#16a34a',
        bg: '#dcfce7',
      },
      {
        id: 3,
        stage: 'Master Boxes',
        shortTitle: 'Boxes (200k+)',
        count: boxCount,
        quantity: boxStock,
        unit: 'pcs in boxes',
        status: `${lockedBoxesCount} Sealed / ${unlockedBoxesCount} Open`,
        color: '#d97706',
        bg: '#fef3c7',
      },
      {
        id: 4,
        stage: 'Dispatch Invoices',
        shortTitle: 'Invoices (300k+)',
        count: invoiceCount,
        quantity: invStock,
        unit: 'pcs invoiced',
        status: `${pendingInvoicesCount} Pending Allocation`,
        color: '#dc2626',
        bg: '#fee2e2',
      },
      {
        id: 5,
        stage: 'Gate Exit Clearance',
        shortTitle: 'Gate Passes',
        count: verifiedMatchesCount + pendingMatchesCount,
        quantity: verifiedMatchesCount,
        unit: 'vehicles cleared',
        status: `${verifiedMatchesCount} Cleared`,
        color: '#7c3aed',
        bg: '#ede9fe',
      },
    ];

    // Alerts
    const alerts: any[] = [];
    if (unlockedBoxesCount > 0) {
      alerts.push({
        id: 'unlocked-boxes',
        type: 'warning',
        title: `${unlockedBoxesCount} Unlocked Master Box${unlockedBoxesCount > 1 ? 'es' : ''}`,
        message: 'Boxes must be locked with packing items before mapping to invoices.',
        actionUrl: '/view_box',
        actionText: 'View & Lock Boxes',
      });
    }
    if (pendingMatchesCount > 0) {
      alerts.push({
        id: 'pending-gate',
        type: 'info',
        title: `${pendingMatchesCount} Invoice${pendingMatchesCount > 1 ? 's' : ''} in Gate Verification`,
        message: 'Security officer needs to scan physical box barcodes to complete clearance.',
        actionUrl: '/verify_invoice',
        actionText: 'Go to Gate Verification',
      });
    }

    const lowStockParts = await this.partRepo
      .createQueryBuilder('p')
      .where('p.qty <= 50 AND p.qty > 0')
      .orderBy('p.qty', 'ASC')
      .take(3)
      .getMany();

    if (lowStockParts.length > 0) {
      alerts.push({
        id: 'low-stock',
        type: 'danger',
        title: `${lowStockParts.length} Low Stock Part Item${lowStockParts.length > 1 ? 's' : ''}`,
        message: `Parts like "${lowStockParts[0]?.part_number}" have ${lowStockParts[0]?.qty} units remaining.`,
        actionUrl: '/part_stock',
        actionText: 'Check Part Stock',
      });
    }

    // Activity Feed
    const [recentPackList, recentBoxList, recentInvList, recentGateList] =
      await Promise.all([
        this.packingRepo.find({ order: { id: 'DESC' }, take: 4 }),
        this.boxRepo.find({ order: { id: 'DESC' }, take: 4 }),
        this.invoiceRepo.find({ order: { id: 'DESC' }, take: 4 }),
        this.invoiceMatchRepo.find({ order: { id: 'DESC' }, take: 4 }),
      ]);

    const activityFeed: any[] = [];
    recentGateList.forEach((g) => {
      activityFeed.push({
        id: `gate-${g.id}`,
        type: 'gate',
        title: `Gate Clearance Pass #${g.invoice_number}`,
        description: `Status: ${g.status === 'verified' ? 'Cleared & Dispatched' : 'Verification In Progress'}`,
        timeStr: g.created_date ? `${g.created_date} ${g.created_time || ''}` : 'Recent',
        badge: g.status === 'verified' ? 'Verified' : 'Pending',
        badgeColor: g.status === 'verified' ? '#16a34a' : '#0284c7',
      });
    });

    recentInvList.forEach((inv) => {
      activityFeed.push({
        id: `inv-${inv.id}`,
        type: 'invoice',
        title: `Invoice #${inv.invoice_number} (Barcode: ${inv.barcode})`,
        description: `Target Quantity: ${inv.qty} pcs (${inv.status})`,
        timeStr: inv.created_date ? `${inv.created_date} ${inv.created_time || ''}` : 'Recent',
        badge: 'Invoice',
        badgeColor: '#dc2626',
      });
    });

    recentBoxList.forEach((b) => {
      activityFeed.push({
        id: `box-${b.id}`,
        type: 'box',
        title: `Master Box #${b.barcode}`,
        description: `Status: ${b.lock_status === 'yes' ? 'Locked & Sealed' : 'Open / Unlocked'}`,
        timeStr: b.created_date ? `${b.created_date} ${b.created_time || ''}` : 'Recent',
        badge: b.lock_status === 'yes' ? 'Locked' : 'Open',
        badgeColor: b.lock_status === 'yes' ? '#16a34a' : '#d97706',
      });
    });

    recentPackList.forEach((pk) => {
      activityFeed.push({
        id: `pk-${pk.id}`,
        type: 'packing',
        title: `FG Packing #${pk.barcode}`,
        description: `Packed ${pk.part_qty} units (Status: ${pk.status})`,
        timeStr: pk.created_time ? `${pk.created_time} ${pk.created_date || ''}` : 'Recent',
        badge: 'Packed',
        badgeColor: '#0284c7',
      });
    });

    activityFeed.sort((a, b) => b.id.localeCompare(a.id));

    return {
      role: 'admin',
      roleTitle: 'System Administrator',
      roleDesc: 'Full System Control & Overview Across All Factory Modules',
      systemCounts: {
        parts: partsCount,
        packings: packingCount,
        boxes: boxCount,
        invoices: invoiceCount,
        users: usersCount,
        lockedBoxes: lockedBoxesCount,
        unlockedBoxes: unlockedBoxesCount,
        pendingInvoices: pendingInvoicesCount,
        verifiedGatePasses: verifiedMatchesCount,
        pendingGatePasses: pendingMatchesCount,
      },
      todayStats: {
        date: today,
        packingsCount: todayPackingCount,
        packedUnits: todayPackedQty,
        boxesCount: todayBoxesCount,
        invoicesCount: todayInvoicesCount,
        gatePassesCount: todayGatePassesCount,
      },
      stockDistribution: {
        rawStock,
        fgStock,
        boxStock,
        invStock,
        totalStock: totalSystemStock,
        chartData: [
          { name: 'Raw Parts Stock', value: rawStock, color: '#0284c7' },
          { name: 'FG Rack (Ready on Shelf)', value: fgStock, color: '#16a34a' },
          { name: 'Box Packed Stock', value: boxStock, color: '#d97706' },
          { name: 'Invoiced for Dispatch', value: invStock, color: '#dc2626' },
        ].filter((d) => d.value > 0),
      },
      productionTrends,
      pipeline,
      alerts,
      recentActivities: activityFeed.slice(0, 8),
    };
  }
}
