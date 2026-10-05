import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Packing, Part } from '../entities';
import { PackingService } from './packing.service';
import { PackingController } from './packing.controller';

import { PartsModule } from '../parts/parts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Packing, Part]), PartsModule],
  providers: [PackingService],
  controllers: [PackingController],
  exports: [PackingService],
})
export class PackingModule {}
