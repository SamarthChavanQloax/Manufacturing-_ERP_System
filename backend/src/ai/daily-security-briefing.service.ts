import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import {
  DailySecurityBriefing,
  GateRiskAnalysis,
  GateScanLog,
  Invoice,
  InvoiceMatch,
  Part,
  Customer,
  UserInfo,
} from '../entities';
import { NotificationService } from '../notifications/notifications.service';

export interface SecurityBriefingEvent {
  id: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'BARCODE_RETRY' | 'OFF_HOURS' | 'QUANTITY_ANOMALY' | 'PRODUCT_LINE' | 'GATE_RISK' | 'WORKFLOW_BYPASS';
  what_happened: string;
  why_it_matters: string;
  evidence: {
    invoice_number?: string;
    invoice_barcode?: string;
    customer_name?: string;
    part_number?: string;
    part_description?: string;
    quantity?: number;
    risk_score?: number;
    risk_level?: string;
    scan_time?: string;
    failed_scans_count?: number;
    duplicate_scans_count?: number;
    actor_name?: string;
    review_status?: string;
    reviewed_by?: string;
    review_note?: string;
    historical_avg_qty?: number;
    quantity_ratio?: number;
    scan_timeline?: Array<{
      time: string;
      barcode: string;
      scan_type: string;
      is_valid: boolean;
      failure_reason?: string;
      user_name?: string;
    }>;
  };
  actions_recommended: string;
  review_status: 'pending_review' | 'reviewed' | 'not_required';
}

