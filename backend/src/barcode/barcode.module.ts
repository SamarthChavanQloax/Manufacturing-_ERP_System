import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarcodeService } from './barcode.service';
import { BarcodeController } from './barcode.controller';
import {
  Packing,
  Box,
  BoxPacking,
  Invoice,
  InvoiceBox,
  InvoiceMatch,
  Customer,
  Part,
  GateScanLog,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Packing,
      Box,
      BoxPacking,
      Invoice,
      InvoiceBox,
      InvoiceMatch,
      Customer,
      Part,
      GateScanLog,
    ]),
  ],
  controllers: [BarcodeController],
  providers: [BarcodeService],
  exports: [BarcodeService],
})
export class BarcodeModule {}
