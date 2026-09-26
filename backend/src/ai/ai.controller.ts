import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('stock-intelligence')
  @Roles('admin') // Restricted strictly to admin
  async getStockIntelligence() {
    return this.aiService.getStockIntelligence();
  }

  @Get('security-anomalies')
  @Roles('admin', 'gate') // Relevant for gate and admin
  async getSecurityAnomalies() {
    return this.aiService.getSecurityAnomalies();
  }
}
