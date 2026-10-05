import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like, In, Brackets, SelectQueryBuilder } from 'typeorm';
import { Notification, Invoice } from '../entities';

export interface CreateNotificationDto {
  recipient_user_id?: number;
  recipient_role?: string; // 'admin' | 'gate' | 'packing' | 'box' | 'invoice' | 'ALL'
  type: string;
  priority?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  reason?: string;
  module?: string;
  actor_name?: string;
  actor_id?: number;
  actor_role?: string;
  actor_email?: string;
  user?: any; // Active user context
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  dedup_key?: string;
}

import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => ActivityLogService))
    private activityService?: ActivityLogService,
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
          reason TEXT NULL,
          module VARCHAR(100) NULL,
          actor_name VARCHAR(255) NULL,
          actor_id INT NULL,
          actor_role VARCHAR(50) NULL,
          actor_email VARCHAR(255) NULL,
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

      // Ensure reason, module, and actor columns exist in existing table
      const addColumnSafe = async (colDef: string) => {
        try {
          await this.dataSource.query(`ALTER TABLE erp_notification ADD COLUMN ${colDef}`);
        } catch (colErr: any) {
          // Ignored if column already exists
        }
      };
      await addColumnSafe('reason TEXT NULL');
      await addColumnSafe('module VARCHAR(100) NULL');
      await addColumnSafe('actor_name VARCHAR(255) NULL');
      await addColumnSafe('actor_id INT NULL');
      await addColumnSafe('actor_role VARCHAR(50) NULL');
      await addColumnSafe('actor_email VARCHAR(255) NULL');

      // Fix legacy non-existent action URLs (e.g., /verification or empty) so admin directly opens incident details
      await this.dataSource.query(`
        UPDATE erp_notification
        SET action_url = CONCAT('/ai_gate_risk?search=', entity_id)
        WHERE (action_url = '/verification' OR action_url LIKE '%/verification%')
          AND entity_id IS NOT NULL AND entity_id != '';
      `);
      await this.dataSource.query(`
        UPDATE erp_notification
        SET action_url = '/ai_gate_risk'
        WHERE action_url = '/verification' OR action_url LIKE '%/verification%';
      `);
    } catch (e) {
      console.error('Error ensuring erp_notification table exists:', e);
    }
  }

  // Create notification with automatic deduplication
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const priority = dto.priority || 'INFO';
    const recipientRole = dto.recipient_role || 'ALL';

    const actorId = dto.actor_id ?? dto.user?.id ?? dto.user?.sub ?? null;
    const actorName = dto.actor_name ?? dto.user?.user_name ?? dto.user?.name ?? dto.user?.username ?? null;
    const actorRole = dto.actor_role ?? dto.user?.type ?? dto.user?.role ?? null;
    const actorEmail = dto.actor_email ?? dto.user?.user_email ?? dto.user?.email ?? null;
    const reason = dto.reason || (dto.metadata?.reason as string) || null;
    const module = dto.module || (dto.metadata?.module as string) || null;

    const mergedMetadata = {
      ...(dto.metadata || {}),
      reason: reason || dto.metadata?.reason,
      module: module || dto.metadata?.module,
      user_details: {
        id: actorId,
        name: actorName,
        role: actorRole,
        email: actorEmail,
      },
    };
    const metadataStr = JSON.stringify(mergedMetadata);

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
        existing.reason = reason || existing.reason;
        existing.module = module || existing.module;
        existing.actor_id = actorId ?? existing.actor_id;
        existing.actor_name = actorName || existing.actor_name;
        existing.actor_role = actorRole || existing.actor_role;
        existing.actor_email = actorEmail || existing.actor_email;
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
      reason,
      module,
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      actor_email: actorEmail,
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

  // Apply strict Role-Based Access Control (RBAC) to QueryBuilder
  private applyRbacFilter(qb: SelectQueryBuilder<Notification>, userRole: string, userId?: number) {
    const role = (userRole || 'admin').toLowerCase();
    if (role === 'admin') {
      return; // Admin has full system-wide access to all sections
    }

    qb.andWhere(
      new Brackets((subQb) => {
        if (role === 'packing') {
          subQb.where(
            '(n.recipient_role = "ALL" OR n.recipient_role = "packing" OR n.recipient_role LIKE "%packing%" OR n.module LIKE "%Packing%" OR n.module LIKE "%Part Master%" OR n.module LIKE "%Inventory%" OR n.type LIKE "%STOCK%")'
          );
        } else if (role === 'box') {
          subQb.where(
            '(n.recipient_role = "ALL" OR n.recipient_role = "box" OR n.recipient_role LIKE "%box%" OR n.module LIKE "%Box%" OR n.type LIKE "%BOX%" OR n.module LIKE "%Invoice Box%")'
          );
        } else if (role === 'invoice') {
          subQb.where(
            '(n.recipient_role = "ALL" OR n.recipient_role = "invoice" OR n.recipient_role LIKE "%invoice%" OR n.module LIKE "%Invoice%" OR n.type LIKE "%INVOICE%")'
          );
        } else if (role === 'gate') {
          subQb.where(
            '(n.recipient_role = "ALL" OR n.recipient_role = "gate" OR n.recipient_role LIKE "%gate%" OR n.module LIKE "%Gate%" OR n.type LIKE "%GATE%" OR n.type LIKE "%BARCODE%")'
          );
        } else {
          subQb.where(
            '(n.recipient_role = "ALL" OR n.recipient_role = :role OR n.recipient_role LIKE :rolePattern)',
            { role, rolePattern: `%${role}%` }
          );
        }

        if (userId) {
          subQb.orWhere('n.recipient_user_id = :userId', { userId });
        }
      })
    );
  }

  // Get paginated notifications filtered strictly by RBAC
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
    const qb = this.notifRepo.createQueryBuilder('n');

    // Strict RBAC Filter
    this.applyRbacFilter(qb, userRole, user?.id);

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
        '(n.title LIKE :s OR n.message LIKE :s OR n.entity_id LIKE :s OR n.reason LIKE :s OR n.module LIKE :s)',
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
      user_role: userRole,
    };
  }

  // Fast unread count and pending alerts count for top header bell badge (Strict RBAC)
  async getUnreadCount(user: any): Promise<{ unread_count: number; critical_count: number; pending_count: number }> {
    const userRole = (user?.role || user?.type || 'admin').toLowerCase();

    const baseQb = () => {
      const q = this.notifRepo.createQueryBuilder('n');
      this.applyRbacFilter(q, userRole, user?.id);
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

  // Admin / Supervisor Notification Overview Summary (Strict RBAC)
  async getSummary(user: any) {
    const userRole = (user?.role || user?.type || 'admin').toLowerCase();

    const baseQb = () => {
      const q = this.notifRepo.createQueryBuilder('n');
      this.applyRbacFilter(q, userRole, user?.id);
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
      user_role: userRole,
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

  // Mark all notifications as read for current user according to RBAC
  async markAllAsRead(user: any) {
    const userRole = (user?.role || user?.type || 'admin').toLowerCase();

    const qb = this.notifRepo.createQueryBuilder().update(Notification).set({
      is_read: true,
      read_at: new Date(),
    }).where('is_read = false');

    if (userRole !== 'admin') {
      if (userRole === 'packing') {
        qb.andWhere('(recipient_role = "ALL" OR recipient_role LIKE "%packing%" OR module LIKE "%Packing%" OR module LIKE "%Part Master%")');
      } else if (userRole === 'box') {
        qb.andWhere('(recipient_role = "ALL" OR recipient_role LIKE "%box%" OR module LIKE "%Box%")');
      } else if (userRole === 'invoice') {
        qb.andWhere('(recipient_role = "ALL" OR recipient_role LIKE "%invoice%" OR module LIKE "%Invoice%")');
      } else if (userRole === 'gate') {
        qb.andWhere('(recipient_role = "ALL" OR recipient_role LIKE "%gate%" OR module LIKE "%Gate%")');
      } else {
        qb.andWhere('(recipient_role = "ALL" OR recipient_role = :role OR recipient_role LIKE :rolePattern)', {
          role: userRole,
          rolePattern: `%${userRole}%`,
        });
      }
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

    // If this notification is for an invoice waiting for approval, approve the invoice so next process can continue!
    if (notif.entity_type === 'INVOICE' || notif.type === 'SECURITY_ANOMALY') {
      try {
        const invRepo = this.dataSource.getRepository(Invoice);
        let invoice: Invoice | null = null;
        if (notif.entity_id) {
          invoice = await invRepo.findOne({
            where: [{ invoice_number: notif.entity_id }, { barcode: notif.entity_id }],
          });
        }
        if (!invoice && notif.metadata) {
          try {
            const meta = typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata;
            if (meta?.invoice_id) {
              invoice = await invRepo.findOne({ where: { id: meta.invoice_id } });
            }
          } catch (e) {}
        }
        if (invoice && (invoice.status === 'waiting_for_approval' || invoice.status_new === 'waiting_for_approval')) {
          invoice.status = 'pending';
          invoice.status_new = 'approved';
          await invRepo.save(invoice);
        }
      } catch (err) {
        console.error('Failed to update invoice status upon notification resolution', err);
      }
    }

    if (this.activityService) {
      await this.activityService.recordActivity({
        userId: user?.userId || user?.id,
        userName,
        userRole: user?.role || user?.type || 'admin',
        actionType: 'UPDATE',
        actionTitle: 'Security Anomaly Resolved',
        module: 'AI Security & Anomaly Detection',
        entityType: notif.entity_type || 'NOTIFICATION',
        entityId: notif.entity_id || String(notif.id),
        details: `Anomaly alert #${notif.id} ("${notif.title}") was reviewed and resolved by ${userName}. Note: ${notif.resolution_note}.`,
        metadata: {
          notification_id: notif.id,
          resolution_note: notif.resolution_note,
        },
      });
    }

    return { success: true, notification: saved };
  }

  // --------------------------------------------------------------------------
  // HOOKS: Notification Triggers (Only generated on manual actions when required)
  // --------------------------------------------------------------------------

  // Generic System / Security / Anomaly Notification Method fulfilling Feature 1
  async notifySystemEvent(data: {
    reason: string;
    module: string;
    user?: any;
    recipient_role?: string;
    title: string;
    message: string;
    priority?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
    type?: string;
    entity_type?: string;
    entity_id?: string;
    action_url?: string;
    metadata?: Record<string, any>;
    dedup_key?: string;
  }) {
    const actorName = data.user?.user_name || data.user?.name || data.user?.username || 'Active Operator';
    const actorRole = data.user?.type || data.user?.role || 'operator';
    const actorId = data.user?.id || data.user?.sub || null;
    const actorEmail = data.user?.user_email || data.user?.email || null;

    // Structured message according to Feature 1 requirement:
    // 1. Reason
    // 2. Affected section/module
    // 3. Active user details
    const fullMessage = `${data.message}

Reason: ${data.reason}
Affected Section: ${data.module}
Active User: ${actorName} (${String(actorRole).toUpperCase()}${actorId ? ` | ID: ${actorId}` : ''}${actorEmail ? ` | Email: ${actorEmail}` : ''})`;

    return this.createNotification({
      recipient_role: data.recipient_role || 'admin',
      type: data.type || 'SYSTEM_ALERT',
      priority: data.priority || 'WARNING',
      title: data.title,
      message: fullMessage,
      reason: data.reason,
      module: data.module,
      actor_name: actorName,
      actor_id: actorId,
      actor_role: actorRole,
      actor_email: actorEmail,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      action_url: data.action_url,
      metadata: {
        ...(data.metadata || {}),
        reason: data.reason,
        module: data.module,
        user_details: {
          id: actorId,
          name: actorName,
          role: actorRole,
          email: actorEmail,
        },
      },
      dedup_key: data.dedup_key,
    });
  }

  // 1. Hook for AI Gate Risk Analysis (Only genuine HIGH RISK incidents trigger notification)
  async notifyGateRisk(analysis: {
    id?: number;
    invoice_barcode: string;
    invoice_number?: string;
    customer_name?: string;
    risk_score: number;
    risk_level: string;
    reasons?: string[] | string;
    invoice_qty?: number;
    operator_name?: string;
    operator_id?: number;
    operator_role?: string;
  }) {
    const reasonsArr = typeof analysis.reasons === 'string' ? JSON.parse(analysis.reasons || '[]') : analysis.reasons || [];
    const primaryReason = reasonsArr.length > 0 ? reasonsArr[0] : 'Volumetric and temporal anomalies detected during gate dispatch verification';

    const invoiceId = analysis.invoice_number || analysis.invoice_barcode;
    const actorName = analysis.operator_name || 'Gate Operator';
    const actorRole = analysis.operator_role || 'gate';
    const actorId = analysis.operator_id || null;
    const dateStr = new Date().toISOString().split('T')[0];
    const invoiceBarcode = analysis.invoice_barcode || analysis.invoice_number || '';
    const searchUrl = invoiceBarcode ? `/ai_gate_risk?search=${encodeURIComponent(invoiceBarcode)}` : '/ai_gate_risk';

    // Only notify when risk is genuinely HIGH (risk score >= 71 or HIGH risk level)
    if (analysis.risk_level === 'HIGH' || analysis.risk_score >= 71) {
      const title = `🔴 High-Risk Gate Transaction (${invoiceId})`;
      const message = `Invoice ${invoiceId} for customer ${analysis.customer_name || 'N/A'} was flagged with Risk Score ${analysis.risk_score}/100. ${primaryReason}. Supervisor review required prior to truck release.

Reason: ${primaryReason}
Affected Section: Gate Verification & Dispatch
Active User: ${actorName} (${actorRole.toUpperCase()}${actorId ? ` | ID: ${actorId}` : ''})`;

      const dedupKey = `AI_HIGH_RISK_${analysis.invoice_barcode}_${dateStr}`;

      return this.createNotification({
        recipient_role: 'gate,admin',
        type: 'AI_HIGH_RISK',
        priority: 'CRITICAL',
        title,
        message,
        reason: primaryReason,
        module: 'Gate Verification & Dispatch',
        actor_name: actorName,
        actor_id: actorId,
        actor_role: actorRole,
        entity_type: 'gate_risk',
        entity_id: analysis.invoice_barcode,
        action_url: searchUrl,
        metadata: {
          risk_score: analysis.risk_score,
          risk_level: analysis.risk_level,
          customer_name: analysis.customer_name,
          invoice_barcode: analysis.invoice_barcode,
          reasons: reasonsArr,
          reason: primaryReason,
          module: 'Gate Verification & Dispatch',
          user_details: {
            name: actorName,
            role: actorRole,
            id: actorId,
          },
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
    operator_id?: number;
    operator_role?: string;
    last_reason?: string;
  }) {
    const dateStr = new Date().toISOString().split('T')[0];
    const searchUrl = data.invoice_barcode ? `/ai_gate_risk?search=${encodeURIComponent(data.invoice_barcode)}` : '/ai_gate_risk';
    const operatorName = data.operator_name || 'Gate Operator';
    const operatorRole = data.operator_role || 'gate';
    const operatorId = data.operator_id || null;

    if (data.duplicate_count >= 1) {
      const dedupKey = `DUP_BARCODE_${data.invoice_barcode}_${dateStr}`;
      const reason = `Duplicate box barcode scan attempt detected during verification of Invoice ${data.invoice_barcode}`;
      const message = `${reason}.

Reason: ${reason}
Affected Section: Gate Barcode Verification
Active User: ${operatorName} (${operatorRole.toUpperCase()}${operatorId ? ` | ID: ${operatorId}` : ''})`;

      return this.createNotification({
        recipient_role: 'gate,admin',
        type: 'DUPLICATE_BARCODE',
        priority: 'HIGH',
        title: `⚠️ Duplicate Barcode Scanned (${data.invoice_barcode})`,
        message,
        reason,
        module: 'Gate Barcode Verification',
        actor_name: operatorName,
        actor_id: operatorId,
        actor_role: operatorRole,
        entity_type: 'gate_risk',
        entity_id: data.invoice_barcode,
        action_url: searchUrl,
        metadata: {
          ...data,
          reason,
          module: 'Gate Barcode Verification',
          user_details: { name: operatorName, role: operatorRole, id: operatorId },
        },
        dedup_key: dedupKey,
      });
    }

    if (data.failed_count >= 5) {
      const dedupKey = `FAIL_SCAN_HIGH_${data.invoice_barcode}_${dateStr}`;
      const reason = `${data.failed_count} repeated rejected barcode scan attempts. Last error: ${data.last_reason || 'CRC checksum error'}`;
      const message = `Invoice ${data.invoice_barcode} has encountered ${data.failed_count} rejected barcode scan attempts.

Reason: ${reason}
Affected Section: Gate Barcode Verification
Active User: ${operatorName} (${operatorRole.toUpperCase()}${operatorId ? ` | ID: ${operatorId}` : ''})`;

      return this.createNotification({
        recipient_role: 'gate,admin',
        type: 'REPEATED_BARCODE_FAILURE',
        priority: 'HIGH',
        title: `⚠️ ${data.failed_count} Repeated Barcode Scan Failures`,
        message,
        reason,
        module: 'Gate Barcode Verification',
        actor_name: operatorName,
        actor_id: operatorId,
        actor_role: operatorRole,
        entity_type: 'gate_risk',
        entity_id: data.invoice_barcode,
        action_url: searchUrl,
        metadata: {
          ...data,
          reason,
          module: 'Gate Barcode Verification',
          user_details: { name: operatorName, role: operatorRole, id: operatorId },
        },
        dedup_key: dedupKey,
      });
    } else if (data.failed_count >= 3) {
      const dedupKey = `FAIL_SCAN_WARN_${data.invoice_barcode}_${dateStr}`;
      const reason = `${data.failed_count} barcode scan retries detected on Invoice ${data.invoice_barcode}`;
      const message = `Invoice ${data.invoice_barcode} had ${data.failed_count} failed scan attempts.

Reason: ${reason}
Affected Section: Gate Barcode Verification
Active User: ${operatorName} (${operatorRole.toUpperCase()}${operatorId ? ` | ID: ${operatorId}` : ''})`;

      return this.createNotification({
        recipient_role: 'gate,admin',
        type: 'REPEATED_BARCODE_FAILURE',
        priority: 'WARNING',
        title: `⚠️ Barcode Scan Retries Detected (${data.invoice_barcode})`,
        message,
        reason,
        module: 'Gate Barcode Verification',
        actor_name: operatorName,
        actor_id: operatorId,
        actor_role: operatorRole,
        entity_type: 'gate_risk',
        entity_id: data.invoice_barcode,
        action_url: searchUrl,
        metadata: {
          ...data,
          reason,
          module: 'Gate Barcode Verification',
          user_details: { name: operatorName, role: operatorRole, id: operatorId },
        },
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
    const reason = `Security briefing compiled for ${briefing.briefing_date} (${briefing.total_events} operations, ${briefing.high_priority_count} High priority alerts)`;
    const title = `🤖 Daily Security Briefing Ready (${briefing.briefing_date})`;
    const message = `Security briefing for ${briefing.briefing_date} generated. ${briefing.total_events} operations monitored (${briefing.high_priority_count} High, ${briefing.medium_priority_count} Medium alerts).

Reason: ${reason}
Affected Section: Security Intelligence & AI Briefing
Active User: System AI Agent (ADMIN)`;

    return this.createNotification({
      recipient_role: 'admin',
      type: 'AI_DAILY_SECURITY_BRIEFING',
      priority,
      title,
      message,
      reason,
      module: 'Security Intelligence',
      actor_name: 'System AI Agent',
      actor_role: 'admin',
      entity_type: 'security_briefing',
      entity_id: briefing.briefing_date,
      action_url: '/ai_security_briefing',
      metadata: {
        ...briefing,
        reason,
        module: 'Security Intelligence',
        user_details: { name: 'System AI Agent', role: 'admin' },
      },
      dedup_key: dedupKey,
    });
  }

  // 4. Hook for Workflow Operations (Packing, Box, Invoice, Gate, Parts)
  async notifyWorkflowEvent(data: {
    type: string;
    priority?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    reason?: string;
    module?: string;
    user?: any;
    entity_type: string;
    entity_id: string;
    recipient_role: string;
    action_url?: string;
    metadata?: Record<string, any>;
  }) {
    const reason = data.reason || data.title;
    const module = data.module || 'Workflow Operations';
    const actorName = data.user?.user_name || data.user?.name || 'Operator';
    const actorRole = data.user?.type || data.user?.role || data.recipient_role;
    const actorId = data.user?.id || data.user?.sub || null;

    const formattedMessage = `${data.message}

Reason: ${reason}
Affected Section: ${module}
Active User: ${actorName} (${String(actorRole).toUpperCase()}${actorId ? ` | ID: ${actorId}` : ''})`;

    return this.createNotification({
      recipient_role: data.recipient_role,
      type: data.type,
      priority: data.priority || 'WARNING',
      title: data.title,
      message: formattedMessage,
      reason,
      module,
      actor_name: actorName,
      actor_id: actorId,
      actor_role: actorRole,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      action_url: data.action_url,
      metadata: {
        ...(data.metadata || {}),
        reason,
        module,
        user_details: {
          id: actorId,
          name: actorName,
          role: actorRole,
        },
      },
      dedup_key: `${data.type}_${data.entity_id}_${new Date().toISOString().split('T')[0]}`,
    });
  }
}

