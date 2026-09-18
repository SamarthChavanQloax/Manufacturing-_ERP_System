import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  @Roles('admin', 'invoice')
  async create(
    @Body() body: { invoice_number: string; part_id: number; qty: number },
    @Request() req: any,
  ) {
    return this.invoicesService.create(body, req.user.userId);
  }

  @Get()
  @Roles('admin', 'invoice')
  async getAll(
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ) {
    return this.invoicesService.findAll(fromDate, toDate);
  }

  @Get(':id')
  @Roles('admin', 'invoice')
  async getOne(@Param('id') id: string) {
    return this.invoicesService.findOne(Number(id));
  }

  @Post('add-box')
  @Roles('admin', 'invoice')
  async addBox(
    @Body() body: { invoice_id: number; box_id: string },
    @Request() req: any,
  ) {
    return this.invoicesService.addBoxToInvoice(Number(body.invoice_id), String(body.box_id), req.user.userId);
  }

  @Delete(':id')
  @Roles('admin', 'invoice')
  async delete(@Param('id') id: string) {
    return this.invoicesService.delete(Number(id));
  }
}
