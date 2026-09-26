import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Part, Invoice } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Part, Invoice])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
