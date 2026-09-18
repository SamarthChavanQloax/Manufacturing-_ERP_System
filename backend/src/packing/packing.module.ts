import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Packing, Part } from '../entities';
import { PackingService } from './packing.service';
import { PackingController } from './packing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Packing, Part])],
  providers: [PackingService],
  controllers: [PackingController],
  exports: [PackingService],
})
export class PackingModule {}
