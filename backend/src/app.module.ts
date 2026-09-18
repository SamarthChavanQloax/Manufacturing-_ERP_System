import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import {
  UserInfo,
  Part,
  Customer,
  Packing,
  Box,
  BoxPacking,
  Invoice,
  InvoiceBox,
  InvoiceMatch,
  InvoiceBoxMatch,
} from './entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PartsModule } from './parts/parts.module';
import { CustomersModule } from './customers/customers.module';
import { PackingModule } from './packing/packing.module';
import { BoxesModule } from './boxes/boxes.module';
import { InvoicesModule } from './invoices/invoices.module';
import { VerificationModule } from './verification/verification.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Outlook@123',
      database: process.env.DB_NAME || 'barcode',
      entities: [
        UserInfo,
        Part,
        Customer,
        Packing,
        Box,
        BoxPacking,
        Invoice,
        InvoiceBox,
        InvoiceMatch,
        InvoiceBoxMatch,
      ],
      synchronize: false, // Do not alter the legacy database schema!
    }),
    AuthModule,
    UsersModule,
    PartsModule,
    CustomersModule,
    PackingModule,
    BoxesModule,
    InvoicesModule,
    VerificationModule,
    ReportsModule,
    DashboardModule,
  ],
})
export class AppModule {}
