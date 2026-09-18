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
}
