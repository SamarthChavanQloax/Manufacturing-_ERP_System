import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PartsService } from './parts.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/parts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartsController {
  constructor(private partsService: PartsService) {}

  @Get()
  @Roles('admin', 'packing', 'box', 'invoice')
  async getAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partsService.findAll(search, Number(page) || 1, Number(limit) || 50);
  }

  @Get('simple')
  @Roles('admin', 'packing', 'box', 'invoice')
  async getSimple() {
    return this.partsService.getAllSimple();
  }

  @Get('stock')
  @Roles('admin', 'packing')
  async getStock(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partsService.getStockList(search, Number(page) || 1, Number(limit) || 50);
  }

  @Post()
  @Roles('admin')
  async create(@Body() body: { part_number: string; part_desc: string; qty: number }) {
    return this.partsService.create(body);
  }

  @Patch(':id')
  @Roles('admin', 'packing')
  async update(
    @Param('id') id: string,
    @Body() body: { part_number?: string; part_desc?: string; qty?: number },
  ) {
    return this.partsService.update(Number(id), body);
  }
}
