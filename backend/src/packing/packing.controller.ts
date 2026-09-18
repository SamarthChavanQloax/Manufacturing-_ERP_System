import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PackingService } from './packing.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/packing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackingController {
  constructor(private packingService: PackingService) {}

  @Post('single')
  @Roles('admin', 'packing')
  async createSingle(
    @Body() body: { part_id: number; part_qty: number },
    @Request() req: any,
  ) {
    return this.packingService.createSingle(Number(body.part_id), Number(body.part_qty), req.user.userId);
  }

  @Post('bulk')
  @Roles('admin', 'packing')
  async createBulk(
    @Body() body: { part_id: number; part_qty: number; packing_qty: number },
    @Request() req: any,
  ) {
    return this.packingService.createBulk(
      Number(body.part_id),
      Number(body.part_qty),
      Number(body.packing_qty),
      req.user.userId,
    );
  }

  @Get()
  @Roles('admin', 'packing')
  async getAll(
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ) {
    return this.packingService.findAll(fromDate, toDate);
  }

  @Get(':id')
  @Roles('admin', 'packing')
  async getOne(@Param('id') id: string) {
    return this.packingService.findOne(Number(id));
  }

  @Delete(':id')
  @Roles('admin', 'packing')
  async delete(@Param('id') id: string) {
    return this.packingService.delete(Number(id));
  }
}
