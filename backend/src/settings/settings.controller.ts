import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('api/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getSettings(@Req() req: any) {
    const role = (req.user?.type || 'admin').toLowerCase();
    return this.settingsService.getSettingsForRole(role);
  }

  @Put()
  async updateSettings(@Req() req: any, @Body() body: any) {
    const role = (req.user?.type || 'admin').toLowerCase();
    return this.settingsService.updateSettings(role, body);
  }
}
