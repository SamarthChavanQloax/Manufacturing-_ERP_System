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
import { AiModule } from './ai/ai.module';
import { HealthController } from './health/health.controller';

dotenv.config();

const isSslEnabled = process.env.DB_SSL === 'true';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || '127.0.0.1',
            port: Number(process.env.DB_PORT) || 3306,
            username: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'Outlook@123',
            database: process.env.DB_NAME || 'barcode',
          }),
      ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined,
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
    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
