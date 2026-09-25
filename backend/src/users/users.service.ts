import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from '../entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserInfo)
    private userRepository: Repository<UserInfo>,
  ) {}

  async findAll(): Promise<UserInfo[]> {
    return this.userRepository.find({ order: { id: 'ASC' } });
  }

  async create(data: { user_name: string; user_email: string; user_password: string; user_role: string }) {
    if (!data.user_name || !data.user_email || !data.user_password || !data.user_role) {
      throw new BadRequestException('All fields are required');
    }

    const existing = await this.userRepository.findOne({ where: { user_email: data.user_email } });
    if (existing) {
      throw new BadRequestException('User email already exists');
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

  async delete(targetUserId: number, currentUserId?: number) {
    if (currentUserId && Number(targetUserId) === Number(currentUserId)) {
      throw new BadRequestException('You cannot delete your own admin account');
    }

    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.userRepository.delete(targetUserId);
    return { success: true, message: `User "${user.user_name}" deleted successfully` };
  }
}

