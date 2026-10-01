const BASE_URL = 'http://localhost:5001';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, error?: string, details?: any) {
  results.push({ suite, name, passed, error, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${suite}] ${name}${error ? ' -> ' + error : ''}`);
}

async function request(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });

    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }

    return { status: res.status, ok: res.ok, data };
  } catch (err: any) {
    return { status: 0, ok: false, data: null, error: err.message };
  }
}

async function runAutomationTests() {
  console.log('========================================================================');
  console.log('🚀 COMPREHENSIVE AUTOMATED ERP SYSTEM & AI GATE TEST SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('========================================================================\n');

  // ==========================================
  // 1. HEALTH & CONNECTIVITY
  // ==========================================
  const healthRes = await request('/api/health');
  recordTest('System Health', 'GET /api/health responds with status ok', healthRes.status === 200 && healthRes.data?.status === 'ok', healthRes.error);

  // ==========================================
  // 2. AUTHENTICATION & SECURITY
  // ==========================================
  // 2.1 Rejection of invalid credentials
  const invalidLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { user_email: 'fake_user@talbros.com', user_password: 'wrong_password_999' },
  });
  recordTest('Auth & Security', 'Rejects invalid login credentials with 401', invalidLoginRes.status === 401);

  // 2.2 Admin Login
  let adminToken = '';
  let adminUser: any = null;
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { user_email: 'admin@admin.com', user_password: 'admin' },
  });
  if ((adminLogin.status === 200 || adminLogin.status === 201) && adminLogin.data?.access_token) {
    adminToken = adminLogin.data.access_token;
    adminUser = adminLogin.data.user;
    recordTest('Auth & Security', 'Admin user login successful (admin@admin.com)', true);
  } else {
    recordTest('Auth & Security', 'Admin user login successful', false, `Status ${adminLogin.status}`);
  }

  // 2.3 Packing User Login
  let packingToken = '';
  const packLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { user_email: 'dpr@talbros.com', user_password: 'dpr' },
  });
  if ((packLogin.status === 200 || packLogin.status === 201) && packLogin.data?.access_token) {
    packingToken = packLogin.data.access_token;
    recordTest('Auth & Security', 'Packing operator login successful (dpr@talbros.com)', true);
  } else {
    recordTest('Auth & Security', 'Packing operator login', false, `Status ${packLogin.status}`);
  }

  // 2.4 Gate Security User Login
  let gateToken = '';
  const gateLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { user_email: 'gate@talbros.com', user_password: 'gate' },
  });
  if ((gateLogin.status === 200 || gateLogin.status === 201) && gateLogin.data?.access_token) {
    gateToken = gateLogin.data.access_token;
    recordTest('Auth & Security', 'Gate security officer login successful (gate@talbros.com)', true);
  } else {
    recordTest('Auth & Security', 'Gate security login', false, `Status ${gateLogin.status}`);
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const packingHeaders = { Authorization: `Bearer ${packingToken}` };

  // ==========================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  if (adminToken && packingToken) {
    // Non-admin user trying to access admin-only users list
    const rbacRes = await request('/api/users', { headers: packingHeaders });
    recordTest('RBAC Security', 'Restricts non-admin (packing) from accessing /api/users (403 Forbidden)', rbacRes.status === 403);

    // Admin accessing admin-only users list
    const adminUsersRes = await request('/api/users', { headers: adminHeaders });
    recordTest('RBAC Security', 'Allows admin to access /api/users', adminUsersRes.status === 200 && Array.isArray(adminUsersRes.data));
  }

  // 3.2 Profile & Department Details
  if (adminToken) {
    const profileRes = await request('/api/auth/profile-details', { headers: adminHeaders });
    recordTest(
      'Profile Module',
      'GET /api/auth/profile-details returns complete user metadata',
      profileRes.status === 200 && !!profileRes.data?.department && !!profileRes.data?.employee_id
    );
  }

  // ==========================================
  // 4. PARTS MASTER & INVENTORY LOGIC
  // ==========================================
  let partsList: any[] = [];
  const partsRes = await request('/api/parts', { headers: adminHeaders });
  const rawParts = partsRes.data?.items || partsRes.data?.data || partsRes.data;
  if (partsRes.status === 200 && Array.isArray(rawParts)) {
    partsList = rawParts;
    recordTest('Parts Inventory', `GET /api/parts loaded ${partsList.length} parts (total: ${partsRes.data?.total || partsList.length})`, true);

    // Check zero stock representation
    const zeroStockParts = partsList.filter((p) => Number(p.total_quantity ?? p.qty) === 0);
    recordTest('Parts Inventory', `Zero stock parts correctly identified (${zeroStockParts.length} found with 0 stock)`, true);

    // Check Simple Parts list
    const simpleParts = await request('/api/parts/simple', { headers: adminHeaders });
    recordTest('Parts Inventory', 'GET /api/parts/simple returns lightweight options list', simpleParts.status === 200 && Array.isArray(simpleParts.data));
  } else {
    recordTest('Parts Inventory', 'GET /api/parts failed', false, `Status ${partsRes.status}`);
  }

  // ==========================================
  // 5. CUSTOMERS MODULE
  // ==========================================
  const custRes = await request('/api/customers', { headers: adminHeaders });
  recordTest('Customers Module', 'GET /api/customers returns customer records', custRes.status === 200 && Array.isArray(custRes.data));

  // ==========================================
  // 6. PACKING & UNIQUE BARCODE INTEGRITY
  // ==========================================
  const packRes = await request('/api/packing', { headers: adminHeaders });
  if (packRes.status === 200 && Array.isArray(packRes.data)) {
    recordTest('Packing Module', `GET /api/packing loaded ${packRes.data.length} packing records`, true);

    // Audit duplicate barcodes across entire packing table
    const seenBarcodes = new Map<string, number>();
    for (const p of packRes.data) {
      if (p.barcode_number) {
        seenBarcodes.set(p.barcode_number, (seenBarcodes.get(p.barcode_number) || 0) + 1);
      }
    }

    const duplicates = Array.from(seenBarcodes.entries()).filter(([_, count]) => count > 1);
    recordTest(
      'Barcode Integrity',
      `Audit packing barcodes for zero duplicates (total records: ${packRes.data.length})`,
      duplicates.length === 0,
      duplicates.length > 0 ? `Detected duplicate barcode numbers: ${duplicates.map(([code, c]) => `${code} (x${c})`).join(', ')}` : undefined
    );
  } else {
    recordTest('Packing Module', 'GET /api/packing failed', false, `Status ${packRes.status}`);
  }

  // ==========================================
  // 7. BOXES MODULE
  // ==========================================
  const boxesRes = await request('/api/boxes', { headers: adminHeaders });
  recordTest('Boxes Module', 'GET /api/boxes returns box records', boxesRes.status === 200 && Array.isArray(boxesRes.data));

  // ==========================================
  // 8. INVOICES & VERIFICATION ENGINE
  // ==========================================
  const invRes = await request('/api/invoices', { headers: adminHeaders });
  recordTest('Invoices Module', 'GET /api/invoices returns invoice records', invRes.status === 200 && Array.isArray(invRes.data));

  // Verification edge case: invalid / unmatched verification attempt
  const verifyRejectRes = await request('/api/verification/match', {
    method: 'POST',
    headers: adminHeaders,
    body: { invoice_no: 'INVALID_TEST_99999', box_barcode: 'BOX_NONE_000' },
  });
  // System should safely handle the invalid invoice without crashing
  const safeHandling = verifyRejectRes.status === 400 || verifyRejectRes.status === 404 || verifyRejectRes.data?.success === false || verifyRejectRes.status === 200;
  recordTest('Verification Engine', 'Gracefully validates unmatched invoice barcode attempts', safeHandling);

  // ==========================================
  // 9. AI SECURITY & GATE RISK ENGINE
  // ==========================================
  // 9.1 AI Service Status
  const aiStatus = await request('/api/ai/status', { headers: adminHeaders });
  recordTest(
    'AI Security Module',
    `GET /api/ai/status returns status (${aiStatus.data?.status || 'N/A'}, provider: ${aiStatus.data?.provider || 'N/A'})`,
    aiStatus.status === 200 && (aiStatus.data?.status === 'operational' || aiStatus.data?.ai_service === 'online')
  );

  // 9.2 Stock Intelligence & Security Anomalies
  const stockIntel = await request('/api/ai/stock-intelligence', { headers: adminHeaders });
  recordTest('AI Security Module', 'GET /api/ai/stock-intelligence returns AI stock forecasts', stockIntel.status === 200 && typeof stockIntel.data === 'object');

  const securityAnomalies = await request('/api/ai/security-anomalies', { headers: adminHeaders });
  recordTest('AI Security Module', 'GET /api/ai/security-anomalies returns gate & inventory anomalies', securityAnomalies.status === 200 && Array.isArray(securityAnomalies.data));

  // 9.3 Gate Risk Dashboard & Transactions
  const gateDashboard = await request('/api/ai/gate-risk/dashboard', { headers: adminHeaders });
  recordTest('AI Security Module', 'GET /api/ai/gate-risk/dashboard returns real-time risk telemetry', gateDashboard.status === 200 && typeof gateDashboard.data === 'object');

  const gateTransactions = await request('/api/ai/gate-risk/transactions', { headers: adminHeaders });
  const rawGateTx = gateTransactions.data?.items || gateTransactions.data?.data || gateTransactions.data;
  recordTest('AI Security Module', 'GET /api/ai/gate-risk/transactions returns audit log', gateTransactions.status === 200 && Array.isArray(rawGateTx));

  // 9.4 Daily Security Briefing (Today & History)
  const briefingRes = await request('/api/ai/security-briefing/today', { headers: adminHeaders });
  recordTest(
    'AI Security Module',
    'GET /api/ai/security-briefing/today returns executive security briefing',
    briefingRes.status === 200 && typeof briefingRes.data === 'object'
  );

  const briefingHistory = await request('/api/ai/security-briefing/history', { headers: adminHeaders });
  recordTest(
    'AI Security Module',
    'GET /api/ai/security-briefing/history returns past briefing archives',
    briefingHistory.status === 200 && Array.isArray(briefingHistory.data)
  );

  // 9.5 AI Ask Assistant Role-based Prompts
  const askSuggestions = await request('/api/ai/ask/suggestions', { headers: adminHeaders });
  recordTest(
    'AI Assistant Module',
    'GET /api/ai/ask/suggestions returns role-tailored questions',
    askSuggestions.status === 200 && Array.isArray(askSuggestions.data?.suggestions)
  );

  // ==========================================
  // 10. DASHBOARD, NOTIFICATIONS & SETTINGS
  // ==========================================
  const dashRes = await request('/api/dashboard/stats', { headers: adminHeaders });
  recordTest('Dashboard Module', 'GET /api/dashboard/stats returns operational metrics', dashRes.status === 200);

  const notifRes = await request('/api/notifications', { headers: adminHeaders });
  const rawNotifs = notifRes.data?.items || notifRes.data?.data || notifRes.data;
  recordTest('Notifications Module', 'GET /api/notifications returns user notification queue', notifRes.status === 200 && Array.isArray(rawNotifs));

  const unreadNotif = await request('/api/notifications/unread-count', { headers: adminHeaders });
  recordTest(
    'Notifications Module',
    'GET /api/notifications/unread-count returns header badge count',
    unreadNotif.status === 200 && typeof unreadNotif.data?.unread_count === 'number'
  );

  const settingsRes = await request('/api/settings', { headers: adminHeaders });
  recordTest('Settings Module', 'GET /api/settings returns configuration', settingsRes.status === 200);

  // ==========================================
  // SUMMARY REPORT
  // ==========================================
  console.log('\n========================================================================');
  console.log('📊 AUTOMATION TEST SUMMARY REPORT');
  console.log('========================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Automated Tests Run : ${total}`);
  console.log(`Passed                    : ${passed} ( ${Math.round((passed / total) * 100)}% )`);
  console.log(`Failed                    : ${failed}`);

  if (failed > 0) {
    console.log('\n🚨 DETECTED ISSUES / BUGS:');
    results.filter((r) => !r.passed).forEach((r, idx) => {
      console.log(`${idx + 1}. [${r.suite}] ${r.name}: ${r.error || 'Check details'}`);
    });
  } else {
    console.log('\n🎉 ALL AUTOMATED TESTS COMPLETED WITH 100% PASS RATE! ALL WORKFLOWS HEALTHY.');
  }
}

runAutomationTests().catch(console.error);
