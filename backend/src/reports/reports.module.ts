import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceMatch, Invoice, InvoiceBox, Box, BoxPacking, Packing, Part } from '../entities';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceMatch,
      Invoice,
      InvoiceBox,
      Box,
      BoxPacking,
      Packing,
      Part,
    ]),
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
