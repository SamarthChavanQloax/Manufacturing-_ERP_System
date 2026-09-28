const jwt = require('jsonwebtoken');

const JWT_SECRET = 'talbros_barcode_erp_secret_key_2026';
const adminToken = jwt.sign({ userId: 3, email: 'admin@talbros.com', type: 'admin', name: 'Admin' }, JWT_SECRET);

async function get(url) {
  const resp = await fetch('http://localhost:5001' + url, {
    headers: { Authorization: 'Bearer ' + adminToken },
  });
  return { status: resp.status, data: await resp.json() };
}

async function runRegression() {
  console.log('=== SECTION E: ERP REGRESSION TESTING ===');
  const modules = [
    { name: 'Dashboard Stats', url: '/api/dashboard/stats' },
    { name: 'Part Master List', url: '/api/parts' },
    { name: 'Customer Master List', url: '/api/customers' },
    { name: 'Packing List', url: '/api/packing' },
    { name: 'Boxes List', url: '/api/boxes' },
    { name: 'Invoice List', url: '/api/invoices' },
    { name: 'Gate Verification List', url: '/api/verification' },
    { name: 'Gate Out Reports', url: '/api/reports/gate-out' },
    { name: 'ERP User Accounts', url: '/api/users' },
    { name: 'Notifications Center', url: '/api/notifications' },
    { name: 'AI Gate Risk Dashboard', url: '/api/ai/gate-risk/dashboard' },
  ];

  for (const mod of modules) {
    try {
      const res = await get(mod.url);
      const isOk = res.status === 200;
      console.log(`[${isOk ? 'PASS' : 'FAIL'}] ${mod.name} (${mod.url}): HTTP ${res.status}`);
    } catch (err) {
      console.error(`[FAIL] ${mod.name}:`, err.message);
    }
  }
}

runRegression();
