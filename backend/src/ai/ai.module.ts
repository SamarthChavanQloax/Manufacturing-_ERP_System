import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GateRiskService } from './gate-risk.service';
import { DailySecurityBriefingService } from './daily-security-briefing.service';
import { AskErpService } from './ask-erp.service';
import { GeminiService } from './gemini.service';
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
  Notification,
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
      Notification,
    ]),
    NotificationsModule,
  ],
  controllers: [AiController],
  providers: [AiService, GateRiskService, DailySecurityBriefingService, AskErpService, GeminiService],
  exports: [AiService, GateRiskService, DailySecurityBriefingService, AskErpService, GeminiService],
})
export class AiModule {}
