import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Packing, Part } from '../entities';

@Injectable()
export class PackingService {
  constructor(
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
  ) {}

  private getLegacyDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
    return { dateStr, timeStr };
  }

  async createSingle(partId: number, partQty: number, userId: number) {
    const part = await this.partRepo.findOne({ where: { id: partId } });
    if (!part) throw new BadRequestException('Part not found');
    if (!partQty || partQty <= 0) throw new BadRequestException('Invalid quantity');

    const availableStock = Number(part.qty) || 0;
    if (partQty > availableStock) {
      throw new BadRequestException(
        `You don't have enough stock! Available stock is ${availableStock}, but requested is ${partQty}.`
      );
    }

    const count = await this.packingRepo.count();
    const barcode = String(100000 + count);
    const { dateStr, timeStr } = this.getLegacyDateTime();

    const packing = this.packingRepo.create({
      barcode,
      part_id: partId,
      part_qty: partQty,
      created_by: userId,
      created_time: dateStr, // legacy stored date string here
      created_date: timeStr, // legacy stored time string here
      status: 'pending',
      packing_name: '',
    });

    const saved = await this.packingRepo.save(packing);

    // Deduct packed quantity from remaining part stock
    part.qty = Math.max(0, availableStock - partQty);
    await this.partRepo.save(part);

    return {
      ...saved,
      remaining_stock: part.qty,
      part_number: part.part_number,
      part_description: part.part_description,
    };
  }

  async createBulk(partId: number, partQty: number, packingQty: number, userId: number) {
    const part = await this.partRepo.findOne({ where: { id: partId } });
    if (!part) throw new BadRequestException('Part not found');
    if (!partQty || partQty <= 0) throw new BadRequestException('Invalid part quantity');
    if (!packingQty || packingQty <= 0) throw new BadRequestException('Invalid packing bulk quantity');

    const totalRequired = partQty * packingQty;
    const availableStock = Number(part.qty) || 0;
    if (totalRequired > availableStock) {
      throw new BadRequestException(
        `You don't have enough stock! Available stock is ${availableStock}, but requested is ${totalRequired} (${packingQty} items × ${partQty}).`
      );
    }

    const createdItems: any[] = [];
    const { dateStr, timeStr } = this.getLegacyDateTime();

    for (let i = 0; i < packingQty; i++) {
      const count = await this.packingRepo.count();
      const barcode = String(100000 + count);

      const item = this.packingRepo.create({
        barcode,
        part_id: partId,
        part_qty: partQty,
        created_by: userId,
        created_time: dateStr,
        created_date: timeStr,
        status: 'pending',
        packing_name: '',
      });

      const saved = await this.packingRepo.save(item);
      createdItems.push({
        ...saved,
        part_number: part.part_number,
        part_description: part.part_description,
      });
    }

    // Deduct bulk packed quantity from remaining part stock
    part.qty = Math.max(0, availableStock - totalRequired);
    await this.partRepo.save(part);

    return createdItems;
  }

  async findAll(fromDate?: string, toDate?: string) {
    let query = this.packingRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect(Part, 'part', 'part.id = p.part_id')
      .select([
        'p.id AS id',
        'p.barcode AS barcode',
        'p.part_id AS part_id',
        'p.part_qty AS part_qty',
        'p.created_by AS created_by',
        'p.created_time AS created_time',
        'p.created_date AS created_date',
        'p.status AS status',
        'part.part_number AS part_number',
        'part.part_description AS part_description',
      ]);

    if (fromDate && toDate) {
      query = query.where('p.created_time >= :fromDate AND p.created_time <= :toDate', {
        fromDate,
        toDate,
      });
    }

    return query.orderBy('p.id', 'DESC').getRawMany();
  }

  async findOne(id: number) {
    const item: any = await this.packingRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect(Part, 'part', 'part.id = p.part_id')
      .select([
        'p.id AS id',
        'p.barcode AS barcode',
        'p.part_id AS part_id',
        'p.part_qty AS part_qty',
        'p.created_by AS created_by',
        'p.created_time AS created_time',
        'p.created_date AS created_date',
        'p.status AS status',
        'part.part_number AS part_number',
        'part.part_description AS part_description',
      ])
      .where('p.id = :id', { id })
      .getRawOne();

    if (!item) throw new NotFoundException('Packing record not found');
    const trimmedPartNumber = (item.part_number || '').trim();
    return {
      ...item,
      part_number: trimmedPartNumber,
      part: {
        id: item.part_id,
        part_number: trimmedPartNumber,
        part_description: item.part_description || '',
      },
    };
  }

  async delete(id: number) {
    const item = await this.packingRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Packing record not found');
    const part = await this.partRepo.findOne({ where: { id: item.part_id } });
    if (part) {
      part.qty = (Number(part.qty) || 0) + Number(item.part_qty || 0);
      await this.partRepo.save(part);
    }
    return this.packingRepo.delete(id);
  }
}
