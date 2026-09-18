import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Box, BoxPacking, Packing, Part, Customer } from '../entities';
import { BoxesService } from './boxes.service';
import { BoxesController } from './boxes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Box, BoxPacking, Packing, Part, Customer])],
  providers: [BoxesService],
  controllers: [BoxesController],
  exports: [BoxesService],
})
export class BoxesModule {}
