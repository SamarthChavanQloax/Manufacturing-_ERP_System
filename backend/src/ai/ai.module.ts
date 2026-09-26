import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Part, Invoice, Box, Packing, UserInfo, InvoiceMatch } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Part, Invoice, Box, Packing, UserInfo, InvoiceMatch])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
