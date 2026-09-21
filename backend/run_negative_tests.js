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

async function runNegativeTests() {
  console.log('====================================================');
  console.log('STARTING SIX NEGATIVE TEST SCENARIOS');
  console.log('Verifying rejections, HTTP status codes, and DB safety');
  console.log('====================================================\n');

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
      headers: { Authorization: `Bearer ${data.access_token}` },
    };
  }

  const boxAuth = await login('fgs@talbros.com', 'fgs');
  const invAuth = await login('invoice@talbros.com', 'invoice');
  const packAuth = await login('dpr@talbros.com', 'dpr');

  const testResults = [];

  // -----------------------------------------------------------------
  // NEGATIVE TEST A: Lock Empty Box
  // -----------------------------------------------------------------
  console.log('--- NEGATIVE TEST A: Attempting to lock an empty box ---');
  const emptyBox = await request('/boxes', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_name: 'D16.064.34.0.PR', box_size: 'STD', customer_id: 1 }),
  });

  let testAPassed = false;
  let testAHttp = 0;
  let testAMsg = '';
  try {
    await request('/boxes/lock', {
      method: 'POST',
      headers: boxAuth.headers,
      body: JSON.stringify({ box_id: emptyBox.id }),
    });
  } catch (err) {
    testAHttp = err.status;
    testAMsg = err.data?.message || err.message;
    testAPassed = testAHttp >= 400 && testAMsg.toLowerCase().includes('empty');
  }

  // Verify DB state: box lock_status must still be 'no'
  const [emptyBoxDb] = await db.query('SELECT lock_status FROM box WHERE id = ?', [emptyBox.id]);
  const testADbIntact = emptyBoxDb[0]?.lock_status === 'no';

  console.log(`Result: ${testAPassed && testADbIntact ? '[PASS]' : '[FAIL]'}`);
  console.log(`  Actual HTTP Status: ${testAHttp}`);
  console.log(`  Business Message:   "${testAMsg}"`);
  console.log(`  DB Lock Status:     "${emptyBoxDb[0]?.lock_status}" (Unchanged: ${testADbIntact})`);

  testResults.push({
    test: 'TEST A: Lock Empty Box',
    expected: 'Rejection + lock_status remains no',
    actualHttp: testAHttp,
    businessMessage: testAMsg,
    dbIntact: testADbIntact,
    status: testAPassed && testADbIntact ? 'PASS' : 'FAIL',
  });

  // -----------------------------------------------------------------
  // NEGATIVE TEST B: Add Empty Box to Invoice
  // -----------------------------------------------------------------
  console.log('\n--- NEGATIVE TEST B: Attempting to add empty box to invoice ---');
  const invoiceB = await request('/invoices', {
    method: 'POST',
    headers: invAuth.headers,
    body: JSON.stringify({ invoice_number: `INV-NEG-B-${Date.now().toString().slice(-6)}`, part_id: 1825, qty: 10 }),
  });

  let testBPassed = false;
  let testBHttp = 0;
  let testBMsg = '';
  try {
    await request('/invoices/add-box', {
      method: 'POST',
      headers: invAuth.headers,
      body: JSON.stringify({ invoice_id: invoiceB.id, box_barcode: emptyBox.barcode }),
    });
  } catch (err) {
    testBHttp = err.status;
    testBMsg = err.data?.message || err.message;
    testBPassed = testBHttp >= 400 && testBMsg.toLowerCase().includes('no packing items');
  }

  // Verify DB: invoice_box must not have this mapping
  const [invBoxBDb] = await db.query('SELECT COUNT(*) as cnt FROM invoice_box WHERE invoice_id = ?', [invoiceB.id]);
  const testBDbIntact = invBoxBDb[0].cnt === 0;

  console.log(`Result: ${testBPassed && testBDbIntact ? '[PASS]' : '[FAIL]'}`);
  console.log(`  Actual HTTP Status: ${testBHttp}`);
  console.log(`  Business Message:   "${testBMsg}"`);
  console.log(`  DB Mappings Count:  ${invBoxBDb[0].cnt} (Expected: 0)`);

  testResults.push({
    test: 'TEST B: Add Empty Box to Invoice',
    expected: 'Rejection ("contains no packing items") + 0 mappings in DB',
    actualHttp: testBHttp,
    businessMessage: testBMsg,
    dbIntact: testBDbIntact,
    status: testBPassed && testBDbIntact ? 'PASS' : 'FAIL',
  });

  // -----------------------------------------------------------------
  // NEGATIVE TEST C: Wrong-Part Box added to Invoice
  // -----------------------------------------------------------------
  console.log('\n--- NEGATIVE TEST C: Attempting to add wrong-part box to invoice ---');
  const [otherPartRows] = await db.query('SELECT id, part_number FROM parts WHERE id = 1');
  const otherPart = otherPartRows[0];

  const packC = await request('/packing/single', {
    method: 'POST',
    headers: packAuth.headers,
    body: JSON.stringify({ part_id: otherPart.id, part_qty: 5 }),
  });
  const boxC = await request('/boxes', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_name: otherPart.part_number, customer_id: 1 }),
  });
  await request('/boxes/add-packing', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_id: boxC.id, packing_barcode: packC.barcode }),
  });

  let testCPassed = false;
  let testCHttp = 0;
  let testCMsg = '';
  try {
    await request('/invoices/add-box', {
      method: 'POST',
      headers: invAuth.headers,
      body: JSON.stringify({ invoice_id: invoiceB.id, box_barcode: boxC.barcode }),
    });
  } catch (err) {
    testCHttp = err.status;
    testCMsg = err.data?.message || err.message;
    testCPassed = testCHttp >= 400 && testCMsg.toLowerCase().includes('mismatch');
  }

  const [invBoxCDb] = await db.query('SELECT COUNT(*) as cnt FROM invoice_box WHERE invoice_id = ?', [invoiceB.id]);
  const testCDbIntact = invBoxCDb[0].cnt === 0;

  console.log(`Result: ${testCPassed && testCDbIntact ? '[PASS]' : '[FAIL]'}`);
  console.log(`  Actual HTTP Status: ${testCHttp}`);
  console.log(`  Business Message:   "${testCMsg}"`);
  console.log(`  DB Mappings Count:  ${invBoxCDb[0].cnt} (Expected: 0)`);

  testResults.push({
    test: 'TEST C: Wrong-Part Box to Invoice',
    expected: 'Rejection ("Part Number Mismatch") + 0 mappings in DB',
    actualHttp: testCHttp,
    businessMessage: testCMsg,
    dbIntact: testCDbIntact,
    status: testCPassed && testCDbIntact ? 'PASS' : 'FAIL',
  });

  // -----------------------------------------------------------------
  // NEGATIVE TEST D: Duplicate Box Mapping
  // -----------------------------------------------------------------
  console.log('\n--- NEGATIVE TEST D: Attempting to map same box twice ---');
  const packD = await request('/packing/single', {
    method: 'POST',
    headers: packAuth.headers,
    body: JSON.stringify({ part_id: 1825, part_qty: 5 }),
  });
  const boxD = await request('/boxes', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_name: 'D16.064.34.0.PR', customer_id: 1 }),
  });
  await request('/boxes/add-packing', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_id: boxD.id, packing_barcode: packD.barcode }),
  });
  await request('/boxes/lock', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_id: boxD.id }),
  });

  const invoiceD = await request('/invoices', {
    method: 'POST',
    headers: invAuth.headers,
    body: JSON.stringify({ invoice_number: `INV-NEG-D-${Date.now().toString().slice(-6)}`, part_id: 1825, qty: 10 }),
  });

  // First mapping (succeeds)
  await request('/invoices/add-box', {
    method: 'POST',
    headers: invAuth.headers,
    body: JSON.stringify({ invoice_id: invoiceD.id, box_barcode: boxD.barcode }),
  });

  // Second mapping with same box (must fail)
  let testDPassed = false;
  let testDHttp = 0;
  let testDMsg = '';
  try {
    await request('/invoices/add-box', {
      method: 'POST',
      headers: invAuth.headers,
      body: JSON.stringify({ invoice_id: invoiceD.id, box_barcode: boxD.barcode }),
    });
  } catch (err) {
    testDHttp = err.status;
    testDMsg = err.data?.message || err.message;
    testDPassed = testDHttp >= 400 && testDMsg.toLowerCase().includes('already used');
  }

  const [invBoxDDb] = await db.query('SELECT COUNT(*) as cnt FROM invoice_box WHERE invoice_id = ?', [invoiceD.id]);
  const testDDbIntact = invBoxDDb[0].cnt === 1;

  console.log(`Result: ${testDPassed && testDDbIntact ? '[PASS]' : '[FAIL]'}`);
  console.log(`  Actual HTTP Status: ${testDHttp}`);
  console.log(`  Business Message:   "${testDMsg}"`);
  console.log(`  DB Mappings Count:  ${invBoxDDb[0].cnt} (Expected: exactly 1)`);

  testResults.push({
    test: 'TEST D: Duplicate Box Mapping',
    expected: 'Rejection ("already used") + exactly 1 mapping in DB',
    actualHttp: testDHttp,
    businessMessage: testDMsg,
    dbIntact: testDDbIntact,
    status: testDPassed && testDDbIntact ? 'PASS' : 'FAIL',
  });

  // -----------------------------------------------------------------
  // NEGATIVE TEST E: Invoice Quantity Exceeded
  // -----------------------------------------------------------------
  console.log('\n--- NEGATIVE TEST E: Attempting to exceed invoice target quantity ---');
  const invoiceE = await request('/invoices', {
    method: 'POST',
    headers: invAuth.headers,
    body: JSON.stringify({ invoice_number: `INV-NEG-E-${Date.now().toString().slice(-6)}`, part_id: 1825, qty: 5 }),
  });

  const packE1 = await request('/packing/single', {
    method: 'POST',
    headers: packAuth.headers,
    body: JSON.stringify({ part_id: 1825, part_qty: 5 }),
  });
  const boxE1 = await request('/boxes', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_name: 'D16.064.34.0.PR', customer_id: 1 }),
  });
  await request('/boxes/add-packing', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_id: boxE1.id, packing_barcode: packE1.barcode }),
  });
  await request('/invoices/add-box', {
    method: 'POST',
    headers: invAuth.headers,
    body: JSON.stringify({ invoice_id: invoiceE.id, box_barcode: boxE1.barcode }),
  });

  // Second box with qty 5 (would make total 10 / 5)
  const packE2 = await request('/packing/single', {
    method: 'POST',
    headers: packAuth.headers,
    body: JSON.stringify({ part_id: 1825, part_qty: 5 }),
  });
  const boxE2 = await request('/boxes', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_name: 'D16.064.34.0.PR', customer_id: 1 }),
  });
  await request('/boxes/add-packing', {
    method: 'POST',
    headers: boxAuth.headers,
    body: JSON.stringify({ box_id: boxE2.id, packing_barcode: packE2.barcode }),
  });

  let testEPassed = false;
  let testEHttp = 0;
  let testEMsg = '';
  try {
    await request('/invoices/add-box', {
      method: 'POST',
      headers: invAuth.headers,
      body: JSON.stringify({ invoice_id: invoiceE.id, box_barcode: boxE2.barcode }),
    });
  } catch (err) {
    testEHttp = err.status;
    testEMsg = err.data?.message || err.message;
    testEPassed = testEHttp >= 400 && testEMsg.toLowerCase().includes('exceed');
  }

  const [invBoxEDb] = await db.query('SELECT COUNT(*) as cnt FROM invoice_box WHERE invoice_id = ?', [invoiceE.id]);
  const testEDbIntact = invBoxEDb[0].cnt === 1;

  console.log(`Result: ${testEPassed && testEDbIntact ? '[PASS]' : '[FAIL]'}`);
  console.log(`  Actual HTTP Status: ${testEHttp}`);
  console.log(`  Business Message:   "${testEMsg}"`);
  console.log(`  DB Mappings Count:  ${invBoxEDb[0].cnt} (Expected: 1, did not exceed)`);

  testResults.push({
    test: 'TEST E: Invoice Quantity Exceeded',
    expected: 'Rejection ("Exceeds Required") + 1 mapping in DB',
    actualHttp: testEHttp,
    businessMessage: testEMsg,
    dbIntact: testEDbIntact,
    status: testEPassed && testEDbIntact ? 'PASS' : 'FAIL',
  });

  // -----------------------------------------------------------------
  // NEGATIVE TEST F: Invalid Barcode
  // -----------------------------------------------------------------
  console.log('\n--- NEGATIVE TEST F: Scanning invalid/non-existent box barcode ---');
  let testFPassed = false;
  let testFHttp = 0;
  let testFMsg = '';
  try {
    await request('/invoices/add-box', {
      method: 'POST',
      headers: invAuth.headers,
      body: JSON.stringify({ invoice_id: invoiceB.id, box_barcode: '999999999' }),
    });
  } catch (err) {
    testFHttp = err.status;
    testFMsg = err.data?.message || err.message;
    testFPassed = testFHttp >= 400 && testFMsg.toLowerCase().includes('not found');
  }

  console.log(`Result: ${testFPassed ? '[PASS]' : '[FAIL]'}`);
  console.log(`  Actual HTTP Status: ${testFHttp}`);
  console.log(`  Business Message:   "${testFMsg}"`);

  testResults.push({
    test: 'TEST F: Invalid Barcode',
    expected: 'Rejection ("not found")',
    actualHttp: testFHttp,
    businessMessage: testFMsg,
    dbIntact: true,
    status: testFPassed ? 'PASS' : 'FAIL',
  });

  console.log('\n====================================================');
  console.log('NEGATIVE TEST SUITE RESULTS:');
  console.log('====================================================');
  console.table(testResults);

  const allPassed = testResults.every(r => r.status === 'PASS');
  console.log(`\nOVERALL NEGATIVE TESTS: ${allPassed ? 'ALL PASS (6/6)' : 'SOME FAILED'}`);

  await db.end();
  return { allPassed, testResults };
}

runNegativeTests().catch((err) => {
  console.error('[FATAL ERROR IN NEGATIVE TESTS]:', err);
  process.exit(1);
});
