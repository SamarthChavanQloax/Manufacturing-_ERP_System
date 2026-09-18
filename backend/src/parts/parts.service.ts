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
    const where: any = {};
    if (search && search.trim()) {
      where.part_number = Like(`%${search.trim()}%`);
    }

    const [items, total] = await this.partRepo.findAndCount({
      where,
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  async getAllSimple(): Promise<Part[]> {
    return this.partRepo.find({
      select: ['id', 'part_number', 'part_description', 'qty'],
      order: { part_number: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Part> {
    const part = await this.partRepo.findOne({ where: { id } });
    if (!part) throw new BadRequestException('Part not found');
    return part;
  }

  async create(data: { part_number: string; part_desc: string; qty: number }) {
    if (!data.part_number || !data.part_desc) {
      throw new BadRequestException('Part number and description are required');
    }

    const existing = await this.partRepo.findOne({ where: { part_number: data.part_number } });
    if (existing) {
      throw new BadRequestException('Part Number already exists');
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const part = this.partRepo.create({
      part_number: data.part_number,
      part_description: data.part_desc,
      qty: Number(data.qty) || 0,
      customer_id: 0,
      customer_part_id: 0,
      part_family: '',
      created_id: 3,
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
      ORDER BY p.id ASC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const items = await this.partRepo.query(dataQuery, params);
    return { items, total };
  }
}
