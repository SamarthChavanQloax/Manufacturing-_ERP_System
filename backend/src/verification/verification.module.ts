import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceBox, InvoiceMatch, InvoiceBoxMatch, Box, BoxPacking, Part } from '../entities';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

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
    ]),
  ],
  providers: [VerificationService],
  controllers: [VerificationController],
  exports: [VerificationService],
})
export class VerificationModule {}
