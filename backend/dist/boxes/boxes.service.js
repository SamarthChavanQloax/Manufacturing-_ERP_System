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
exports.BoxesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let BoxesService = class BoxesService {
    constructor(boxRepo, boxPackingRepo, packingRepo, partRepo, customerRepo) {
        this.boxRepo = boxRepo;
        this.boxPackingRepo = boxPackingRepo;
        this.packingRepo = packingRepo;
        this.partRepo = partRepo;
        this.customerRepo = customerRepo;
    }
    getLegacyDateTime() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        return { dateStr, timeStr };
    }
    async create(data, userId) {
        if (!data.box_name)
            throw new common_1.BadRequestException('Box/Part Name is required');
        const count = await this.boxRepo.count();
        const barcode = String(200000 + count);
        const { dateStr, timeStr } = this.getLegacyDateTime();
        const box = this.boxRepo.create({
            barcode,
            box_name: data.box_name,
            box_size: data.box_size || null,
            customer_id: data.customer_id || null,
            created_by: userId,
            created_date: timeStr,
            created_time: dateStr,
            status: 'pending',
            lock_status: 'no',
        });
        return this.boxRepo.save(box);
    }
    async findAll(fromDate, toDate) {
        let query = this.boxRepo.createQueryBuilder('b');
        if (fromDate && toDate) {
            query = query.where('b.created_time >= :fromDate AND b.created_time <= :toDate', {
                fromDate,
                toDate,
            });
        }
        const boxes = await query.orderBy('b.id', 'DESC').getMany();
        const result = await Promise.all(boxes.map(async (box) => {
            const boxPackings = await this.boxPackingRepo.find({ where: { box_id: box.id } });
            let totalPartQty = 0;
            for (const bp of boxPackings) {
                totalPartQty += bp.part_qty || 0;
            }
            return {
                ...box,
                part_qty: totalPartQty,
            };
        }));
        return result;
    }
    async findOne(id) {
        const box = await this.boxRepo.findOne({ where: { id } });
        if (!box)
            throw new common_1.NotFoundException('Box not found');
        const customer = box.customer_id
            ? await this.customerRepo.findOne({ where: { id: box.customer_id } })
            : null;
        const boxPackings = await this.boxPackingRepo.find({ where: { box_id: box.id } });
        let totalPartQty = 0;
        const items = [];
        for (const bp of boxPackings) {
            totalPartQty += bp.part_qty || 0;
            const part = await this.partRepo.findOne({ where: { id: bp.part_id } });
            items.push({
                ...bp,
                part_number: part?.part_number || '',
                part_description: part?.part_description || '',
            });
        }
        return {
            box,
            customer,
            total_part_qty: totalPartQty,
            items,
        };
    }
    async addPackingToBox(boxId, packBarcode, userId) {
        const box = await this.boxRepo.findOne({ where: { id: boxId } });
        if (!box)
            throw new common_1.NotFoundException('Box not found');
        if (box.lock_status === 'yes') {
            throw new common_1.BadRequestException('Error: Box is already locked');
        }
        const packing = await this.packingRepo.findOne({
            where: { barcode: packBarcode, status: 'pending' },
        });
        if (!packing) {
            throw new common_1.BadRequestException('Error : Packing barcode not found or already used !!!!');
        }
        const part = await this.partRepo.findOne({ where: { id: packing.part_id } });
        if (!part) {
            throw new common_1.BadRequestException('Part record not found');
        }
        if (box.box_name !== part.part_number) {
            throw new common_1.BadRequestException('Error : Part Id Not Matched !!!!');
        }
        const { dateStr, timeStr } = this.getLegacyDateTime();
        const boxPacking = this.boxPackingRepo.create({
            box_id: box.id,
            pack_id: Number(packing.barcode),
            part_id: part.id,
            part_qty: packing.part_qty,
            created_by: userId,
            created_date: dateStr,
            created_time: timeStr,
            status: 'used',
        });
        await this.boxPackingRepo.save(boxPacking);
        packing.status = 'used';
        await this.packingRepo.save(packing);
        return { success: true, message: 'Added Successfully' };
    }
    async lockBox(boxId) {
        const box = await this.boxRepo.findOne({ where: { id: boxId } });
        if (!box)
            throw new common_1.NotFoundException('Box not found');
        box.lock_status = 'yes';
        await this.boxRepo.save(box);
        return { success: true, lock_status: 'yes', message: 'Box Locked Successfully' };
    }
};
exports.BoxesService = BoxesService;
exports.BoxesService = BoxesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Box)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.BoxPacking)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Packing)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Part)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BoxesService);
//# sourceMappingURL=boxes.service.js.map