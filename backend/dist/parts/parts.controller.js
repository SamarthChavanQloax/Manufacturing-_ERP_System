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
exports.PartsController = void 0;
const common_1 = require("@nestjs/common");
const parts_service_1 = require("./parts.service");
const guards_1 = require("../auth/guards");
const roles_decorator_1 = require("../auth/roles.decorator");
let PartsController = class PartsController {
    constructor(partsService) {
        this.partsService = partsService;
    }
    async getAll(search, page, limit) {
        return this.partsService.findAll(search, Number(page) || 1, Number(limit) || 50);
    }
    async getSimple() {
        return this.partsService.getAllSimple();
    }
    async getStock(search, page, limit) {
        return this.partsService.getStockList(search, Number(page) || 1, Number(limit) || 50);
    }
    async create(body) {
        return this.partsService.create(body);
    }
};
exports.PartsController = PartsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'packing', 'box', 'invoice'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PartsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('simple'),
    (0, roles_decorator_1.Roles)('admin', 'packing', 'box', 'invoice'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PartsController.prototype, "getSimple", null);
__decorate([
    (0, common_1.Get)('stock'),
    (0, roles_decorator_1.Roles)('admin', 'packing'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PartsController.prototype, "getStock", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PartsController.prototype, "create", null);
exports.PartsController = PartsController = __decorate([
    (0, common_1.Controller)('api/parts'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    __metadata("design:paramtypes", [parts_service_1.PartsService])
], PartsController);
//# sourceMappingURL=parts.controller.js.map