const mysql = require('mysql2/promise');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001/api';

async function main() {
  console.log('====================================================');
  console.log('  STARTING AI GATE RISK ANALYSIS REGRESSION TEST SUITE');
  console.log('====================================================\n');

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'barcode',
    password: process.env.DB_PASS || 'barcode',
    database: process.env.DB_NAME || 'barcode',
  });

  const results = [];

  function record(id, name, expected, actual, pass) {
    results.push({
      test: `Test ${id}: ${name}`,
      expected: typeof expected === 'object' ? JSON.stringify(expected) : String(expected),
      actual: typeof actual === 'object' ? JSON.stringify(actual) : String(actual),
      status: pass ? 'PASS' : 'FAIL',
    });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] Test ${id}: ${name}`);
    if (!pass) {
      console.log(`   Expected: ${JSON.stringify(expected)}\n   Actual:   ${JSON.stringify(actual)}`);
    }
  }

  // 1. Authenticate with admin and gate roles
  let adminToken = '';
  let gateToken = '';

  try {
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admin.com', password: 'admin' }),
    });
    const adminData = await adminLoginRes.json();
    adminToken = adminData.access_token;

    const gateLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gate@talbros.com', password: 'gate' }),
    });
    const gateData = await gateLoginRes.json();
    gateToken = gateData.access_token;

    record(1, 'Authentication & JWT Token Generation', 'admin and gate tokens received', { admin: !!adminToken, gate: !!gateToken }, !!adminToken && !!gateToken);
  } catch (err) {
    record(1, 'Authentication & JWT Token Generation', 'tokens', err.message, false);
    console.error('Login failed, aborting suite');
    process.exit(1);
  }

  // 2. Setup Seed Data in Database for Deterministic Testing
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = '11:00:00';

  // Insert Test Customer & Parts
  const testBarcodeSuffix = Math.floor(1000 + Math.random() * 9000);
  const custName = `Test AutoCorp ${testBarcodeSuffix}`;
  const [custRes] = await db.query('INSERT INTO customer (customer_name) VALUES (?)', [custName]);
  const customerId = custRes.insertId;

  const [partRes] = await db.query(
    'INSERT INTO parts (part_number, part_description, qty, customer_id, customer_part_id, created_id, date, time, deleted, part_family) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [`GEAR-BOX-${testBarcodeSuffix}`, 'Heavy Precision Transmission Gear', 5000, customerId, 1, 1, dateStr, timeStr, 0, 'Gears']
  );
  const partId = partRes.insertId;

  // Insert 3 Historical Invoices for Baseline (Average Qty = 100 pcs)

  await db.query(
    'INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [`HIST-INV-1-${testBarcodeSuffix}`, `INV-H1-${testBarcodeSuffix}`, 1, timeStr, dateStr, 100, partId, 'used', 'yes']
  );
  await db.query(
    'INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [`HIST-INV-2-${testBarcodeSuffix}`, `INV-H2-${testBarcodeSuffix}`, 1, timeStr, dateStr, 100, partId, 'used', 'yes']
  );
  await db.query(
    'INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [`HIST-INV-3-${testBarcodeSuffix}`, `INV-H3-${testBarcodeSuffix}`, 1, timeStr, dateStr, 100, partId, 'used', 'yes']
  );

  // --------------------------------------------------------------------------
  // TEST CASE 1: Normal Transaction (Normal Qty 100 pcs, daytime, valid sequence)
  // Expected: LOW Risk (Score <= 30)
  // --------------------------------------------------------------------------
  const normalBarcode = `NORM-INV-${testBarcodeSuffix}`;
  await db.query(
    'INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [normalBarcode, `INV-NORM-${testBarcodeSuffix}`, 1, '11:30:00', dateStr, 100, partId, 'pending', 'yes']
  );

  const resNormal = await fetch(`${BASE_URL}/ai/gate-risk/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gateToken}` },
    body: JSON.stringify({ invoice_barcode: normalBarcode }),
  });
  const dataNormal = await resNormal.json();

  record(
    2,
    'Normal Transaction Evaluation -> LOW Risk Level',
    'LOW (score <= 30)',
    `${dataNormal.risk_level} (score ${dataNormal.risk_score})`,
    dataNormal.risk_level === 'LOW' && dataNormal.risk_score <= 30
  );

  // --------------------------------------------------------------------------
  // TEST CASE 2: High Quantity Anomaly (350 pcs vs 100 pcs historical avg = 3.5x)
  // Expected: Quantity Anomaly detected & Score contribution
  // --------------------------------------------------------------------------
  const highQtyBarcode = `HQ-INV-${testBarcodeSuffix}`;
  await db.query(
    'INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [highQtyBarcode, `INV-HQ-${testBarcodeSuffix}`, 1, '11:30:00', dateStr, 350, partId, 'pending', 'yes']
  );

  const resHighQty = await fetch(`${BASE_URL}/ai/gate-risk/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gateToken}` },
    body: JSON.stringify({ invoice_barcode: highQtyBarcode }),
  });
  const dataHighQty = await resHighQty.json();

  const isQtyDetected = dataHighQty.risk_factors?.quantity_anomaly?.detected === true;
  record(
    3,
    'Quantity Anomaly Detection (3.5x Customer Historical Average)',
    'quantity_anomaly detected = true with explanation reason',
    { detected: isQtyDetected, score: dataHighQty.risk_factors?.quantity_anomaly?.score },
    isQtyDetected && dataHighQty.risk_factors?.quantity_anomaly?.score > 0
  );

  // --------------------------------------------------------------------------
  // TEST CASE 3: Unusual Time Anomaly (Night Shift / Off-Hours Scan at 02:30 AM)
  // Expected: Unusual Scan Time detected
  // --------------------------------------------------------------------------
  const nightBarcode = `NIGHT-INV-${testBarcodeSuffix}`;
  const [invNight] = await db.query(
    'INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nightBarcode, `INV-NIGHT-${testBarcodeSuffix}`, 1, '02:30:00', dateStr, 100, partId, 'pending', 'yes']
  );

  // Create match with 02:30:00 time
  const [matchNight] = await db.query(
    'INSERT INTO invoice_match (invoice_number, total_stock, created_by, created_time, created_date, status) VALUES (?, ?, ?, ?, ?, ?)',
    [nightBarcode, 100, 1, dateStr, '02:30:00', 'pending']
  );

  const resNight = await fetch(`${BASE_URL}/ai/gate-risk/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gateToken}` },
    body: JSON.stringify({ match_id: matchNight.insertId }),
  });
  const dataNight = await resNight.json();

  const isNightDetected = dataNight.risk_factors?.unusual_scan_time?.detected === true;
  record(
    4,
    'Unusual Scan Time Anomaly Detection (02:30 AM Off-Hours)',
    'unusual_scan_time detected = true',
    { detected: isNightDetected, score: dataNight.risk_factors?.unusual_scan_time?.score },
    isNightDetected && dataNight.risk_factors?.unusual_scan_time?.score > 0
  );

  // --------------------------------------------------------------------------
  // TEST CASE 4: Multiple Failed Scans Pattern Tracking
  // Expected: Failed scan pattern detected & risk score increased
  // --------------------------------------------------------------------------
  const failBarcode = `FAIL-INV-${testBarcodeSuffix}`;
  await db.query(
    'INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [failBarcode, `INV-FAIL-${testBarcodeSuffix}`, 1, '11:00:00', dateStr, 100, partId, 'pending', 'yes']
  );

  // Log 4 failed box scan attempts via API
  for (let i = 1; i <= 4; i++) {
    await fetch(`${BASE_URL}/ai/gate-risk/log-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gateToken}` },
      body: JSON.stringify({
        invoice_barcode: failBarcode,
        scanned_barcode: `INVALID-BOX-${i}`,
        scan_type: 'box',
        is_valid: false,
        failure_reason: 'Box barcode not found in this invoice',
      }),
    });
  }

  const resFail = await fetch(`${BASE_URL}/ai/gate-risk/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gateToken}` },
    body: JSON.stringify({ invoice_barcode: failBarcode }),
  });
  const dataFail = await resFail.json();

  const isFailedDetected = dataFail.risk_factors?.failed_scan_pattern?.detected === true;
  record(
    5,
    'Multiple Failed Scan Pattern Tracking (4 invalid scan retries)',
    'failed_scan_pattern detected = true with score contribution',
    { detected: isFailedDetected, score: dataFail.risk_factors?.failed_scan_pattern?.score, count: dataFail.metrics?.failed_scans_count },
    isFailedDetected && dataFail.metrics?.failed_scans_count >= 4
  );

  // --------------------------------------------------------------------------
  // TEST CASE 5: Multiple Combined Risk Factors -> HIGH Risk Level (71-100)
  // (High Qty 400 pcs + Off-Hours 03:15 AM + 4 Failed Scans)
  // Expected: HIGH Risk & Actionable Recommendation
  // --------------------------------------------------------------------------
  const comboBarcode = `COMBO-INV-${testBarcodeSuffix}`;
  await db.query(
    'INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [comboBarcode, `INV-COMBO-${testBarcodeSuffix}`, 1, '03:15:00', dateStr, 400, partId, 'pending', 'yes']
  );

  const [matchCombo] = await db.query(
    'INSERT INTO invoice_match (invoice_number, total_stock, created_by, created_time, created_date, status) VALUES (?, ?, ?, ?, ?, ?)',
    [comboBarcode, 400, 1, dateStr, '03:15:00', 'pending']
  );

  for (let i = 1; i <= 4; i++) {
    await fetch(`${BASE_URL}/ai/gate-risk/log-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gateToken}` },
      body: JSON.stringify({
        match_id: matchCombo.insertId,
        invoice_barcode: comboBarcode,
        scanned_barcode: `BAD-BOX-${i}`,
        scan_type: 'box',
        is_valid: false,
        failure_reason: 'Box barcode not found',
      }),
    });
  }

  const resCombo = await fetch(`${BASE_URL}/ai/gate-risk/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gateToken}` },
    body: JSON.stringify({ match_id: matchCombo.insertId }),
  });
  const dataCombo = await resCombo.json();

  record(
    6,
    'Combined Multi-Factor Anomaly Evaluation -> HIGH Risk Level (71-100)',
    'HIGH (score >= 71)',
    `${dataCombo.risk_level} (score ${dataCombo.risk_score})`,
    dataCombo.risk_level === 'HIGH' && dataCombo.risk_score >= 71
  );

  // --------------------------------------------------------------------------
  // TEST CASE 6: Human/Admin Risk Review & Audit Trail Workflow
  // Expected: Status changes to 'reviewed', reviewer name & note persisted
  // --------------------------------------------------------------------------
  const reviewRes = await fetch(`${BASE_URL}/ai/gate-risk/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      analysis_id: dataCombo.id,
      decision: 'approved',
      note: 'Supervisor physically verified advance PO with Tata Motors buyer.',
    }),
  });
  const reviewData = await reviewRes.json();

  const [dbReview] = await db.query('SELECT * FROM gate_risk_analysis WHERE id = ?', [dataCombo.id]);
  const auditRecord = dbReview[0];

  record(
    7,
    'Human/Admin Risk Review Recording & Audit Logging',
    'review_status = reviewed, decision = approved, note logged',
    {
      status: auditRecord?.review_status,
      decision: auditRecord?.review_decision,
      reviewer: auditRecord?.reviewed_by_name,
      note: auditRecord?.review_note,
    },
    auditRecord?.review_status === 'reviewed' &&
      auditRecord?.review_decision === 'approved' &&
      auditRecord?.review_note?.includes('Tata Motors')
  );

  // --------------------------------------------------------------------------
  // TEST CASE 7: Admin Dashboard KPI & Summary Endpoint
  // Expected: Dashboard returns total count, low/med/high counts, factor frequencies
  // --------------------------------------------------------------------------
  const resDash = await fetch(`${BASE_URL}/ai/gate-risk/dashboard`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dataDash = await resDash.json();

  record(
    8,
    'Admin Gate Risk Dashboard KPI & Factor Analytics',
    'total_analyzed >= 5, low/med/high counts, factor frequencies',
    {
      total: dataDash.total_analyzed,
      low: dataDash.low_risk_count,
      med: dataDash.medium_risk_count,
      high: dataDash.high_risk_count,
      factorsCount: dataDash.factor_frequencies?.length,
    },
    dataDash.total_analyzed >= 5 && Array.isArray(dataDash.factor_frequencies)
  );

  // --------------------------------------------------------------------------
  // TEST CASE 8: Filtered Transactions Pagination & Search
  // Expected: Filter by risk_level=HIGH returns only high risk records
  // --------------------------------------------------------------------------
  const resFilter = await fetch(`${BASE_URL}/ai/gate-risk/transactions?risk_level=HIGH`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dataFilter = await resFilter.json();

  const allHigh = dataFilter.items.every((item) => item.risk_level === 'HIGH');
  record(
    9,
    'Admin Transactions Filter & Search by Risk Level',
    'All returned items have risk_level == HIGH',
    { count: dataFilter.items?.length, allHigh },
    dataFilter.items.length > 0 && allHigh
  );

  // --------------------------------------------------------------------------
  // TEST CASE 9: Preservation of Deterministic Business Rules
  // Verification with missing box barcode is strictly rejected by deterministic ERP rules
  // --------------------------------------------------------------------------
  let deterministicRejected = false;
  try {
    const resBadScan = await fetch(`${BASE_URL}/verification/scan-box`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gateToken}` },
      body: JSON.stringify({ match_id: matchCombo.insertId, box_barcode: '9999999' }),
    });
    if (resBadScan.status === 400) deterministicRejected = true;
  } catch (e) {
    deterministicRejected = true;
  }

  record(
    10,
    'Preservation of Deterministic ERP Gate Rules (Invalid Box Scan strictly blocked)',
    '400 Bad Request error returned',
    deterministicRejected ? '400 Blocked' : 'Not Blocked',
    deterministicRejected
  );

  // Summary
  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.status === 'PASS').length;
  console.log(`  AI GATE RISK REGRESSION SUMMARY: ${passedCount} / ${results.length} PASSED`);
  console.log('====================================================\n');

  await db.end();

  if (passedCount < results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
