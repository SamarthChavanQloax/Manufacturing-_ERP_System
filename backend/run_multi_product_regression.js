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

async function runMultiProductRegression() {
  console.log('====================================================');
  console.log('STARTING MULTI-PRODUCT & MULTI-BOX REGRESSION SUITE');
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

  const dpr = await login('dpr@talbros.com', 'dpr');
  const fgs = await login('fgs@talbros.com', 'fgs');
  const comm = await login('invoice@talbros.com', 'invoice');
  const gate = await login('gate@talbros.com', 'gate');

  // -----------------------------------------------------------------
  // SCENARIO 1: Different Part + Multiple Packing Items in ONE Box
  // Part 1: "436330" (GASKET FLEXOID)
  // Packing 1: Qty 12 | Packing 2: Qty 8 | Box Total = 20
  // -----------------------------------------------------------------
  console.log('--- SCENARIO 1: Multiple Packing Items Inside ONE Box (Part 1, Qty 12 + 8 = 20) ---');
  const pack1 = await request('/packing/single', {
    method: 'POST',
    headers: dpr.headers,
    body: JSON.stringify({ part_id: 1, part_qty: 12 }),
  });
  console.log(`[PASS] Pack 1 created: Barcode ${pack1.barcode}, Qty: 12`);

  const pack2 = await request('/packing/single', {
    method: 'POST',
    headers: dpr.headers,
    body: JSON.stringify({ part_id: 1, part_qty: 8 }),
  });
  console.log(`[PASS] Pack 2 created: Barcode ${pack2.barcode}, Qty: 8`);

  const box1 = await request('/boxes', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_name: '436330', box_size: 'STD', customer_id: 1 }),
  });

  await request('/boxes/add-packing', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_id: box1.id, pack_id: pack1.barcode, packing_barcode: pack1.barcode }),
  });

  await request('/boxes/add-packing', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_id: box1.id, pack_id: pack2.barcode, packing_barcode: pack2.barcode }),
  });

  await request('/boxes/lock', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_id: box1.id }),
  });

  const box1Detail = await request(`/boxes/${box1.id}`, { headers: fgs.headers });
  if (box1Detail.total_part_qty !== 20 || box1Detail.items.length !== 2) {
    throw new Error(`Box 1 aggregation error! Qty=${box1Detail.total_part_qty} (expected 20), items=${box1Detail.items.length} (expected 2)`);
  }
  console.log(`[PASS] Box 1 locked successfully: Total Qty=${box1Detail.total_part_qty} (accumulated 12+8), Items=${box1Detail.items.length}`);
  testResults.push({ test: 'Multiple Packing Items in Single Box (Part 1)', status: 'PASS', total_qty: 20 });

  // -----------------------------------------------------------------
  // SCENARIO 2: Single Invoice Requiring MULTIPLE BOXES (Part 2754, Qty 7 + 7 = 14)
  // Part 2754: "0904AP200010N" (HEAT SHIELD)
  // Target Invoice Qty = 14
  // Box A = 7 pcs | Box B = 7 pcs
  // -----------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Single Invoice Requiring Multiple Boxes (Part 2754, 2 Boxes of 7) ---');
  const packA = await request('/packing/single', {
    method: 'POST',
    headers: dpr.headers,
    body: JSON.stringify({ part_id: 2754, part_qty: 7 }),
  });
  const boxA = await request('/boxes', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_name: '0904AP200010N', box_size: 'STD', customer_id: 1 }),
  });
  await request('/boxes/add-packing', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_id: boxA.id, pack_id: packA.barcode, packing_barcode: packA.barcode }),
  });
  await request('/boxes/lock', { method: 'POST', headers: fgs.headers, body: JSON.stringify({ box_id: boxA.id }) });

  const packB = await request('/packing/single', {
    method: 'POST',
    headers: dpr.headers,
    body: JSON.stringify({ part_id: 2754, part_qty: 7 }),
  });
  const boxB = await request('/boxes', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_name: '0904AP200010N', box_size: 'STD', customer_id: 1 }),
  });
  await request('/boxes/add-packing', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_id: boxB.id, pack_id: packB.barcode, packing_barcode: packB.barcode }),
  });
  await request('/boxes/lock', { method: 'POST', headers: fgs.headers, body: JSON.stringify({ box_id: boxB.id }) });

  console.log(`[PASS] Created Box A (${boxA.barcode}, Qty 7) and Box B (${boxB.barcode}, Qty 7)`);

  // Create Invoice for Part 2754, target Qty 14
  const multiBoxInvNum = `INV-MULTI-${Date.now().toString().slice(-5)}`;
  const multiBoxInv = await request('/invoices', {
    method: 'POST',
    headers: comm.headers,
    body: JSON.stringify({ invoice_number: multiBoxInvNum, part_id: 2754, qty: 14 }),
  });

  // Map Box A (7 / 14)
  await request('/invoices/add-box', {
    method: 'POST',
    headers: comm.headers,
    body: JSON.stringify({ invoice_id: multiBoxInv.id, box_barcode: boxA.barcode }),
  });

  // Check intermediate state: Qty 7 / 14
  const invInter = await request(`/invoices/${multiBoxInv.id}`, { headers: comm.headers });
  console.log(`[PASS] After mapping Box A: Packed=${invInter.total_part_qty}/14, Boxes count=${invInter.boxes.length}`);
  if (invInter.total_part_qty !== 7) throw new Error('Intermediate invoice qty mismatch!');

  // Map Box B (14 / 14)
  await request('/invoices/add-box', {
    method: 'POST',
    headers: comm.headers,
    body: JSON.stringify({ invoice_id: multiBoxInv.id, box_barcode: boxB.barcode }),
  });

  const invFull = await request(`/invoices/${multiBoxInv.id}`, { headers: comm.headers });
  console.log(`[PASS] After mapping Box B: Packed=${invFull.total_part_qty}/14, Boxes count=${invFull.boxes.length}`);
  if (invFull.total_part_qty !== 14 || invFull.boxes.length !== 2) {
    throw new Error('Full invoice qty or boxes count mismatch!');
  }

  // Lock Invoice
  await request('/invoices/lock', {
    method: 'POST',
    headers: comm.headers,
    body: JSON.stringify({ invoice_id: multiBoxInv.id }),
  });
  console.log(`[PASS] Multi-box invoice locked successfully.`);
  testResults.push({ test: 'Multiple Boxes Mapped to One Invoice (Part 2754)', status: 'PASS', boxes: 2, total_qty: 14 });

  // -----------------------------------------------------------------
  // SCENARIO 3: Gate Verification with Multiple Physical Box Scans
  // -----------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Gate Verification for Multi-Box Invoice ---');
  const gateMatch = await request('/verification/start', {
    method: 'POST',
    headers: gate.headers,
    body: JSON.stringify({ invoice_barcode: multiBoxInv.barcode }),
  });

  // Scan first box (Box A)
  const scanA = await request('/verification/scan-box', {
    method: 'POST',
    headers: gate.headers,
    body: JSON.stringify({ match_id: gateMatch.id, box_barcode: boxA.barcode }),
  });
  console.log(`[PASS] Scanned Box A at gate: remaining boxes=${scanA.remaining}, completed=${scanA.completed}`);
  if (scanA.completed !== false || scanA.remaining !== 1) {
    throw new Error('Gate should NOT be completed after only 1 of 2 boxes scanned!');
  }

  // Scan second box (Box B)
  const scanB = await request('/verification/scan-box', {
    method: 'POST',
    headers: gate.headers,
    body: JSON.stringify({ match_id: gateMatch.id, box_barcode: boxB.barcode }),
  });
  console.log(`[PASS] Scanned Box B at gate: remaining boxes=${scanB.remaining}, completed=${scanB.completed}`);
  if (scanB.completed !== true || scanB.remaining !== 0) {
    throw new Error('Gate should be completed after both boxes scanned!');
  }

  const expectedGateOut = `${multiBoxInv.invoice_number}4000${gateMatch.id}`;
  if (scanB.clearance_code !== expectedGateOut) {
    throw new Error(`Clearance code mismatch! Got ${scanB.clearance_code}, expected ${expectedGateOut}`);
  }
  console.log(`[PASS] Multi-box gate clearance code generated: "${scanB.clearance_code}"`);
  testResults.push({ test: 'Multi-Box Gate Scanning & Clearance', status: 'PASS', clearance_code: expectedGateOut });

  // -----------------------------------------------------------------
  // SCENARIO 4: Cross-Product Mismatch Rejection
  // Attempt to map Box1 (Part 1) into an invoice created for Part 2754
  // -----------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Cross-Product Mismatch Rejection ---');
  const mismatchInv = await request('/invoices', {
    method: 'POST',
    headers: comm.headers,
    body: JSON.stringify({ invoice_number: `INV-MIS-${Date.now().toString().slice(-4)}`, part_id: 2754, qty: 20 }),
  });

  let mismatchRejected = false;
  try {
    await request('/invoices/add-box', {
      method: 'POST',
      headers: comm.headers,
      body: JSON.stringify({ invoice_id: mismatchInv.id, box_barcode: box1.barcode }),
    });
  } catch (err) {
    mismatchRejected = (err.status === 400);
    console.log(`[PASS] Cross-product box mapping rejected: HTTP ${err.status}, "${err.data?.message}"`);
  }
  if (!mismatchRejected) throw new Error('Cross-product box mapping was NOT rejected!');
  testResults.push({ test: 'Cross-Product Box Mismatch Rejection', status: 'PASS' });

  console.log('\n====================================================');
  console.log('MULTI-PRODUCT & MULTI-BOX REGRESSION SUITE PASSED (4/4)');
  console.log('====================================================');
  console.table(testResults);

  await db.end();
  return { success: true, testResults };
}

runMultiProductRegression().catch(err => {
  console.error('[MULTI-PRODUCT REGRESSION ERROR]:', err);
  process.exit(1);
});
