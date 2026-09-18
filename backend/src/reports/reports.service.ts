import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceMatch, Invoice, InvoiceBox, Box, BoxPacking, Packing, Part } from '../entities';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(InvoiceMatch)
    private invoiceMatchRepo: Repository<InvoiceMatch>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceBox)
    private invoiceBoxRepo: Repository<InvoiceBox>,
    @InjectRepository(Box)
    private boxRepo: Repository<Box>,
    @InjectRepository(BoxPacking)
    private boxPackingRepo: Repository<BoxPacking>,
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(Part)
    private partRepo: Repository<Part>,
  ) {}

  async getGateOutReport() {
    const matches = await this.invoiceMatchRepo.find({ order: { id: 'DESC' } });

    const rows: any[] = [];
    for (const match of matches) {
      // Find invoice by barcode
      const invoice = await this.invoiceRepo.findOne({
        where: { barcode: match.invoice_number },
      });

      let partNumber = '';
      let partDesc = '';
      let invoiceQty = 0;
      let invoiceNum = '';
      let gateoutCode = '';

      if (invoice) {
        invoiceNum = invoice.invoice_number;
        invoiceQty = invoice.qty;
        gateoutCode = `${invoice.invoice_number}4000${invoice.id}`;

        const invoiceBox = await this.invoiceBoxRepo.findOne({
          where: { invoice_id: invoice.id },
        });

        if (invoiceBox) {
          const box = await this.boxRepo.findOne({
            where: { barcode: String(invoiceBox.box_id) },
          });

          if (box) {
            const boxPacking = await this.boxPackingRepo.findOne({
              where: { box_id: box.id },
            });

            if (boxPacking) {
              const packing = await this.packingRepo.findOne({
                where: { barcode: String(boxPacking.pack_id) },
              });

              if (packing) {
                const part = await this.partRepo.findOne({
                  where: { id: packing.part_id },
                });
                if (part) {
                  partNumber = part.part_number;
                  partDesc = part.part_description;
                }
              }
            }
          }
        }

        // Fallback: If box/packing wasn't directly linked through chain, get part from invoice.part_id
        if (!partNumber && invoice.part_id) {
          const part = await this.partRepo.findOne({ where: { id: invoice.part_id } });
          if (part) {
            partNumber = part.part_number;
            partDesc = part.part_description;
          }
        }
      }

      rows.push({
        id: match.id,
        invoice_number: invoiceNum || match.invoice_number,
        part_number: partNumber,
        part_description: partDesc,
        qty: invoiceQty,
        gateout_code: gateoutCode,
        gateout_date: `${match.created_date}/${match.created_time}`,
      });
    }

    return rows;
  }
}
