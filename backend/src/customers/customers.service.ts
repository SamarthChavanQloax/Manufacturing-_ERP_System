import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return this.customerRepo.find({ order: { id: 'ASC' } });
  }

  async create(customerName: string): Promise<Customer> {
    if (!customerName || !customerName.trim()) {
      throw new BadRequestException('Customer Name is required');
    }
    const customer = this.customerRepo.create({
      customer_name: customerName.trim(),
    });
    return this.customerRepo.save(customer);
  }

  async update(id: number, customerName: string): Promise<Customer> {
    if (!customerName || !customerName.trim()) {
      throw new BadRequestException('Customer Name is required');
    }
    const customer = await this.customerRepo.findOne({ where: { id: Number(id) } });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }
    customer.customer_name = customerName.trim();
    return this.customerRepo.save(customer);
  }
}
