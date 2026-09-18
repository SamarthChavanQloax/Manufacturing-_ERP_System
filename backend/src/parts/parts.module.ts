import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Part, Packing, BoxPacking, Invoice } from '../entities';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Part, Packing, BoxPacking, Invoice])],
  providers: [PartsService],
  controllers: [PartsController],
  exports: [PartsService],
})
export class PartsModule {}
