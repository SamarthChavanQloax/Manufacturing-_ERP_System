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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let InvoicesService = class InvoicesService {
    constructor(invoiceRepo, invoiceBoxRepo, boxRepo, boxPackingRepo, packingRepo, partRepo) {
        this.invoiceRepo = invoiceRepo;
        this.invoiceBoxRepo = invoiceBoxRepo;
        this.boxRepo = boxRepo;
        this.boxPackingRepo = boxPackingRepo;
        this.packingRepo = packingRepo;
        this.partRepo = partRepo;
    }
    getLegacyDateTime() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        return { dateStr, timeStr };
    }
    async create(data, userId) {
        if (!data.invoice_number || !data.part_id || !data.qty) {
            throw new common_1.BadRequestException('Invoice number, Part, and Quantity are required');
        }
        const existing = await this.invoiceRepo.findOne({
            where: { invoice_number: data.invoice_number.trim() },
        });
        if (existing) {
            throw new common_1.BadRequestException('Error : Invoice Number Already Exists');
        }
        const count = await this.invoiceRepo.count();
        const barcode = String(300000 + count);
        const { dateStr, timeStr } = this.getLegacyDateTime();
        const invoice = this.invoiceRepo.create({
            barcode,
            invoice_number: data.invoice_number.trim(),
            part_id: Number(data.part_id),
            qty: Number(data.qty),
            created_by: userId,
            created_date: timeStr,
            created_time: dateStr,
            status: 'pending',
            lock_status: 'no',
            status_new: 'pending',
        });
        return this.invoiceRepo.save(invoice);
    }
    async findAll(fromDate, toDate) {
        let query = this.invoiceRepo.createQueryBuilder('i');
        if (fromDate && toDate) {
            query = query.where('i.created_time >= :fromDate AND i.created_time <= :toDate', {
                fromDate,
                toDate,
            });
        }
        const invoices = await query.orderBy('i.id', 'DESC').getMany();
        const result = await Promise.all(invoices.map(async (inv) => {
            const part = await this.partRepo.findOne({ where: { id: inv.part_id } });
            return {
                ...inv,
                part_number: part?.part_number || '',
                part_description: part?.part_description || '',
            };
        }));
        return result;
    }
    async findOne(id) {
        const invoice = await this.invoiceRepo.findOne({ where: { id } });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        const part = await this.partRepo.findOne({ where: { id: invoice.part_id } });
        const invoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
        let totalPartQty = 0;
        const boxesWithDetails = [];
        for (const ib of invoiceBoxes) {
            const box = await this.boxRepo.findOne({ where: { barcode: String(ib.box_id) } });
            let boxQty = 0;
            if (box) {
                const boxPackings = await this.boxPackingRepo.find({ where: { box_id: box.id } });
                for (const bp of boxPackings) {
                    boxQty += bp.part_qty || 0;
                }
            }
            totalPartQty += boxQty;
            boxesWithDetails.push({
                ...ib,
                box_barcode: ib.box_id,
                box_name: box?.box_name || '',
                box_qty: boxQty,
            });
        }
        return {
            invoice,
            part,
            total_part_qty: totalPartQty,
            boxes: boxesWithDetails,
        };
    }
    async addBoxToInvoice(invoiceId, boxBarcode, userId) {
        const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        const box = await this.boxRepo.findOne({
            where: { barcode: String(boxBarcode), status: 'pending' },
        });
        if (!box) {
            throw new common_1.BadRequestException('Error : Box barcode not found or already used in another invoice !!!!');
        }
        const boxPackings = await this.boxPackingRepo.find({ where: { box_id: box.id } });
        if (!boxPackings || boxPackings.length === 0) {
            throw new common_1.BadRequestException('Error 403 : Box barcode contains no packing items !!!!');
        }
        const boxPartId = boxPackings[0].part_id;
        if (boxPartId !== invoice.part_id) {
            throw new common_1.BadRequestException('Error 405 : Packing Part Number Mismatch Please Try Again');
        }
        let currentInvoiceTotal = 0;
        const existingInvoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
        for (const eib of existingInvoiceBoxes) {
            const b = await this.boxRepo.findOne({ where: { barcode: String(eib.box_id) } });
            if (b) {
                const bps = await this.boxPackingRepo.find({ where: { box_id: b.id } });
                for (const bp of bps) {
                    currentInvoiceTotal += bp.part_qty || 0;
                }
            }
        }
        let thisBoxQty = 0;
        for (const bp of boxPackings) {
            thisBoxQty += bp.part_qty || 0;
        }
        if (currentInvoiceTotal + thisBoxQty > invoice.qty) {
            throw new common_1.BadRequestException('Error 406 : Part Qty Mismatch, adding this box exceeds invoice quantity');
        }
        const { dateStr, timeStr } = this.getLegacyDateTime();
        const invoiceBox = this.invoiceBoxRepo.create({
            box_id: Number(box.barcode),
            invoice_id: invoice.id,
            created_by: userId,
            created_date: dateStr,
            created_time: timeStr,
            status: 'used',
        });
        await this.invoiceBoxRepo.save(invoiceBox);
        box.status = 'used';
        await this.boxRepo.save(box);
        return { success: true, message: 'Box Added to Invoice Successfully' };
    }
    async delete(id) {
        const invoice = await this.invoiceRepo.findOne({ where: { id } });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        const invoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
        for (const ib of invoiceBoxes) {
            const box = await this.boxRepo.findOne({ where: { barcode: String(ib.box_id) } });
            if (box) {
                box.status = 'pending';
                await this.boxRepo.save(box);
            }
            await this.invoiceBoxRepo.delete(ib.id);
        }
        return this.invoiceRepo.delete(id);
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Invoice)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.InvoiceBox)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Box)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.BoxPacking)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Packing)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.Part)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map