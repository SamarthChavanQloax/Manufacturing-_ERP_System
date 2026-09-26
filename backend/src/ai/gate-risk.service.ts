import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Like } from 'typeorm';
import {
  GateRiskAnalysis,
  GateScanLog,
  GateRiskConfig,
  Invoice,
  Part,
  Customer,
  InvoiceBox,
  Box,
  BoxPacking,
  InvoiceMatch,
  InvoiceBoxMatch,
  UserInfo,
} from '../entities';
import { NotificationService } from '../notifications/notifications.service';

export interface RiskFactorItem {
  name: string;
  score: number;
  maxScore: number;
  detected: boolean;
  detail: string;
}

export interface RiskAnalysisResult {
  id?: number;
  match_id?: number;
  invoice_barcode: string;
  invoice_number: string;
  customer_id?: number;
  customer_name: string;
  part_id?: number;
  part_number: string;
  part_description?: string;
  invoice_qty: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  recommendation: string;
  risk_factors: Record<string, RiskFactorItem>;
  metrics: Record<string, any>;
  model_version: string;
  review_status: 'not_required' | 'pending_review' | 'reviewed';
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  review_timestamp?: Date | null;
  review_note?: string | null;
  review_decision?: string | null;
  created_at?: Date;
}

@Injectable()
export class GateRiskService implements OnModuleInit {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(GateRiskAnalysis)
    private riskAnalysisRepo: Repository<GateRiskAnalysis>,
    @InjectRepository(GateScanLog)
    private scanLogRepo: Repository<GateScanLog>,
    @InjectRepository(GateRiskConfig)
    private configRepo: Repository<GateRiskConfig>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(InvoiceBox)
    private invoiceBoxRepo: Repository<InvoiceBox>,
    @InjectRepository(Box)
    private boxRepo: Repository<Box>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(InvoiceMatch)
    private invoiceMatchRepo: Repository<InvoiceMatch>,
    @InjectRepository(InvoiceBoxMatch)
    private invoiceBoxMatchRepo: Repository<InvoiceBoxMatch>,
    @InjectRepository(UserInfo)
    private userRepo: Repository<UserInfo>,
    private notifService: NotificationService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureTablesExist();
      await this.seedDefaultConfigs();
    } catch (err) {
      console.error('[GateRiskService] Init warning:', err);
    }
  }

  private async ensureTablesExist() {
    // Safely create AI Gate Risk tables if they do not exist
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS gate_risk_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT NULL,
        invoice_barcode VARCHAR(50) NOT NULL,
        invoice_number VARCHAR(50) NULL,
        customer_id INT NULL,
        customer_name VARCHAR(255) NULL,
        part_id INT NULL,
        part_number VARCHAR(255) NULL,
        invoice_qty FLOAT DEFAULT 0,
        risk_score INT DEFAULT 0,
        risk_level VARCHAR(20) DEFAULT 'LOW',
        risk_factors LONGTEXT NULL,
        reasons LONGTEXT NULL,
        recommendation TEXT NULL,
        metrics LONGTEXT NULL,
        model_version VARCHAR(50) DEFAULT 'v1.0-explainable-heuristics',
        review_status VARCHAR(30) DEFAULT 'not_required',
        reviewed_by INT NULL,
        reviewed_by_name VARCHAR(255) NULL,
        review_timestamp DATETIME NULL,
        review_note TEXT NULL,
        review_decision VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_match_id (match_id),
        INDEX idx_invoice_barcode (invoice_barcode),
        INDEX idx_risk_level (risk_level),
        INDEX idx_review_status (review_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS gate_scan_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT NULL,
        invoice_barcode VARCHAR(50) NULL,
        scanned_barcode VARCHAR(50) NOT NULL,
        scan_type VARCHAR(20) NOT NULL,
        is_valid BOOLEAN DEFAULT TRUE,
        failure_reason VARCHAR(255) NULL,
        user_id INT NULL,
        user_name VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_scan_match (match_id),
        INDEX idx_scan_invoice (invoice_barcode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS gate_risk_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value TEXT NOT NULL,
        description VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  private async seedDefaultConfigs() {
    const defaultConfigs: Record<string, { value: string; desc: string }> = {
      WEIGHT_QUANTITY: { value: '28', desc: 'Maximum weight for order quantity deviation' },
      WEIGHT_TIME: { value: '20', desc: 'Maximum weight for off-hours dispatch' },
      WEIGHT_WORKFLOW_BYPASS: { value: '22', desc: 'Maximum weight for packing-to-gate bypass' },
      WEIGHT_FAILED_SCANS: { value: '25', desc: 'Maximum weight for failed scan patterns' },
      WEIGHT_CUSTOMER_PATTERN: { value: '15', desc: 'Weight for customer pattern / new product deviations' },
      WEIGHT_USER_VELOCITY: { value: '12', desc: 'Weight for unusual operator velocity' },
      THRESHOLD_LOW_MAX: { value: '30', desc: 'Max score for LOW risk level' },
      THRESHOLD_MEDIUM_MAX: { value: '70', desc: 'Max score for MEDIUM risk level' },
      OFF_HOURS_START: { value: '22', desc: 'Hour of day starting night shift (22 = 10 PM)' },
      OFF_HOURS_END: { value: '6', desc: 'Hour of day ending night shift (6 = 6 AM)' },
    };

    for (const [key, item] of Object.entries(defaultConfigs)) {
      const exists = await this.configRepo.findOne({ where: { config_key: key } });
      if (!exists) {
        await this.configRepo.save(
          this.configRepo.create({
            config_key: key,
            config_value: item.value,
            description: item.desc,
          }),
        );
      }
    }
  }

  // Retrieve configuration
  async getConfigs(): Promise<Record<string, string>> {
    const configs = await this.configRepo.find();
    const result: Record<string, string> = {
      WEIGHT_QUANTITY: '28',
      WEIGHT_TIME: '20',
      WEIGHT_WORKFLOW_BYPASS: '22',
      WEIGHT_FAILED_SCANS: '25',
      WEIGHT_CUSTOMER_PATTERN: '15',
      WEIGHT_USER_VELOCITY: '12',
      THRESHOLD_LOW_MAX: '30',
      THRESHOLD_MEDIUM_MAX: '70',
      OFF_HOURS_START: '22',
      OFF_HOURS_END: '6',
    };
    configs.forEach((c) => {
      result[c.config_key] = c.config_value;
    });
    return result;
  }

  async updateConfig(key: string, value: string) {
    let cfg = await this.configRepo.findOne({ where: { config_key: key } });
    if (!cfg) {
      cfg = this.configRepo.create({ config_key: key, config_value: value });
    } else {
      cfg.config_value = value;
    }
    return this.configRepo.save(cfg);
  }

  // Scan logging for Gate verification events
  async logScan(dto: {
    match_id?: number;
    invoice_barcode?: string;
    scanned_barcode: string;
    scan_type: string;
    is_valid: boolean;
    failure_reason?: string;
    user_id?: number;
  }) {
    let userName = 'Operator';
    if (dto.user_id) {
      const u = await this.userRepo.findOne({ where: { id: dto.user_id } });
      if (u) userName = u.user_name || u.user_email || `User #${u.id}`;
    }

    const logEntry = this.scanLogRepo.create({
      match_id: dto.match_id || undefined,
      invoice_barcode: dto.invoice_barcode || undefined,
      scanned_barcode: dto.scanned_barcode,
      scan_type: dto.scan_type,
      is_valid: dto.is_valid,
      failure_reason: dto.failure_reason,
      user_id: dto.user_id,
      user_name: userName,
    });

    const savedLog = await this.scanLogRepo.save(logEntry);

    // Trigger notification if repeated failures or duplicate scan
    if (dto.invoice_barcode && (!dto.is_valid || (dto.failure_reason || '').toLowerCase().includes('duplicate'))) {
      try {
        const recentLogs = await this.scanLogRepo.find({
          where: { invoice_barcode: dto.invoice_barcode },
          order: { id: 'DESC' },
          take: 10,
        });
        const failedCount = recentLogs.filter((s) => !s.is_valid).length;
        const duplicateCount = recentLogs.filter(
          (s) =>
            (s.failure_reason || '').toLowerCase().includes('already scanned') ||
            (s.failure_reason || '').toLowerCase().includes('duplicate'),
        ).length;

        if (failedCount >= 3 || duplicateCount >= 1) {
          await this.notifService.notifyScanAnomaly({
            invoice_barcode: dto.invoice_barcode,
            failed_count: failedCount,
            duplicate_count: duplicateCount,
            operator_name: userName,
            last_reason: dto.failure_reason,
          });
        }
      } catch (e) {
        console.error('Error triggering scan anomaly notification:', e);
      }
    }

    return savedLog;
  }

  // Core Risk Analysis Engine
  async analyzeGateTransaction(params: {
    invoice_barcode?: string;
    match_id?: number;
    user_id?: number;
  }): Promise<RiskAnalysisResult> {
    const { invoice_barcode, match_id, user_id } = params;

    let invoiceBarcode = (invoice_barcode || '').trim();
    let matchRecord: InvoiceMatch | null = null;

    if (match_id) {
      matchRecord = await this.invoiceMatchRepo.findOne({ where: { id: match_id } });
      if (matchRecord && !invoiceBarcode) {
        invoiceBarcode = matchRecord.invoice_number;
      }
    }

    if (!invoiceBarcode) {
      throw new BadRequestException('Invoice barcode or match ID is required for AI risk analysis');
    }

    // 1. Fetch Invoice
    const invoice = await this.invoiceRepo.findOne({
      where: { barcode: invoiceBarcode },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with barcode ${invoiceBarcode} not found`);
    }

    // 2. Fetch Part & Customer
    let part: Part | null = null;
    let customer: Customer | null = null;

    if (invoice.part_id) {
      part = await this.partRepo.findOne({ where: { id: invoice.part_id } });
      if (part && part.customer_id) {
        customer = await this.customerRepo.findOne({ where: { id: part.customer_id } });
      }
    }

    if (!matchRecord) {
      matchRecord = await this.invoiceMatchRepo.findOne({
        where: { invoice_number: invoice.barcode },
      });
    }

    const configs = await this.getConfigs();
    const weightQuantity = Number(configs.WEIGHT_QUANTITY) || 28;
    const weightTime = Number(configs.WEIGHT_TIME) || 20;
    const weightWorkflow = Number(configs.WEIGHT_WORKFLOW_BYPASS) || 22;
    const weightFailedScans = Number(configs.WEIGHT_FAILED_SCANS) || 25;
    const weightCustomerPattern = Number(configs.WEIGHT_CUSTOMER_PATTERN) || 15;
    const weightUserVelocity = Number(configs.WEIGHT_USER_VELOCITY) || 12;

    const thresholdLow = Number(configs.THRESHOLD_LOW_MAX) || 30;
    const thresholdMedium = Number(configs.THRESHOLD_MEDIUM_MAX) || 70;
    const offHoursStart = Number(configs.OFF_HOURS_START) || 22;
    const offHoursEnd = Number(configs.OFF_HOURS_END) || 6;

    const riskFactors: Record<string, RiskFactorItem> = {};
    const reasons: string[] = [];
    const metrics: Record<string, any> = {};

    // ----------------------------------------------------
    // FACTOR 1: Quantity Anomaly (Customer Historical Orders)
    // ----------------------------------------------------
    let quantityScore = 0;
    let quantityDetail = 'Normal order quantity within historical baseline';
    let isQuantityAnomaly = false;

    // Fetch historical invoices for this customer or part
    let historicalInvoices: Invoice[] = [];
    if (part) {
      // Find all parts belonging to this customer
      let customerPartIds: number[] = [part.id];
      if (part.customer_id) {
        const custParts = await this.partRepo.find({ where: { customer_id: part.customer_id } });
        customerPartIds = custParts.map((p) => p.id);
      }

      // Query past invoices (excluding current invoice)
      const allInvoices = await this.invoiceRepo.find();
      historicalInvoices = allInvoices.filter(
        (inv) => customerPartIds.includes(inv.part_id) && inv.id !== invoice.id,
      );
    }

    const currentQty = Number(invoice.qty) || 0;
    metrics.current_qty = currentQty;
    metrics.historical_order_count = historicalInvoices.length;

    if (historicalInvoices.length >= 2) {
      const totalPastQty = historicalInvoices.reduce((sum, inv) => sum + (Number(inv.qty) || 0), 0);
      const avgPastQty = totalPastQty / historicalInvoices.length;
      const maxPastQty = Math.max(...historicalInvoices.map((inv) => Number(inv.qty) || 0));
      const ratio = avgPastQty > 0 ? currentQty / avgPastQty : 1;

      metrics.historical_avg_qty = Math.round(avgPastQty * 10) / 10;
      metrics.historical_max_qty = maxPastQty;
      metrics.quantity_ratio = Math.round(ratio * 100) / 100;

      if (ratio >= 2.5 || (currentQty > maxPastQty * 2 && currentQty > 500)) {
        quantityScore = weightQuantity;
        isQuantityAnomaly = true;
        quantityDetail = `Dispatch qty (${currentQty} pcs) is ${ratio.toFixed(1)}x higher than customer's historical average (${Math.round(avgPastQty)} pcs)`;
        reasons.push(quantityDetail);
      } else if (ratio >= 1.7) {
        quantityScore = Math.round(weightQuantity * 0.65);
        isQuantityAnomaly = true;
        quantityDetail = `Dispatch qty (${currentQty} pcs) is ${ratio.toFixed(1)}x customer's normal average (${Math.round(avgPastQty)} pcs)`;
        reasons.push(quantityDetail);
      } else if (currentQty > 5000) {
        quantityScore = Math.round(weightQuantity * 0.5);
        isQuantityAnomaly = true;
        quantityDetail = `Unusually large bulk dispatch batch (${currentQty} pcs)`;
        reasons.push(quantityDetail);
      }
    } else if (historicalInvoices.length === 0 && currentQty > 1000) {
      quantityScore = Math.round(weightQuantity * 0.5);
      isQuantityAnomaly = true;
      quantityDetail = `Large initial order volume (${currentQty} pcs) with no prior customer dispatch history`;
      reasons.push(quantityDetail);
    }

    riskFactors.quantity_anomaly = {
      name: 'Quantity Anomaly',
      score: quantityScore,
      maxScore: weightQuantity,
      detected: isQuantityAnomaly,
      detail: quantityDetail,
    };

    // ----------------------------------------------------
    // FACTOR 2: Unusual Time / Off-Hours Anomaly
    // ----------------------------------------------------
    let timeScore = 0;
    let timeDetail = 'Standard operating hours dispatch';
    let isTimeAnomaly = false;

    const now = new Date();
    // Use match creation time if available, else current time
    let scanHour = now.getHours();
    let scanTimeStr = now.toTimeString().split(' ')[0];
    let scanDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    if (matchRecord && matchRecord.created_date) {
      const hourPart = parseInt(matchRecord.created_date.split(':')[0], 10);
      if (!isNaN(hourPart)) {
        scanHour = hourPart;
        scanTimeStr = matchRecord.created_date;
      }
    }

    metrics.scan_hour = scanHour;
    metrics.scan_time = scanTimeStr;
    const isOffHours = scanHour >= offHoursStart || scanHour < offHoursEnd;
    metrics.is_off_hours = isOffHours;

    if (isOffHours) {
      timeScore = weightTime;
      isTimeAnomaly = true;
      timeDetail = `Gate scan initiated at ${scanTimeStr} during off-hours window (${offHoursStart}:00 - 0${offHoursEnd}:00)`;
      reasons.push(timeDetail);
    } else if (scanDay === 0) {
      timeScore = Math.round(weightTime * 0.6);
      isTimeAnomaly = true;
      timeDetail = `Gate dispatch conducted on Sunday outside normal scheduled manufacturing shifts`;
      reasons.push(timeDetail);
    }

    riskFactors.unusual_scan_time = {
      name: 'Unusual Scan Time',
      score: timeScore,
      maxScore: weightTime,
      detected: isTimeAnomaly,
      detail: timeDetail,
    };

    // ----------------------------------------------------
    // FACTOR 3: Workflow Sequence & Rapid Packing-to-Gate Delta
    // ----------------------------------------------------
    let workflowScore = 0;
    let workflowDetail = 'Normal packing-to-gate progression sequence';
    let isWorkflowAnomaly = false;

    // Check mapped boxes for this invoice
    const invoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
    metrics.total_boxes_count = invoiceBoxes.length;

    if (invoiceBoxes.length > 0) {
      // Find boxes in box table
      const boxBarcodes = invoiceBoxes.map((ib) => ib.box_id);
      const boxes = await this.boxRepo.find();
      const relevantBoxes = boxes.filter((b) => boxBarcodes.includes(Number(b.barcode)));

      // Compare box creation time vs invoice / match creation time
      // In this ERP, created_time holds Date string (YYYY-MM-DD) and created_date holds Time string (HH:MM:SS)
      let minDeltaMinutes = 9999;
      const invDateTimeStr = `${invoice.created_time}T${invoice.created_date}`;
      const invDate = new Date(invDateTimeStr);

      if (!isNaN(invDate.getTime())) {
        for (const b of relevantBoxes) {
          const boxDateTime = new Date(`${b.created_time}T${b.created_date}`);
          if (!isNaN(boxDateTime.getTime())) {
            const diffMin = Math.floor((invDate.getTime() - boxDateTime.getTime()) / 60000);
            if (diffMin >= 0 && diffMin < minDeltaMinutes) {
              minDeltaMinutes = diffMin;
            }
          }
        }
      }

      metrics.packing_to_gate_delta_min = minDeltaMinutes < 9999 ? minDeltaMinutes : null;

      if (minDeltaMinutes < 3 && relevantBoxes.length >= 3) {
        workflowScore = weightWorkflow;
        isWorkflowAnomaly = true;
        workflowDetail = `Rapid workflow bypass: ${relevantBoxes.length} boxes packed only ${minDeltaMinutes} min before invoice generation`;
        reasons.push(workflowDetail);
      } else if (minDeltaMinutes < 8 && relevantBoxes.length >= 5) {
        workflowScore = Math.round(weightWorkflow * 0.6);
        isWorkflowAnomaly = true;
        workflowDetail = `Short interval (${minDeltaMinutes} min) between packing ${relevantBoxes.length} boxes and gate verification`;
        reasons.push(workflowDetail);
      }
    }

    riskFactors.workflow_bypass = {
      name: 'Workflow Bypass / Rapid Sequence',
      score: workflowScore,
      maxScore: weightWorkflow,
      detected: isWorkflowAnomaly,
      detail: workflowDetail,
    };

    // ----------------------------------------------------
    // FACTOR 4: Failed Scan Pattern / Repeated Retries
    // ----------------------------------------------------
    let failedScansScore = 0;
    let failedScansDetail = 'No abnormal scan failures detected';
    let isFailedScanAnomaly = false;

    // Search scan logs for this invoice/match
    const scanLogs = await this.scanLogRepo.find({
      where: [
        { invoice_barcode: invoice.barcode },
        matchRecord ? { match_id: matchRecord.id } : { invoice_barcode: invoice.barcode },
      ],
      order: { id: 'DESC' },
      take: 50,
    });

    const failedScans = scanLogs.filter((l) => !l.is_valid);
    const duplicateScans = failedScans.filter((l) =>
      (l.failure_reason || '').toLowerCase().includes('already scanned'),
    );

    metrics.failed_scans_count = failedScans.length;
    metrics.duplicate_scans_count = duplicateScans.length;

    if (failedScans.length >= 4) {
      failedScansScore = weightFailedScans;
      isFailedScanAnomaly = true;
      failedScansDetail = `${failedScans.length} failed/invalid barcode scan attempts recorded during gate verification`;
      reasons.push(failedScansDetail);
    } else if (failedScans.length >= 2) {
      failedScansScore = Math.round(weightFailedScans * 0.6);
      isFailedScanAnomaly = true;
      failedScansDetail = `${failedScans.length} failed barcode scan attempts detected before successful match`;
      reasons.push(failedScansDetail);
    } else if (duplicateScans.length >= 1) {
      failedScansScore = Math.round(weightFailedScans * 0.4);
      isFailedScanAnomaly = true;
      failedScansDetail = `Duplicate barcode scan attempt detected during verification`;
      reasons.push(failedScansDetail);
    }

    riskFactors.failed_scan_pattern = {
      name: 'Failed Scan Pattern & Retries',
      score: failedScansScore,
      maxScore: weightFailedScans,
      detected: isFailedScanAnomaly,
      detail: failedScansDetail,
    };

    // ----------------------------------------------------
    // FACTOR 5: Customer Pattern Anomaly (New Part / Product Line)
    // ----------------------------------------------------
    let customerPatternScore = 0;
    let customerPatternDetail = 'Product matches customer established order profile';
    let isCustomerPatternAnomaly = false;

    if (customer && part && historicalInvoices.length >= 3) {
      // Check if this specific part was ever ordered before by this customer
      const partOrderedBefore = historicalInvoices.some((inv) => inv.part_id === part.id);
      if (!partOrderedBefore) {
        customerPatternScore = weightCustomerPattern;
        isCustomerPatternAnomaly = true;
        customerPatternDetail = `First-time dispatch of part ${part.part_number} for established customer ${customer.customer_name}`;
        reasons.push(customerPatternDetail);
      }
    }

    riskFactors.customer_pattern_anomaly = {
      name: 'Customer Order Pattern',
      score: customerPatternScore,
      maxScore: weightCustomerPattern,
      detected: isCustomerPatternAnomaly,
      detail: customerPatternDetail,
    };

    // ----------------------------------------------------
    // FACTOR 6: User / Operator Activity Velocity
    // ----------------------------------------------------
    let userVelocityScore = 0;
    let userVelocityDetail = 'Normal operator scanning cadence';
    let isUserVelocityAnomaly = false;

    if (scanLogs.length >= 6) {
      // Calculate timestamps of last 6 scans
      const timestamps = scanLogs.slice(0, 6).map((l) => new Date(l.created_at).getTime());
      const maxTime = Math.max(...timestamps);
      const minTime = Math.min(...timestamps);
      const diffSec = (maxTime - minTime) / 1000;

      if (diffSec > 0 && diffSec < 8) {
        // 6 scans in less than 8 seconds
        userVelocityScore = weightUserVelocity;
        isUserVelocityAnomaly = true;
        userVelocityDetail = `Abnormally high scan velocity (6 scans in ${Math.round(diffSec)}s, physically improbable for manual inspection)`;
        reasons.push(userVelocityDetail);
      }
    }

    riskFactors.user_activity_anomaly = {
      name: 'Operator Scan Velocity',
      score: userVelocityScore,
      maxScore: weightUserVelocity,
      detected: isUserVelocityAnomaly,
      detail: userVelocityDetail,
    };

    // ----------------------------------------------------
    // Total Risk Score & Classification
    // ----------------------------------------------------
    const rawScore =
      quantityScore +
      timeScore +
      workflowScore +
      failedScansScore +
      customerPatternScore +
      userVelocityScore;

    const totalRiskScore = Math.min(100, Math.max(0, rawScore));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let recommendation = 'Safe to proceed. Continue standard gate workflow.';

    if (totalRiskScore > thresholdMedium) {
      riskLevel = 'HIGH';
      recommendation =
        'Critical risk factors detected. Transaction flagged for Human/Admin Review before gate dispatch.';
    } else if (totalRiskScore > thresholdLow) {
      riskLevel = 'MEDIUM';
      recommendation =
        'Advisory warnings detected. Supervisor review recommended before gate clearance.';
    } else {
      if (reasons.length === 0) {
        reasons.push('All transaction signals align with historical baseline and normal shift parameters.');
      }
    }

    let reviewStatus: 'not_required' | 'pending_review' | 'reviewed' =
      totalRiskScore > thresholdLow ? 'pending_review' : 'not_required';

    // Check if an existing review was already recorded for this match
    let existingRecord = await this.riskAnalysisRepo.findOne({
      where: matchRecord ? { match_id: matchRecord.id } : { invoice_barcode: invoice.barcode },
    });

    if (existingRecord && existingRecord.review_status === 'reviewed') {
      reviewStatus = 'reviewed';
    }

    const customerName = customer?.customer_name || 'Generic Customer';
    const partNumber = part?.part_number || 'N/A';
    const partDesc = part?.part_description || '';

    // Save or update record in database
    if (!existingRecord) {
      existingRecord = this.riskAnalysisRepo.create({
        match_id: matchRecord?.id || undefined,
        invoice_barcode: invoice.barcode,
        invoice_number: invoice.invoice_number,
        customer_id: customer?.id || part?.customer_id || undefined,
        customer_name: customerName,
        part_id: part?.id || undefined,
        part_number: partNumber,
        invoice_qty: currentQty,
        risk_score: totalRiskScore,
        risk_level: riskLevel,
        risk_factors: JSON.stringify(riskFactors),
        reasons: JSON.stringify(reasons),
        recommendation: recommendation,
        metrics: JSON.stringify(metrics),
        model_version: 'v1.0-explainable-heuristics',
        review_status: reviewStatus,
      });
    } else {
      existingRecord.risk_score = totalRiskScore;
      existingRecord.risk_level = riskLevel;
      existingRecord.risk_factors = JSON.stringify(riskFactors);
      existingRecord.reasons = JSON.stringify(reasons);
      existingRecord.recommendation = recommendation;
      existingRecord.metrics = JSON.stringify(metrics);
      if (existingRecord.review_status !== 'reviewed') {
        existingRecord.review_status = reviewStatus;
      }
      if (matchRecord && !existingRecord.match_id) {
        existingRecord.match_id = matchRecord.id;
      }
    }

    const savedRecord = await this.riskAnalysisRepo.save(existingRecord);

    // Trigger AI Gate Risk notification if HIGH or MEDIUM risk
    try {
      await this.notifService.notifyGateRisk({
        id: savedRecord.id,
        invoice_barcode: savedRecord.invoice_barcode,
        invoice_number: savedRecord.invoice_number || invoice.invoice_number,
        customer_name: savedRecord.customer_name || customerName,
        risk_score: savedRecord.risk_score,
        risk_level: savedRecord.risk_level,
        reasons: reasons,
        invoice_qty: savedRecord.invoice_qty,
      });
    } catch (e) {
      console.error('Error triggering gate risk notification:', e);
    }

    return {
      id: savedRecord.id,
      match_id: savedRecord.match_id || undefined,
      invoice_barcode: savedRecord.invoice_barcode,
      invoice_number: savedRecord.invoice_number || invoice.invoice_number,
      customer_id: savedRecord.customer_id || undefined,
      customer_name: savedRecord.customer_name || customerName,
      part_id: savedRecord.part_id || undefined,
      part_number: savedRecord.part_number || partNumber,
      part_description: partDesc,
      invoice_qty: savedRecord.invoice_qty,
      risk_score: savedRecord.risk_score,
      risk_level: savedRecord.risk_level as any,
      reasons: reasons,
      recommendation: savedRecord.recommendation,
      risk_factors: riskFactors,
      metrics: metrics,
      model_version: savedRecord.model_version,
      review_status: savedRecord.review_status as any,
      reviewed_by: savedRecord.reviewed_by,
      reviewed_by_name: savedRecord.reviewed_by_name,
      review_timestamp: savedRecord.review_timestamp,
      review_note: savedRecord.review_note,
      review_decision: savedRecord.review_decision,
      created_at: savedRecord.created_at,
    };
  }

  // Get risk analysis for a match (or analyze on-the-fly)
  async getRiskForMatch(matchId: number): Promise<RiskAnalysisResult> {
    const match = await this.invoiceMatchRepo.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Verification match #${matchId} not found`);
    }

    return this.analyzeGateTransaction({ match_id: match.id, invoice_barcode: match.invoice_number });
  }

  // Record human/admin review
  async reviewTransaction(dto: {
    analysis_id: number;
    decision: 'approved' | 'flagged' | 'rejected';
    note: string;
    user_id: number;
  }): Promise<GateRiskAnalysis> {
    const record = await this.riskAnalysisRepo.findOne({ where: { id: dto.analysis_id } });
    if (!record) {
      throw new NotFoundException(`Risk analysis record #${dto.analysis_id} not found`);
    }

    let reviewerName = 'Admin';
    if (dto.user_id) {
      const u = await this.userRepo.findOne({ where: { id: dto.user_id } });
      if (u) reviewerName = u.user_name || u.user_email || `User #${u.id}`;
    }

    record.review_status = 'reviewed';
    record.review_decision = dto.decision;
    record.review_note = dto.note;
    record.reviewed_by = dto.user_id;
    record.reviewed_by_name = reviewerName;
    record.review_timestamp = new Date();

    return this.riskAnalysisRepo.save(record);
  }

  // Admin Dashboard Summary
  async getDashboardSummary() {
    const allAnalyses = await this.riskAnalysisRepo.find({
      order: { id: 'DESC' },
      take: 1000,
    });

    const total = allAnalyses.length;
    const lowCount = allAnalyses.filter((a) => a.risk_level === 'LOW').length;
    const medCount = allAnalyses.filter((a) => a.risk_level === 'MEDIUM').length;
    const highCount = allAnalyses.filter((a) => a.risk_level === 'HIGH').length;

    const totalScoreSum = allAnalyses.reduce((sum, a) => sum + (a.risk_score || 0), 0);
    const avgScore = total > 0 ? Math.round((totalScoreSum / total) * 10) / 10 : 0;
    const pendingReviews = allAnalyses.filter((a) => a.review_status === 'pending_review').length;

    // Risk Factor Frequency Analysis
    const factorCounts: Record<string, number> = {
      quantity_anomaly: 0,
      unusual_scan_time: 0,
      workflow_bypass: 0,
      failed_scan_pattern: 0,
      customer_pattern_anomaly: 0,
      user_activity_anomaly: 0,
    };

    for (const item of allAnalyses) {
      try {
        if (item.risk_factors) {
          const factors = JSON.parse(item.risk_factors);
          for (const [fKey, fVal] of Object.entries(factors)) {
            if ((fVal as any)?.detected) {
              factorCounts[fKey] = (factorCounts[fKey] || 0) + 1;
            }
          }
        }
      } catch (e) {}
    }

    // Recent Flagged Transactions
    const recentFlagged = allAnalyses
      .filter((a) => a.risk_level === 'HIGH' || a.risk_level === 'MEDIUM')
      .slice(0, 10)
      .map((a) => {
        let reasonsArr: string[] = [];
        try {
          reasonsArr = a.reasons ? JSON.parse(a.reasons) : [];
        } catch (e) {}
        return {
          ...a,
          reasons: reasonsArr,
        };
      });

    return {
      total_analyzed: total,
      low_risk_count: lowCount,
      medium_risk_count: medCount,
      high_risk_count: highCount,
      average_risk_score: avgScore,
      pending_reviews_count: pendingReviews,
      factor_frequencies: [
        { name: 'Quantity Anomaly', key: 'quantity_anomaly', count: factorCounts.quantity_anomaly },
        { name: 'Unusual Scan Time', key: 'unusual_scan_time', count: factorCounts.unusual_scan_time },
        { name: 'Workflow Bypass', key: 'workflow_bypass', count: factorCounts.workflow_bypass },
        { name: 'Failed Barcode Scans', key: 'failed_scan_pattern', count: factorCounts.failed_scan_pattern },
        { name: 'Customer Pattern Anomaly', key: 'customer_pattern_anomaly', count: factorCounts.customer_pattern_anomaly },
        { name: 'Operator Velocity Anomaly', key: 'user_activity_anomaly', count: factorCounts.user_activity_anomaly },
      ],
      recent_flagged: recentFlagged,
    };
  }

  // Filtered Paginated Transactions List
  async getTransactions(query: {
    risk_level?: string;
    review_status?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = Number(query.limit) || 25;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    let qb = this.riskAnalysisRepo.createQueryBuilder('ra');

    if (query.risk_level && query.risk_level !== 'ALL') {
      qb = qb.andWhere('ra.risk_level = :riskLevel', { riskLevel: query.risk_level });
    }

    if (query.review_status && query.review_status !== 'ALL') {
      qb = qb.andWhere('ra.review_status = :reviewStatus', { reviewStatus: query.review_status });
    }

    if (query.search && query.search.trim()) {
      const s = `%${query.search.trim()}%`;
      qb = qb.andWhere(
        '(ra.invoice_barcode LIKE :s OR ra.invoice_number LIKE :s OR ra.customer_name LIKE :s OR ra.part_number LIKE :s)',
        { s },
      );
    }

    qb = qb.orderBy('ra.id', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const formattedItems = items.map((item) => {
      let reasonsArr: string[] = [];
      let factorsObj: any = {};
      let metricsObj: any = {};
      try {
        reasonsArr = item.reasons ? JSON.parse(item.reasons) : [];
        factorsObj = item.risk_factors ? JSON.parse(item.risk_factors) : {};
        metricsObj = item.metrics ? JSON.parse(item.metrics) : {};
      } catch (e) {}

      return {
        ...item,
        reasons: reasonsArr,
        risk_factors: factorsObj,
        metrics: metricsObj,
      };
    });

    return {
      items: formattedItems,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  // Single transaction details
  async getTransactionById(id: number) {
    const record = await this.riskAnalysisRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Transaction record #${id} not found`);

    let reasonsArr: string[] = [];
    let factorsObj: any = {};
    let metricsObj: any = {};
    try {
      reasonsArr = record.reasons ? JSON.parse(record.reasons) : [];
      factorsObj = record.risk_factors ? JSON.parse(record.risk_factors) : {};
      metricsObj = record.metrics ? JSON.parse(record.metrics) : {};
    } catch (e) {}

    // Find scan logs
    const scanLogs = await this.scanLogRepo.find({
      where: [
        { invoice_barcode: record.invoice_barcode },
        record.match_id ? { match_id: record.match_id } : { invoice_barcode: record.invoice_barcode },
      ],
      order: { id: 'ASC' },
    });

    return {
      ...record,
      reasons: reasonsArr,
      risk_factors: factorsObj,
      metrics: metricsObj,
      scan_logs: scanLogs,
    };
  }
}
