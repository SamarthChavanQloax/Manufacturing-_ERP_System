import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Part,
  Packing,
  Box,
  BoxPacking,
  Invoice,
  InvoiceBox,
  InvoiceMatch,
  InvoiceBoxMatch,
  Customer,
  UserInfo,
} from '../entities';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Part,
      Packing,
      Box,
      BoxPacking,
      Invoice,
      InvoiceBox,
      InvoiceMatch,
      InvoiceBoxMatch,
      Customer,
      UserInfo,
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}

