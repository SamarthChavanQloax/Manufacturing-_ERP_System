import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Part, Packing, Box, Invoice, UserInfo } from '../entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(Box)
    private boxRepo: Repository<Box>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(UserInfo)
    private userRepo: Repository<UserInfo>,
  ) {}

  async getStats() {
    const partsCount = await this.partRepo.count();
    const packingCount = await this.packingRepo.count();
    const boxCount = await this.boxRepo.count();
    const invoiceCount = await this.invoiceRepo.count();
    const usersCount = await this.userRepo.count();

    return {
      // Exact legacy dashboard stat numbers from screenshot 02_admin_dashboard.png
      newOrders: 1501,
      bounceRate: '53%',
      userRegistrations: 44,
      uniqueVisitors: 65,
      // System active counts
      systemCounts: {
        parts: partsCount,
        packings: packingCount,
        boxes: boxCount,
        invoices: invoiceCount,
        users: usersCount,
      },
    };
  }
}
