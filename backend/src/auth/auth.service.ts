import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserInfo } from '../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserInfo)
    private userRepository: Repository<UserInfo>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<UserInfo> {
    const user = await this.userRepository.findOne({
      where: { user_email: email },
    });
    if (!user || user.user_password !== pass) {
      throw new UnauthorizedException('Email and Password Invalid');
    }
    return user;
  }

  async login(email: string, pass: string) {
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

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      user_name: user.user_name,
      user_email: user.user_email,
      type: user.type,
    };
  }

  async getProfileDetails(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const departmentMap: Record<string, string> = {
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

  async updateProfile(userId: number, data: { user_name?: string; mobile?: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

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

  async changePassword(userId: number, currentPass: string, newPass: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (user.user_password !== currentPass) {
      throw new UnauthorizedException('Current password does not match');
    }

    if (!newPass || newPass.trim().length < 3) {
      throw new UnauthorizedException('New password must be at least 3 characters long');
    }

    user.user_password = newPass.trim();
    await this.userRepository.save(user);

    return { success: true, message: 'Password changed successfully' };
  }
}

