import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Part, Packing, BoxPacking, Invoice, PartHistory, UserInfo } from '../entities';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Part, Packing, BoxPacking, Invoice, PartHistory, UserInfo]),
    NotificationsModule,
  ],
  providers: [PartsService],
  controllers: [PartsController],
  exports: [PartsService],
})
export class PartsModule {}

