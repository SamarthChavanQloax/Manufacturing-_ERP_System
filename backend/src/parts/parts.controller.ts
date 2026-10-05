import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
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

  // Feature 2: Get History Log for a specific part
  @Get(':id/history')
  @Roles('admin', 'packing', 'box', 'invoice', 'gate')
  async getHistory(@Param('id') id: string) {
    return this.partsService.getPartHistory(Number(id));
  }

  // Feature 2 Flow 1: When adding a new part: Ask for all normal part details + supplier details
  @Post()
  @Roles('admin', 'packing')
  async create(
    @Body()
    body: {
      part_number: string;
      part_desc: string;
      qty: number;
      supplier_name?: string;
      supplier_contact?: string;
      supplier_invoice_no?: string;
      supplier_notes?: string;
    },
    @Req() req: any,
  ) {
    return this.partsService.create(body, req.user);
  }

  // Feature 2 Flow 2: When adding stock to an existing part: Only ask for quantity and supplier details
  @Post(':id/add-stock')
  @Roles('admin', 'packing')
  async addStock(
    @Param('id') id: string,
    @Body()
    body: {
      qty: number;
      supplier_name: string;
      supplier_contact?: string;
      supplier_invoice_no?: string;
      supplier_notes?: string;
    },
    @Req() req: any,
  ) {
    return this.partsService.addStock(Number(id), body, req.user);
  }

  // Manually mark stock as finished
  @Post(':id/mark-finished')
  @Roles('admin', 'packing')
  async markFinished(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    return this.partsService.markStockFinished(Number(id), req.user, body?.reason);
  }

  @Patch(':id')
  @Roles('admin', 'packing')
  async update(
    @Param('id') id: string,
    @Body() body: { part_number?: string; part_desc?: string; qty?: number },
    @Req() req: any,
  ) {
    return this.partsService.update(Number(id), body, req.user);
  }

  @Delete(':id')
  @Roles('admin', 'packing')
  async delete(
    @Param('id') id: string,
    @Query('force') force?: string,
  ) {
    return this.partsService.delete(Number(id), force === 'true');
  }
}
