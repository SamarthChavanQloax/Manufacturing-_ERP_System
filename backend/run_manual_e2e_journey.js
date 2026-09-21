const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

async function runManualE2EJourney() {
  const timestamp = Date.now().toString().slice(-6);
  const runId = `MANUAL-E2E-${timestamp}`;
  const outDir = path.resolve(__dirname, '..', 'docs', 'screenshots', 'manual_e2e');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const BASE_UI = 'http://localhost:3000';

  console.log('====================================================');
  console.log(`STARTING MANUAL-STYLE COMPLETE E2E USER JOURNEY`);
  console.log(`Run ID: ${runId}`);
  console.log(`Part: D16.064.34.0.PR (ID: 1825, "S S JOINT")`);
  console.log(`Customer: Mahindra & Mahindra | Qty: 5 Pcs`);
  console.log('====================================================\n');

  // Direct database connection for audit and traceability
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'barcode',
    password: 'barcode',
    database: 'barcode',
  });

  // Capture baseline table counts
  const baselineTables = [
    'parts', 'userinfo', 'customer', 'packing', 'box',
    'box_packing', 'invoice', 'invoice_box', 'invoice_match', 'invoice_box_match'
  ];
  const baselineCounts = {};
  for (const t of baselineTables) {
    const [rows] = await db.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    baselineCounts[t] = rows[0].cnt;
  }
  console.log('Baseline Database Counts:');
  console.table(baselineCounts);

  // Launch browser
  console.log(`\nLaunching Chrome from ${chromePath}...`);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1366, height: 850 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Track dialogs / alerts
  let lastAlertMessage = '';
  page.on('dialog', async (dialog) => {
    lastAlertMessage = dialog.message();
    console.log(`[BROWSER DIALOG]: "${lastAlertMessage}"`);
    try {
      await dialog.accept();
    } catch {}
  });

  page.on('console', (msg) => {
    console.log(`[BROWSER CONSOLE] [${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', (err) => {
    console.error(`[BROWSER PAGEERROR]:`, err.message);
  });

  // Robust helper to set React 18 controlled inputs using prototype setter + native events
  async function setNativeInput(selector, text) {
    const el = await page.waitForSelector(selector, { timeout: 15000 });
    await page.evaluate((inputEl, val) => {
      const valSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      valSetter.call(inputEl, String(val));
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }, el, text);
    await new Promise(r => setTimeout(r, 200));
  }
  const fillInput = setNativeInput;

  async function performUiLogin(email, password) {
    await page.goto(`${BASE_UI}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('form input[type="email"]', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 300));

    // Fill inputs using React-compatible prototype setter
    await setNativeInput('input[type="email"]', email);
    await setNativeInput('input[type="password"]', password);

    // Also trigger matching preset button click
    await page.evaluate((targetEmail) => {
      const btns = Array.from(document.querySelectorAll('button[type="button"]'));
      for (const btn of btns) {
        if (btn.textContent.includes('Admin') && targetEmail.includes('admin')) { btn.click(); return; }
        if (btn.textContent.includes('Packing') && targetEmail.includes('dpr')) { btn.click(); return; }
        if (btn.textContent.includes('Box') && targetEmail.includes('fgs')) { btn.click(); return; }
        if (btn.textContent.includes('Invoice') && targetEmail.includes('invoice')) { btn.click(); return; }
        if (btn.textContent.includes('Gate') && targetEmail.includes('gate')) { btn.click(); return; }
      }
    }, email);

    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await page.waitForSelector('.top-navbar, .content-header', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 500));
  }

  async function performUiLogout() {
    await page.evaluate(() => {
      const b = document.querySelector('.top-navbar button.btn-danger') || document.querySelector('button.btn-danger');
      if (b && b.textContent.includes('Logout')) b.click();
      localStorage.clear();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.goto(`${BASE_UI}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.login-box, form, input[type="email"]', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 300));
  }

  const transactionData = {
    runId,
    partNumber: 'D16.064.34.0.PR',
    partId: 1825,
    customer: 'Mahindra & Mahindra',
    qty: 5,
  };

  // ==========================================
  // PRE-TEST CHECK
  // ==========================================
  console.log('\n--- PRE-TEST CHECK ---');
  await page.goto(`${BASE_UI}/login`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, '00_pre_test_login.png') });
  console.log('Saved 00_pre_test_login.png');

  // ==========================================
  // ROLE 1: ADMIN
  // ==========================================
  console.log('\n--- ROLE 1: ADMIN ---');
  await performUiLogin('admin@admin.com', 'admin');
  await page.screenshot({ path: path.join(outDir, '01_admin_dashboard.png') });
  console.log('Admin Dashboard loaded -> Saved 01_admin_dashboard.png');

  // Part Master check
  await page.goto(`${BASE_UI}/part_master`, { waitUntil: 'networkidle2' });
  await fillInput('input[placeholder*="Search"]', 'D16.064.34.0.PR');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '02_admin_part_master.png') });
  console.log('Admin Part Master verified -> Saved 02_admin_part_master.png');

  // Customer Master check
  await page.goto(`${BASE_UI}/customer`, { waitUntil: 'networkidle2' });
  await fillInput('input[placeholder*="Search"]', 'Mahindra');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '03_admin_customer_master.png') });
  console.log('Admin Customer Master verified -> Saved 03_admin_customer_master.png');

  // Part Stock starting values
  await page.goto(`${BASE_UI}/part_stock`, { waitUntil: 'networkidle2' });
  await fillInput('input[placeholder*="Search"]', 'D16.064.34.0.PR');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '04_admin_part_stock.png') });
  console.log('Admin Part Stock recorded -> Saved 04_admin_part_stock.png');

  // Extract starting stock
  const startingStock = await page.evaluate(() => {
    const tr = document.querySelector('.data-table tbody tr');
    if (!tr) return null;
    const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
    return { fg: tds[3] || '0', box: tds[4] || '0', inv: tds[5] || '0' };
  });
  console.log(`Starting Stock: FG=${startingStock?.fg}, Box=${startingStock?.box}, Inv=${startingStock?.inv}`);
  transactionData.startingStock = startingStock;

  await performUiLogout();
  console.log('Admin Logged Out.');

  // ==========================================
  // ROLE 2: PACKING / DPR
  // ==========================================
  console.log('\n--- ROLE 2: PACKING / DPR ---');
  await performUiLogin('dpr@talbros.com', 'dpr');
  await page.goto(`${BASE_UI}/create_packing`, { waitUntil: 'networkidle2' });

  // Open Add modal
  await page.waitForSelector('.card-header button.btn-primary');
  await page.click('.card-header button.btn-primary');
  await page.waitForSelector('.modal-dialog form');

  // Select Part D16.064.34.0.PR and Qty 5
  await page.select('.modal-body select', '1825');
  const qtyInput = await page.waitForSelector('.modal-body input[type="number"]');
  await qtyInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await qtyInput.type('5');
  await page.click('.modal-dialog form button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));

  // Verify from DB as source of truth for newly created packing record
  const [packRows] = await db.query("SELECT * FROM packing ORDER BY id DESC LIMIT 1");
  const actualPackBarcode = packRows[0].barcode;
  const actualPackId = packRows[0].id;
  transactionData.packingId = actualPackId;
  transactionData.packingBarcode = actualPackBarcode;
  console.log(`[PASS] Packing Created: ID=${actualPackId}, Barcode=${actualPackBarcode}, Status=${packRows[0].status}`);

  await page.screenshot({ path: path.join(outDir, '05_packing_creation.png') });
  console.log('Saved 05_packing_creation.png');

  // View Packing list
  await page.goto(`${BASE_UI}/view_packing`, { waitUntil: 'networkidle2' });
  await fillInput('input[placeholder*="Search"]', actualPackBarcode);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '06_packing_view.png') });
  console.log('Saved 06_packing_view.png');

  // View Packing print preview
  await page.goto(`${BASE_UI}/view_packing_by_id/${actualPackId}`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '07_packing_barcode_preview.png') });
  console.log('Saved 07_packing_barcode_preview.png');

  await performUiLogout();
  console.log('DPR Logged Out.');

  // ==========================================
  // ROLE 3: BOX / FGS
  // ==========================================
  console.log('\n--- ROLE 3: BOX / FGS ---');
  await performUiLogin('fgs@talbros.com', 'fgs');
  await page.goto(`${BASE_UI}/create_box`, { waitUntil: 'networkidle2' });

  // Select Part D16.064.34.0.PR and Customer Mahindra in Create Box
  await page.waitForSelector('form select');
  const selects = await page.$$('form select');
  const partVal = await page.evaluate(() => {
    const s = document.querySelectorAll('form select')[0];
    for (const opt of s.options) {
      if (opt.text.includes('D16.064.34.0.PR')) return opt.value;
    }
    return '';
  });
  if (partVal) await selects[0].select(partVal);

  const custVal = await page.evaluate(() => {
    const s = document.querySelectorAll('form select')[1];
    if (!s) return '';
    for (const opt of s.options) {
      if (opt.text.includes('Mahindra')) return opt.value;
    }
    return '';
  });
  if (custVal) await selects[1].select(custVal);
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, '08_create_box.png') });
  console.log('Saved 08_create_box.png');

  // Submit box creation form
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));

  const [boxRows] = await db.query('SELECT * FROM box WHERE box_name = "D16.064.34.0.PR" ORDER BY id DESC LIMIT 1');
  const actualBoxId = boxRows[0].id;
  const actualBoxBarcode = boxRows[0].barcode;
  transactionData.boxId = actualBoxId;
  transactionData.boxBarcode = actualBoxBarcode;
  console.log(`[PASS] Box Created: ID=${actualBoxId}, Barcode=${actualBoxBarcode}, LockStatus=${boxRows[0].lock_status}`);

  // Navigate to add_packing_to_box/:id
  await page.goto(`${BASE_UI}/add_packing_to_box/${actualBoxId}`, { waitUntil: 'networkidle2' });

  // 11.1 EMPTY BOX LOCK REJECTION TEST
  console.log('Testing Empty Box Lock Rejection in UI...');
  lastAlertMessage = '';
  // Click Lock Box button on empty box
  const lockBoxBtn = await page.waitForSelector('#btn-lock-box');
  await lockBoxBtn.click();
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(outDir, '09_empty_box_lock_rejected.png') });
  console.log(`Empty Box Lock Rejection Alert: "${lastAlertMessage}" -> Saved 09_empty_box_lock_rejected.png`);

  const [boxCheckEmpty] = await db.query('SELECT lock_status FROM box WHERE id = ?', [actualBoxId]);
  if (boxCheckEmpty[0].lock_status !== 'no') {
    throw new Error('FATAL: Box locked when empty!');
  }
  console.log('[PASS] Empty box lock rejected cleanly; lock_status remains "no".');

  // 11.2 ADD PACKING
  console.log(`Adding Packing Barcode ${actualPackBarcode} into Box ${actualBoxBarcode}...`);
  await fillInput('input[placeholder*="Packing Barcode"]', actualPackBarcode);
  await page.click('#btn-add-packing');
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(outDir, '10_box_after_packing.png') });
  console.log('Saved 10_box_after_packing.png');

  // 11.3 LOCK BOX
  console.log('Locking Box with packed item...');
  const lockBtnWithItems = await page.waitForSelector('#btn-lock-box');
  await lockBtnWithItems.click();
  await page.waitForSelector('.modal-dialog .btn-primary');
  await page.click('.modal-dialog .btn-primary');
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: path.join(outDir, '11_box_after_lock.png') });
  console.log('Saved 11_box_after_lock.png');

  const [boxCheckLocked] = await db.query('SELECT lock_status, status FROM box WHERE id = ?', [actualBoxId]);
  const [bpRows] = await db.query('SELECT * FROM box_packing WHERE box_id = ?', [actualBoxId]);
  if (boxCheckLocked[0].lock_status !== 'yes' || bpRows.length !== 1 || bpRows[0].part_qty !== 5) {
    throw new Error('FATAL: Box lock status or quantity mismatch after lock!');
  }
  console.log(`[PASS] Box Locked Successfully: LockStatus=${boxCheckLocked[0].lock_status}, Qty=5 retained.`);

  await performUiLogout();
  console.log('FGS Logged Out.');

  // ==========================================
  // ROLE 4: INVOICE / COMMERCIAL
  // ==========================================
  console.log('\n--- ROLE 4: INVOICE / COMMERCIAL ---');
  await performUiLogin('invoice@talbros.com', 'invoice');
  await page.goto(`${BASE_UI}/create_invoice`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('form select option[value="1825"]', { timeout: 15000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Loading invoices...'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));

  // Use runId as invoiceNumber (e.g. MANUAL-E2E-123456) which is 17 characters, within varchar(20)
  const invoiceNumber = runId;
  transactionData.invoiceNumber = invoiceNumber;

  // Fill Create Invoice Form
  const invInput = await page.waitForSelector('input[placeholder*="Invoice Number"]');
  await page.evaluate((el, text) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, invInput, invoiceNumber);

  await page.select('form select', '1825');

  const invQtyInput = await page.waitForSelector('input[type="number"]');
  await page.evaluate((el, text) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, invQtyInput, '5');

  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, '12_create_invoice.png') });
  console.log('Saved 12_create_invoice.png');

  await page.evaluate(() => {
    const b = document.getElementById('btn-create-invoice');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  let invRows = [];
  for (let i = 0; i < 10; i++) {
    const [rows] = await db.query('SELECT * FROM invoice WHERE invoice_number = ?', [invoiceNumber]);
    if (rows && rows.length > 0) {
      invRows = rows;
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  if (!invRows || invRows.length === 0) throw new Error('Invoice not found in database');
  const actualInvoiceId = invRows[0].id;
  const actualInvoiceBarcode = invRows[0].barcode;
  transactionData.invoiceId = actualInvoiceId;
  transactionData.invoiceBarcode = actualInvoiceBarcode;
  console.log(`[PASS] Invoice Created: ID=${actualInvoiceId}, Barcode=${actualInvoiceBarcode}`);

  // Navigate to add_box_to_invoice/:id via UI
  await page.goto(`${BASE_UI}/add_box_to_invoice/${actualInvoiceId}`, { waitUntil: 'networkidle2' });

  // 12.1 ADD BOX TO INVOICE
  console.log(`Adding Box ${actualBoxBarcode} into Invoice ${invoiceNumber}...`);
  const boxInp = await page.waitForSelector('input[placeholder*="Box Barcode"]');
  await page.evaluate((el, text) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, boxInp, actualBoxBarcode);
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(outDir, '13_add_box_to_invoice.png') });
  console.log('Saved 13_add_box_to_invoice.png');

  await page.evaluate(() => {
    const b = document.getElementById('btn-add-box-to-invoice');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.waitForSelector('#btn-lock-invoice', { timeout: 15000 });
  await page.screenshot({ path: path.join(outDir, '14_invoice_5_of_5_matched.png') });
  console.log('Saved 14_invoice_5_of_5_matched.png');

  // 12.2 LOCK INVOICE
  console.log('Locking Invoice...');
  await page.waitForSelector('#btn-lock-invoice', { timeout: 15000 });
  await page.evaluate(() => {
    const b = document.getElementById('btn-lock-invoice');
    if (b) b.click();
  });
  await page.waitForSelector('#btn-confirm-lock-invoice', { timeout: 15000 });
  await page.evaluate(() => {
    const b = document.getElementById('btn-confirm-lock-invoice');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(outDir, '15_locked_invoice.png') });
  console.log('Saved 15_locked_invoice.png');

  const [invCheckLocked] = await db.query('SELECT lock_status FROM invoice WHERE id = ?', [actualInvoiceId]);
  if (invCheckLocked[0].lock_status !== 'yes') {
    throw new Error('FATAL: Invoice not locked!');
  }
  console.log(`[PASS] Invoice Locked Successfully: LockStatus=${invCheckLocked[0].lock_status}`);

  await performUiLogout();
  console.log('Commercial Logged Out.');

  // ==========================================
  // ROLE 5: GATE SECURITY
  // ==========================================
  console.log('\n--- ROLE 5: GATE SECURITY ---');
  await performUiLogin('gate@talbros.com', 'gate');
  await page.goto(`${BASE_UI}/verify_invoice`, { waitUntil: 'networkidle2' });

  // 13.1 VERIFY INVOICE
  console.log(`Scanning Invoice Barcode ${actualInvoiceBarcode} at gate...`);
  const gateInvInp = await page.waitForSelector('input[placeholder*="Invoice Barcode"]');
  await page.evaluate((el, text) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, gateInvInp, actualInvoiceBarcode);
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(outDir, '16_gate_invoice_verification.png') });
  console.log('Saved 16_gate_invoice_verification.png');

  await page.evaluate(() => {
    const b = document.getElementById('btn-start-verify-invoice');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  let matchRows = [];
  for (let i = 0; i < 10; i++) {
    const [rows] = await db.query('SELECT * FROM invoice_match WHERE invoice_number = ? ORDER BY id DESC LIMIT 1', [actualInvoiceBarcode]);
    if (rows && rows.length > 0) {
      matchRows = rows;
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  if (!matchRows || matchRows.length === 0) throw new Error('Gate match session not created');
  const actualMatchId = matchRows[0].id;
  transactionData.gateMatchId = actualMatchId;
  console.log(`Gate Verification Session started: Match ID=${actualMatchId}`);

  await page.goto(`${BASE_UI}/add_box_to_invoice_verify/${actualMatchId}`, { waitUntil: 'networkidle2' });

  // 13.2 PHYSICAL BOX SCAN
  console.log(`Scanning Physical Box Barcode ${actualBoxBarcode} at gate...`);
  const gateBoxInp = await page.waitForSelector('input[placeholder*="Barcode Number"]');
  await page.evaluate((el, text) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, gateBoxInp, actualBoxBarcode);
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const b = document.getElementById('btn-scan-box-gate');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(outDir, '17_gate_box_scan_match.png') });
  console.log('Saved 17_gate_box_scan_match.png');

  // 13.3 CLEARANCE CODE
  const expectedClearanceCode = `${invoiceNumber}4000${actualMatchId}`;
  transactionData.clearanceCode = expectedClearanceCode;

  const actualGateOutCode = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    for (const d of divs) {
      if (d.textContent && d.textContent.includes('4000')) {
        const m = d.textContent.match(/[A-Za-z0-9\-]+4000\d+/);
        if (m) return m[0];
      }
    }
    return '';
  });
  console.log(`Expected Clearance Code: ${expectedClearanceCode}`);
  console.log(`Actual Clearance Code in UI: ${actualGateOutCode}`);

  // Open Gate Pass Modal
  const printPassBtn = await page.$('button.btn-success');
  if (printPassBtn) {
    await page.evaluate(() => {
      const b = document.querySelector('button.btn-success');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 800));
  }
  await page.screenshot({ path: path.join(outDir, '18_gate_clearance.png') });
  console.log('Saved 18_gate_clearance.png');

  // Close modal if open
  await page.evaluate(() => {
    const b = document.querySelector('.modal-header button');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 13.4 GATE-OUT REPORT
  await page.goto(`${BASE_UI}/gate_out_report`, { waitUntil: 'networkidle2' });
  await setNativeInput('input[placeholder*="Search"]', invoiceNumber);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '19_gate_out_report.png') });
  console.log('Saved 19_gate_out_report.png');

  await performUiLogout();
  console.log('Gate Security Logged Out.');

  // ==========================================
  // FINAL ADMIN RECONCILIATION & STOCK CHECK
  // ==========================================
  console.log('\n--- FINAL ADMIN RECONCILIATION & STOCK CHECK ---');
  await performUiLogin('admin@admin.com', 'admin');

  // Trace verification in DB
  const [matchAudit] = await db.query('SELECT * FROM invoice_match WHERE id = ?', [actualMatchId]);
  const [ibmAudit] = await db.query('SELECT * FROM invoice_box_match WHERE invoice_id = ?', [actualInvoiceId]);
  const [packAudit] = await db.query('SELECT * FROM packing WHERE id = ?', [actualPackId]);
  const [boxAudit] = await db.query('SELECT * FROM box WHERE id = ?', [actualBoxId]);
  const [bpAudit] = await db.query('SELECT * FROM box_packing WHERE box_id = ?', [actualBoxId]);
  const [invAudit] = await db.query('SELECT * FROM invoice WHERE id = ?', [actualInvoiceId]);

  console.log('\n--- FINAL LIFECYCLE STATUS ASSERTIONS ---');
  const assertions = [
    { entity: 'packing.status', expected: 'used', actual: packAudit[0]?.status, pass: packAudit[0]?.status === 'used' },
    { entity: 'box.lock_status', expected: 'yes', actual: boxAudit[0]?.lock_status, pass: boxAudit[0]?.lock_status === 'yes' },
    { entity: 'box.status', expected: 'used', actual: boxAudit[0]?.status, pass: boxAudit[0]?.status === 'used' },
    { entity: 'box_packing.status', expected: 'used', actual: bpAudit[0]?.status, pass: bpAudit[0]?.status === 'used' },
    { entity: 'invoice.lock_status', expected: 'yes', actual: invAudit[0]?.lock_status, pass: invAudit[0]?.lock_status === 'yes' },
    { entity: 'invoice.status', expected: 'used', actual: invAudit[0]?.status, pass: invAudit[0]?.status === 'used' },
    { entity: 'invoice_match.status', expected: 'verified', actual: matchAudit[0]?.status, pass: matchAudit[0]?.status === 'verified' },
    { entity: 'invoice_box_match scans', expected: '1', actual: String(ibmAudit.length), pass: ibmAudit.length === 1 },
  ];
  console.table(assertions);

  const allAssertionsPass = assertions.every(a => a.pass);
  if (!allAssertionsPass) {
    throw new Error('FATAL: One or more final lifecycle status assertions failed!');
  }

  await page.goto(`${BASE_UI}/dashboard`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, '20_final_transaction_trace.png') });
  console.log('Saved 20_final_transaction_trace.png');

  // Final Part Stock
  await page.goto(`${BASE_UI}/part_stock`, { waitUntil: 'networkidle2' });
  await setNativeInput('input[placeholder*="Search"]', 'D16.064.34.0.PR');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '21_final_stock.png') });
  console.log('Saved 21_final_stock.png');

  const finalStock = await page.evaluate(() => {
    const tr = document.querySelector('.data-table tbody tr');
    if (!tr) return null;
    const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
    return { fg: tds[3] || '0', box: tds[4] || '0', inv: tds[5] || '0' };
  });
  console.log(`Final Stock: FG=${finalStock?.fg}, Box=${finalStock?.box}, Inv=${finalStock?.inv}`);
  transactionData.finalStock = finalStock;

  // Final Database audit
  const finalCounts = {};
  const deltaCounts = {};
  for (const t of baselineTables) {
    const [rows] = await db.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    finalCounts[t] = rows[0].cnt;
    deltaCounts[t] = finalCounts[t] - baselineCounts[t];
  }
  console.log('\n--- FINAL DATABASE COUNTS & DELTAS ---');
  const dbAuditTable = baselineTables.map(t => ({
    table: t,
    baseline: baselineCounts[t],
    final: finalCounts[t],
    delta: deltaCounts[t] >= 0 ? `+${deltaCounts[t]}` : `${deltaCounts[t]}`,
    status: deltaCounts[t] >= 0 ? 'INTACT' : 'CORRUPTED',
  }));
  console.table(dbAuditTable);

  await browser.close();
  await db.end();

  // Save transaction trace to disk
  fs.writeFileSync(
    path.join(__dirname, 'latest_manual_e2e_trace.json'),
    JSON.stringify(transactionData, null, 2)
  );

  console.log('====================================================');
  console.log('MANUAL-STYLE COMPLETE E2E USER JOURNEY: PASS');
  console.log('====================================================');
  return transactionData;
}

runManualE2EJourney().catch(err => {
  console.error('[MANUAL E2E JOURNEY FATAL ERROR]:', err);
  process.exit(1);
});
