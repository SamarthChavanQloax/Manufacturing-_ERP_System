import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like, In } from 'typeorm';
import { Notification } from '../entities';

export interface CreateNotificationDto {
  recipient_user_id?: number;
  recipient_role?: string; // 'admin' | 'gate' | 'packing' | 'box' | 'invoice' | 'ALL'
  type: string;
  priority?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  dedup_key?: string;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureTableExists();
  }

  private async ensureTableExists() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS erp_notification (
          id INT AUTO_INCREMENT PRIMARY KEY,
          recipient_user_id INT NULL,
          recipient_role VARCHAR(50) DEFAULT 'ALL',
          type VARCHAR(60) NOT NULL,
          priority VARCHAR(20) DEFAULT 'INFO',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          entity_type VARCHAR(50) NULL,
          entity_id VARCHAR(100) NULL,
          action_url VARCHAR(255) NULL,
          metadata TEXT NULL,
          dedup_key VARCHAR(180) NULL,
          is_read BOOLEAN DEFAULT FALSE,
          read_at DATETIME NULL,
          lifecycle_status VARCHAR(30) DEFAULT 'OPEN',
          resolved_by_name VARCHAR(255) NULL,
          resolved_at DATETIME NULL,
          resolution_note TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NULL,
          INDEX idx_recipient (recipient_role, is_read),
          INDEX idx_dedup (dedup_key),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {
      console.error('Error ensuring erp_notification table exists:', e);
    }
  }

  // Create notification with automatic deduplication
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const priority = dto.priority || 'INFO';
    const recipientRole = dto.recipient_role || 'ALL';
    const metadataStr = dto.metadata ? JSON.stringify(dto.metadata) : null;

    // Deduplication check: if dedup_key provided, check if active notification exists within last 60 mins
    if (dto.dedup_key) {
      const existing = await this.notifRepo.findOne({
        where: { dedup_key: dto.dedup_key },
        order: { id: 'DESC' },
      });

      if (existing) {
        // Update existing notification with new message and timestamp to avoid alert spam
        existing.title = dto.title;
        existing.message = dto.message;
        existing.priority = priority;
        existing.metadata = metadataStr;
        existing.is_read = false;
        existing.read_at = null;
        existing.action_url = dto.action_url || existing.action_url;
        existing.created_at = new Date();
        return this.notifRepo.save(existing);
      }
    }

    const notif = this.notifRepo.create({
      recipient_user_id: dto.recipient_user_id || null,
      recipient_role: recipientRole,
      type: dto.type,
      priority,
      title: dto.title,
      message: dto.message,
      entity_type: dto.entity_type || null,
      entity_id: dto.entity_id || null,
      action_url: dto.action_url || null,
      metadata: metadataStr,
      dedup_key: dto.dedup_key || null,
      is_read: false,
      lifecycle_status: 'OPEN',
    });

    return this.notifRepo.save(notif);
  }

  // Role visibility query helper
  private getRoleFilter(userRole: string) {
    if (userRole === 'admin') {
      return null; // Admin sees all
    }
    return In([userRole, 'ALL']);
  }

  // Get paginated notifications
  async getNotifications(
    user: any,
    query: {
      page?: number;
      limit?: number;
      type?: string;
      priority?: string;
      is_read?: string;
      search?: string;
      entity_type?: string;
    },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const userRole = (user?.role || user?.type || 'admin').toLowerCase();
    const roleFilter = this.getRoleFilter(userRole);

    const qb = this.notifRepo.createQueryBuilder('n');

    if (roleFilter) {
      qb.andWhere('n.recipient_role IN (:...roles)', { roles: [userRole, 'ALL'] });
    }

    if (query.type && query.type !== 'ALL') {
      qb.andWhere('n.type = :type', { type: query.type });
    }

    if (query.priority && query.priority !== 'ALL') {
      qb.andWhere('n.priority = :priority', { priority: query.priority });
    }

    if (query.is_read !== undefined && query.is_read !== '' && query.is_read !== 'ALL') {
      const isReadBool = query.is_read === 'true' || query.is_read === '1';
      qb.andWhere('n.is_read = :isRead', { isRead: isReadBool });
    }

    if (query.entity_type && query.entity_type !== 'ALL') {
      qb.andWhere('n.entity_type = :entityType', { entityType: query.entity_type });
    }

    if (query.search && query.search.trim()) {
      const searchPattern = `%${query.search.trim()}%`;
      qb.andWhere(
        '(n.title LIKE :s OR n.message LIKE :s OR n.entity_id LIKE :s)',
        { s: searchPattern },
      );
    }

    qb.orderBy('n.created_at', 'DESC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const formattedItems = items.map((item) => {
      let parsedMeta = null;
      try {
        parsedMeta = item.metadata ? JSON.parse(item.metadata) : null;
      } catch (e) {}
      return {
        ...item,
        metadata: parsedMeta,
      };
    });

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Fast unread count and pending alerts count for top header bell badge
  async getUnreadCount(user: any): Promise<{ unread_count: number; critical_count: number; pending_count: number }> {
    const userRole = (user?.role || user?.type || 'admin').toLowerCase();
    const roleFilter = this.getRoleFilter(userRole);

    const baseQb = () => {
      const q = this.notifRepo.createQueryBuilder('n');
      if (roleFilter) {
        q.andWhere('n.recipient_role IN (:...roles)', { roles: [userRole, 'ALL'] });
      }
      return q;
    };

    const unread_count = await baseQb().andWhere('n.is_read = false').getCount();

    const critical_count = await baseQb()
      .andWhere('n.is_read = false')
      .andWhere("n.priority IN ('CRITICAL', 'HIGH')")
      .getCount();

    const pending_count = await baseQb()
      .andWhere("(n.lifecycle_status = 'OPEN' OR n.is_read = false)")
      .getCount();

    return { unread_count, critical_count, pending_count };
  }

  // Admin / Supervisor Notification Overview Summary
  async getSummary(user: any) {
    const userRole = (user?.role || user?.type || 'admin').toLowerCase();
    const roleFilter = this.getRoleFilter(userRole);

    const baseQb = () => {
      const q = this.notifRepo.createQueryBuilder('n');
      if (roleFilter) {
        q.andWhere('n.recipient_role IN (:...roles)', { roles: [userRole, 'ALL'] });
      }
      return q;
    };

    const total = await baseQb().getCount();
    const unread = await baseQb().andWhere('n.is_read = false').getCount();
    const critical = await baseQb().andWhere("n.priority = 'CRITICAL'").getCount();
    const high = await baseQb().andWhere("n.priority = 'HIGH'").getCount();
    const warning = await baseQb().andWhere("n.priority = 'WARNING'").getCount();
    const info = await baseQb().andWhere("n.priority = 'INFO'").getCount();
    const pendingActions = await baseQb()
      .andWhere("n.lifecycle_status = 'OPEN'")
      .andWhere("n.priority IN ('CRITICAL', 'HIGH')")
      .getCount();

    // Top most frequent alert types
    const frequentTypesRaw = await baseQb()
      .select('n.type', 'type')
      .addSelect('COUNT(n.id)', 'count')
      .groupBy('n.type')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const frequentTypes = frequentTypesRaw.map((r) => ({
      type: r.type,
      count: Number(r.count),
    }));

    return {
      total,
      unread,
      critical,
      high,
      warning,
      info,
      pending_actions: pendingActions,
      frequent_types: frequentTypes,
    };
  }

  // Mark single notification as read
  async markAsRead(id: number, user: any) {
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) return { success: false, message: 'Notification not found' };

    notif.is_read = true;
    notif.read_at = new Date();
    await this.notifRepo.save(notif);
    return { success: true, id };
  }

  // Mark all notifications as read for current user/role
  async markAllAsRead(user: any) {
    const userRole = (user?.role || user?.type || 'admin').toLowerCase();
    const roleFilter = this.getRoleFilter(userRole);

    const qb = this.notifRepo.createQueryBuilder().update(Notification).set({
      is_read: true,
      read_at: new Date(),
    }).where('is_read = false');

    if (roleFilter) {
      qb.andWhere('recipient_role IN (:...roles)', { roles: [userRole, 'ALL'] });
    }

    await qb.execute();
    return { success: true };
  }

  // Resolve an alert (Supervisor/Admin action)
  async resolveNotification(
    id: number,
    data: { note?: string },
    user: any,
  ) {
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) return { success: false, message: 'Notification not found' };

    const userName = user?.user_name || user?.username || user?.email || 'Supervisor';
    notif.lifecycle_status = 'RESOLVED';
    notif.resolved_by_name = userName;
    notif.resolved_at = new Date();
    notif.resolution_note = data.note || 'Resolved via Notification Center';
    notif.is_read = true;
    notif.read_at = notif.read_at || new Date();

    const saved = await this.notifRepo.save(notif);
    return { success: true, notification: saved };
  }

  // --------------------------------------------------------------------------
  // HOOKS: Automated Notification Triggers from ERP Events
  // --------------------------------------------------------------------------

  // 1. Hook for AI Gate Risk Analysis
  async notifyGateRisk(analysis: {
    id?: number;
    invoice_barcode: string;
    invoice_number?: string;
    customer_name?: string;
    risk_score: number;
    risk_level: string;
    reasons?: string[] | string;
    invoice_qty?: number;
  }) {
    if (analysis.risk_level === 'HIGH' || analysis.risk_score >= 71) {
      const reasonsArr = typeof analysis.reasons === 'string' ? JSON.parse(analysis.reasons || '[]') : analysis.reasons || [];
      const primaryReason = reasonsArr.length > 0 ? reasonsArr[0] : 'Volumetric and temporal anomalies detected';

      const invoiceId = analysis.invoice_number || analysis.invoice_barcode;
      const title = `🔴 High-Risk Gate Transaction (${invoiceId})`;
      const message = `Invoice ${invoiceId} for customer ${analysis.customer_name || 'N/A'} was flagged with Risk Score ${analysis.risk_score}/100. ${primaryReason}. Supervisor review required prior to truck release.`;

      const dateStr = new Date().toISOString().split('T')[0];
      const dedupKey = `AI_HIGH_RISK_${analysis.invoice_barcode}_${dateStr}`;

      return this.createNotification({
        recipient_role: 'admin', // Admin and Gate supervisors
        type: 'AI_HIGH_RISK',
        priority: 'CRITICAL',
        title,
        message,
        entity_type: 'gate_risk',
        entity_id: analysis.invoice_barcode,
        action_url: '/ai_gate_risk',
        metadata: {
          risk_score: analysis.risk_score,
          risk_level: analysis.risk_level,
          customer_name: analysis.customer_name,
          invoice_barcode: analysis.invoice_barcode,
          reasons: reasonsArr,
        },
        dedup_key: dedupKey,
      });
    } else if (analysis.risk_level === 'MEDIUM' || analysis.risk_score >= 31) {
      const invoiceId = analysis.invoice_number || analysis.invoice_barcode;
      const title = `🟠 Gate Risk Review Recommended (${invoiceId})`;
      const message = `Invoice ${invoiceId} has a moderate risk score of ${analysis.risk_score}/100. Review of dispatch parameters recommended.`;

      const dateStr = new Date().toISOString().split('T')[0];
      const dedupKey = `AI_MED_RISK_${analysis.invoice_barcode}_${dateStr}`;

      return this.createNotification({
        recipient_role: 'gate',
        type: 'AI_MEDIUM_RISK',
        priority: 'WARNING',
        title,
        message,
        entity_type: 'gate_risk',
        entity_id: analysis.invoice_barcode,
        action_url: '/ai_gate_risk',
        metadata: {
          risk_score: analysis.risk_score,
          risk_level: analysis.risk_level,
          customer_name: analysis.customer_name,
          invoice_barcode: analysis.invoice_barcode,
        },
        dedup_key: dedupKey,
      });
    }
  }

  // 2. Hook for Gate Barcode Scan Anomalies (Repeated Retries & Duplicate Scans)
  async notifyScanAnomaly(data: {
    invoice_barcode: string;
    failed_count: number;
    duplicate_count: number;
    operator_name?: string;
    last_reason?: string;
  }) {
    const dateStr = new Date().toISOString().split('T')[0];

    if (data.duplicate_count >= 1) {
      const dedupKey = `DUP_BARCODE_${data.invoice_barcode}_${dateStr}`;
      return this.createNotification({
        recipient_role: 'gate',
        type: 'DUPLICATE_BARCODE',
        priority: 'HIGH',
        title: `⚠️ Duplicate Barcode Scanned (${data.invoice_barcode})`,
        message: `Duplicate box barcode scan attempt detected during verification of Invoice ${data.invoice_barcode}. Operator: ${data.operator_name || 'Gate Operator'}.`,
        entity_type: 'gate_risk',
        entity_id: data.invoice_barcode,
        action_url: '/verification',
        metadata: data,
        dedup_key: dedupKey,
      });
    }

    if (data.failed_count >= 5) {
      const dedupKey = `FAIL_SCAN_HIGH_${data.invoice_barcode}_${dateStr}`;
      return this.createNotification({
        recipient_role: 'gate',
        type: 'REPEATED_BARCODE_FAILURE',
        priority: 'HIGH',
        title: `⚠️ ${data.failed_count} Repeated Barcode Scan Failures`,
        message: `Invoice ${data.invoice_barcode} has encountered ${data.failed_count} rejected barcode scan attempts. Last error: ${data.last_reason || 'CRC checksum error'}.`,
        entity_type: 'gate_risk',
        entity_id: data.invoice_barcode,
        action_url: '/verification',
        metadata: data,
        dedup_key: dedupKey,
      });
    } else if (data.failed_count >= 3) {
      const dedupKey = `FAIL_SCAN_WARN_${data.invoice_barcode}_${dateStr}`;
      return this.createNotification({
        recipient_role: 'gate',
        type: 'REPEATED_BARCODE_FAILURE',
        priority: 'WARNING',
        title: `⚠️ Barcode Scan Retries Detected (${data.invoice_barcode})`,
        message: `Invoice ${data.invoice_barcode} had ${data.failed_count} failed scan attempts.`,
        entity_type: 'gate_risk',
        entity_id: data.invoice_barcode,
        action_url: '/verification',
        metadata: data,
        dedup_key: dedupKey,
      });
    }
  }

  // 3. Hook for Daily Security Briefing Generation
  async notifyDailySecurityBriefing(briefing: {
    briefing_date: string;
    total_events: number;
    high_priority_count: number;
    medium_priority_count: number;
  }) {
    const dedupKey = `BRIEFING_${briefing.briefing_date}`;
    const priority = briefing.high_priority_count > 0 ? 'HIGH' : 'INFO';
    const title = `🤖 Daily Security Briefing Ready (${briefing.briefing_date})`;
    const message = `Security briefing for ${briefing.briefing_date} generated. ${briefing.total_events} operations monitored (${briefing.high_priority_count} High, ${briefing.medium_priority_count} Medium alerts).`;

    return this.createNotification({
      recipient_role: 'admin',
      type: 'AI_DAILY_SECURITY_BRIEFING',
      priority,
      title,
      message,
      entity_type: 'security_briefing',
      entity_id: briefing.briefing_date,
      action_url: '/ai_security_briefing',
      metadata: briefing,
      dedup_key: dedupKey,
    });
  }

  // 4. Hook for Workflow Operations (Packing, Box, Invoice, Gate)
  async notifyWorkflowEvent(data: {
    type: string;
    priority?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    entity_type: string;
    entity_id: string;
    recipient_role: string;
    action_url?: string;
  }) {
    return this.createNotification({
      recipient_role: data.recipient_role,
      type: data.type,
      priority: data.priority || 'WARNING',
      title: data.title,
      message: data.message,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      action_url: data.action_url,
      dedup_key: `${data.type}_${data.entity_id}_${new Date().toISOString().split('T')[0]}`,
    });
  }
}
