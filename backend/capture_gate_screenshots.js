const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

async function captureGateScreenshots() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outDir = path.resolve(__dirname, '..', 'docs', 'screenshots', 'final_verification');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const db = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'barcode',
    password: 'barcode',
    database: 'barcode'
  });

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

  try {
    // 1. Login directly by obtaining gate token via API and setting localStorage
    console.log('Logging in as Gate...');
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gate@talbros.com', password: 'gate' })
    });
    const authData = await loginRes.json();
    if (!authData.access_token) {
      throw new Error('Gate login API failed: ' + JSON.stringify(authData));
    }

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.evaluate((token, user) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, authData.access_token, authData.user);

    // 15. Gate Verify Invoice Page
    console.log('Navigating to /verify_invoice...');
    await page.goto('http://localhost:3000/verify_invoice', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[placeholder*="Enter Invoice Barcode"]', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, '15_gate_verify_invoice.png') });
    console.log('Saved 15_gate_verify_invoice.png');

    // Find the most recent invoice_match
    const [matches] = await db.query(
      'SELECT im.id, im.invoice_number, im.status FROM invoice_match im ORDER BY im.id DESC LIMIT 1'
    );
    const lastMatch = matches[0];
    console.log('Latest match record:', lastMatch);

    if (lastMatch) {
      // 16. Physical Box Scan Page (or match detail page)
      await page.goto(`http://localhost:3000/add_box_to_invoice_verify/${lastMatch.id}`, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(outDir, '16_gate_physical_box_scan.png') });
      console.log('Saved 16_gate_physical_box_scan.png');

      // 17. Successful Match / Clearance (Gate Pass Modal if available or matched badge)
      // Check if Gate Pass button is available
      const gatePassBtn = await page.$('button.btn-primary');
      if (gatePassBtn) {
        await gatePassBtn.click();
        await new Promise((r) => setTimeout(r, 800));
      }
      await page.screenshot({ path: path.join(outDir, '17_gate_clearance_success.png') });
      console.log('Saved 17_gate_clearance_success.png');
    }

    // 18. Gate-Out Report Page
    console.log('Navigating to /gate_out_report...');
    await page.goto('http://localhost:3000/gate_out_report', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(outDir, '18_gate_out_report.png') });
    console.log('Saved 18_gate_out_report.png');

    console.log('--- ALL GATE SCREENSHOTS CAPTURED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during gate screenshot capture:', err);
  } finally {
    await browser.close();
    await db.end();
  }
}

captureGateScreenshots();
