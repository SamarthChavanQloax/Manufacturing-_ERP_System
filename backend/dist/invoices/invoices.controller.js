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
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const invoices_service_1 = require("./invoices.service");
const guards_1 = require("../auth/guards");
const roles_decorator_1 = require("../auth/roles.decorator");
let InvoicesController = class InvoicesController {
    constructor(invoicesService) {
        this.invoicesService = invoicesService;
    }
    async create(body, req) {
        return this.invoicesService.create(body, req.user.userId);
    }
    async getAll(fromDate, toDate) {
        return this.invoicesService.findAll(fromDate, toDate);
    }
    async getOne(id) {
        return this.invoicesService.findOne(Number(id));
    }
    async addBox(body, req) {
        return this.invoicesService.addBoxToInvoice(Number(body.invoice_id), String(body.box_id), req.user.userId);
    }
    async delete(id) {
        return this.invoicesService.delete(Number(id));
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin', 'invoice'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'invoice'),
    __param(0, (0, common_1.Query)('from_date')),
    __param(1, (0, common_1.Query)('to_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'invoice'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)('add-box'),
    (0, roles_decorator_1.Roles)('admin', 'invoice'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "addBox", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'invoice'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "delete", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_1.Controller)('api/invoices'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map