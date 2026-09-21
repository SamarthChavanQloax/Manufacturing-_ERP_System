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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let ReportsService = class ReportsService {
    constructor(invoiceMatchRepo, invoiceRepo, invoiceBoxRepo, boxRepo, boxPackingRepo, packingRepo, partRepo) {
        this.invoiceMatchRepo = invoiceMatchRepo;
        this.invoiceRepo = invoiceRepo;
        this.invoiceBoxRepo = invoiceBoxRepo;
        this.boxRepo = boxRepo;
        this.boxPackingRepo = boxPackingRepo;
        this.packingRepo = packingRepo;
        this.partRepo = partRepo;
    }
    async getGateOutReport() {
        const matches = await this.invoiceMatchRepo.find({ order: { id: 'DESC' } });
        const rows = [];
        for (const match of matches) {
            const invoice = await this.invoiceRepo.findOne({
                where: { barcode: match.invoice_number },
            });
            let partNumber = '';
            let partDesc = '';
            let invoiceQty = 0;
            let invoiceNum = '';
            let gateoutCode = '';
            if (invoice) {
                invoiceNum = invoice.invoice_number;
                invoiceQty = invoice.qty;
                gateoutCode = `${invoice.invoice_number}4000${match.id}`;
                const invoiceBox = await this.invoiceBoxRepo.findOne({
                    where: { invoice_id: invoice.id },
                });
                if (invoiceBox) {
                    const box = await this.boxRepo.findOne({
                        where: { barcode: String(invoiceBox.box_id) },
                    });
                    if (box) {
                        const boxPacking = await this.boxPackingRepo.findOne({
                            where: { box_id: box.id },
                        });
                        if (boxPacking) {
                            const packing = await this.packingRepo.findOne({
                                where: { barcode: String(boxPacking.pack_id) },
                            });
                            if (packing) {
                                const part = await this.partRepo.findOne({
                                    where: { id: packing.part_id },
                                });
                                if (part) {
                                    partNumber = part.part_number;
                                    partDesc = part.part_description;
                                }
                            }
                        }
                    }
                }
                if (!partNumber && invoice.part_id) {
                    const part = await this.partRepo.findOne({ where: { id: invoice.part_id } });
                    if (part) {
                        partNumber = part.part_number;
                        partDesc = part.part_description;
                    }
                }
            }
            rows.push({
                id: match.id,
                invoice_number: invoiceNum || match.invoice_number,
                part_number: partNumber,
                part_description: partDesc,
                qty: invoiceQty,
                gateout_code: gateoutCode,
                gateout_date: `${match.created_date}/${match.created_time}`,
            });
        }
        return rows;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.InvoiceMatch)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Invoice)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.InvoiceBox)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Box)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.BoxPacking)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.Packing)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.Part)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map