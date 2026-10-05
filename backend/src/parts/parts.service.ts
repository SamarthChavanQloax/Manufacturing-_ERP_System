import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Part, Packing, BoxPacking, Invoice, PartHistory, UserInfo } from '../entities';
import { NotificationService } from '../notifications/notifications.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class PartsService implements OnModuleInit {
  constructor(
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(PartHistory)
    private partHistoryRepo: Repository<PartHistory>,
    @InjectRepository(UserInfo)
    private userRepo: Repository<UserInfo>,
    private dataSource: DataSource,
    private notifService: NotificationService,
    private activityService: ActivityLogService,
  ) {}

  async onModuleInit() {
    await this.ensureHistoryTableExists();
  }

  private async ensureHistoryTableExists() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS part_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          part_id INT NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          quantity_change FLOAT NOT NULL DEFAULT 0,
          previous_qty FLOAT NOT NULL DEFAULT 0,
          new_qty FLOAT NOT NULL DEFAULT 0,
          supplier_name VARCHAR(255) NULL,
          supplier_contact VARCHAR(255) NULL,
          supplier_invoice_no VARCHAR(100) NULL,
          supplier_notes TEXT NULL,
          created_by_user_id INT NULL,
          created_by_user_name VARCHAR(255) NULL,
          created_by_user_role VARCHAR(50) NULL,
          entry_date VARCHAR(30) NOT NULL,
          entry_time VARCHAR(30) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notes TEXT NULL,
          INDEX idx_part_id (part_id),
          INDEX idx_event_type (event_type),
          INDEX idx_entry_date (entry_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {
      console.error('Error ensuring part_history table exists:', e);
    }
  }

  async findAll(search?: string, page = 1, limit = 50): Promise<{ items: Part[]; total: number }> {
    let where: any = {};
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where = [
        { part_number: Like(q) },
        { part_description: Like(q) },
      ];
    }

    const [items, total] = await this.partRepo.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  async getAllSimple(): Promise<Part[]> {
    const parts = await this.partRepo.find({
      select: ['id', 'part_number', 'part_description', 'qty'],
      order: { id: 'DESC' },
    });
    return parts.map((p) => ({
      ...p,
      part_number: (p.part_number || '').trim(),
      part_description: (p.part_description || '').trim(),
    }));
  }

  async findOne(id: number): Promise<Part> {
    const part = await this.partRepo.findOne({ where: { id } });
    if (!part) throw new BadRequestException('Part not found');
    return part;
  }

  // Feature 2 Flow 1: When adding a new part: Ask for all normal part details + supplier details.
  async create(
    data: {
      part_number: string;
      part_desc: string;
      qty: number;
      supplier_name?: string;
      supplier_contact?: string;
      supplier_invoice_no?: string;
      supplier_notes?: string;
    },
    user?: any,
  ) {
    if (!data.part_number || !data.part_desc) {
      throw new BadRequestException('Part number and description are required');
    }

    const trimmedPartNumber = data.part_number.trim();
    const trimmedPartDesc = data.part_desc.trim();

    const existing = await this.partRepo.findOne({ where: { part_number: trimmedPartNumber } });
    if (existing) {
      throw new BadRequestException('Part Number already exists');
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const userId = user?.id || user?.sub || 3;
    const userName = user?.user_name || user?.name || user?.username || 'Administrator';
    const userRole = user?.type || user?.role || 'admin';

    const initialQty = Number(data.qty) || 0;

    const part = this.partRepo.create({
      part_number: trimmedPartNumber,
      part_description: trimmedPartDesc,
      qty: initialQty,
      customer_id: 0,
      customer_part_id: 0,
      part_family: '',
      created_id: userId,
      date: dateStr,
      time: timeStr,
      uom: '',
      safety_stock: '',
    });

    const savedPart = await this.partRepo.save(part);

    // Record initial stock entry in part_history with supplier details
    const historyEntry = this.partHistoryRepo.create({
      part_id: savedPart.id,
      event_type: 'STOCK_ADDED',
      quantity_change: initialQty,
      previous_qty: 0,
      new_qty: initialQty,
      supplier_name: (data.supplier_name || 'Initial Setup Supplier').trim(),
      supplier_contact: (data.supplier_contact || '').trim(),
      supplier_invoice_no: (data.supplier_invoice_no || '').trim(),
      supplier_notes: (data.supplier_notes || 'Initial part creation and baseline stock entry').trim(),
      created_by_user_id: userId,
      created_by_user_name: userName,
      created_by_user_role: userRole,
      entry_date: dateStr,
      entry_time: timeStr,
      notes: `Initial part creation with ${initialQty} units`,
    });

    await this.partHistoryRepo.save(historyEntry);

    // Record immutable audit history
    await this.activityService.recordActivity({
      userId,
      userName,
      userRole,
      actionType: 'INSERT',
      actionTitle: 'Part Created',
      module: 'Part Master',
      entityType: 'PART',
      entityId: savedPart.part_number,
      details: `Created Part "${savedPart.part_number}" (${savedPart.part_description}) with baseline stock ${savedPart.qty} units. Supplier: "${data.supplier_name || 'Initial Setup'}".`,
      metadata: {
        part_id: savedPart.id,
        part_number: savedPart.part_number,
        qty: savedPart.qty,
        supplier_name: data.supplier_name,
      },
    });

    return savedPart;
  }

  // Feature 2 Flow 2: When adding stock to an existing part: Only ask for quantity and supplier details.
  async addStock(
    partId: number,
    data: {
      qty: number;
      supplier_name: string;
      supplier_contact?: string;
      supplier_invoice_no?: string;
      supplier_notes?: string;
    },
    user?: any,
  ) {
    const part = await this.findOne(partId);

    const addedQty = Number(data.qty);
    if (isNaN(addedQty) || addedQty <= 0) {
      throw new BadRequestException('Added stock quantity must be greater than zero');
    }

    if (!data.supplier_name || !data.supplier_name.trim()) {
      throw new BadRequestException('Supplier details (Supplier Name) are required when adding new stock');
    }

    const previousQty = Number(part.qty) || 0;
    const newQty = previousQty + addedQty;
    part.qty = newQty;
    await this.partRepo.save(part);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const userId = user?.id || user?.sub || 3;
    const userName = user?.user_name || user?.name || user?.username || 'Operator';
    const userRole = user?.type || user?.role || 'packing';

    const historyEntry = this.partHistoryRepo.create({
      part_id: part.id,
      event_type: 'STOCK_ADDED',
      quantity_change: addedQty,
      previous_qty: previousQty,
      new_qty: newQty,
      supplier_name: data.supplier_name.trim(),
      supplier_contact: (data.supplier_contact || '').trim(),
      supplier_invoice_no: (data.supplier_invoice_no || '').trim(),
      supplier_notes: (data.supplier_notes || '').trim(),
      created_by_user_id: userId,
      created_by_user_name: userName,
      created_by_user_role: userRole,
      entry_date: dateStr,
      entry_time: timeStr,
      notes: `Replenished +${addedQty} units from supplier "${data.supplier_name.trim()}"`,
    });

    const savedHistory = await this.partHistoryRepo.save(historyEntry);

    // Record immutable audit history
    await this.activityService.recordActivity({
      userId,
      userName,
      userRole,
      actionType: 'INSERT',
      actionTitle: 'Stock Added to Part',
      module: 'Part Master',
      entityType: 'PART',
      entityId: part.part_number,
      details: `Added +${addedQty} units to Part "${part.part_number}". Previous: ${previousQty}, New Stock: ${newQty} units. Supplier: "${data.supplier_name}".`,
      metadata: {
        part_id: part.id,
        part_number: part.part_number,
        added_qty: addedQty,
        previous_qty: previousQty,
        new_qty: newQty,
        supplier_name: data.supplier_name,
        supplier_invoice_no: data.supplier_invoice_no,
      },
    });

    return {
      success: true,
      message: `Successfully added ${addedQty} units to Part "${part.part_number}". New stock balance is ${newQty}.`,
      part,
      history: savedHistory,
    };
  }

  // Feature 2: Get History Log for a specific part (Stock added, finished, date/time, supplier details)
  async getPartHistory(partId: number): Promise<{ part: Part; history: PartHistory[] }> {
    const part = await this.findOne(partId);

    let history = await this.partHistoryRepo.find({
      where: { part_id: partId },
      order: { id: 'DESC' },
    });

    // Backfill synthetic initial entry if this is a legacy part created before history tracking
    if (history.length === 0) {
      const creator = part.created_id
        ? await this.userRepo.findOne({ where: { id: part.created_id } })
        : null;

      const dateStr = part.date || (part.timestamp ? new Date(part.timestamp).toISOString().split('T')[0] : '2026-01-01');
      const timeStr = part.time || (part.timestamp ? new Date(part.timestamp).toTimeString().split(' ')[0] : '00:00:00');

      const initialEntry = this.partHistoryRepo.create({
        part_id: part.id,
        event_type: 'STOCK_ADDED',
        quantity_change: Number(part.qty) || 0,
        previous_qty: 0,
        new_qty: Number(part.qty) || 0,
        supplier_name: 'Original Part Master Supplier',
        supplier_contact: 'Plant Central Store',
        supplier_invoice_no: `INIT-${part.part_number}`,
        supplier_notes: 'Initial part catalog onboarding entry',
        created_by_user_id: part.created_id || 3,
        created_by_user_name: creator?.user_name || 'System Administrator',
        created_by_user_role: creator?.type || 'admin',
        entry_date: dateStr,
        entry_time: timeStr,
        notes: `Baseline stock entry: ${part.qty} units`,
      });

      const saved = await this.partHistoryRepo.save(initialEntry);
      history = [saved];
    }

    return { part, history };
  }

  // Record stock consumption and check if stock is finished/depleted
  async recordStockConsumption(
    partId: number,
    qtyConsumed: number,
    user?: any,
    notes?: string,
  ): Promise<PartHistory> {
    const part = await this.findOne(partId);
    const prevQty = Number(part.qty) || 0;
    const newQty = Math.max(0, prevQty - qtyConsumed);
    part.qty = newQty;
    await this.partRepo.save(part);

    const isFinished = newQty === 0;
    const eventType = isFinished ? 'STOCK_FINISHED' : 'STOCK_CONSUMED';

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const userId = user?.id || user?.sub || 3;
    const userName = user?.user_name || user?.name || user?.username || 'Production Line';
    const userRole = user?.type || user?.role || 'packing';

    const historyEntry = this.partHistoryRepo.create({
      part_id: part.id,
      event_type: eventType,
      quantity_change: -qtyConsumed,
      previous_qty: prevQty,
      new_qty: newQty,
      supplier_name: isFinished ? 'Stock Finished / Depleted' : null,
      supplier_contact: null,
      supplier_invoice_no: null,
      supplier_notes: notes || (isFinished ? 'Stock completely finished on packing line' : 'Packing consumption'),
      created_by_user_id: userId,
      created_by_user_name: userName,
      created_by_user_role: userRole,
      entry_date: dateStr,
      entry_time: timeStr,
      notes: notes || `Consumed -${qtyConsumed} units. Balance: ${newQty}`,
    });

    const savedHistory = await this.partHistoryRepo.save(historyEntry);

    // Feature 1: If stock is finished / depleted or low, emit Enhanced System Warning Notification!
    const isLowStock = newQty > 0 && newQty <= 50 && prevQty > 50;
    if (isFinished) {
      const reason = `Stock Depleted: Part "${part.part_number}" is completely finished (0 remaining stock)`;
      this.notifService.notifySystemEvent({
        reason,
        module: 'Part Master / Inventory',
        user: { id: userId, user_name: userName, type: userRole },
        recipient_role: 'packing,admin',
        priority: 'WARNING',
        type: 'STOCK_DEPLETED_WARNING',
        title: `⚠️ Stock Depleted: Part "${part.part_number}" Finished`,
        message: `Part "${part.part_number}" (${part.part_description}) inventory has reached zero (0 units remaining). Production cannot proceed with this part until new stock is added with supplier details.`,
        entity_type: 'part',
        entity_id: String(part.id),
        action_url: '/part_master',
        metadata: {
          part_id: part.id,
          part_number: part.part_number,
          part_description: part.part_description,
          previous_qty: prevQty,
          depleted_at: `${dateStr} ${timeStr}`,
        },
      }).catch((e) => console.error('[PartsService] Error notifying stock depletion:', e));
    } else if (isLowStock) {
      const reason = `Low Stock Warning: Part "${part.part_number}" dropped to ${newQty} units (below threshold)`;
      this.notifService.notifySystemEvent({
        reason,
        module: 'Part Master / Inventory',
        user: { id: userId, user_name: userName, type: userRole },
        recipient_role: 'packing,admin',
        priority: 'WARNING',
        type: 'LOW_STOCK_WARNING',
        title: `⚠️ Low Stock Warning: Part "${part.part_number}" (${newQty} left)`,
        message: `Part "${part.part_number}" stock has fallen below the 50 units buffer threshold to ${newQty} units remaining. Please reorder stock soon.`,
        entity_type: 'part',
        entity_id: String(part.id),
        action_url: '/part_master',
        metadata: {
          part_id: part.id,
          part_number: part.part_number,
          part_description: part.part_description,
          previous_qty: prevQty,
          current_qty: newQty,
        },
      }).catch((e) => console.error('[PartsService] Error notifying low stock:', e));
    }

    return savedHistory;
  }

  // Manually mark part stock as finished (e.g. batch complete / obsolete / zeroed out)
  async markStockFinished(partId: number, user?: any, reason = 'Manually marked stock finished'): Promise<PartHistory> {
    const part = await this.findOne(partId);
    const prevQty = Number(part.qty) || 0;
    part.qty = 0;
    await this.partRepo.save(part);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const userId = user?.id || user?.sub || 3;
    const userName = user?.user_name || user?.name || user?.username || 'Supervisor';
    const userRole = user?.type || user?.role || 'admin';

    const historyEntry = this.partHistoryRepo.create({
      part_id: part.id,
      event_type: 'STOCK_FINISHED',
      quantity_change: -prevQty,
      previous_qty: prevQty,
      new_qty: 0,
      supplier_name: 'Stock Finished / Depleted',
      supplier_notes: reason,
      created_by_user_id: userId,
      created_by_user_name: userName,
      created_by_user_role: userRole,
      entry_date: dateStr,
      entry_time: timeStr,
      notes: reason,
    });

    const savedHistory = await this.partHistoryRepo.save(historyEntry);

    // Feature 1 notification
    this.notifService.notifySystemEvent({
      reason: `Stock for Part "${part.part_number}" marked as finished: ${reason}`,
      module: 'Part Master / Inventory',
      user: { id: userId, user_name: userName, type: userRole },
      recipient_role: 'packing,admin',
      priority: 'WARNING',
      type: 'STOCK_DEPLETED_WARNING',
      title: `⚠️ Part "${part.part_number}" Stock Finished`,
      message: `Stock for Part "${part.part_number}" (${part.part_description}) was closed out. Balance is 0.`,
      entity_type: 'part',
      entity_id: String(part.id),
      action_url: '/part_master',
      metadata: {
        part_id: part.id,
        part_number: part.part_number,
        previous_qty: prevQty,
      },
    }).catch((e) => console.error('[PartsService] Error notifying stock finished:', e));

    return savedHistory;
  }

  async getStockList(search?: string, page = 1, limit = 50): Promise<{ items: any[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];

    if (search && search.trim()) {
      whereClause = 'WHERE p.part_number LIKE ? OR p.part_description LIKE ?';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const countQuery = `SELECT COUNT(*) as total FROM parts p ${whereClause}`;
    const countResult = await this.partRepo.query(countQuery, params);
    const total = countResult[0]?.total || 0;

    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        p.id,
        p.part_number,
        p.part_description,
        COALESCE(p.qty, 0) AS remaining_stock,
        COALESCE(pack.fg_stock, 0) AS fg_stock,
        COALESCE(boxp.box_stock, 0) AS box_stock,
        COALESCE(inv.inv_stock, 0) AS inv_stock
      FROM parts p
      LEFT JOIN (
        SELECT part_id, SUM(part_qty) AS fg_stock
        FROM packing
        WHERE status = 'pending'
        GROUP BY part_id
      ) pack ON pack.part_id = p.id
      LEFT JOIN (
        SELECT part_id, SUM(part_qty) AS box_stock
        FROM box_packing
        WHERE status = 'pending'
        GROUP BY part_id
      ) boxp ON boxp.part_id = p.id
      LEFT JOIN (
        SELECT part_id, SUM(qty) AS inv_stock
        FROM invoice
        WHERE status = 'pending'
        GROUP BY part_id
      ) inv ON inv.part_id = p.id
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const items = await this.partRepo.query(dataQuery, params);
    const cleanedItems = items.map((item: any) => ({
      ...item,
      part_number: (item.part_number || '').trim(),
      part_description: (item.part_description || '').trim(),
      remaining_stock: Number(item.remaining_stock) || 0,
      fg_stock: Number(item.fg_stock) || 0,
      box_stock: Number(item.box_stock) || 0,
      inv_stock: Number(item.inv_stock) || 0,
    }));
    return { items: cleanedItems, total };
  }

  async update(id: number, data: { part_number?: string; part_desc?: string; qty?: number }, user?: any): Promise<Part> {
    const part = await this.partRepo.findOne({ where: { id } });
    if (!part) throw new BadRequestException('Part not found');

    const prevQty = Number(part.qty) || 0;

    if (data.part_number !== undefined && data.part_number.trim()) {
      part.part_number = data.part_number.trim();
    }
    if (data.part_desc !== undefined) {
      part.part_description = data.part_desc.trim();
    }
    if (data.qty !== undefined) {
      const q = Number(data.qty);
      if (isNaN(q) || q < 0) throw new BadRequestException('Quantity must be 0 or greater');
      part.qty = q;

      // If quantity was altered, log an adjustment entry in history
      if (q !== prevQty) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        const diff = q - prevQty;
        const eventType = q === 0 ? 'STOCK_FINISHED' : (diff > 0 ? 'STOCK_ADDED' : 'STOCK_ADJUSTED');

        const historyEntry = this.partHistoryRepo.create({
          part_id: part.id,
          event_type: eventType,
          quantity_change: diff,
          previous_qty: prevQty,
          new_qty: q,
          supplier_name: 'Inventory Adjustment',
          supplier_notes: `Manual adjustment from ${prevQty} to ${q}`,
          created_by_user_id: user?.id || user?.sub || 3,
          created_by_user_name: user?.user_name || user?.name || 'Administrator',
          created_by_user_role: user?.type || user?.role || 'admin',
          entry_date: dateStr,
          entry_time: timeStr,
          notes: `Stock quantity manual adjustment: ${prevQty} -> ${q}`,
        });

        await this.partHistoryRepo.save(historyEntry);

        // If stock hit zero, notify!
        if (q === 0) {
          this.notifService.notifySystemEvent({
            reason: `Part "${part.part_number}" stock was manually adjusted to 0 (Finished)`,
            module: 'Part Master / Inventory',
            user,
            recipient_role: 'packing,admin',
            priority: 'WARNING',
            type: 'STOCK_DEPLETED_WARNING',
            title: `⚠️ Stock Depleted: Part "${part.part_number}" Finished`,
            message: `Part "${part.part_number}" available stock is now 0 after manual adjustment.`,
            entity_type: 'part',
            entity_id: String(part.id),
            action_url: '/part_master',
          }).catch((e) => console.error('[PartsService] Notification error:', e));
        }
      }
    }

    const saved = await this.partRepo.save(part);

    const userId = user?.id || user?.sub || 3;
    const userName = user?.user_name || user?.name || 'Administrator';
    const userRole = user?.type || user?.role || 'admin';

    // Record immutable audit history
    await this.activityService.recordActivity({
      userId,
      userName,
      userRole,
      actionType: 'UPDATE',
      actionTitle: 'Part Updated',
      module: 'Part Master',
      entityType: 'PART',
      entityId: part.part_number,
      details: `Updated Part "${part.part_number}" (${part.part_description}). Current stock: ${part.qty} units.`,
      metadata: {
        part_id: part.id,
        part_number: part.part_number,
        qty: part.qty,
      },
    });

    return saved;
  }

  async delete(id: number, force = false): Promise<{ success: boolean; message: string }> {
    const part = await this.partRepo.findOne({ where: { id } });
    if (!part) throw new BadRequestException('Part not found');

    const packingCount = await this.packingRepo.count({ where: { part_id: id } });
    const boxCount = await this.boxPackingRepo.count({ where: { part_id: id } });
    const invoiceCount = await this.invoiceRepo.count({ where: { part_id: id } });

    if ((packingCount > 0 || boxCount > 0 || invoiceCount > 0) && !force) {
      throw new BadRequestException(
        `Cannot remove Part "${part.part_number}": It is linked to existing records (${packingCount} packing, ${boxCount} box packing, ${invoiceCount} invoice).`,
      );
    }

    const pNumber = part.part_number;
    const pDesc = part.part_description;
    const pQty = part.qty;

    // Delete history entries for this part
    await this.partHistoryRepo.delete({ part_id: id });
    await this.partRepo.delete(id);

    // Record immutable audit history
    await this.activityService.recordActivity({
      actionType: 'DELETE',
      actionTitle: 'Part Deleted',
      module: 'Part Master',
      entityType: 'PART',
      entityId: pNumber,
      details: `Part "${pNumber}" (${pDesc}, ${pQty} units) was deleted from Part Master.`,
      metadata: {
        part_id: id,
        part_number: pNumber,
      },
    });

    return { success: true, message: `Part "${pNumber}" removed successfully` };
  }
}
