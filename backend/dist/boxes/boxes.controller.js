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
exports.BoxesController = void 0;
const common_1 = require("@nestjs/common");
const boxes_service_1 = require("./boxes.service");
const guards_1 = require("../auth/guards");
const roles_decorator_1 = require("../auth/roles.decorator");
let BoxesController = class BoxesController {
    constructor(boxesService) {
        this.boxesService = boxesService;
    }
    async create(body, req) {
        return this.boxesService.create(body, req.user.userId);
    }
    async getAll(fromDate, toDate) {
        return this.boxesService.findAll(fromDate, toDate);
    }
    async getOne(id) {
        return this.boxesService.findOne(Number(id));
    }
    async addPacking(body, req) {
        const packBarcode = body.pack_id || body.barcode || body.packing_barcode || body.pack_barcode || '';
        return this.boxesService.addPackingToBox(Number(body.box_id), String(packBarcode), req.user.userId);
    }
    async lockBox(body) {
        return this.boxesService.lockBox(Number(body.box_id));
    }
};
exports.BoxesController = BoxesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin', 'box'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BoxesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'box'),
    __param(0, (0, common_1.Query)('from_date')),
    __param(1, (0, common_1.Query)('to_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BoxesController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin', 'box'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BoxesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)('add-packing'),
    (0, roles_decorator_1.Roles)('admin', 'box'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BoxesController.prototype, "addPacking", null);
__decorate([
    (0, common_1.Post)('lock'),
    (0, roles_decorator_1.Roles)('admin', 'box'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BoxesController.prototype, "lockBox", null);
exports.BoxesController = BoxesController = __decorate([
    (0, common_1.Controller)('api/boxes'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    __metadata("design:paramtypes", [boxes_service_1.BoxesService])
], BoxesController);
//# sourceMappingURL=boxes.controller.js.map