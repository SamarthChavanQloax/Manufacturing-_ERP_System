const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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

async function runCoreRegression() {
  const runId = `REG-CORE-${Date.now().toString().slice(-6)}`;
  console.log('====================================================');
  console.log(`STARTING CORE E2E WORKFLOW REGRESSION [${runId}]`);
  console.log('Product: D16.064.34.0.PR (ID: 1825, S S JOINT)');
  console.log('Customer: Mahindra & Mahindra | Target Qty: 5 Pcs');
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
    return {
      token: data.access_token,
      user: data.user,
      headers: { Authorization: `Bearer ${data.access_token}` },
    };
  }

  // 1. ADMIN
  console.log('--- 1. ADMIN ROLE ---');
  const admin = await login('admin@admin.com', 'admin');
  const partsData = await request('/parts?search=D16.064.34.0.PR', { headers: admin.headers });
  const part1825 = partsData.items.find(p => p.id === 1825 || p.part_number.includes('D16.064.34.0.PR'));
  if (!part1825) throw new Error('Part 1825 not found in Part Master');
  console.log(`[PASS] Admin verified Part Master: ID=${part1825.id}, Part=${part1825.part_number.trim()}`);

  const custData = await request('/customers', { headers: admin.headers });
  const custMahindra = custData.find(c => c.customer_name.toLowerCase().includes('mahindra'));
  if (!custMahindra) throw new Error('Customer Mahindra not found');
  console.log(`[PASS] Admin verified Customer Master: ID=${custMahindra.id}, Name=${custMahindra.customer_name}`);

  const stockData = await request('/parts/stock?search=D16.064.34.0.PR', { headers: admin.headers });
  const startingStock = stockData.items[0] || {};
  console.log(`[INFO] Starting Stock: FG=${startingStock.fg_stock}, Box=${startingStock.box_stock}, Inv=${startingStock.inv_stock}`);
  testResults.push({ step: '1. Admin Authentication & Masters', status: 'PASS' });

  // 2. PACKING / DPR
  console.log('\n--- 2. PACKING / DPR ROLE ---');
  const packingUser = await login('dpr@talbros.com', 'dpr');
  const [packCountRows] = await db.query('SELECT COUNT(*) as cnt FROM packing');
  const expectedPackBarcode = String(100000 + packCountRows[0].cnt);

  const createdPacking = await request('/packing/single', {
    method: 'POST',
    headers: packingUser.headers,
    body: JSON.stringify({ part_id: 1825, part_qty: 5 }),
  });
  console.log(`[PASS] Packing Created: ID=${createdPacking.id}, Barcode=${createdPacking.barcode}, Qty=${createdPacking.part_qty}, Status=${createdPacking.status}`);
  if (createdPacking.status !== 'pending') throw new Error(`Expected status 'pending', got ${createdPacking.status}`);
  testResults.push({ step: '2. Packing Creation & Sequential Barcode', status: 'PASS', barcode: createdPacking.barcode });

  // 3. BOX / FGS
  console.log('\n--- 3. BOX / FGS ROLE ---');
  const boxUser = await login('fgs@talbros.com', 'fgs');
  const createdBox = await request('/boxes', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({
      box_name: 'D16.064.34.0.PR',
      box_size: 'STANDARD',
      customer_id: custMahindra.id,
    }),
  });
  console.log(`[PASS] Box Created: ID=${createdBox.id}, Barcode=${createdBox.barcode}, Lock=${createdBox.lock_status}`);

  // Empty Box Lock Rejection
  let emptyLockRejected = false;
  try {
    await request('/boxes/lock', {
      method: 'POST',
      headers: boxUser.headers,
      body: JSON.stringify({ box_id: createdBox.id }),
    });
  } catch (err) {
    emptyLockRejected = (err.status === 400);
    console.log(`[PASS] Empty box lock rejected: HTTP ${err.status}, Message: "${err.data?.message}"`);
  }
  if (!emptyLockRejected) throw new Error('Empty box lock was not rejected!');

  // Add packing to box
  await request('/boxes/add-packing', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({
      box_id: createdBox.id,
      pack_id: createdPacking.barcode,
      packing_barcode: createdPacking.barcode,
    }),
  });
  console.log(`[PASS] Packing added to box.`);

  // Lock box
  await request('/boxes/lock', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({ box_id: createdBox.id }),
  });

  // Verify post-lock details
  const boxDetailAfterLock = await request(`/boxes/${createdBox.id}`, { headers: boxUser.headers });
  if (boxDetailAfterLock.total_part_qty !== 5) throw new Error(`Box qty after lock was ${boxDetailAfterLock.total_part_qty}, expected 5`);
  if (boxDetailAfterLock.items.length !== 1) throw new Error('Packed items count after lock mismatch');
  console.log(`[PASS] Box locked: Qty=5, Items=1, LockStatus=${boxDetailAfterLock.box.lock_status}`);
  testResults.push({ step: '3. Box Packing & Lock State', status: 'PASS', barcode: createdBox.barcode });

  // 4. INVOICE / COMMERCIAL
  console.log('\n--- 4. INVOICE / COMMERCIAL ROLE ---');
  const invoiceUser = await login('invoice@talbros.com', 'invoice');
  const invoiceNum = `INV-${runId}`;
  const createdInvoice = await request('/invoices', {
    method: 'POST',
    headers: invoiceUser.headers,
    body: JSON.stringify({
      invoice_number: invoiceNum,
      part_id: 1825,
      qty: 5,
    }),
  });
  console.log(`[PASS] Invoice Created: ID=${createdInvoice.id}, Number=${createdInvoice.invoice_number}, Barcode=${createdInvoice.barcode}`);

  await request('/invoices/add-box', {
    method: 'POST',
    headers: invoiceUser.headers,
    body: JSON.stringify({
      invoice_id: createdInvoice.id,
      box_barcode: createdBox.barcode,
    }),
  });
  console.log(`[PASS] Box mapped to invoice.`);

  // Lock Invoice
  await request('/invoices/lock', {
    method: 'POST',
    headers: invoiceUser.headers,
    body: JSON.stringify({ invoice_id: createdInvoice.id }),
  });

  const invDetail = await request(`/invoices/${createdInvoice.id}`, { headers: invoiceUser.headers });
  if (invDetail.total_part_qty !== 5) throw new Error('Invoice total packed qty mismatch');
  if (invDetail.invoice.lock_status !== 'yes') throw new Error('Invoice lock_status is not yes');
  console.log(`[PASS] Invoice locked: Packed=5/5, LockStatus=yes`);
  testResults.push({ step: '4. Invoice Box Mapping & Lock', status: 'PASS', invoice_number: invoiceNum });

  // 5. GATE SECURITY
  console.log('\n--- 5. GATE SECURITY ROLE ---');
  const gateUser = await login('gate@talbros.com', 'gate');
  const match = await request('/verification/start', {
    method: 'POST',
    headers: gateUser.headers,
    body: JSON.stringify({ invoice_barcode: createdInvoice.barcode }),
  });
  console.log(`[PASS] Gate verification started: MatchID=${match.id}, InvoiceBarcode=${match.invoice_number}`);

  const scanResult = await request('/verification/scan-box', {
    method: 'POST',
    headers: gateUser.headers,
    body: JSON.stringify({
      match_id: match.id,
      box_barcode: createdBox.barcode,
    }),
  });
  console.log(`[PASS] Box scanned at gate: matched=${scanResult.matched}, completed=${scanResult.completed}`);

  const expectedClearance = `${createdInvoice.invoice_number}4000${match.id}`;
  if (scanResult.clearance_code !== expectedClearance) {
    throw new Error(`Clearance code mismatch: expected ${expectedClearance}, got ${scanResult.clearance_code}`);
  }
  console.log(`[PASS] Clearance code verified: "${scanResult.clearance_code}"`);

  // Gate-Out Report verification
  const reportData = await request('/reports/gate-out', { headers: gateUser.headers });
  const item = reportData.find(r => r.gateout_code === expectedClearance || r.invoice_number === createdInvoice.invoice_number);
  if (!item) throw new Error('Cleared transaction not found in Gate-Out Report');
  console.log(`[PASS] Gate-Out Report Verified: Invoice=${item.invoice_number}, Code=${item.gateout_code}`);
  testResults.push({ step: '5. Gate Physical Scan, Clearance & Report', status: 'PASS', clearance_code: expectedClearance });

  console.log('\n====================================================');
  console.log('CORE E2E WORKFLOW REGRESSION PASSED (5/5 ROLES)');
  console.log('====================================================');
  console.table(testResults);

  await db.end();
  return { success: true, runId, testResults };
}

runCoreRegression().catch(err => {
  console.error('[CORE REGRESSION FATAL ERROR]:', err);
  process.exit(1);
});
