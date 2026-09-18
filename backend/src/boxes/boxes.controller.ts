import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BoxesService } from './boxes.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/boxes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoxesController {
  constructor(private boxesService: BoxesService) {}

  @Post()
  @Roles('admin', 'box')
  async create(
    @Body() body: { box_name: string; customer_id?: number; box_size?: string },
    @Request() req: any,
  ) {
    return this.boxesService.create(body, req.user.userId);
  }

  @Get()
  @Roles('admin', 'box')
  async getAll(
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ) {
    return this.boxesService.findAll(fromDate, toDate);
  }

  @Get(':id')
  @Roles('admin', 'box')
  async getOne(@Param('id') id: string) {
    return this.boxesService.findOne(Number(id));
  }

  @Post('add-packing')
  @Roles('admin', 'box')
  async addPacking(
    @Body() body: { box_id: number; pack_id: string },
    @Request() req: any,
  ) {
    return this.boxesService.addPackingToBox(Number(body.box_id), String(body.pack_id), req.user.userId);
  }

  @Post('lock')
  @Roles('admin', 'box')
  async lockBox(@Body() body: { box_id: number }) {
    return this.boxesService.lockBox(Number(body.box_id));
  }
}
