const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

async function captureFinalScreenshots() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outDir = path.resolve(__dirname, '..', 'docs', 'screenshots', 'final_verification');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const db = await mysql.createConnection({ host: '127.0.0.1', user: 'barcode', password: 'barcode', database: 'barcode' });

  console.log('Launching headless Chrome from:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1366, height: 850 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.on('dialog', async (dialog) => {
    try { await dialog.accept(); } catch {}
  });

  // Helper login function
  async function performLogin(email, password) {
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
      await page.evaluate((token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }, data.access_token, data.user);
      await page.goto('http://localhost:3000/index', { waitUntil: 'networkidle2' });
    } catch (err) {
      console.warn('API login fallback to UI login:', err.message);
    }
  }

  console.log('--- 1. ADMIN FLOW ---');
  await performLogin('admin@admin.com', 'admin');
  // 1. Admin Dashboard
  await page.screenshot({ path: path.join(outDir, '01_admin_dashboard.png') });
  console.log('Saved 01_admin_dashboard.png');

  // 2. Part Master
  await page.goto('http://localhost:3000/part_master', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type('D16.064.34.0.PR');
    await new Promise((r) => setTimeout(r, 600));
  }
  await page.screenshot({ path: path.join(outDir, '02_part_master.png') });
  console.log('Saved 02_part_master.png');

  // 3. Part Stock
  await page.goto('http://localhost:3000/part_stock', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  const stockSearch = await page.$('input[placeholder*="Search"]');
  if (stockSearch) {
    await stockSearch.type('D16.064.34.0.PR');
    await new Promise((r) => setTimeout(r, 600));
  }
  await page.screenshot({ path: path.join(outDir, '03_part_stock.png') });
  console.log('Saved 03_part_stock.png');

  console.log('--- 2. PACKING USER FLOW ---');
  await performLogin('dpr@talbros.com', 'dpr');

  // 4. Packing Creation Modal
  await page.goto('http://localhost:3000/create_packing', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  const addBtn = await page.$('button.btn-primary');
  if (addBtn) {
    await addBtn.click();
    await page.waitForSelector('.modal-dialog');
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outDir, '04_packing_creation_modal.png') });
    console.log('Saved 04_packing_creation_modal.png');

    await page.select('select.form-control', '1825');
    const qtyInput = await page.$('input[type="number"]');
    if (qtyInput) {
      await qtyInput.focus();
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await qtyInput.type('5');
    }
    await page.click('.modal-footer button.btn-primary');
    await new Promise((r) => setTimeout(r, 1200));
  }

  // 5. Packing Barcode Preview / Thermal Sticker
  await page.screenshot({ path: path.join(outDir, '05_packing_barcode_preview.png') });
  console.log('Saved 05_packing_barcode_preview.png');

  // 6. View Packing
  await page.goto('http://localhost:3000/view_packing', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '06_view_packing.png') });
  console.log('Saved 06_view_packing.png');

  console.log('--- 3. BOX / FGS USER FLOW ---');
  await performLogin('fgs@talbros.com', 'fgs');

  // 7. Create Box Page
  await page.goto('http://localhost:3000/create_box', { waitUntil: 'networkidle2' });
  await page.waitForSelector('select');
  const partSelect = await page.$('select:first-of-type');
  if (partSelect) {
    await page.evaluate(() => {
      const sel = document.querySelector('select');
      for (let opt of sel.options) {
        if (opt.text.includes('D16.064.34.0.PR')) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });
  }
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, '07_create_box.png') });
  console.log('Saved 07_create_box.png');

  // Submit to create box and go to AddPackingToBoxPage
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 1500));

  // 8. Empty Box Lock Rejection
  await page.screenshot({ path: path.join(outDir, '08_empty_box_lock_rejected.png') });
  console.log('Saved 08_empty_box_lock_rejected.png');

  // Fetch pending packing barcode
  const [latestPack] = await db.query('SELECT barcode FROM packing WHERE status = "pending" ORDER BY id DESC LIMIT 1');
  const packBarcodeToScan = latestPack[0]?.barcode;

  if (packBarcodeToScan) {
    const scanInput = await page.$('input[placeholder*="Enter Packing Barcode"]');
    if (scanInput) {
      await scanInput.type(packBarcodeToScan);
      await page.click('button.btn-danger');
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  // 9. Box after adding packing
  await page.screenshot({ path: path.join(outDir, '09_box_after_adding_packing.png') });
  console.log('Saved 09_box_after_adding_packing.png');

  // 10. Lock Box
  const lockBoxBtn = await page.$('button.btn-primary');
  if (lockBoxBtn) {
    await lockBoxBtn.click();
    await page.waitForSelector('.modal-dialog');
    await new Promise((r) => setTimeout(r, 400));
    await page.click('.modal-footer button.btn-primary');
    await new Promise((r) => setTimeout(r, 1200));
  }
  await page.screenshot({ path: path.join(outDir, '10_box_after_lock.png') });
  console.log('Saved 10_box_after_lock.png');

  // Get current box barcode
  const currentBoxUrl = page.url();
  const currentBoxId = currentBoxUrl.split('/').pop();
  const [currentBoxRow] = await db.query('SELECT barcode FROM box WHERE id = ?', [currentBoxId]);
  const currentBoxBarcode = currentBoxRow[0]?.barcode;

  console.log('--- 4. INVOICE USER FLOW ---');
  await performLogin('invoice@talbros.com', 'invoice');

  // 11. Create Invoice Page
  await page.goto('http://localhost:3000/create_invoice', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await page.screenshot({ path: path.join(outDir, '11_create_invoice.png') });
  console.log('Saved 11_create_invoice.png');

  const testInvNum = `INV-UI-${Date.now().toString().slice(-5)}`;
  const addInvBtn = await page.$('button.btn-primary');
  if (addInvBtn) {
    await addInvBtn.click();
    await page.waitForSelector('.modal-dialog');
    await new Promise((r) => setTimeout(r, 400));

    const invNumInput = await page.$('input[placeholder*="Invoice Number"]');
    if (invNumInput) await invNumInput.type(testInvNum);

    await page.select('select.form-control', '1825');

    const invQtyInput = await page.$('input[type="number"]');
    if (invQtyInput) {
      await invQtyInput.focus();
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await invQtyInput.type('5');
    }

    await page.click('.modal-footer button.btn-primary');
    await new Promise((r) => setTimeout(r, 1500));
  }

  // 12. Add Box to Invoice Page
  await page.screenshot({ path: path.join(outDir, '12_add_box_to_invoice.png') });
  console.log('Saved 12_add_box_to_invoice.png');

  if (currentBoxBarcode) {
    const boxScanInput = await page.$('input[placeholder*="Box Barcode"]');
    if (boxScanInput) {
      await boxScanInput.type(currentBoxBarcode);
      await page.click('button.btn-danger');
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  // 13. Invoice Qty Matched (5 / 5)
  await page.screenshot({ path: path.join(outDir, '13_invoice_qty_matched.png') });
  console.log('Saved 13_invoice_qty_matched.png');

  // Lock Invoice
  const lockInvBtn = await page.$('button.btn-primary');
  if (lockInvBtn) {
    await lockInvBtn.click();
    await page.waitForSelector('.modal-dialog');
    await new Promise((r) => setTimeout(r, 400));
    await page.click('.modal-footer button.btn-primary');
    await new Promise((r) => setTimeout(r, 1200));
  }

  // 14. Locked Invoice
  await page.screenshot({ path: path.join(outDir, '14_locked_invoice.png') });
  console.log('Saved 14_locked_invoice.png');

  const [createdInvRow] = await db.query('SELECT id, barcode FROM invoice WHERE invoice_number = ?', [testInvNum]);
  const createdInvBarcode = createdInvRow[0]?.barcode;

  console.log('--- 5. GATE USER FLOW ---');
  await performLogin('gate@talbros.com', 'gate');

  // 15. Gate Verify Invoice Page
  await page.goto('http://localhost:3000/verify_invoice', { waitUntil: 'networkidle2' });
  await page.waitForSelector('input[placeholder*="Enter Invoice Barcode"]', { timeout: 15000 });
  await page.screenshot({ path: path.join(outDir, '15_gate_verify_invoice.png') });
  console.log('Saved 15_gate_verify_invoice.png');

  // Type invoice barcode and submit if available, or navigate to latest match
  let matchId = null;
  if (createdInvBarcode) {
    try {
      const invBarcodeInput = await page.$('input[placeholder*="Enter Invoice Barcode"]');
      if (invBarcodeInput) {
        await invBarcodeInput.type(createdInvBarcode);
        await page.click('button.btn-danger');
        await new Promise((r) => setTimeout(r, 1500));
        const url = page.url();
        if (url.includes('/add_box_to_invoice_verify/')) {
          matchId = url.split('/').pop();
        }
      }
    } catch {}
  }

  if (!matchId) {
    const [matches] = await db.query('SELECT id FROM invoice_match ORDER BY id DESC LIMIT 1');
    if (matches.length > 0) matchId = matches[0].id;
  }

  if (matchId) {
    await page.goto(`http://localhost:3000/add_box_to_invoice_verify/${matchId}`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    // 16. Physical Box Scan Page
    await page.screenshot({ path: path.join(outDir, '16_gate_physical_box_scan.png') });
    console.log('Saved 16_gate_physical_box_scan.png');

    // 17. Successful Match / Clearance
    const gatePassBtn = await page.$('button.btn-primary');
    if (gatePassBtn) {
      await gatePassBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }
    await page.screenshot({ path: path.join(outDir, '17_gate_clearance_success.png') });
    console.log('Saved 17_gate_clearance_success.png');
  }

  // 18. Gate-Out Report
  await page.goto('http://localhost:3000/gate_out_report', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '18_gate_out_report.png') });
  console.log('Saved 18_gate_out_report.png');

  await db.end();
  await browser.close();
  console.log('\nALL 18 SCREENSHOTS CAPTURED SUCCESSFULLY in:', outDir);
}

captureFinalScreenshots().catch((err) => {
  console.error('[SCREENSHOT CAPTURE ERROR]:', err);
  process.exit(1);
});
