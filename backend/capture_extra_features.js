const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureExtraFeatures() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outDir = path.resolve(__dirname, '..', 'docs', 'screenshots', 'extra');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Launching Chrome from:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Login as admin
  console.log('Logging in as admin...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2000));

  // 1. AI Stock Intelligence
  console.log('Capturing AI Stock Intelligence...');
  await page.goto('http://localhost:3000/ai_stock_intelligence', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'extra_01_ai_stock_intelligence.png') });

  // 2. AI Gate Risk Dashboard
  console.log('Capturing AI Gate Risk Dashboard...');
  await page.goto('http://localhost:3000/ai_gate_risk', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'extra_02_ai_gate_risk.png') });

  // 3. AI Security Briefing
  console.log('Capturing AI Daily Security Briefing...');
  await page.goto('http://localhost:3000/ai_security_briefing', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'extra_03_ai_security_briefing.png') });

  // 4. Activity History Ledger
  console.log('Capturing Activity History Ledger...');
  await page.goto('http://localhost:3000/activity_history', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'extra_04_activity_history.png') });

  // 5. Notifications Page
  console.log('Capturing Notifications Center...');
  await page.goto('http://localhost:3000/notifications', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, 'extra_05_notifications_center.png') });

  console.log('All extra features captured successfully in:', outDir);
  await browser.close();
}

captureExtraFeatures().then(() => {
  console.log('DONE');
  process.exit(0);
}).catch(err => {
  console.error('Error capturing extra screenshots:', err);
  process.exit(1);
});
