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
exports.VerificationController = void 0;
const common_1 = require("@nestjs/common");
const verification_service_1 = require("./verification.service");
const guards_1 = require("../auth/guards");
const roles_decorator_1 = require("../auth/roles.decorator");
let VerificationController = class VerificationController {
    constructor(verificationService) {
        this.verificationService = verificationService;
    }
    async start(body, req) {
        const barcode = body.invoice_barcode || body.invoice_number || '';
        return this.verificationService.startVerification(String(barcode), req.user.userId);
    }
    async getAll() {
        return this.verificationService.findAll();
    }
    async getOne(id) {
        return this.verificationService.findOne(Number(id));
    }
    async scanBox(body, req) {
        const matchId = body.match_id || body.invoice_match_id || 0;
        const boxBarcode = body.box_barcode || body.box_id || '';
        return this.verificationService.scanBox(Number(matchId), String(boxBarcode), req.user.userId);
    }
    async returnInvoice(body) {
        const matchId = body.match_id || body.invoice_match_id || 0;
        return this.verificationService.returnInvoice(Number(matchId), body.invoice_barcode);
    }
};
exports.VerificationController = VerificationController;
__decorate([
    (0, common_1.Post)('start'),
    (0, roles_decorator_1.Roles)('admin', 'gate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "start", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'gate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'gate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)('scan-box'),
    (0, roles_decorator_1.Roles)('admin', 'gate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "scanBox", null);
__decorate([
    (0, common_1.Post)('return'),
    (0, roles_decorator_1.Roles)('admin', 'gate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "returnInvoice", null);
exports.VerificationController = VerificationController = __decorate([
    (0, common_1.Controller)('api/verification'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    __metadata("design:paramtypes", [verification_service_1.VerificationService])
], VerificationController);
//# sourceMappingURL=verification.controller.js.map