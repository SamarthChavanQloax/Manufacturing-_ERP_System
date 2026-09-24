const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureAll() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outDir = path.resolve(__dirname, '..', 'docs', 'screenshots', 'new');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Launching headless Chrome from:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Login Page
  console.log('1. Capturing Login Page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, '01_new_login_page.png') });

  // Perform Login
  console.log('Logging in as admin...');
  await page.type('input[type="email"]', 'admin@admin.com');
  await page.type('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  // 2. Admin Dashboard
  console.log('2. Capturing Dashboard...');
  await page.screenshot({ path: path.join(outDir, '02_new_admin_dashboard.png') });

  // 3. Part Master
  console.log('3. Capturing Part Master...');
  await page.goto('http://localhost:3000/part_master', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '03_new_part_master.png') });

  // 4. Part Stock
  console.log('4. Capturing Part Stock...');
  await page.goto('http://localhost:3000/part_stock', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '04_new_part_stock.png') });

  // 5. Customer Master
  console.log('5. Capturing Customer Master...');
  await page.goto('http://localhost:3000/customer', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '05_new_customer_master.png') });

  // 5-b. Customer Edit Modal
  console.log('5-b. Capturing Customer Edit Modal...');
  const editBtn = await page.$('.data-table tbody tr:first-child button[title="Edit Customer"]');
  if (editBtn) {
    await editBtn.click();
    await page.waitForSelector('.modal-dialog');
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outDir, '05_new_customer_edit_modal.png') });
    // Close modal
    const closeBtn = await page.$('.modal-header button');
    if (closeBtn) await closeBtn.click();
    await new Promise((r) => setTimeout(r, 300));
  }

  // 6. Create Packing
  console.log('6. Capturing Create Packing...');
  await page.goto('http://localhost:3000/create_packing', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '06_new_create_packing.png') });

  // 7. Create Bulk Packing
  console.log('7. Capturing Create Bulk Packing...');
  await page.goto('http://localhost:3000/create_packing_bulk', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '07_new_create_packing_bulk.png') });

  // 8. View Packing
  console.log('8. Capturing View Packing...');
  await page.goto('http://localhost:3000/view_packing', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '08_new_view_packing.png') });

  // 9. Create Box
  console.log('9. Capturing Create Box...');
  await page.goto('http://localhost:3000/create_box', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '09_new_create_box.png') });

  // 10. View Box
  console.log('10. Capturing View Box...');
  await page.goto('http://localhost:3000/view_box', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '10_new_view_box.png') });

  // 11. Create Invoice
  console.log('11. Capturing Create Invoice...');
  await page.goto('http://localhost:3000/create_invoice', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '11_new_create_invoice.png') });

  // 12. Verify Invoice
  console.log('12. Capturing Verify Invoice...');
  await page.goto('http://localhost:3000/verify_invoice', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '12_new_verify_invoice.png') });

  // 13. Gate Out Report
  console.log('13. Capturing Gate Out Report...');
  await page.goto('http://localhost:3000/gate_out_report', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.data-table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '13_new_gate_out_report.png') });

  // 14. ERP Users
  console.log('14. Capturing ERP Users...');
  await page.goto('http://localhost:3000/erp_users', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.table tbody tr');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '14_new_erp_users.png') });

  await browser.close();
  console.log('All parity screenshots captured successfully in:', outDir);
}

captureAll().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
