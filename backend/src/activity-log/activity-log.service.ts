import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { AuditActivityLog, UserInfo } from '../entities';

export interface RecordActivityDto {
  userId?: number;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  actionType: 'INSERT' | 'UPDATE' | 'DELETE';
  actionTitle: string;
  module: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  metadata?: any;
  ipAddress?: string;
}

export interface ActivityQueryDto {
  page?: number;
  limit?: number;
  module?: string;
  action_type?: string;
  user_id?: number;
  search?: string;
  from_date?: string;
  to_date?: string;
}

@Injectable()
export class ActivityLogService implements OnModuleInit {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(AuditActivityLog)
    private readonly activityRepo: Repository<AuditActivityLog>,
    @InjectRepository(UserInfo)
    private readonly userRepo: Repository<UserInfo>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureTableExists();
  }

  private async ensureTableExists() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS audit_activity_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          user_name VARCHAR(255) NULL,
          user_role VARCHAR(50) NULL,
          user_email VARCHAR(255) NULL,
          action_type VARCHAR(20) NOT NULL,
          action_title VARCHAR(255) NOT NULL,
          module VARCHAR(100) NOT NULL,
          entity_type VARCHAR(100) NULL,
          entity_id VARCHAR(100) NULL,
          details TEXT NULL,
          metadata TEXT NULL,
          ip_address VARCHAR(50) NULL,
          created_date VARCHAR(30) NOT NULL,
          created_time VARCHAR(30) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_action_type (action_type),
          INDEX idx_module (module),
          INDEX idx_created_date (created_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {
      this.logger.error('Error ensuring audit_activity_log table exists:', e);
    }
  }

  private getLegacyDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true });
    return { dateStr, timeStr };
  }

  /**
   * Append-only immutable log entry creation.
   * Any user action (INSERT, UPDATE, DELETE) is permanently recorded.
   */
  async recordActivity(dto: RecordActivityDto): Promise<AuditActivityLog | null> {
    try {
      let userName = dto.userName;
      let userRole = dto.userRole;
      let userEmail = dto.userEmail;

      // Enrich actor info from DB if userId provided and details missing
      if (dto.userId && (!userName || !userRole)) {
        try {
          const userRec = await this.userRepo.findOne({ where: { id: dto.userId } });
          if (userRec) {
            userName = userName || userRec.user_name || `User #${dto.userId}`;
            userRole = userRole || userRec.type || 'operator';
            userEmail = userEmail || userRec.user_email || undefined;
          }
        } catch (e) {}
      }

      const { dateStr, timeStr } = this.getLegacyDateTime();

      const log = this.activityRepo.create({
        user_id: dto.userId || null,
        user_name: userName || 'System',
        user_role: (userRole || 'admin').toLowerCase(),
        user_email: userEmail || null,
        action_type: dto.actionType,
        action_title: dto.actionTitle,
        module: dto.module,
        entity_type: dto.entityType || null,
        entity_id: dto.entityId ? String(dto.entityId) : null,
        details: dto.details || null,
        metadata: dto.metadata ? (typeof dto.metadata === 'string' ? dto.metadata : JSON.stringify(dto.metadata)) : null,
        ip_address: dto.ipAddress || null,
        created_date: dateStr,
        created_time: timeStr,
      });

      return await this.activityRepo.save(log);
    } catch (err) {
      this.logger.error('Failed to write immutable audit activity log:', err);
      return null;
    }
  }

  /**
   * Fetch activity history with strict RBAC filtering.
   * Admin can view all sections or filter by any section/user.
   * Non-admin users are restricted to their own activities or role scope.
   */
  async getHistory(user: any, query: ActivityQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const userRole = (user?.role || user?.type || 'admin').toLowerCase();
    const userId = user?.userId || user?.id || user?.sub;

    const qb: SelectQueryBuilder<AuditActivityLog> = this.activityRepo.createQueryBuilder('a');

    // Strict RBAC: Admin sees all sections; non-admin users only see their own activities
    if (userRole !== 'admin') {
      qb.andWhere('(a.user_id = :userId OR a.user_role = :userRole)', { userId, userRole });
    }

    // Filter by module/section
    if (query.module && query.module !== 'ALL') {
      qb.andWhere('a.module = :mod', { mod: query.module });
    }

    // Filter by action type (INSERT, UPDATE, DELETE)
    if (query.action_type && query.action_type !== 'ALL') {
      qb.andWhere('a.action_type = :actionType', { actionType: query.action_type.toUpperCase() });
    }

    // Filter by specific user (Admin only)
    if (userRole === 'admin' && query.user_id) {
      qb.andWhere('a.user_id = :filterUserId', { filterUserId: Number(query.user_id) });
    }

    // Date range filter
    if (query.from_date && query.to_date) {
      qb.andWhere('a.created_date >= :fromDate AND a.created_date <= :toDate', {
        fromDate: query.from_date,
        toDate: query.to_date,
      });
    } else if (query.from_date) {
      qb.andWhere('a.created_date >= :fromDate', { fromDate: query.from_date });
    } else if (query.to_date) {
      qb.andWhere('a.created_date <= :toDate', { toDate: query.to_date });
    }

    // Keyword Search
    if (query.search && query.search.trim()) {
      const q = `%${query.search.trim()}%`;
      qb.andWhere(
        '(a.action_title LIKE :q OR a.details LIKE :q OR a.entity_id LIKE :q OR a.user_name LIKE :q OR a.module LIKE :q)',
        { q },
      );
    }

    qb.orderBy('a.id', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      user_role: userRole,
    };
  }

  /**
   * Get activity stats breakdown (counts by action type and modules)
   */
  async getStats(user: any) {
    const userRole = (user?.role || user?.type || 'admin').toLowerCase();
    const userId = user?.userId || user?.id || user?.sub;

    const baseQb = this.activityRepo.createQueryBuilder('a');
    if (userRole !== 'admin') {
      baseQb.andWhere('(a.user_id = :userId OR a.user_role = :userRole)', { userId, userRole });
    }

    const total = await baseQb.getCount();

    // Counts by action type
    const insertCount = await baseQb.clone().andWhere('a.action_type = "INSERT"').getCount();
    const updateCount = await baseQb.clone().andWhere('a.action_type = "UPDATE"').getCount();
    const deleteCount = await baseQb.clone().andWhere('a.action_type = "DELETE"').getCount();

    // Breakdown by module
    const modulesRaw = await baseQb
      .clone()
      .select('a.module', 'module')
      .addSelect('COUNT(a.id)', 'count')
      .groupBy('a.module')
      .getRawMany();

    const modules = modulesRaw.map((m) => ({
      module: m.module,
      count: Number(m.count) || 0,
    }));

    return {
      total,
      insertCount,
      updateCount,
      deleteCount,
      modules,
      user_role: userRole,
    };
  }
}
