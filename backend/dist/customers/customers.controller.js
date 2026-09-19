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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const customers_service_1 = require("./customers.service");
const guards_1 = require("../auth/guards");
const roles_decorator_1 = require("../auth/roles.decorator");
let CustomersController = class CustomersController {
    constructor(customersService) {
        this.customersService = customersService;
    }
    async getAll() {
        return this.customersService.findAll();
    }
    async create(customerName) {
        return this.customersService.create(customerName);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin', 'box'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)('customerName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "create", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('api/customers'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map