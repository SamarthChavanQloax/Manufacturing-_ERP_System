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
exports.PackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let PackingService = class PackingService {
    constructor(packingRepo, partRepo) {
        this.packingRepo = packingRepo;
        this.partRepo = partRepo;
    }
    getLegacyDateTime() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        return { dateStr, timeStr };
    }
    async createSingle(partId, partQty, userId) {
        const part = await this.partRepo.findOne({ where: { id: partId } });
        if (!part)
            throw new common_1.BadRequestException('Part not found');
        if (!partQty || partQty <= 0)
            throw new common_1.BadRequestException('Invalid quantity');
        const count = await this.packingRepo.count();
        const barcode = String(100000 + count);
        const { dateStr, timeStr } = this.getLegacyDateTime();
        const packing = this.packingRepo.create({
            barcode,
            part_id: partId,
            part_qty: partQty,
            created_by: userId,
            created_time: dateStr,
            created_date: timeStr,
            status: 'pending',
            packing_name: '',
        });
        const saved = await this.packingRepo.save(packing);
        return {
            ...saved,
            part_number: part.part_number,
            part_description: part.part_description,
        };
    }
    async createBulk(partId, partQty, packingQty, userId) {
        const part = await this.partRepo.findOne({ where: { id: partId } });
        if (!part)
            throw new common_1.BadRequestException('Part not found');
        if (!partQty || partQty <= 0)
            throw new common_1.BadRequestException('Invalid part quantity');
        if (!packingQty || packingQty <= 0)
            throw new common_1.BadRequestException('Invalid packing bulk quantity');
        const createdItems = [];
        const { dateStr, timeStr } = this.getLegacyDateTime();
        for (let i = 0; i < packingQty; i++) {
            const count = await this.packingRepo.count();
            const barcode = String(100000 + count);
            const item = this.packingRepo.create({
                barcode,
                part_id: partId,
                part_qty: partQty,
                created_by: userId,
                created_time: dateStr,
                created_date: timeStr,
                status: 'pending',
                packing_name: '',
            });
            const saved = await this.packingRepo.save(item);
            createdItems.push({
                ...saved,
                part_number: part.part_number,
                part_description: part.part_description,
            });
        }
        return createdItems;
    }
    async findAll(fromDate, toDate) {
        let query = this.packingRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect(entities_1.Part, 'part', 'part.id = p.part_id')
            .select([
            'p.id AS id',
            'p.barcode AS barcode',
            'p.part_id AS part_id',
            'p.part_qty AS part_qty',
            'p.created_by AS created_by',
            'p.created_time AS created_time',
            'p.created_date AS created_date',
            'p.status AS status',
            'part.part_number AS part_number',
            'part.part_description AS part_description',
        ]);
        if (fromDate && toDate) {
            query = query.where('p.created_time >= :fromDate AND p.created_time <= :toDate', {
                fromDate,
                toDate,
            });
        }
        return query.orderBy('p.id', 'DESC').getRawMany();
    }
    async findOne(id) {
        const item = await this.packingRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect(entities_1.Part, 'part', 'part.id = p.part_id')
            .select([
            'p.id AS id',
            'p.barcode AS barcode',
            'p.part_id AS part_id',
            'p.part_qty AS part_qty',
            'p.created_by AS created_by',
            'p.created_time AS created_time',
            'p.created_date AS created_date',
            'p.status AS status',
            'part.part_number AS part_number',
            'part.part_description AS part_description',
        ])
            .where('p.id = :id', { id })
            .getRawOne();
        if (!item)
            throw new common_1.NotFoundException('Packing record not found');
        return item;
    }
    async delete(id) {
        const item = await this.packingRepo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Packing record not found');
        return this.packingRepo.delete(id);
    }
};
exports.PackingService = PackingService;
exports.PackingService = PackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Packing)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Part)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PackingService);
//# sourceMappingURL=packing.service.js.map