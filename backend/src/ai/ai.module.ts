import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GateRiskService } from './gate-risk.service';
import { DailySecurityBriefingService } from './daily-security-briefing.service';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  Part,
  Invoice,
  Box,
  Packing,
  UserInfo,
  InvoiceMatch,
  InvoiceBox,
  InvoiceBoxMatch,
  Customer,
  BoxPacking,
  GateRiskAnalysis,
  GateScanLog,
  GateRiskConfig,
  DailySecurityBriefing,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Part,
      Invoice,
      Box,
      Packing,
      UserInfo,
      InvoiceMatch,
      InvoiceBox,
      InvoiceBoxMatch,
      Customer,
      BoxPacking,
      GateRiskAnalysis,
      GateScanLog,
      GateRiskConfig,
      DailySecurityBriefing,
    ]),
    NotificationsModule,
  ],
  controllers: [AiController],
  providers: [AiService, GateRiskService, DailySecurityBriefingService],
  exports: [AiService, GateRiskService, DailySecurityBriefingService],
})
export class AiModule {}
