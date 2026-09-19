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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findAll() {
        return this.userRepository.find({ order: { id: 'ASC' } });
    }
    async create(data) {
        if (!data.user_name || !data.user_email || !data.user_password || !data.user_role) {
            throw new common_1.BadRequestException('All fields are required');
        }
        const existing = await this.userRepository.findOne({ where: { user_email: data.user_email } });
        if (existing) {
            throw new common_1.BadRequestException('User email already exists');
        }
        const user = this.userRepository.create({
            user_name: data.user_name,
            user_email: data.user_email,
            user_password: data.user_password,
            type: data.user_role.toLowerCase().trim(),
            user_role: data.user_role,
            drawing_download: 'yes',
            drawing_upload: 'yes',
        });
        return this.userRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UserInfo)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map