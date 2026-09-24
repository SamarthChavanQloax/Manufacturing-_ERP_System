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

async function runWorkflow() {
  console.log('====================================================');
  console.log('STARTING REAL 5-ROLE END-TO-END WORKFLOW VERIFICATION');
  console.log('Product: D16.064.34.0.PR (ID: 1825, S S JOINT)');
  console.log('Customer: Mahindra & Mahindra');
  console.log('Target Qty: 5 Pcs');
  console.log('====================================================\n');

  const testResults = [];
  const createdRecords = {};

  // Database connection for non-destructive pre/post checks
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'barcode',
    password: 'barcode',
    database: 'barcode',
  });

  // Helper login
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

  // ----------------------------------------------------
  // STEP 1: USER 1 — ADMIN
  // ----------------------------------------------------
  console.log('--- STEP 1: USER 1 — ADMIN (admin@admin.com) ---');
  const admin = await login('admin@admin.com', 'admin');
  console.log(`[PASS] Admin authenticated. Role: ${admin.user.type}, Name: ${admin.user.user_name}`);

  // Check Part Master
  const partsData = await request('/parts?search=D16.064.34.0.PR', { headers: admin.headers });
  const part1825 = partsData.items.find(p => p.id === 1825 || p.part_number.includes('D16.064.34.0.PR'));
  if (!part1825) throw new Error('Part D16.064.34.0.PR not found in Part Master!');
  console.log(`[PASS] Part Master verified: ID ${part1825.id}, Part No: "${part1825.part_number}", Desc: "${part1825.part_description}"`);

  // Check Customer Master
  const custData = await request('/customers', { headers: admin.headers });
  const custMahindra = custData.find(c => c.customer_name.toLowerCase().includes('mahindra'));
  if (!custMahindra) throw new Error('Customer Mahindra & Mahindra not found in Customer Master!');
  console.log(`[PASS] Customer Master verified: ID ${custMahindra.id}, Name: "${custMahindra.customer_name}"`);

  // Record Starting Stock
  const stockData = await request('/parts/stock?search=D16.064.34.0.PR', { headers: admin.headers });
  const startingStock = stockData.items[0] || {};
  console.log(`[INFO] Starting Part Stock for Part 1825: FG=${startingStock.fg_stock || 0}, Box=${startingStock.box_stock || 0}, Inv=${startingStock.inv_stock || 0}`);
  testResults.push({ step: '1. Admin Login & Master Verification', status: 'PASS' });

  // ----------------------------------------------------
  // STEP 2: USER 2 — PACKING / DPR
  // ----------------------------------------------------
  console.log('\n--- STEP 2: USER 2 — PACKING / DPR (dpr@talbros.com) ---');
  const packingUser = await login('dpr@talbros.com', 'dpr');
  console.log(`[PASS] Packing user authenticated. Role: ${packingUser.user.type}`);

  // Count existing packing records to verify barcode rule: 100000 + count
  const [packCountRows] = await db.query('SELECT COUNT(*) as cnt FROM packing');
  const expectedPackBarcode = String(100000 + packCountRows[0].cnt);

  // Create single packing record for Part 1825, Qty: 5
  const createdPacking = await request('/packing/single', {
    method: 'POST',
    headers: packingUser.headers,
    body: JSON.stringify({ part_id: 1825, part_qty: 5 }),
  });
  createdRecords.packing = createdPacking;
  console.log(`[PASS] Packing created: ID ${createdPacking.id}, Barcode: ${createdPacking.barcode}, Qty: ${createdPacking.part_qty}, Status: ${createdPacking.status}`);

  if (createdPacking.barcode !== expectedPackBarcode) {
    console.warn(`[WARN] Packing barcode was ${createdPacking.barcode}, expected ${expectedPackBarcode}`);
  }
  if (createdPacking.status !== 'pending') {
    throw new Error(`Expected packing status 'pending', got '${createdPacking.status}'`);
  }

  // View Packing verification
  const viewPackData = await request(`/packing/${createdPacking.id}`, { headers: packingUser.headers });
  console.log(`[PASS] View Packing By ID verified: Barcode=${viewPackData.barcode}, Part=${viewPackData.part_number}, Qty=${viewPackData.part_qty}`);
  testResults.push({ step: '2. Packing Creation & Barcode Generation', status: 'PASS', barcode: createdPacking.barcode });

  // ----------------------------------------------------
  // STEP 3: USER 3 — BOX / FGS
  // ----------------------------------------------------
  console.log('\n--- STEP 3: USER 3 — BOX / FGS (fgs@talbros.com) ---');
  const boxUser = await login('fgs@talbros.com', 'fgs');
  console.log(`[PASS] Box user authenticated. Role: ${boxUser.user.type}`);

  // Count existing box records to verify barcode rule: 200000 + count
  const [boxCountRows] = await db.query('SELECT COUNT(*) as cnt FROM box');
  const expectedBoxBarcode = String(200000 + boxCountRows[0].cnt);

  // Create Box for Part D16.064.34.0.PR, Customer Mahindra
  const createdBox = await request('/boxes', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({
      box_name: 'D16.064.34.0.PR',
      box_size: 'STANDARD',
      customer_id: custMahindra.id,
    }),
  });
  createdRecords.box = createdBox;
  console.log(`[PASS] Box created: ID ${createdBox.id}, Barcode: ${createdBox.barcode}, Box Name: "${createdBox.box_name}", Lock Status: ${createdBox.lock_status}`);

  // NEGATIVE TEST: Attempt to lock empty box before adding packing
  console.log('\n   [NEGATIVE SUB-TEST] Attempting to lock empty box...');
  let emptyBoxLockRejected = false;
  try {
    await request('/boxes/lock', {
      method: 'POST',
      headers: boxUser.headers,
      body: JSON.stringify({ box_id: createdBox.id }),
    });
  } catch (err) {
    emptyBoxLockRejected = true;
    console.log(`   [PASS] Empty box lock correctly REJECTED by server: HTTP ${err.status}, Message: "${err.data?.message}"`);
  }
  if (!emptyBoxLockRejected) {
    throw new Error('FAILED: Empty box was locked without packing items!');
  }

  // Add packing item to box
  console.log('\n   Adding packing item to box...');
  const addPackData = await request('/boxes/add-packing', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({
      box_id: createdBox.id,
      pack_id: createdPacking.barcode,
      packing_barcode: createdPacking.barcode,
    }),
  });
  console.log(`[PASS] Packing added to box: "${addPackData.message}"`);

  // Verify Box detail before lock
  const boxDetailBeforeLock = await request(`/boxes/${createdBox.id}`, { headers: boxUser.headers });
  console.log(`[PASS] Box state before lock: Total Qty=${boxDetailBeforeLock.total_part_qty}, Items Count=${boxDetailBeforeLock.items.length}, Lock=${boxDetailBeforeLock.box.lock_status}`);
  if (boxDetailBeforeLock.total_part_qty !== 5) {
    throw new Error(`Expected Box Total Qty 5, got ${boxDetailBeforeLock.total_part_qty}`);
  }

  // Lock Box
  console.log('   Locking box...');
  const lockBoxData = await request('/boxes/lock', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({ box_id: createdBox.id }),
  });
  console.log(`[PASS] Lock Box response: "${lockBoxData.message}", lock_status: ${lockBoxData.lock_status}`);

  // Verify Box detail AFTER lock (CRITICAL CHECK: items remain visible and qty does NOT become 0)
  const boxDetailAfterLock = await request(`/boxes/${createdBox.id}`, { headers: boxUser.headers });
  console.log(`[PASS] Box state after lock: Total Qty=${boxDetailAfterLock.total_part_qty}, Items Count=${boxDetailAfterLock.items.length}, Lock=${boxDetailAfterLock.box.lock_status}`);
  if (boxDetailAfterLock.total_part_qty !== 5) {
    throw new Error(`CRITICAL REGRESSION: Box Total Qty changed to ${boxDetailAfterLock.total_part_qty} after lock! Expected 5.`);
  }
  if (boxDetailAfterLock.items.length !== 1) {
    throw new Error(`CRITICAL REGRESSION: Packed items disappeared after lock!`);
  }
  testResults.push({ step: '3. Box Creation, Empty Lock Check & Packing Scan', status: 'PASS', box_barcode: createdBox.barcode });

  // ----------------------------------------------------
  // STEP 4: USER 4 — INVOICE / COMMERCIAL
  // ----------------------------------------------------
  console.log('\n--- STEP 4: USER 4 — INVOICE / COMMERCIAL (invoice@talbros.com) ---');
  const invoiceUser = await login('invoice@talbros.com', 'invoice');
  console.log(`[PASS] Invoice user authenticated. Role: ${invoiceUser.user.type}`);

  // Unique invoice number for retest
  const testInvNumber = `INV-RETEST-${Date.now().toString().slice(-6)}`;
  const createdInvoice = await request('/invoices', {
    method: 'POST',
    headers: invoiceUser.headers,
    body: JSON.stringify({
      invoice_number: testInvNumber,
      part_id: 1825,
      qty: 5,
    }),
  });
  createdRecords.invoice = createdInvoice;
  console.log(`[PASS] Invoice created: ID ${createdInvoice.id}, Invoice No: "${createdInvoice.invoice_number}", Barcode: ${createdInvoice.barcode}, Target Qty: ${createdInvoice.qty}`);

  // Add Box to Invoice
  console.log(`   Mapping Box ${createdBox.barcode} to Invoice ${createdInvoice.invoice_number}...`);
  const addBoxData = await request('/invoices/add-box', {
    method: 'POST',
    headers: invoiceUser.headers,
    body: JSON.stringify({
      invoice_id: createdInvoice.id,
      box_barcode: createdBox.barcode,
    }),
  });
  console.log(`[PASS] Box added to invoice: "${addBoxData.message}"`);

  // Verify Invoice detail before lock (5 / 5 target matched)
  const invDetailBeforeLock = await request(`/invoices/${createdInvoice.id}`, { headers: invoiceUser.headers });
  console.log(`[PASS] Invoice state before lock: Total Packed=${invDetailBeforeLock.total_part_qty} / Target=${invDetailBeforeLock.invoice.qty}, Mapped Boxes=${invDetailBeforeLock.boxes.length}`);
  if (invDetailBeforeLock.total_part_qty !== 5) {
    throw new Error(`Expected Invoice Total Qty 5, got ${invDetailBeforeLock.total_part_qty}`);
  }

  // Lock Invoice
  console.log('   Locking invoice...');
  const lockInvData = await request('/invoices/lock', {
    method: 'POST',
    headers: invoiceUser.headers,
    body: JSON.stringify({ invoice_id: createdInvoice.id }),
  });
  console.log(`[PASS] Lock Invoice response: "${lockInvData.message}", lock_status: ${lockInvData.lock_status}`);

  // Verify Invoice detail AFTER lock (mapped boxes remain visible, lock_status = yes)
  const invDetailAfterLock = await request(`/invoices/${createdInvoice.id}`, { headers: invoiceUser.headers });
  console.log(`[PASS] Invoice state after lock: Lock=${invDetailAfterLock.invoice.lock_status}, Total Packed=${invDetailAfterLock.total_part_qty} / Target=${invDetailAfterLock.invoice.qty}, Mapped Boxes=${invDetailAfterLock.boxes.length}`);
  if (invDetailAfterLock.invoice.lock_status !== 'yes') {
    throw new Error('Expected Invoice lock_status to be "yes"!');
  }
  if (invDetailAfterLock.boxes.length !== 1) {
    throw new Error('CRITICAL: Mapped boxes disappeared from invoice after locking!');
  }
  testResults.push({ step: '4. Invoice Creation, Box Mapping & Lock Invoice', status: 'PASS', invoice_number: testInvNumber });

  // ----------------------------------------------------
  // STEP 5: USER 5 — GATE
  // ----------------------------------------------------
  console.log('\n--- STEP 5: USER 5 — GATE (gate@talbros.com) ---');
  const gateUser = await login('gate@talbros.com', 'gate');
  console.log(`[PASS] Gate user authenticated. Role: ${gateUser.user.type}`);

  // Start verification by scanning invoice barcode
  console.log(`   Initiating gate verification for invoice barcode: ${createdInvoice.barcode}...`);
  const invoiceMatch = await request('/verification/start', {
    method: 'POST',
    headers: gateUser.headers,
    body: JSON.stringify({ invoice_barcode: createdInvoice.barcode }),
  });
  createdRecords.invoice_match = invoiceMatch;
  console.log(`[PASS] Gate verification started: invoice_match ID ${invoiceMatch.id}, Invoice No: "${invoiceMatch.invoice_number}", Status: ${invoiceMatch.status}`);

  // Get verification detail
  const verifyDetail = await request(`/verification/${invoiceMatch.id}`, { headers: gateUser.headers });
  console.log(`[PASS] Verification detail loaded: Pending Boxes=${verifyDetail.expected_boxes?.length || 0}`);

  // Scan physical box barcode
  console.log(`   Scanning physical box barcode: ${createdBox.barcode}...`);
  const scanBoxData = await request('/verification/scan-box', {
    method: 'POST',
    headers: gateUser.headers,
    body: JSON.stringify({
      match_id: invoiceMatch.id,
      box_barcode: createdBox.barcode,
    }),
  });
  console.log(`[PASS] Box scanned at gate: matched=${scanBoxData.matched}, completed=${scanBoxData.completed}, remaining=${scanBoxData.remaining}`);
  if (!scanBoxData.matched) {
    throw new Error('Box barcode failed to match at gate!');
  }
  if (!scanBoxData.completed) {
    throw new Error('Gate verification not marked completed after scanning all mapped boxes!');
  }

  // Verify clearance code format: ${invoice_number}4000${invoice_match.id}
  const expectedClearanceCode = `${createdInvoice.invoice_number}4000${invoiceMatch.id}`;
  const actualClearanceCode = scanBoxData.clearance_code;
  console.log(`[PASS] Gate Clearance Code: "${actualClearanceCode}" (Expected: "${expectedClearanceCode}")`);
  if (actualClearanceCode !== expectedClearanceCode) {
    throw new Error(`Clearance code mismatch! Got "${actualClearanceCode}", expected "${expectedClearanceCode}"`);
  }

  // Verify Gate-Out Report
  console.log('\n   Verifying Gate-Out Report...');
  const reportData = await request('/reports/gate-out', { headers: gateUser.headers });
  const completedReportItem = reportData.find(r => r.gateout_code === expectedClearanceCode || r.invoice_number === createdInvoice.invoice_number);
  if (!completedReportItem) {
    throw new Error('Completed transaction not found in Gate-Out Report!');
  }
  console.log(`[PASS] Gate-Out Report Record Verified:`);
  console.log(`       Invoice No: ${completedReportItem.invoice_number}`);
  console.log(`       Part Code:  ${completedReportItem.part_number}`);
  console.log(`       Part Desc:  ${completedReportItem.part_description}`);
  console.log(`       Qty:        ${completedReportItem.qty}`);
  console.log(`       Gateout:    ${completedReportItem.gateout_code}`);
  console.log(`       Date/Time:  ${completedReportItem.created_date}`);
  testResults.push({ step: '5. Gate Physical Box Scan, Clearance & Report', status: 'PASS', clearance_code: actualClearanceCode });

  // ----------------------------------------------------
  // STOCK CHECK POST-WORKFLOW
  // ----------------------------------------------------
  console.log('\n--- STOCK CHECK POST-WORKFLOW ---');
  const stockDataPost = await request('/parts/stock?search=D16.064.34.0.PR', { headers: admin.headers });
  const endingStock = stockDataPost.items[0] || {};
  console.log(`[INFO] Ending Part Stock for Part 1825: FG=${endingStock.fg_stock || 0}, Box=${endingStock.box_stock || 0}, Inv=${endingStock.inv_stock || 0}`);

  const transactionSummary = {
    runId: `RETEST-${Date.now()}`,
    timestamp: new Date().toISOString(),
    partId: 1825,
    partNumber: 'D16.064.34.0.PR',
    customerId: custMahindra.id,
    customerName: custMahindra.customer_name,
    packingId: createdPacking.id,
    packingBarcode: createdPacking.barcode,
    boxId: createdBox.id,
    boxBarcode: createdBox.barcode,
    invoiceId: createdInvoice.id,
    invoiceNumber: createdInvoice.invoice_number,
    invoiceBarcode: createdInvoice.barcode,
    matchId: invoiceMatch.id,
    clearanceCode: actualClearanceCode,
    startingStock,
    endingStock,
  };
  fs.writeFileSync(
    path.join(__dirname, 'latest_retest_transaction.json'),
    JSON.stringify(transactionSummary, null, 2)
  );
  console.log(`[PASS] Saved fresh retest transaction to latest_retest_transaction.json`);

  console.log('\n====================================================');
  console.log('ALL 5 USER ROLES EXECUTED AND PASSED END-TO-END!');
  console.log('====================================================');
  console.table(testResults);

  await db.end();
  return { success: true, testResults, createdRecords, transactionSummary };
}

runWorkflow().catch((err) => {
  console.error('\n[FATAL ERROR IN WORKFLOW]:', err.data || err.message);
  process.exit(1);
});
