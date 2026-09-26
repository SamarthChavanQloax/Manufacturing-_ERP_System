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

@Entity('gate_risk_analysis')
export class GateRiskAnalysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  match_id: number;

  @Column({ type: 'varchar', length: 50 })
  invoice_barcode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  invoice_number: string;

  @Column({ type: 'int', nullable: true })
  customer_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_name: string;

  @Column({ type: 'int', nullable: true })
  part_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  part_number: string;

  @Column({ type: 'float', default: 0 })
  invoice_qty: number;

  @Column({ type: 'int', default: 0 })
  risk_score: number; // 0 to 100

  @Column({ type: 'varchar', length: 20, default: 'LOW' }) // 'LOW' | 'MEDIUM' | 'HIGH'
  risk_level: string;

  @Column({ type: 'text', nullable: true }) // JSON object with risk factor breakdown
  risk_factors: string;

  @Column({ type: 'text', nullable: true }) // JSON array of explainable reasons
  reasons: string;

  @Column({ type: 'text', nullable: true })
  recommendation: string;

  @Column({ type: 'text', nullable: true }) // JSON context metrics
  metrics: string;

  @Column({ type: 'varchar', length: 50, default: 'v1.0-explainable-heuristics' })
  model_version: string;

  @Column({ type: 'varchar', length: 30, default: 'not_required' }) // 'not_required' | 'pending_review' | 'reviewed'
  review_status: string;

  @Column({ type: 'int', nullable: true })
  reviewed_by: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewed_by_name: string;

  @Column({ type: 'datetime', nullable: true })
  review_timestamp: Date;

  @Column({ type: 'text', nullable: true })
  review_note: string;

  @Column({ type: 'varchar', length: 50, nullable: true }) // 'approved' | 'flagged' | 'rejected'
  review_decision: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

@Entity('gate_scan_log')
export class GateScanLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  match_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  invoice_barcode: string;

  @Column({ type: 'varchar', length: 50 })
  scanned_barcode: string;

  @Column({ type: 'varchar', length: 20 }) // 'invoice' | 'box'
  scan_type: string;

  @Column({ type: 'boolean', default: true })
  is_valid: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failure_reason: string;

  @Column({ type: 'int', nullable: true })
  user_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_name: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

@Entity('gate_risk_config')
export class GateRiskConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  config_key: string;

  @Column({ type: 'text' })
  config_value: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

@Entity('daily_security_briefing')
export class DailySecurityBriefing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true }) // YYYY-MM-DD
  briefing_date: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  generated_at: Date;

  @Column({ type: 'int', default: 0 })
  total_events: number;

  @Column({ type: 'int', default: 0 })
  normal_count: number;

  @Column({ type: 'int', default: 0 })
  high_priority_count: number;

  @Column({ type: 'int', default: 0 })
  medium_priority_count: number;

  @Column({ type: 'int', default: 0 })
  low_priority_count: number;

  @Column({ type: 'int', default: 0 })
  pending_reviews_count: number;

  @Column({ type: 'text', nullable: true })
  executive_summary: string;

  @Column({ type: 'longtext', nullable: true }) // JSON array of structured consolidated events
  events: string;

  @Column({ type: 'varchar', length: 30, default: 'generated' }) // 'generated' | 'reviewed'
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'system' })
  generated_by: string;

  @Column({ type: 'varchar', length: 50, default: 'v1.0-evidence-consolidator' })
  engine_version: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

@Entity('erp_notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  recipient_user_id: number;

  @Column({ type: 'varchar', length: 50, default: 'ALL' })
  recipient_role: string; // 'admin' | 'gate' | 'packing' | 'box' | 'invoice' | 'ALL'

  @Column({ type: 'varchar', length: 60 })
  type: string;

  @Column({ type: 'varchar', length: 20, default: 'INFO' })
  priority: string; // 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entity_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entity_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  action_url: string;

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON

  @Column({ type: 'varchar', length: 180, nullable: true })
  dedup_key: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'datetime', nullable: true })
  read_at: Date;

  @Column({ type: 'varchar', length: 30, default: 'OPEN' })
  lifecycle_status: string; // 'OPEN' | 'REVIEWED' | 'RESOLVED'

  @Column({ type: 'varchar', length: 255, nullable: true })
  resolved_by_name: string;

  @Column({ type: 'datetime', nullable: true })
  resolved_at: Date;

  @Column({ type: 'text', nullable: true })
  resolution_note: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date;
}


