import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'erp-barcode-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
