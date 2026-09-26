import { DataSource } from 'typeorm';
import { Part, Invoice } from './src/entities';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Outlook@123',
  database: process.env.DB_NAME || 'barcode',
  entities: [Part, Invoice],
  synchronize: false,
});

async function run() {
  await AppDataSource.initialize();
  const invoices = await AppDataSource.getRepository(Invoice).find();
  console.log(`Found ${invoices.length} invoices.`);
  
  if (invoices.length > 0) {
    // update dates to yesterday
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const dateStr = today.toISOString().split('T')[0];
    
    await AppDataSource.createQueryBuilder()
      .update(Invoice)
      .set({ created_date: dateStr })
      .execute();
    console.log(`Updated all invoices to date ${dateStr}`);
  }
  
  const parts = await AppDataSource.getRepository(Part).find();
  console.log(`Found ${parts.length} parts.`);
  
  process.exit(0);
}

run();
