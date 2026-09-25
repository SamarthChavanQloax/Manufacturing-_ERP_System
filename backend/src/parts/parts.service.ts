import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Part, Packing, BoxPacking, Invoice } from '../entities';

@Injectable()
export class PartsService {
  constructor(
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
  ) {}

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
      order: { part_number: 'ASC' },
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

  async create(data: { part_number: string; part_desc: string; qty: number }, userId = 3) {
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

    const part = this.partRepo.create({
      part_number: trimmedPartNumber,
      part_description: trimmedPartDesc,
      qty: Number(data.qty) || 0,
      customer_id: 0,
      customer_part_id: 0,
      part_family: '',
      created_id: userId,
      date: dateStr,
      time: timeStr,
      uom: '',
      safety_stock: '',
    });

    return this.partRepo.save(part);
  }

  async getStockList(search?: string, page = 1, limit = 50): Promise<{ items: any[]; total: number }> {
    // Efficient aggregation using subqueries to calculate real-time inventory
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

  async update(id: number, data: { part_number?: string; part_desc?: string; qty?: number }): Promise<Part> {
    const part = await this.partRepo.findOne({ where: { id } });
    if (!part) throw new BadRequestException('Part not found');

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
    }

    return this.partRepo.save(part);
  }
}
