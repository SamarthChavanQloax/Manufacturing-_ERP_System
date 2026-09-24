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
exports.PackingController = void 0;
const common_1 = require("@nestjs/common");
const packing_service_1 = require("./packing.service");
const guards_1 = require("../auth/guards");
const roles_decorator_1 = require("../auth/roles.decorator");
let PackingController = class PackingController {
    constructor(packingService) {
        this.packingService = packingService;
    }
    async createSingle(body, req) {
        return this.packingService.createSingle(Number(body.part_id), Number(body.part_qty), req.user.userId);
    }
    async createBulk(body, req) {
        return this.packingService.createBulk(Number(body.part_id), Number(body.part_qty), Number(body.packing_qty), req.user.userId);
    }
    async getAll(fromDate, toDate) {
        return this.packingService.findAll(fromDate, toDate);
    }
    async getOne(id) {
        return this.packingService.findOne(Number(id));
    }
    async delete(id) {
        return this.packingService.delete(Number(id));
    }
};
exports.PackingController = PackingController;
__decorate([
    (0, common_1.Post)('single'),
    (0, roles_decorator_1.Roles)('admin', 'packing'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "createSingle", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, roles_decorator_1.Roles)('admin', 'packing'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'packing'),
    __param(0, (0, common_1.Query)('from_date')),
    __param(1, (0, common_1.Query)('to_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'packing'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "getOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'packing'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "delete", null);
exports.PackingController = PackingController = __decorate([
    (0, common_1.Controller)('api/packing'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    __metadata("design:paramtypes", [packing_service_1.PackingService])
], PackingController);
//# sourceMappingURL=packing.controller.js.map