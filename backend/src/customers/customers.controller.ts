import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @Roles('admin', 'box')
  async getAll() {
    return this.customersService.findAll();
  }

  @Post()
  @Roles('admin')
  async create(@Body() body: { customer_name?: string; customerName?: string }) {
    const name = body.customer_name || body.customerName || '';
    return this.customersService.create(name);
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() body: { customer_name?: string; customerName?: string; ucustomerName?: string },
  ) {
    const name = body.customer_name || body.customerName || body.ucustomerName || '';
    return this.customersService.update(parseInt(id, 10), name);
  }

  @Post(':id/update')
  @Roles('admin')
  async updatePost(
    @Param('id') id: string,
    @Body() body: { customer_name?: string; customerName?: string; ucustomerName?: string },
  ) {
    const name = body.customer_name || body.customerName || body.ucustomerName || '';
    return this.customersService.update(parseInt(id, 10), name);
  }
}
