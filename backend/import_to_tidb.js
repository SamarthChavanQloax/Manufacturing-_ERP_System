const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
  console.log('--- TiDB Cloud Database Importer ---');
  
  const password = process.argv[2] || process.env.TIDB_PASS || await question('Enter your TiDB root password: ');
  rl.close();

  if (!password) {
    console.error('Password cannot be empty.');
    process.exit(1);
  }

  const host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
  const port = 4000;
  const user = '47powb9yBKwu1am.root';
  const dbName = 'barcode';

  console.log(`\nConnecting to TiDB cluster (${host})...`);

  // Connect to server (without specific DB first to create it if needed)
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    },
    multipleStatements: true
  });

  console.log('Connected successfully!');

  // Create database barcode if it does not exist
  console.log(`Creating database \`${dbName}\` if not exists...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.query(`USE \`${dbName}\`;`);

  // Read Dump20260919.sql
  const sqlPath = path.resolve(__dirname, '../Dump20260919.sql');
  console.log(`Reading SQL file from: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Importing tables and data into TiDB... This may take a few seconds.');
  await connection.query(sql);

  console.log('\n SUCCESS! Dump imported successfully.');
  
  // Verify tables
  const [rows] = await connection.query('SHOW TABLES;');
  console.log(`Imported ${rows.length} tables:`, rows.map(r => Object.values(r)[0]).join(', '));

  await connection.end();
  console.log('\nDatabase is ready for hosting!');
}

run().catch((err) => {
  console.error('\n Import failed:', err.message);
  process.exit(1);
});
