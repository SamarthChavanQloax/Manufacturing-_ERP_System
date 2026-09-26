import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
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
  async create(@Body('customerName') customerName: string) {
    return this.customersService.create(customerName);
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id') id: number, @Body('customerName') customerName: string) {
    return this.customersService.update(id, customerName);
  }
}