@Injectable()
export class DailySecurityBriefingService implements OnModuleInit {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(DailySecurityBriefing)
    private briefingRepo: Repository<DailySecurityBriefing>,
    @InjectRepository(GateRiskAnalysis)
    private gateRiskRepo: Repository<GateRiskAnalysis>,
    @InjectRepository(GateScanLog)
    private scanLogRepo: Repository<GateScanLog>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceMatch)
    private invoiceMatchRepo: Repository<InvoiceMatch>,
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(UserInfo)
    private userRepo: Repository<UserInfo>,
    private notifService: NotificationService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureTableExists();
    } catch (err) {
      console.error('[DailySecurityBriefingService] Init warning:', err);
    }
  }

  private async ensureTableExists() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS daily_security_briefing (
        id INT AUTO_INCREMENT PRIMARY KEY,
        briefing_date VARCHAR(20) NOT NULL UNIQUE,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_events INT DEFAULT 0,
        normal_count INT DEFAULT 0,
        high_priority_count INT DEFAULT 0,
        medium_priority_count INT DEFAULT 0,
        low_priority_count INT DEFAULT 0,
        pending_reviews_count INT DEFAULT 0,
        executive_summary TEXT NULL,
        events LONGTEXT NULL,
        status VARCHAR(30) DEFAULT 'generated',
        generated_by VARCHAR(50) DEFAULT 'system',
        engine_version VARCHAR(50) DEFAULT 'v1.0-evidence-consolidator',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_briefing_date (briefing_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  private formatDateStr(d: any): string {
    if (!d) return '';
    if (typeof d === 'string') {
      return d.split('T')[0].split(' ')[0];
    }
    if (d instanceof Date) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  private getTodayDateStr(): string {
    return this.formatDateStr(new Date());
  }

  // Get Briefing for specific date (or today)
  async getBriefingForDate(dateStr?: string) {
    const targetDate = (dateStr || this.getTodayDateStr()).trim();

    let briefing = await this.briefingRepo.findOne({
      where: { briefing_date: targetDate },
    });

    if (!briefing) {
      // Automatically generate if not already generated
      return this.generateBriefing(targetDate, 'auto');
    }

    let eventsArr: SecurityBriefingEvent[] = [];
    try {
      eventsArr = briefing.events ? JSON.parse(briefing.events) : [];
    } catch (e) {}

    return {
      ...briefing,
      events: eventsArr,
    };
  }

  // Generate / Regenerate Briefing for a date
  async generateBriefing(dateStr: string, generatedBy = 'admin') {
    const targetDate = (dateStr || this.getTodayDateStr()).trim();

    // 1. Fetch all Gate Risk Analyses for target date
    const allRiskAnalyses = await this.gateRiskRepo.find({
      order: { id: 'DESC' },
    });

    // Filter analyses belonging to target date
    const dayAnalyses = allRiskAnalyses.filter((ra) => {
      const createdDateStr = this.formatDateStr(ra.created_at);
      return createdDateStr === targetDate;
    });

    // 2. Fetch all Gate Scan Logs for target date
    const dayScanLogs = await this.scanLogRepo.find({
      order: { id: 'ASC' },
    });
    const filteredScanLogs = dayScanLogs.filter((sl) => {
      const createdDateStr = this.formatDateStr(sl.created_at);
      return createdDateStr === targetDate;
    });

    // 3. Fetch Invoices and Matches created/scanned on target date
    const allInvoices = await this.invoiceRepo.find();
    const dayInvoices = allInvoices.filter((inv) => {
      const d1 = this.formatDateStr(inv.created_date);
      return d1 === targetDate;
    });

    const allMatches = await this.invoiceMatchRepo.find();
    const dayMatches = allMatches.filter((m) => {
      const d1 = this.formatDateStr(m.created_date);
      return d1 === targetDate;
    });

    // 4. Group Activity & Scan Logs by Invoice Barcode to Consolidate
    const invoiceScanMap = new Map<string, GateScanLog[]>();
    for (const log of filteredScanLogs) {
      const key = log.invoice_barcode || 'GENERAL';
      if (!invoiceScanMap.has(key)) invoiceScanMap.set(key, []);
      invoiceScanMap.get(key)!.push(log);
    }

    const consolidatedEvents: SecurityBriefingEvent[] = [];
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let pendingReviewsCount = 0;

    // Set of processed invoice barcodes
    const processedInvoices = new Set<string>();

    // Process each Gate Risk Analysis on this day
    for (const ra of dayAnalyses) {
      processedInvoices.add(ra.invoice_barcode);

      let factors: any = {};
      let reasons: string[] = [];
      let metrics: any = {};
      try {
        factors = ra.risk_factors ? JSON.parse(ra.risk_factors) : {};
        reasons = ra.reasons ? JSON.parse(ra.reasons) : [];
        metrics = ra.metrics ? JSON.parse(ra.metrics) : {};
      } catch (e) {}

      const relatedScans = invoiceScanMap.get(ra.invoice_barcode) || [];
      const failedScans = relatedScans.filter((s) => !s.is_valid);
      const duplicateScans = failedScans.filter(
        (s) =>
          (s.failure_reason || '').toLowerCase().includes('already scanned') ||
          (s.failure_reason || '').toLowerCase().includes('duplicate')
      );

      if (ra.review_status === 'pending_review') {
        pendingReviewsCount++;
      }

      // Check if this transaction has anomalies to report
      if (ra.risk_score > 30 || failedScans.length >= 2 || duplicateScans.length >= 1 || ra.risk_level === 'HIGH' || ra.risk_level === 'MEDIUM') {
        let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (ra.risk_level === 'HIGH' || ra.risk_score >= 71) {
          priority = 'HIGH';
          highCount++;
        } else if (ra.risk_level === 'MEDIUM' || ra.risk_score > 30) {
          priority = 'MEDIUM';
          mediumCount++;
        } else {
          lowCount++;
        }

        // Build Title & Category
        let title = 'Abnormal Gate Dispatch Activity';
        let category: SecurityBriefingEvent['category'] = 'GATE_RISK';

        if (failedScans.length >= 2) {
          title = `${failedScans.length} Repeated Barcode Scan Attempts`;
          category = 'BARCODE_RETRY';
        } else if (metrics.is_off_hours) {
          title = 'Unusual Off-Hours Dispatch Activity';
          category = 'OFF_HOURS';
        } else if (metrics.quantity_ratio >= 2.0) {
          title = `Order Quantity Surge (${metrics.quantity_ratio}x Normal Average)`;
          category = 'QUANTITY_ANOMALY';
        } else if (factors.customer_pattern_anomaly?.detected) {
          title = 'Customer Product Line Deviation';
          category = 'PRODUCT_LINE';
        }

        // Build "What Happened"
        const whatHappenedParts: string[] = [];
        if (failedScans.length > 0) {
          whatHappenedParts.push(`${failedScans.length} failed barcode scan attempts were detected during verification of Invoice ${ra.invoice_number || ra.invoice_barcode}.`);
        }
        if (metrics.is_off_hours) {
          whatHappenedParts.push(`The Gate verification was initiated at ${metrics.scan_time || 'night'} outside standard factory shift operating hours.`);
        }
        if (metrics.quantity_ratio >= 1.7) {
          whatHappenedParts.push(`Dispatch quantity of ${ra.invoice_qty} units is ${metrics.quantity_ratio}x higher than the customer's historical average of ${metrics.historical_avg_qty || 'standard'} units.`);
        }
        if (factors.customer_pattern_anomaly?.detected) {
          whatHappenedParts.push(`This is the first recorded shipment of part ${ra.part_number} for customer ${ra.customer_name}.`);
        }
        if (whatHappenedParts.length === 0) {
          whatHappenedParts.push(`AI Gate Risk Assessment assigned a risk score of ${ra.risk_score}/100 based on evaluated dispatch parameters.`);
        }

        const whatHappenedText = whatHappenedParts.join(' ');

        // Build "Why It Matters" (Cautious, professional language, zero unsubstantiated accusations)
        let whyItMatters = 'This activity differs from historical baseline patterns and warrants supervisor verification before truck release.';
        if (category === 'BARCODE_RETRY') {
          whyItMatters = 'Repeated failed scans may indicate incorrect barcode labels on physical boxes, packing mismatch, or unauthorized scanning attempts.';
        } else if (category === 'OFF_HOURS') {
          whyItMatters = 'Dispatches conducted outside standard manufacturing operating shifts carry elevated compliance risks and require supervisor verification of transport authority.';
        } else if (category === 'QUANTITY_ANOMALY') {
          whyItMatters = 'Significantly elevated dispatch volumes should be cross-checked against official customer purchase orders to prevent inventory discrepancies.';
        } else if (category === 'PRODUCT_LINE') {
          whyItMatters = 'First-time shipments for established customers should be validated against customer drawing approval and engineering change records.';
        }

        // Build Scan Timeline
        const scanTimeline = relatedScans.map((s) => ({
          time: new Date(s.created_at).toTimeString().split(' ')[0],
          barcode: s.scanned_barcode,
          scan_type: s.scan_type,
          is_valid: s.is_valid,
          failure_reason: s.failure_reason || undefined,
          user_name: s.user_name || undefined,
        }));

        consolidatedEvents.push({
          id: `briefing_event_${ra.id}_${ra.invoice_barcode}`,
          title,
          priority,
          category,
          what_happened: whatHappenedText,
          why_it_matters: whyItMatters,
          evidence: {
            invoice_number: ra.invoice_number || ra.invoice_barcode,
            invoice_barcode: ra.invoice_barcode,
            customer_name: ra.customer_name || undefined,
            part_number: ra.part_number || undefined,
            quantity: ra.invoice_qty,
            risk_score: ra.risk_score,
            risk_level: ra.risk_level,
            scan_time: metrics.scan_time || undefined,
            failed_scans_count: failedScans.length,
            duplicate_scans_count: duplicateScans.length,
            actor_name: ra.reviewed_by_name || undefined,
            review_status: ra.review_status,
            reviewed_by: ra.reviewed_by_name || undefined,
            review_note: ra.review_note || undefined,
            historical_avg_qty: metrics.historical_avg_qty || undefined,
            quantity_ratio: metrics.quantity_ratio || undefined,
            scan_timeline: scanTimeline,
          },
          actions_recommended:
            ra.risk_level === 'HIGH'
              ? 'Mandatory Supervisor review required. Verify physical box seal, part drawing, and customer PO before gate clearance.'
              : 'Review scan logs and ensure physical boxes match invoice manifest.',
          review_status: ra.review_status as any,
        });
      }
    }

    // Process any Scan Logs that weren't linked to a saved GateRiskAnalysis record
    for (const [invBarcode, logs] of invoiceScanMap.entries()) {
      if (!processedInvoices.has(invBarcode) && invBarcode !== 'GENERAL') {
        const failed = logs.filter((l) => !l.is_valid);
        if (failed.length >= 2) {
          const priority = failed.length >= 4 ? 'HIGH' : 'MEDIUM';
          if (priority === 'HIGH') highCount++;
          else mediumCount++;

          const timeline = logs.map((s) => ({
            time: new Date(s.created_at).toTimeString().split(' ')[0],
            barcode: s.scanned_barcode,
            scan_type: s.scan_type,
            is_valid: s.is_valid,
            failure_reason: s.failure_reason || undefined,
            user_name: s.user_name || undefined,
          }));

          consolidatedEvents.push({
            id: `briefing_scan_${invBarcode}`,
            title: `${failed.length} Failed Barcode Attempts on Unverified Invoice`,
            priority,
            category: 'BARCODE_RETRY',
            what_happened: `${failed.length} invalid barcode scan attempts were recorded for Invoice/Barcode ${invBarcode}.`,
            why_it_matters: 'Multiple failed barcode scans may indicate an invalid label or operator entry error on unverified goods.',
            evidence: {
              invoice_barcode: invBarcode,
              failed_scans_count: failed.length,
              scan_timeline: timeline,
            },
            actions_recommended: 'Inspect physical barcode on boxes and verify invoice status in ERP.',
            review_status: 'pending_review',
          });
        }
      }
    }

    // Sort events by priority: CRITICAL -> HIGH -> MEDIUM -> LOW
    const priorityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    consolidatedEvents.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const totalMonitoredTransactions = Math.max(dayAnalyses.length, dayMatches.length, dayInvoices.length, 1);
    const normalCount = Math.max(0, totalMonitoredTransactions - consolidatedEvents.length);

    // Format Executive Summary
    const dateFormatted = new Date(`${targetDate}T12:00:00`).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    let executiveSummary = '';
    if (consolidatedEvents.length === 0) {
      executiveSummary = `On ${dateFormatted}, the ERP monitored ${totalMonitoredTransactions} gate operations with 100% adherence to standard factory parameters. Zero abnormal barcode retries, off-hours dispatches, or quantity anomalies were recorded.`;
    } else {
      const topIssue = consolidatedEvents[0];
      executiveSummary = `On ${dateFormatted}, the ERP monitored ${totalMonitoredTransactions} gate transactions. ${highCount} high-priority and ${mediumCount} medium-priority security events were identified. Primary alert: ${topIssue.title} (${topIssue.what_happened}). ${pendingReviewsCount} dispatches are currently awaiting supervisor review.`;
    }

    // 5. Save or Update in database
    let briefingRecord = await this.briefingRepo.findOne({
      where: { briefing_date: targetDate },
    });

    if (!briefingRecord) {
      briefingRecord = this.briefingRepo.create({
        briefing_date: targetDate,
        total_events: totalMonitoredTransactions,
        normal_count: normalCount,
        high_priority_count: highCount,
        medium_priority_count: mediumCount,
        low_priority_count: lowCount,
        pending_reviews_count: pendingReviewsCount,
        executive_summary: executiveSummary,
        events: JSON.stringify(consolidatedEvents),
        status: pendingReviewsCount > 0 ? 'generated' : 'reviewed',
        generated_by: generatedBy,
        engine_version: 'v1.0-evidence-consolidator',
      });
    } else {
      briefingRecord.total_events = totalMonitoredTransactions;
      briefingRecord.normal_count = normalCount;
      briefingRecord.high_priority_count = highCount;
      briefingRecord.medium_priority_count = mediumCount;
      briefingRecord.low_priority_count = lowCount;
      briefingRecord.pending_reviews_count = pendingReviewsCount;
      briefingRecord.executive_summary = executiveSummary;
      briefingRecord.events = JSON.stringify(consolidatedEvents);
      briefingRecord.generated_by = generatedBy;
      briefingRecord.generated_at = new Date();
    }

    const saved = await this.briefingRepo.save(briefingRecord);

    // Trigger notification for daily security briefing
    try {
      await this.notifService.notifyDailySecurityBriefing({
        briefing_date: saved.briefing_date,
        total_events: saved.total_events,
        high_priority_count: saved.high_priority_count,
        medium_priority_count: saved.medium_priority_count,
      });
    } catch (e) {
      console.error('Error triggering briefing notification:', e);
    }

    return {
      ...saved,
      events: consolidatedEvents,
    };
  }

  // Get Briefing History (List of past dates)
  async getBriefingHistory() {
    const records = await this.briefingRepo.find({
      order: { briefing_date: 'DESC' },
      take: 30,
    });

    return records.map((r) => ({
      id: r.id,
      briefing_date: r.briefing_date,
      generated_at: r.generated_at,
      total_events: r.total_events,
      high_priority_count: r.high_priority_count,
      medium_priority_count: r.medium_priority_count,
      low_priority_count: r.low_priority_count,
      pending_reviews_count: r.pending_reviews_count,
      status: r.status,
      summary: r.executive_summary,
    }));
  }

  // Get single event detail with underlying evidence
  async getEventDetail(dateStr: string, eventId: string) {
    const briefing = await this.getBriefingForDate(dateStr);
    const event = briefing.events.find((e: SecurityBriefingEvent) => e.id === eventId);
    if (!event) {
      throw new NotFoundException(`Security event #${eventId} not found in briefing for ${dateStr}`);
    }
    return event;
  }
}
