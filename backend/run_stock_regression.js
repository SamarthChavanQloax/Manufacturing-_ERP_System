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

async function runStockRegression() {
  console.log('====================================================');
  console.log('STOCK & INVENTORY REGRESSION VERIFICATION');
  console.log('Rigorous validation of FG Stock, Box Stock, Inv Stock');
  console.log('====================================================\n');

  const runId = `STOCK-${Date.now().toString().slice(-6)}`;

  // 1. Authenticate required roles
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

  const admin = await login('admin@admin.com', 'admin');
  const packUser = await login('dpr@talbros.com', 'dpr');
  const boxUser = await login('fgs@talbros.com', 'fgs');
  const invUser = await login('invoice@talbros.com', 'invoice');
  const gateUser = await login('gate@talbros.com', 'gate');

  // Direct DB connection for state inspection
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'barcode',
    password: 'barcode',
    database: 'barcode',
  });

  // Helper to get stock via API
  const getStockViaApi = async (partNumber) => {
    const res = await request(`/parts/stock?search=${encodeURIComponent(partNumber)}`, {
      method: 'GET',
      headers: admin.headers,
    });
    const match = res.items.find(p => p.part_number.trim() === partNumber.trim());
    if (!match) throw new Error(`Part ${partNumber} not found in stock API`);
    return {
      fg_stock: Number(match.fg_stock),
      box_stock: Number(match.box_stock),
      inv_stock: Number(match.inv_stock),
    };
  };

  // Helper to get raw DB stock calculation
  const getStockViaDb = async (partId) => {
    const [packRows] = await db.query("SELECT COALESCE(SUM(part_qty), 0) AS fg_stock FROM packing WHERE part_id = ? AND status = 'pending'", [partId]);
    const [boxRows] = await db.query("SELECT COALESCE(SUM(part_qty), 0) AS box_stock FROM box_packing WHERE part_id = ? AND status = 'pending'", [partId]);
    const [invRows] = await db.query("SELECT COALESCE(SUM(qty), 0) AS inv_stock FROM invoice WHERE part_id = ? AND status = 'pending'", [partId]);
    return {
      fg_stock: Number(packRows[0].fg_stock),
      box_stock: Number(boxRows[0].box_stock),
      inv_stock: Number(invRows[0].inv_stock),
    };
  };

  // Test with Part 1825 (D16.064.34.0.PR)
  const partId = 1825;
  const partNumber = 'D16.064.34.0.PR';
  const testQty = 6;

  console.log(`Testing Part: ${partNumber} (ID: ${partId}) with Test Qty: ${testQty}\n`);

  // Initial State
  const initialApi = await getStockViaApi(partNumber);
  const initialDb = await getStockViaDb(partId);

  console.log('--- INITIAL STOCK STATE ---');
  console.log(`API => FG Stock: ${initialApi.fg_stock} | Box Stock: ${initialApi.box_stock} | Inv Stock: ${initialApi.inv_stock}`);
  console.log(`DB  => FG Stock: ${initialDb.fg_stock} | Box Stock: ${initialDb.box_stock} | Inv Stock: ${initialDb.inv_stock}`);

  if (initialApi.fg_stock !== initialDb.fg_stock ||
      initialApi.box_stock !== initialDb.box_stock ||
      initialApi.inv_stock !== initialDb.inv_stock) {
    throw new Error('FATAL: Initial API stock does not match raw DB calculation!');
  }
  console.log('[PASS] API and DB stock calculations are in 100% agreement initially.\n');

  // STEP 1: CREATE PACKING
  console.log(`--- STEP 1: CREATE PACKING (+${testQty} FG Stock) ---`);
  const packRes = await request('/packing/single', {
    method: 'POST',
    headers: packUser.headers,
    body: JSON.stringify({
      part_id: partId,
      part_qty: testQty,
      shift: 'A',
    }),
  });
  const packingBarcode = packRes.barcode;
  console.log(`Created packing record: ID=${packRes.id}, Barcode=${packingBarcode}, Qty=${testQty}`);

  const step1Stock = await getStockViaApi(partNumber);
  console.log(`Post-Pack Stock: FG=${step1Stock.fg_stock} | Box=${step1Stock.box_stock} | Inv=${step1Stock.inv_stock}`);
  const delta1_fg = step1Stock.fg_stock - initialApi.fg_stock;
  if (delta1_fg !== testQty) {
    throw new Error(`Step 1 Failed: Expected FG delta +${testQty}, got ${delta1_fg}`);
  }
  if (step1Stock.box_stock !== initialApi.box_stock || step1Stock.inv_stock !== initialApi.inv_stock) {
    throw new Error('Step 1 Failed: Box or Inv stock changed unexpectedly during packing!');
  }
  console.log(`[PASS] Step 1: FG Stock increased by exactly ${testQty}, other stocks unchanged.\n`);

  // STEP 2: CREATE BOX & ADD PACKING TO BOX
  console.log(`--- STEP 2: ADD PACKING TO BOX (-${testQty} FG Stock, +${testQty} Box Stock) ---`);
  const boxRes = await request('/boxes', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({
      box_name: partNumber,
      customer_id: 1,
      box_size: 'STANDARD',
    }),
  });
  const boxId = boxRes.id;
  const boxBarcode = boxRes.barcode;
  console.log(`Created box: ID=${boxId}, Barcode=${boxBarcode}`);

  await request('/boxes/add-packing', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({
      box_id: boxId,
      pack_id: packingBarcode,
      packing_barcode: packingBarcode,
    }),
  });
  console.log(`Added packing ${packingBarcode} to box ${boxBarcode}`);

  await request('/boxes/lock', {
    method: 'POST',
    headers: boxUser.headers,
    body: JSON.stringify({ box_id: boxId }),
  });
  console.log(`Box ${boxBarcode} locked`);

  const step2Stock = await getStockViaApi(partNumber);
  console.log(`Post-Box Stock: FG=${step2Stock.fg_stock} | Box=${step2Stock.box_stock} | Inv=${step2Stock.inv_stock}`);
  if (step2Stock.fg_stock !== initialApi.fg_stock) {
    throw new Error(`Step 2 Failed: FG Stock should return to initial ${initialApi.fg_stock}, got ${step2Stock.fg_stock}`);
  }
  const delta2_box = step2Stock.box_stock - initialApi.box_stock;
  if (delta2_box !== testQty) {
    throw new Error(`Step 2 Failed: Expected Box Stock delta +${testQty}, got ${delta2_box}`);
  }
  if (step2Stock.inv_stock !== initialApi.inv_stock) {
    throw new Error('Step 2 Failed: Inv stock changed unexpectedly during box creation!');
  }
  console.log(`[PASS] Step 2: FG Stock restored, Box Stock increased by exactly ${testQty}.\n`);

  // STEP 3: CREATE INVOICE
  console.log(`--- STEP 3: CREATE INVOICE (+${testQty} Inv Stock) ---`);
  const invRes = await request('/invoices', {
    method: 'POST',
    headers: invUser.headers,
    body: JSON.stringify({
      invoice_number: `INV-${runId}`,
      part_id: partId,
      qty: testQty,
    }),
  });
  const invoiceId = invRes.id;
  const invoiceBarcode = invRes.barcode;
  console.log(`Created invoice: ID=${invoiceId}, Barcode=${invoiceBarcode}, Qty=${testQty}`);

  const step3Stock = await getStockViaApi(partNumber);
  console.log(`Post-Invoice Stock: FG=${step3Stock.fg_stock} | Box=${step3Stock.box_stock} | Inv=${step3Stock.inv_stock}`);
  const delta3_inv = step3Stock.inv_stock - initialApi.inv_stock;
  if (delta3_inv !== testQty) {
    throw new Error(`Step 3 Failed: Expected Inv Stock delta +${testQty}, got ${delta3_inv}`);
  }
  if (step3Stock.fg_stock !== initialApi.fg_stock || step3Stock.box_stock !== step2Stock.box_stock) {
    throw new Error('Step 3 Failed: FG or Box stock changed unexpectedly during invoice creation!');
  }
  console.log(`[PASS] Step 3: Inv Stock increased by exactly ${testQty}, FG & Box unchanged.\n`);

  // STEP 4: ADD BOX TO INVOICE
  console.log(`--- STEP 4: ADD BOX TO INVOICE (-${testQty} Box Stock, Inv Stock unchanged) ---`);
  await request('/invoices/add-box', {
    method: 'POST',
    headers: invUser.headers,
    body: JSON.stringify({
      invoice_id: invoiceId,
      box_barcode: boxBarcode,
    }),
  });
  console.log(`Added box ${boxBarcode} to invoice ${invoiceId}`);

  await request('/invoices/lock', {
    method: 'POST',
    headers: invUser.headers,
    body: JSON.stringify({ invoice_id: invoiceId }),
  });
  console.log(`Invoice ${invoiceId} locked`);

  const step4Stock = await getStockViaApi(partNumber);
  console.log(`Post-Box-Add Stock: FG=${step4Stock.fg_stock} | Box=${step4Stock.box_stock} | Inv=${step4Stock.inv_stock}`);
  if (step4Stock.box_stock !== initialApi.box_stock) {
    throw new Error(`Step 4 Failed: Box stock should return to initial ${initialApi.box_stock}, got ${step4Stock.box_stock}`);
  }
  if (step4Stock.inv_stock !== step3Stock.inv_stock) {
    throw new Error('Step 4 Failed: Inv stock changed unexpectedly during box mapping!');
  }
  console.log(`[PASS] Step 4: Box Stock decreased by ${testQty} (transitioned to used), Inv Stock remains ${step4Stock.inv_stock}.\n`);

  // STEP 5: GATE START VERIFICATION (Invoice status becomes 'used' -> -testQty Inv Stock)
  console.log(`--- STEP 5: GATE VERIFICATION START (-${testQty} Inv Stock) ---`);
  const verifyRes = await request('/verification/start', {
    method: 'POST',
    headers: gateUser.headers,
    body: JSON.stringify({ invoice_barcode: invoiceBarcode }),
  });
  const matchId = verifyRes.id || verifyRes.invoice_match_id;
  console.log(`Gate verification started: Match ID=${matchId}`);

  const step5Stock = await getStockViaApi(partNumber);
  console.log(`Post-Gate-Start Stock: FG=${step5Stock.fg_stock} | Box=${step5Stock.box_stock} | Inv=${step5Stock.inv_stock}`);
  if (step5Stock.inv_stock !== initialApi.inv_stock) {
    throw new Error(`Step 5 Failed: Inv Stock should return to initial ${initialApi.inv_stock}, got ${step5Stock.inv_stock}`);
  }
  console.log(`[PASS] Step 5: Inv Stock decreased by ${testQty} when gate marked invoice as 'used'.\n`);

  // STEP 6: RETURN INVOICE (Invoice status restores to 'pending' -> +testQty Inv Stock)
  console.log(`--- STEP 6: RETURN INVOICE RESTORATION (+${testQty} Inv Stock) ---`);
  await request('/verification/return', {
    method: 'POST',
    headers: gateUser.headers,
    body: JSON.stringify({
      match_id: matchId,
      invoice_barcode: invoiceBarcode,
    }),
  });
  console.log(`Invoice returned at gate: Match ID=${matchId}`);

  const step6Stock = await getStockViaApi(partNumber);
  console.log(`Post-Return Stock: FG=${step6Stock.fg_stock} | Box=${step6Stock.box_stock} | Inv=${step6Stock.inv_stock}`);
  const delta6_inv = step6Stock.inv_stock - initialApi.inv_stock;
  if (delta6_inv !== testQty) {
    throw new Error(`Step 6 Failed: Expected Inv Stock restored by +${testQty}, got ${delta6_inv}`);
  }
  console.log(`[PASS] Step 6: Return Invoice cleanly restored Inv Stock by exactly +${testQty}!\n`);

  // Clean final transition check: gate-verify again and complete scan so the test invoice finishes cleanly
  console.log('--- FINALIZING TEST INVOICE AT GATE ---');
  const finalVerifyRes = await request('/verification/start', {
    method: 'POST',
    headers: gateUser.headers,
    body: JSON.stringify({ invoice_barcode: invoiceBarcode }),
  });
  const finalMatchId = finalVerifyRes.id || finalVerifyRes.invoice_match_id;
  await request('/verification/scan-box', {
    method: 'POST',
    headers: gateUser.headers,
    body: JSON.stringify({
      match_id: finalMatchId,
      box_barcode: boxBarcode,
    }),
  });
  console.log(`Gate clearance completed for test run: Match ID=${finalMatchId}`);

  const finalStock = await getStockViaApi(partNumber);
  console.log(`Final Balanced Stock: FG=${finalStock.fg_stock} | Box=${finalStock.box_stock} | Inv=${finalStock.inv_stock}`);
  if (finalStock.fg_stock !== initialApi.fg_stock ||
      finalStock.box_stock !== initialApi.box_stock ||
      finalStock.inv_stock !== initialApi.inv_stock) {
    throw new Error('Stock Regression Failed: Stock did not balance out to initial state after final clearance!');
  }
  console.log('[PASS] Full Stock Lifecycle is 100% mathematically balanced and verified!\n');

  await db.end();
  console.log('====================================================');
  console.log('STOCK & INVENTORY REGRESSION: ALL CHECKS PASSED');
  console.log('====================================================');
}

runStockRegression().catch(err => {
  console.error('[STOCK REGRESSION ERROR]:', err.data || err.message);
  process.exit(1);
});
