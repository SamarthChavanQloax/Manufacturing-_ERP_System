import { Controller, Post, Body, Get, Put, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email?: string; password?: string; user_email?: string; user_password?: string }) {
    const email = body.email || body.user_email || '';
    const password = body.password || body.user_password || '';
    return this.authService.login(email, password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile-details')
  async getProfileDetails(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.authService.getProfileDetails(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() body: { user_name?: string; mobile?: string }) {
    const userId = req.user.userId || req.user.id;
    return this.authService.updateProfile(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(@Request() req: any, @Body() body: { currentPassword?: string; newPassword?: string }) {
    const userId = req.user.userId || req.user.id;
    return this.authService.changePassword(userId, body.currentPassword || '', body.newPassword || '');
  }
}

