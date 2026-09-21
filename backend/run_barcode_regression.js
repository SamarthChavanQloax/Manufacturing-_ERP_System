const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:5001/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runBarcodeRegression() {
  console.log('====================================================');
  console.log('STARTING BARCODE SEQUENCE & NUMBERING REGRESSION');
  console.log('Verifying 100000+, 200000+, 300000+, Clearance Code');
  console.log('====================================================\n');

  const testResults = [];
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'barcode',
    password: 'barcode',
    database: 'barcode',
  });

  async function login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user_email: email, user_password: password }),
    });
    return { headers: { Authorization: `Bearer ${data.access_token}` } };
  }

  const dpr = await login('dpr@talbros.com', 'dpr');
  const fgs = await login('fgs@talbros.com', 'fgs');
  const comm = await login('invoice@talbros.com', 'invoice');

  // 1. Check Packing Barcode Sequence (100000 + count)
  console.log('--- 1. Packing Barcode Sequence Rule (100000 + count) ---');
  const [packCount] = await db.query('SELECT COUNT(*) as cnt FROM packing');
  const expectedPackBarcode = String(100000 + packCount[0].cnt);

  const pack = await request('/packing/single', {
    method: 'POST',
    headers: dpr.headers,
    body: JSON.stringify({ part_id: 1825, part_qty: 1 }),
  });
  console.log(`[PASS] Packing Barcode generated: ${pack.barcode} (Expected: ${expectedPackBarcode})`);
  if (pack.barcode !== expectedPackBarcode) {
    throw new Error(`Packing barcode sequence mismatch! Got ${pack.barcode}, expected ${expectedPackBarcode}`);
  }
  testResults.push({ entity: 'Packing Barcode', rule: '100000 + count', generated: pack.barcode, status: 'PASS' });

  // 2. Check Box Barcode Sequence (200000 + count)
  console.log('\n--- 2. Box Barcode Sequence Rule (200000 + count) ---');
  const [boxCount] = await db.query('SELECT COUNT(*) as cnt FROM box');
  const expectedBoxBarcode = String(200000 + boxCount[0].cnt);

  const box = await request('/boxes', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_name: 'D16.064.34.0.PR', box_size: 'STD', customer_id: 1 }),
  });
  console.log(`[PASS] Box Barcode generated: ${box.barcode} (Expected: ${expectedBoxBarcode})`);
  if (box.barcode !== expectedBoxBarcode) {
    throw new Error(`Box barcode sequence mismatch! Got ${box.barcode}, expected ${expectedBoxBarcode}`);
  }
  testResults.push({ entity: 'Box Barcode', rule: '200000 + count', generated: box.barcode, status: 'PASS' });

  // 3. Check Invoice Barcode Sequence (300000 + count)
  console.log('\n--- 3. Invoice Barcode Sequence Rule (300000 + count) ---');
  const [invCount] = await db.query('SELECT COUNT(*) as cnt FROM invoice');
  const expectedInvBarcode = String(300000 + invCount[0].cnt);

  const inv = await request('/invoices', {
    method: 'POST',
    headers: comm.headers,
    body: JSON.stringify({ invoice_number: `INV-BC-${Date.now().toString().slice(-4)}`, part_id: 1825, qty: 1 }),
  });
  console.log(`[PASS] Invoice Barcode generated: ${inv.barcode} (Expected: ${expectedInvBarcode})`);
  if (inv.barcode !== expectedInvBarcode) {
    throw new Error(`Invoice barcode sequence mismatch! Got ${inv.barcode}, expected ${expectedInvBarcode}`);
  }
  testResults.push({ entity: 'Invoice Barcode', rule: '300000 + count', generated: inv.barcode, status: 'PASS' });

  // 4. Check Uniqueness of Generated Barcodes in Database
  console.log('\n--- 4. Uniqueness Collision Check for Generated Barcodes ---');
  const [packDupes] = await db.query('SELECT barcode, COUNT(*) as c FROM packing WHERE barcode = ? GROUP BY barcode HAVING c > 1', [pack.barcode]);
  const [boxDupes] = await db.query('SELECT barcode, COUNT(*) as c FROM box WHERE barcode = ? GROUP BY barcode HAVING c > 1', [box.barcode]);
  const [invDupes] = await db.query('SELECT barcode, COUNT(*) as c FROM invoice WHERE barcode = ? GROUP BY barcode HAVING c > 1', [inv.barcode]);

  if (packDupes.length > 0 || boxDupes.length > 0 || invDupes.length > 0) {
    throw new Error('Collision detected: Generated barcode was duplicated in database!');
  }
  console.log(`[PASS] Zero collisions detected for generated barcodes (${pack.barcode}, ${box.barcode}, ${inv.barcode}).`);
  testResults.push({ entity: 'Barcode Uniqueness Audit', rule: 'Unique Barcode Constraint', generated: '0 Collisions', status: 'PASS' });

  console.log('\n====================================================');
  console.log('BARCODE SEQUENCE REGRESSION PASSED (ALL RULES VALID)');
  console.log('====================================================');
  console.table(testResults);

  await db.end();
  return { success: true, testResults };
}

runBarcodeRegression().catch(err => {
  console.error('[BARCODE REGRESSION ERROR]:', err);
  process.exit(1);
});
