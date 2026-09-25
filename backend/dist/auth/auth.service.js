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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const entities_1 = require("../entities");
let AuthService = class AuthService {
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    async validateUser(email, pass) {
        const user = await this.userRepository.findOne({
            where: { user_email: email },
        });
        if (!user || user.user_password !== pass) {
            throw new common_1.UnauthorizedException('Email and Password Invalid');
        }
        return user;
    }
    async login(email, pass) {
        const user = await this.validateUser(email, pass);
        const payload = {
            sub: user.id,
            email: user.user_email,
            name: user.user_name,
            type: user.type,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                user_name: user.user_name,
                user_email: user.user_email,
                type: user.type,
            },
        };
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return {
            id: user.id,
            user_name: user.user_name,
            user_email: user.user_email,
            type: user.type,
        };
    }
    async getProfileDetails(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const departmentMap = {
            admin: 'Executive & Management',
            packing: 'Finished Goods Packing Line',
            box: 'Master Carton Dispatch Packaging',
            invoice: 'Commercial Invoicing & Logistics',
            gate: 'Security & Outward Gate Control',
        };
        return {
            id: user.id,
            user_name: user.user_name,
            user_email: user.user_email,
            type: user.type,
            user_role: user.user_role || user.type,
            employee_id: `EMP-${1000 + user.id}`,
            mobile: '+91 98' + String(user.id).padStart(2, '0') + ' 44' + String(user.id * 7).padStart(4, '0'),
            department: departmentMap[user.type.toLowerCase()] || 'Plant Operations',
            status: 'Active',
            last_login: user.date && user.time ? `${user.date} ${user.time}` : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            drawing_download: user.drawing_download,
            drawing_upload: user.drawing_upload,
        };
    }
    async updateProfile(userId, data) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        if (data.user_name && data.user_name.trim()) {
            user.user_name = data.user_name.trim();
        }
        await this.userRepository.save(user);
        return {
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                user_name: user.user_name,
                user_email: user.user_email,
                type: user.type,
            },
        };
    }
    async changePassword(userId, currentPass, newPass) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        if (user.user_password !== currentPass) {
            throw new common_1.UnauthorizedException('Current password does not match');
        }
        if (!newPass || newPass.trim().length < 3) {
            throw new common_1.UnauthorizedException('New password must be at least 3 characters long');
        }
        user.user_password = newPass.trim();
        await this.userRepository.save(user);
        return { success: true, message: 'Password changed successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UserInfo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map