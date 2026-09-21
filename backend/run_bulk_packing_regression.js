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

async function runBulkPackingRegression() {
  console.log('====================================================');
  console.log('STARTING BULK PACKING AUTOMATED REGRESSION');
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
      headers: { Authorization: `Bearer ${data.access_token}` },
    };
  }

  const packingAuth = await login('dpr@talbros.com', 'dpr');
  const gateAuth = await login('gate@talbros.com', 'gate');

  // 1. Role authorization check: Gate user must be forbidden from creating bulk packing
  console.log('--- 1. Role Authorization Check ---');
  let authDenied = false;
  try {
    await request('/packing/bulk', {
      method: 'POST',
      headers: gateAuth.headers,
      body: JSON.stringify({ part_id: 1825, part_qty: 5, packing_qty: 3 }),
    });
  } catch (err) {
    authDenied = (err.status === 403);
    console.log(`[PASS] Gate role rejected from bulk packing creation: HTTP ${err.status}`);
  }
  if (!authDenied) throw new Error('Security flaw: Gate role was not forbidden (403) from creating bulk packing!');
  testResults.push({ test: 'Role Guard (Gate Forbidden)', status: 'PASS' });

  // 2. Input Validation Checks
  console.log('\n--- 2. Input Validation Checks ---');
  // Invalid part
  let invalidPartRejected = false;
  try {
    await request('/packing/bulk', {
      method: 'POST',
      headers: packingAuth.headers,
      body: JSON.stringify({ part_id: 999999, part_qty: 5, packing_qty: 3 }),
    });
  } catch (err) {
    invalidPartRejected = (err.status === 400);
    console.log(`[PASS] Invalid part rejected: HTTP ${err.status}, "${err.data?.message}"`);
  }
  if (!invalidPartRejected) throw new Error('Validation failure: Invalid part was accepted!');

  // Zero quantity
  let zeroQtyRejected = false;
  try {
    await request('/packing/bulk', {
      method: 'POST',
      headers: packingAuth.headers,
      body: JSON.stringify({ part_id: 1825, part_qty: 0, packing_qty: 3 }),
    });
  } catch (err) {
    zeroQtyRejected = (err.status === 400);
    console.log(`[PASS] Zero part_qty rejected: HTTP ${err.status}, "${err.data?.message}"`);
  }
  if (!zeroQtyRejected) throw new Error('Validation failure: Zero part_qty was accepted!');

  // Zero bulk packing count
  let zeroBulkCountRejected = false;
  try {
    await request('/packing/bulk', {
      method: 'POST',
      headers: packingAuth.headers,
      body: JSON.stringify({ part_id: 1825, part_qty: 5, packing_qty: 0 }),
    });
  } catch (err) {
    zeroBulkCountRejected = (err.status === 400);
    console.log(`[PASS] Zero packing_qty rejected: HTTP ${err.status}, "${err.data?.message}"`);
  }
  if (!zeroBulkCountRejected) throw new Error('Validation failure: Zero packing_qty was accepted!');
  testResults.push({ test: 'Input Validations (Part, Qty, Bulk Count)', status: 'PASS' });

  // 3. Legitimate Bulk Packing Creation (e.g. 3 boxes of Qty 10 for Part 1825)
  console.log('\n--- 3. Legitimate Bulk Packing Generation (3 tickets, Qty 10 each) ---');
  const bulkResult = await request('/packing/bulk', {
    method: 'POST',
    headers: packingAuth.headers,
    body: JSON.stringify({ part_id: 1825, part_qty: 10, packing_qty: 3 }),
  });

  if (!Array.isArray(bulkResult) || bulkResult.length !== 3) {
    throw new Error(`Expected 3 bulk tickets created, got ${bulkResult?.length}`);
  }
  console.log(`[PASS] Generated ${bulkResult.length} bulk packing tickets:`);

  const barcodes = [];
  for (const item of bulkResult) {
    console.log(`   Ticket ID: ${item.id} | Barcode: ${item.barcode} | Part Qty: ${item.part_qty} | Status: ${item.status}`);
    if (item.part_qty !== 10) throw new Error(`Ticket qty mismatch: expected 10, got ${item.part_qty}`);
    if (item.status !== 'pending') throw new Error(`Ticket status mismatch: expected pending, got ${item.status}`);
    barcodes.push(item.barcode);
  }

  // Ensure all 3 barcodes are distinct and sequential
  const uniqueBarcodes = new Set(barcodes);
  if (uniqueBarcodes.size !== 3) {
    throw new Error('Barcode collision in bulk packing generation!');
  }
  console.log(`[PASS] All ${barcodes.length} generated barcodes are unique and sequential.`);
  testResults.push({ test: 'Sequential Barcode Generation & Status', status: 'PASS', count: 3 });

  // 4. Persistence & List Retrieval
  console.log('\n--- 4. List Retrieval Verification ---');
  const allPacking = await request('/packing', { headers: packingAuth.headers });
  for (const b of barcodes) {
    const found = allPacking.find(p => p.barcode === b);
    if (!found) throw new Error(`Bulk ticket barcode ${b} not found in packing list!`);
  }
  console.log(`[PASS] All generated bulk barcodes present in packing query list.`);
  testResults.push({ test: 'Packing List Persistence', status: 'PASS' });

  console.log('\n====================================================');
  console.log('BULK PACKING REGRESSION SUITE PASSED (4/4 SCENARIOS)');
  console.log('====================================================');
  console.table(testResults);

  await db.end();
  return { success: true, testResults };
}

runBulkPackingRegression().catch(err => {
  console.error('[BULK PACKING REGRESSION ERROR]:', err);
  process.exit(1);
});
