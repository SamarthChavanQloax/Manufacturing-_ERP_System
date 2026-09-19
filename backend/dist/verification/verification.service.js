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
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let VerificationService = class VerificationService {
    constructor(invoiceRepo, invoiceBoxRepo, invoiceMatchRepo, invoiceBoxMatchRepo, boxRepo, boxPackingRepo, partRepo) {
        this.invoiceRepo = invoiceRepo;
        this.invoiceBoxRepo = invoiceBoxRepo;
        this.invoiceMatchRepo = invoiceMatchRepo;
        this.invoiceBoxMatchRepo = invoiceBoxMatchRepo;
        this.boxRepo = boxRepo;
        this.boxPackingRepo = boxPackingRepo;
        this.partRepo = partRepo;
    }
    getLegacyDateTime() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        return { dateStr, timeStr };
    }
    async startVerification(invoiceBarcode, userId) {
        const invoice = await this.invoiceRepo.findOne({
            where: { barcode: String(invoiceBarcode).trim() },
        });
        if (!invoice) {
            throw new common_1.BadRequestException('Error : Invoice Number Not Found !!!');
        }
        const existingMatch = await this.invoiceMatchRepo.findOne({
            where: { invoice_number: invoice.barcode },
        });
        if (existingMatch) {
            throw new common_1.BadRequestException('Error : Invoice Number Already In Verification Process , Please Select Invoice Number From Following Table !!!');
        }
        const { dateStr, timeStr } = this.getLegacyDateTime();
        const match = this.invoiceMatchRepo.create({
            invoice_number: invoice.barcode,
            total_stock: invoice.qty,
            created_by: userId,
            created_time: dateStr,
            created_date: timeStr,
            status: 'pending',
        });
        const savedMatch = await this.invoiceMatchRepo.save(match);
        invoice.status = 'used';
        await this.invoiceRepo.save(invoice);
        return savedMatch;
    }
    async findAll() {
        return this.invoiceMatchRepo.find({ order: { id: 'DESC' } });
    }
    async findOne(matchId) {
        const match = await this.invoiceMatchRepo.findOne({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException('Verification record not found');
        const invoice = await this.invoiceRepo.findOne({
            where: { barcode: match.invoice_number },
        });
        let expectedBoxes = [];
        let scannedBoxes = [];
        let isMatched = false;
        if (invoice) {
            const invoiceBoxes = await this.invoiceBoxRepo.find({ where: { invoice_id: invoice.id } });
            expectedBoxes = invoiceBoxes;
            scannedBoxes = await this.invoiceBoxMatchRepo.find({ where: { invoice_id: invoice.id } });
            if (expectedBoxes.length > 0 && scannedBoxes.length >= expectedBoxes.length) {
                isMatched = true;
            }
        }
        const gateOutCode = invoice ? `${invoice.invoice_number}4000${match.id}` : '';
        return {
            match,
            invoice,
            expected_boxes_count: expectedBoxes.length,
            scanned_boxes_count: scannedBoxes.length,
            checked: isMatched,
            gate_out_code: gateOutCode,
            scanned_boxes: scannedBoxes,
        };
    }
    async scanBox(matchId, boxBarcode, userId) {
        const match = await this.invoiceMatchRepo.findOne({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException('Verification record not found');
        const invoice = await this.invoiceRepo.findOne({
            where: { barcode: match.invoice_number },
        });
        if (!invoice)
            throw new common_1.BadRequestException('Invoice not found');
        const validInvoiceBox = await this.invoiceBoxRepo.findOne({
            where: { invoice_id: invoice.id, box_id: Number(boxBarcode) },
        });
        if (!validInvoiceBox) {
            throw new common_1.BadRequestException('Error : Box barcode not found in this invoice !!!!');
        }
        const alreadyScanned = await this.invoiceBoxMatchRepo.findOne({
            where: { invoice_id: invoice.id, box_id: Number(boxBarcode) },
        });
        if (alreadyScanned) {
            throw new common_1.BadRequestException('Error : Box barcode already scanned for this invoice');
        }
        const { dateStr, timeStr } = this.getLegacyDateTime();
        const boxMatch = this.invoiceBoxMatchRepo.create({
            box_id: Number(boxBarcode),
            invoice_id: invoice.id,
            created_by: userId,
            created_date: dateStr,
            created_time: timeStr,
            status: 'pending',
        });
        await this.invoiceBoxMatchRepo.save(boxMatch);
        const totalExpected = await this.invoiceBoxRepo.count({ where: { invoice_id: invoice.id } });
        const totalScanned = await this.invoiceBoxMatchRepo.count({ where: { invoice_id: invoice.id } });
        if (totalExpected > 0 && totalScanned >= totalExpected) {
            match.status = 'verified';
            await this.invoiceMatchRepo.save(match);
        }
        return {
            success: true,
            message: 'Added Successfully',
            completed: totalExpected > 0 && totalScanned >= totalExpected,
        };
    }
    async returnInvoice(matchId, invoiceBarcode) {
        const match = await this.invoiceMatchRepo.findOne({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException('Verification record not found');
        const invoice = await this.invoiceRepo.findOne({
            where: { barcode: invoiceBarcode },
        });
        if (invoice) {
            invoice.status = 'pending';
            await this.invoiceRepo.save(invoice);
            await this.invoiceBoxMatchRepo.delete({ invoice_id: invoice.id });
        }
        await this.invoiceMatchRepo.delete(matchId);
        return { success: true, message: 'Invoice Returned Successfully' };
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Invoice)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.InvoiceBox)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.InvoiceMatch)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.InvoiceBoxMatch)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.Box)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.BoxPacking)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.Part)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], VerificationService);
//# sourceMappingURL=verification.service.js.map