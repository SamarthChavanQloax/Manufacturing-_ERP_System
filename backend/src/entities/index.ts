import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('userinfo')
export class UserInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  user_email: string;

  @Column({ type: 'varchar', length: 30 })
  type: string; // 'admin', 'packing', 'box', 'invoice', 'gate'

  @Column({ type: 'text', nullable: true })
  user_role: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_name: string;

  @Column({ type: 'text', nullable: true })
  user_password: string;

  @Column({ type: 'text', nullable: true })
  date: string;

  @Column({ type: 'text', nullable: true })
  time: string;

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  deleted: string;

  @Column({ type: 'varchar', length: 20, default: 'yes' })
  drawing_download: string;

  @Column({ type: 'varchar', length: 20, default: 'yes' })
  drawing_upload: string;
}

@Entity('parts')
export class Part {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  part_number: string;

  @Column({ type: 'text' })
  part_description: string;

  @Column({ type: 'float', default: 0 })
  qty: number;

  @Column({ type: 'int', default: 0 })
  customer_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  revision_date: string;

  @Column({ type: 'int', default: 0 })
  customer_part_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  revision_no: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  diagram: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  part_family: string;

  @Column({ type: 'int', default: 0 })
  created_id: number;

  @Column({ type: 'varchar', length: 255, default: '' })
  date: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  time: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'int', nullable: true })
  deleted: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  revision_remark: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  hsn_code: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  uom: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  safety_stock: string;
}

@Entity('customer')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  customer_name: string;

  @Column({ type: 'text', nullable: true })
  customer_image?: string;
}

@Entity('packing')
export class Packing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  barcode: string;

  @Column({ type: 'int' })
  part_id: number;

  @Column({ type: 'int' })
  part_qty: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  packing_details: Date;

  @Column({ type: 'varchar', length: 50, default: '' })
  packing_name: string;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar', length: 11 })
  created_time: string; // date string in legacy format e.g. YYYY-MM-DD

  @Column({ type: 'varchar', length: 11 })
  created_date: string; // time string in legacy format e.g. HH:MM:SS

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending' | 'used'
}

@Entity('box')
export class Box {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  barcode: string;

  @Column({ type: 'varchar', length: 20 })
  box_name: string; // stores part_number in legacy

  @Column({ type: 'varchar', length: 20, nullable: true })
  box_size: string;

  @Column({ type: 'int', nullable: true })
  customer_id: number;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar', length: 50 })
  created_date: string;

  @Column({ type: 'varchar', length: 50 })
  created_time: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending' | 'used'

  @Column({ type: 'varchar', length: 10, default: 'no' })
  lock_status: string; // 'no' | 'yes'
}

@Entity('box_packing')
export class BoxPacking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  box_id: number; // primary key of box

  @Column({ type: 'int' })
  pack_id: number; // barcode string/int of packing item

  @Column({ type: 'int' })
  part_id: number;

  @Column({ type: 'int' })
  part_qty: number;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar', length: 20 })
  created_date: string;

  @Column({ type: 'varchar', length: 20 })
  created_time: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending' | 'used'
}

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  barcode: string; // e.g. 300000

  @Column({ type: 'varchar', length: 20 })
  invoice_number: string;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar', length: 50 })
  created_date: string;

  @Column({ type: 'varchar', length: 50 })
  created_time: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending' | 'used'

  @Column({ type: 'varchar', length: 20, default: 'no' })
  lock_status: string; // 'no' | 'yes'

  @Column({ type: 'float' })
  qty: number;

  @Column({ type: 'int' })
  part_id: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status_new: string;
}

@Entity('invoice_box')
export class InvoiceBox {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  box_id: number; // stores box barcode e.g. 200000

  @Column({ type: 'int' })
  invoice_id: number; // id of invoice

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar', length: 20 })
  created_date: string;

  @Column({ type: 'varchar', length: 20 })
  created_time: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;
}

@Entity('invoice_match')
export class InvoiceMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 20 })
  invoice_number: string; // stores barcode of invoice e.g. 300000

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar', length: 50 })
  created_date: string;

  @Column({ type: 'varchar', length: 50 })
  created_time: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // 'pending' | 'verified'

  @Column({ type: 'float', nullable: true })
  total_stock: number;
}

@Entity('invoice_box_match')
export class InvoiceBoxMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  box_id: number; // box barcode

  @Column({ type: 'int' })
  invoice_id: number; // invoice barcode / id

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'varchar', length: 20 })
  created_date: string;

  @Column({ type: 'varchar', length: 20 })
  created_time: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;
}
