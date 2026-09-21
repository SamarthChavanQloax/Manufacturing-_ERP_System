import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Box, BoxPacking, Packing, Part, Customer } from '../entities';

@Injectable()
export class BoxesService {
  constructor(
    @InjectRepository(Box)
    private boxRepo: Repository<Box>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  private getLegacyDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    return { dateStr, timeStr };
  }

  async create(data: { box_name: string; customer_id?: number; box_size?: string }, userId: number) {
    if (!data.box_name) throw new BadRequestException('Box/Part Name is required');

    const count = await this.boxRepo.count();
    const barcode = String(200000 + count);
    const { dateStr, timeStr } = this.getLegacyDateTime();

    const box = this.boxRepo.create({
      barcode,
      box_name: data.box_name,
      box_size: data.box_size || null,
      customer_id: data.customer_id || null,
      created_by: userId,
      created_date: timeStr,
      created_time: dateStr,
      status: 'pending',
      lock_status: 'no',
    });

    return this.boxRepo.save(box);
  }

  async findAll(fromDate?: string, toDate?: string) {
    let query = this.boxRepo.createQueryBuilder('b');

    if (fromDate && toDate) {
      query = query.where('b.created_time >= :fromDate AND b.created_time <= :toDate', {
        fromDate,
        toDate,
      });
    }

    const boxes = await query.orderBy('b.id', 'DESC').getMany();

    // Calculate part_qty for each box from box_packing
    const result = await Promise.all(
      boxes.map(async (box) => {
        const boxPackings = await this.boxPackingRepo.find({
          where: [{ box_id: box.id }, { box_id: Number(box.barcode) }],
        });
        let totalPartQty = 0;
        for (const bp of boxPackings) {
          totalPartQty += bp.part_qty || 0;
        }
        return {
          ...box,
          part_qty: totalPartQty,
        };
      }),
    );

    return result;
  }

  async findOne(id: number) {
    // Support lookup by either database ID or box barcode
    let box = await this.boxRepo.findOne({ where: { id } });
    if (!box && id >= 200000) {
      box = await this.boxRepo.findOne({ where: { barcode: String(id) } });
    }
    if (!box) throw new NotFoundException('Box not found');

    const customer = box.customer_id
      ? await this.customerRepo.findOne({ where: { id: box.customer_id } })
      : null;

    const boxPackings = await this.boxPackingRepo.find({
      where: [{ box_id: box.id }, { box_id: Number(box.barcode) }],
    });
    let totalPartQty = 0;
    const items: any[] = [];

    for (const bp of boxPackings) {
      totalPartQty += bp.part_qty || 0;
      const part = await this.partRepo.findOne({ where: { id: bp.part_id } });
      items.push({
        ...bp,
        part_number: (part?.part_number || '').trim(),
        part_description: part?.part_description || '',
      });
    }

    return {
      box: {
        ...box,
        box_name: (box.box_name || '').trim(),
      },
      customer,
      total_part_qty: totalPartQty,
      items,
    };
  }

  async addPackingToBox(boxId: number, packBarcode: string, userId: number) {
    let box = await this.boxRepo.findOne({ where: { id: boxId } });
    if (!box && boxId >= 200000) {
      box = await this.boxRepo.findOne({ where: { barcode: String(boxId) } });
    }
    if (!box) throw new NotFoundException('Box not found');

    if (box.lock_status === 'yes') {
      throw new BadRequestException('Error: Box is already locked');
    }

    // Check packing barcode
    const cleanPackBarcode = String(packBarcode).trim();
    const packing = await this.packingRepo.findOne({
      where: { barcode: cleanPackBarcode, status: 'pending' },
    });
    if (!packing) {
      throw new BadRequestException('Error : Packing barcode not found or already used !!!!');
    }

    const part = await this.partRepo.findOne({ where: { id: packing.part_id } });
    if (!part) {
      throw new BadRequestException('Part record not found');
    }

    // Verify part matches box name (trimmed to avoid whitespace / tab discrepancies)
    if (box.box_name.trim() !== part.part_number.trim()) {
      throw new BadRequestException('Error : Part Id Not Matched !!!!');
    }

    const { dateStr, timeStr } = this.getLegacyDateTime();

    const boxPacking = this.boxPackingRepo.create({
      box_id: box.id,
      pack_id: Number(packing.barcode),
      part_id: part.id,
      part_qty: packing.part_qty,
      created_by: userId,
      created_date: dateStr,
      created_time: timeStr,
      status: 'pending', // Keeps 'pending' while inside the box (transitions to 'used' on invoice mapping)
    });

    await this.boxPackingRepo.save(boxPacking);

    // Update packing status to used
    packing.status = 'used';
    await this.packingRepo.save(packing);

    return { success: true, message: 'Added Successfully' };
  }

  async lockBox(boxId: number) {
    let box = await this.boxRepo.findOne({ where: { id: boxId } });
    if (!box && boxId >= 200000) {
      box = await this.boxRepo.findOne({ where: { barcode: String(boxId) } });
    }
    if (!box) throw new NotFoundException('Box not found');

    // Prevent locking an empty box
    const boxPackings = await this.boxPackingRepo.find({
      where: [{ box_id: box.id }, { box_id: Number(box.barcode) }],
    });
    if (!boxPackings || boxPackings.length === 0) {
      throw new BadRequestException('Error: Cannot lock an empty box! Please scan packing items first.');
    }

    box.lock_status = 'yes';
    await this.boxRepo.save(box);
    return { success: true, lock_status: 'yes', message: 'Box Locked Successfully' };
  }
}
