import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    const role = (req.user?.type || 'admin').toLowerCase();
    const userId = req.user?.userId || req.user?.id;
    return this.dashboardService.getStats(role, userId);
  }
}

