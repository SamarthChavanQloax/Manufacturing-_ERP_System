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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let DashboardService = class DashboardService {
    constructor(partRepo, packingRepo, boxRepo, invoiceRepo, userRepo) {
        this.partRepo = partRepo;
        this.packingRepo = packingRepo;
        this.boxRepo = boxRepo;
        this.invoiceRepo = invoiceRepo;
        this.userRepo = userRepo;
    }
    async getStats() {
        const partsCount = await this.partRepo.count();
        const packingCount = await this.packingRepo.count();
        const boxCount = await this.boxRepo.count();
        const invoiceCount = await this.invoiceRepo.count();
        const usersCount = await this.userRepo.count();
        return {
            newOrders: 1501,
            bounceRate: '53%',
            userRegistrations: 44,
            uniqueVisitors: 65,
            systemCounts: {
                parts: partsCount,
                packings: packingCount,
                boxes: boxCount,
                invoices: invoiceCount,
                users: usersCount,
            },
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Part)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Packing)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Box)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Invoice)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.UserInfo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map