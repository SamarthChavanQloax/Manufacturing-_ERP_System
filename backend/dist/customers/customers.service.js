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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let CustomersService = class CustomersService {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async findAll() {
        return this.customerRepo.find({ order: { id: 'ASC' } });
    }
    async create(customerName) {
        if (!customerName || !customerName.trim()) {
            throw new common_1.BadRequestException('Customer Name is required');
        }
        const customer = this.customerRepo.create({
            customer_name: customerName.trim(),
        });
        return this.customerRepo.save(customer);
    }
    async update(id, customerName) {
        if (!customerName || !customerName.trim()) {
            throw new common_1.BadRequestException('Customer Name is required');
        }
        const customer = await this.customerRepo.findOne({ where: { id: Number(id) } });
        if (!customer) {
            throw new common_1.BadRequestException('Customer not found');
        }
        customer.customer_name = customerName.trim();
        return this.customerRepo.save(customer);
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomersService);
//# sourceMappingURL=customers.service.js.map