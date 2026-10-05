import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserInfo } from '../entities';

import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private loginFailures = new Map<string, { count: number; firstAt: number }>();

  constructor(
    @InjectRepository(UserInfo)
    private userRepository: Repository<UserInfo>,
    private jwtService: JwtService,
    private notifService: NotificationService,
  ) {}

  async validateUser(email: string, pass: string): Promise<UserInfo> {
    const user = await this.userRepository.findOne({
      where: { user_email: email },
    });
    if (!user || user.user_password !== pass) {
      const emailKey = (email || '').toLowerCase().trim();
      const now = Date.now();
      const record = this.loginFailures.get(emailKey) || { count: 0, firstAt: now };
      
      // Reset after 10 minutes
      if (now - record.firstAt > 10 * 60 * 1000) {
        record.count = 1;
        record.firstAt = now;
      } else {
        record.count += 1;
      }
      this.loginFailures.set(emailKey, record);

      // Only trigger notification when required: e.g. repeated failure anomaly (3+ attempts)
      if (record.count >= 3) {
        const actorName = user ? (user.user_name || user.user_email) : (email || 'Unknown User');
        const actorRole = user ? user.type : 'guest';
        const actorId = user ? user.id : null;
        const reason = `Security Anomaly: ${record.count} consecutive failed login attempts on account "${email}" within 10 minutes`;

        this.notifService.createNotification({
          type: 'SECURITY_LOGIN_FAILED',
          priority: 'HIGH',
          title: `🛡️ Security Alert: Repeated Failed Login Attempts (${email})`,
          message: `Multiple consecutive failed login attempts detected on Authentication portal for account "${email}". Possible unauthorized credential guessing.

Reason: ${reason}
Affected Section: Authentication & Security
Active User: ${actorName} (${actorRole.toUpperCase()}${actorId ? ` | ID: ${actorId}` : ''} | Email: ${email})`,
          reason,
          module: 'Authentication & Security',
          actor_name: actorName,
          actor_id: actorId,
          actor_role: actorRole,
          actor_email: email,
          recipient_role: 'admin',
          action_url: '/notifications',
          metadata: {
            attempted_email: email,
            attempt_count: record.count,
            reason,
            module: 'Authentication & Security',
            user_details: {
              id: actorId,
              name: actorName,
              role: actorRole,
              email,
            },
          },
          dedup_key: `LOGIN_FAIL_${emailKey}_${new Date().toISOString().slice(0, 13)}`,
        }).catch((e) => console.error('[AuthService] Error notifying login failure:', e));
      }

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

