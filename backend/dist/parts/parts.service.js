"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let PartsService = class PartsService {
    constructor(partRepo, packingRepo, boxPackingRepo, invoiceRepo) {
        this.partRepo = partRepo;
        this.packingRepo = packingRepo;
        this.boxPackingRepo = boxPackingRepo;
        this.invoiceRepo = invoiceRepo;
    }
    async findAll(search, page = 1, limit = 50) {
        const where = {};
        if (search && search.trim()) {
            where.part_number = (0, typeorm_2.Like)(`%${search.trim()}%`);
        }
        const [items, total] = await this.partRepo.findAndCount({
            where,
            order: { id: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total };
    }
    async getAllSimple() {
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
    async findOne(id) {
        const part = await this.partRepo.findOne({ where: { id } });
        if (!part)
            throw new common_1.BadRequestException('Part not found');
        return part;
    }
    async create(data) {
        if (!data.part_number || !data.part_desc) {
            throw new common_1.BadRequestException('Part number and description are required');
        }
        const existing = await this.partRepo.findOne({ where: { part_number: data.part_number } });
        if (existing) {
            throw new common_1.BadRequestException('Part Number already exists');
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
    async getStockList(search, page = 1, limit = 50) {
        let whereClause = '';
        const params = [];
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
      ORDER BY p.id ASC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;
        const items = await this.partRepo.query(dataQuery, params);
        const cleanedItems = items.map((item) => ({
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
    async update(id, data) {
        const part = await this.partRepo.findOne({ where: { id } });
        if (!part)
            throw new common_1.BadRequestException('Part not found');
        if (data.part_number !== undefined && data.part_number.trim()) {
            part.part_number = data.part_number.trim();
        }
        if (data.part_desc !== undefined) {
            part.part_description = data.part_desc.trim();
        }
        if (data.qty !== undefined) {
            const q = Number(data.qty);
            if (isNaN(q) || q < 0)
                throw new common_1.BadRequestException('Quantity must be 0 or greater');
            part.qty = q;
        }
        return this.partRepo.save(part);
    }
};
exports.PartsService = PartsService;
exports.PartsService = PartsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Part)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Packing)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.BoxPacking)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Invoice)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PartsService);
//# sourceMappingURL=parts.service.js.map