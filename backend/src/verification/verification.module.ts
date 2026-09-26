import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceBox, InvoiceMatch, InvoiceBoxMatch, Box, BoxPacking, Part, GateRiskAnalysis } from '../entities';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceBox,
      InvoiceMatch,
      InvoiceBoxMatch,
      Box,
      BoxPacking,
      Part,
      GateRiskAnalysis,
    ]),
    forwardRef(() => AiModule),
  ],
  providers: [VerificationService],
  controllers: [VerificationController],
  exports: [VerificationService],
})
export class VerificationModule {}
