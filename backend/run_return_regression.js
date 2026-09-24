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

async function runReturnRegression() {
  console.log('====================================================');
  console.log('STARTING RETURN / REVERSE LOGISTICS REGRESSION');
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

  // 1. Role Authorization Check: Non-gate roles must be forbidden from executing return
  console.log('--- 1. Role Guard Check on Return Endpoint ---');
  let nonGateRejected = false;
  try {
    await request('/verification/return', {
      method: 'POST',
      headers: dpr.headers,
      body: JSON.stringify({ match_id: 1, invoice_barcode: '300000' }),
    });
  } catch (err) {
    nonGateRejected = (err.status === 403);
    console.log(`[PASS] Packing role forbidden from invoice return: HTTP ${err.status}`);
  }
  if (!nonGateRejected) throw new Error('Security failure: Non-gate role allowed to call return endpoint!');
  testResults.push({ test: 'Role Guard on Return Endpoint', status: 'PASS' });

  // 2. Setup a fresh completed gate match for return testing
  console.log('\n--- 2. Setting Up Fresh Gate Transaction for Return ---');
  const pack = await request('/packing/single', {
    method: 'POST',
    headers: dpr.headers,
    body: JSON.stringify({ part_id: 1825, part_qty: 5 }),
  });
  const box = await request('/boxes', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_name: 'D16.064.34.0.PR', box_size: 'STD', customer_id: 1 }),
  });
  await request('/boxes/add-packing', {
    method: 'POST',
    headers: fgs.headers,
    body: JSON.stringify({ box_id: box.id, pack_id: pack.barcode, packing_barcode: pack.barcode }),
  });
  await request('/boxes/lock', { method: 'POST', headers: fgs.headers, body: JSON.stringify({ box_id: box.id }) });

  const retInvNum = `INV-RET-${Date.now().toString().slice(-4)}`;
  const inv = await request('/invoices', {
    method: 'POST',
    headers: comm.headers,
    body: JSON.stringify({ invoice_number: retInvNum, part_id: 1825, qty: 5 }),
  });
  await request('/invoices/add-box', {
    method: 'POST',
    headers: comm.headers,
    body: JSON.stringify({ invoice_id: inv.id, box_barcode: box.barcode }),
  });
  await request('/invoices/lock', { method: 'POST', headers: comm.headers, body: JSON.stringify({ invoice_id: inv.id }) });

  // Start Gate verification & scan box
  const match = await request('/verification/start', {
    method: 'POST',
    headers: gate.headers,
    body: JSON.stringify({ invoice_barcode: inv.barcode }),
  });
  await request('/verification/scan-box', {
    method: 'POST',
    headers: gate.headers,
    body: JSON.stringify({ match_id: match.id, box_barcode: box.barcode }),
  });

  // Check state before return: invoice status should be used
  const [invBefore] = await db.query('SELECT status FROM invoice WHERE id = ?', [inv.id]);
  const [scansBefore] = await db.query('SELECT COUNT(*) as cnt FROM invoice_box_match WHERE invoice_id = ?', [inv.id]);
  console.log(`[PASS] Transaction ready: MatchID=${match.id}, InvoiceStatus=${invBefore[0]?.status}, GateScansCount=${scansBefore[0]?.cnt}`);
  if (invBefore[0]?.status !== 'used' || scansBefore[0]?.cnt !== 1) {
    throw new Error('Pre-return state mismatch!');
  }

  // 3. Execute Legitimate Invoice Return
  console.log('\n--- 3. Executing Return for Invoice ---');
  const returnRes = await request('/verification/return', {
    method: 'POST',
    headers: gate.headers,
    body: JSON.stringify({
      match_id: match.id,
      invoice_barcode: inv.barcode,
    }),
  });
  console.log(`[PASS] Return API Response: "${returnRes.message}"`);

  // Verify State Rollback in DB:
  // - invoice.status restored to 'pending'
  // - invoice_box_match records for this invoice deleted
  // - invoice_match record deleted
  const [invAfter] = await db.query('SELECT status FROM invoice WHERE id = ?', [inv.id]);
  const [scansAfter] = await db.query('SELECT COUNT(*) as cnt FROM invoice_box_match WHERE invoice_id = ?', [inv.id]);
  const [matchAfter] = await db.query('SELECT COUNT(*) as cnt FROM invoice_match WHERE id = ?', [match.id]);

  console.log(`[PASS] Post-Return DB State:`);
  console.log(`       Invoice Status: "${invAfter[0]?.status}" (Expected: 'pending')`);
  console.log(`       Gate Scans:     ${scansAfter[0]?.cnt} (Expected: 0)`);
  console.log(`       Match Record:   ${matchAfter[0]?.cnt} (Expected: 0)`);

  if (invAfter[0]?.status !== 'pending') throw new Error('Invoice status was not rolled back to pending!');
  if (scansAfter[0]?.cnt !== 0) throw new Error('Gate scanned records were not cleared!');
  if (matchAfter[0]?.cnt !== 0) throw new Error('Gate match record was not deleted!');
  testResults.push({ test: 'Invoice Return Execution & Rollback', status: 'PASS' });

  // 4. Negative Test: Invalid Return (non-existent match ID)
  console.log('\n--- 4. Negative Test: Non-existent Match Return ---');
  let invalidReturnRejected = false;
  try {
    await request('/verification/return', {
      method: 'POST',
      headers: gate.headers,
      body: JSON.stringify({ match_id: 999999, invoice_barcode: '300000' }),
    });
  } catch (err) {
    invalidReturnRejected = (err.status === 404);
    console.log(`[PASS] Non-existent match return rejected: HTTP ${err.status}, "${err.data?.message}"`);
  }
  if (!invalidReturnRejected) throw new Error('Non-existent match return was not rejected with 404!');
  testResults.push({ test: 'Invalid Match ID Rejection (404)', status: 'PASS' });

  console.log('\n====================================================');
  console.log('RETURN / CANCELLATION REGRESSION SUITE PASSED (3/3)');
  console.log('====================================================');
  console.table(testResults);

  await db.end();
  return { success: true, testResults };
}

runReturnRegression().catch(err => {
  console.error('[RETURN REGRESSION ERROR]:', err);
  process.exit(1);
});
