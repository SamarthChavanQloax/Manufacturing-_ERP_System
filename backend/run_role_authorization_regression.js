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

  return { status: res.status, ok: res.ok, data };
}

async function runRoleAuthorizationRegression() {
  console.log('====================================================');
  console.log('STARTING 5-ROLE RBAC & AUTHORIZATION REGRESSION');
  console.log('Testing Admin, Packing, Box, Invoice, Gate, & Anon');
  console.log('====================================================\n');

  async function login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user_email: email, user_password: password }),
    });
    return {
      token: res.data.access_token,
      user: res.data.user,
      headers: { Authorization: `Bearer ${res.data.access_token}` },
    };
  }

  // 1. Authenticate all 5 roles
  console.log('--- 1. Authenticating All 5 Roles ---');
  const admin = await login('admin@admin.com', 'admin');
  const packing = await login('dpr@talbros.com', 'dpr');
  const box = await login('fgs@talbros.com', 'fgs');
  const invoice = await login('invoice@talbros.com', 'invoice');
  const gate = await login('gate@talbros.com', 'gate');
  console.log('[PASS] All 5 role credentials verified.');

  // 2. Unauthenticated and Malformed Token tests
  console.log('\n--- 2. Unauthenticated & Invalid Token Security Tests ---');
  const noTokenRes = await request('/users');
  if (noTokenRes.status !== 401) throw new Error(`Expected 401 for unauthenticated request, got ${noTokenRes.status}`);
  console.log(`[PASS] Missing token rejected: HTTP ${noTokenRes.status} Unauthorized`);

  const badTokenRes = await request('/users', { headers: { Authorization: 'Bearer INVALID_JWT_TOKEN_ABC123' } });
  if (badTokenRes.status !== 401) throw new Error(`Expected 401 for invalid token, got ${badTokenRes.status}`);
  console.log(`[PASS] Malformed token rejected: HTTP ${badTokenRes.status} Unauthorized`);

  // 3. Matrix of Protected Endpoints vs Roles
  console.log('\n--- 3. Testing RBAC Access Matrix Across Endpoints ---');
  const rbacTests = [
    // /api/users -> Admin only
    { endpoint: '/users', method: 'GET', allowedRole: 'admin', expectedAllowed: [admin], expectedDenied: [packing, box, invoice, gate] },
    // /api/customers (Read) -> Admin and Box only (Box needs customer dropdown)
    { endpoint: '/customers', method: 'GET', allowedRole: 'admin, box', expectedAllowed: [admin, box], expectedDenied: [packing, invoice, gate] },
    // /api/customers (Write) -> Admin only
    { endpoint: '/customers', method: 'POST', body: { customer_name: 'TEST_AUTH' }, allowedRole: 'admin', expectedAllowed: [admin], expectedDenied: [packing, box, invoice, gate] },
    // /api/packing -> Admin and Packing only
    { endpoint: '/packing', method: 'GET', allowedRole: 'admin, packing', expectedAllowed: [admin, packing], expectedDenied: [box, invoice, gate] },
    // /api/boxes -> Admin and Box only
    { endpoint: '/boxes', method: 'GET', allowedRole: 'admin, box', expectedAllowed: [admin, box], expectedDenied: [packing, invoice, gate] },
    // /api/invoices -> Admin and Invoice only
    { endpoint: '/invoices', method: 'GET', allowedRole: 'admin, invoice', expectedAllowed: [admin, invoice], expectedDenied: [packing, box, gate] },
    // /api/verification -> Admin and Gate only
    { endpoint: '/verification', method: 'GET', allowedRole: 'admin, gate', expectedAllowed: [admin, gate], expectedDenied: [packing, box, invoice] },
  ];

  const results = [];

  for (const test of rbacTests) {
    // Test allowed users
    for (const user of test.expectedAllowed) {
      const res = await request(test.endpoint, {
        method: test.method,
        headers: user.headers,
        body: test.body ? JSON.stringify(test.body) : undefined,
      });
      const pass = res.status === 200 || res.status === 201;
      if (!pass) throw new Error(`RBAC Failure: ${user.user.type} should be allowed on ${test.endpoint}, got ${res.status}`);
      results.push({ endpoint: `${test.method} ${test.endpoint}`, role: user.user.type, expected: 'ALLOW (200/201)', actual: res.status, status: 'PASS' });
    }

    // Test denied users
    for (const user of test.expectedDenied) {
      const res = await request(test.endpoint, {
        method: test.method,
        headers: user.headers,
        body: test.body ? JSON.stringify(test.body) : undefined,
      });
      const pass = res.status === 403;
      if (!pass) throw new Error(`RBAC Failure: ${user.user.type} should be forbidden on ${test.endpoint}, got ${res.status}`);
      results.push({ endpoint: `${test.method} ${test.endpoint}`, role: user.user.type, expected: 'FORBIDDEN (403)', actual: res.status, status: 'PASS' });
    }
  }

  console.log(`[PASS] Tested ${results.length} distinct RBAC role-route combinations.`);
  console.log('\n====================================================');
  console.log('RBAC & ROLE AUTHORIZATION SUITE PASSED (ALL PASS)');
  console.log('====================================================');
  console.table(results);

  return { success: true, count: results.length };
}

runRoleAuthorizationRegression().catch(err => {
  console.error('[RBAC REGRESSION ERROR]:', err);
  process.exit(1);
});
