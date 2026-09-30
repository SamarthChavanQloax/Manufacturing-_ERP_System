const BASE_URL = process.env.BASE_URL || 'http://localhost:5001/api';

async function main() {
  console.log('====================================================');
  console.log('  STARTING ASK ERP AI ASSISTANT REGRESSION TEST SUITE');
  console.log('====================================================\n');

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

    record(1, 'Authentication for Ask ERP Testing', 'admin and gate tokens received', { admin: !!adminToken, gate: !!gateToken }, !!adminToken && !!gateToken);
  } catch (err) {
    record(1, 'Authentication for Ask ERP Testing', 'tokens', err.message, false);
    console.error('Login failed, aborting suite');
    process.exit(1);
  }

  // 2. Test Role Suggestions
  try {
    const adminSugRes = await fetch(`${BASE_URL}/ai/ask/suggestions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminSug = await adminSugRes.json();
    const hasAdminPrompts = Array.isArray(adminSug.suggestions) && adminSug.suggestions.length >= 3;
    record(2, 'Admin Role Suggestions Endpoint', '>= 3 starter prompts', { count: adminSug.suggestions?.length }, hasAdminPrompts);

    const gateSugRes = await fetch(`${BASE_URL}/ai/ask/suggestions`, {
      headers: { Authorization: `Bearer ${gateToken}` },
    });
    const gateSug = await gateSugRes.json();
    const isGateRole = gateSug.role === 'gate' && Array.isArray(gateSug.suggestions);
    record(3, 'Gate Role Suggestions Endpoint', 'role is gate with prompts', { role: gateSug.role, count: gateSug.suggestions?.length }, isGateRole);
  } catch (err) {
    record(2, 'Role Suggestions Endpoint', 'prompts', err.message, false);
  }

  // 3. Test Question: "Which invoices are waiting for box mapping?"
  try {
    const askRes1 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ query: 'Which invoices are waiting for box mapping?' }),
    });
    const ans1 = await askRes1.json();
    const valid1 = ans1.status === 'success' && ans1.intent === 'INVOICES_WAITING_FOR_BOXES' && typeof ans1.direct_answer === 'string';
    record(4, 'Query: Invoices Waiting for Box Mapping', 'status success, intent INVOICES_WAITING_FOR_BOXES', { status: ans1.status, intent: ans1.intent, answerSnippet: ans1.direct_answer?.slice(0, 60) }, valid1);
  } catch (err) {
    record(4, 'Query: Invoices Waiting for Box Mapping', 'success', err.message, false);
  }

  // 4. Test Question: "How many boxes of SJOINT were dispatched yesterday?"
  try {
    const askRes2 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ query: 'How many boxes of SJOINT were dispatched yesterday?' }),
    });
    const ans2 = await askRes2.json();
    const valid2 = ans2.status === 'success' && (ans2.intent === 'BOXES_DISPATCHED_QUERY' || ans2.intent === 'YESTERDAY_DISPATCH_QUERY') && (ans2.data_summary?.count !== undefined || ans2.direct_answer);
    record(5, 'Query: Boxes Dispatched Yesterday', 'status success, intent BOXES_DISPATCHED_QUERY / YESTERDAY_DISPATCH_QUERY', { status: ans2.status, intent: ans2.intent, count: ans2.data_summary?.count }, valid2);
  } catch (err) {
    record(5, 'Query: Boxes Dispatched Yesterday', 'success', err.message, false);
  }

  // 5. Test Question: "Which parts are low in stock?"
  try {
    const askRes3 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ query: 'Which parts are low in stock?' }),
    });
    const ans3 = await askRes3.json();
    const valid3 = ans3.status === 'success' && (ans3.intent === 'STOCK_INTELLIGENCE_QUERY' || ans3.intent === 'PART_DETAILS_QUERY') && (Array.isArray(ans3.data_summary?.items) || ans3.direct_answer);
    record(6, 'Query: Low Stock Inventory Check', 'status success, intent STOCK_INTELLIGENCE_QUERY / PART_DETAILS_QUERY', { status: ans3.status, itemsCount: ans3.data_summary?.items?.length }, valid3);
  } catch (err) {
    record(6, 'Query: Low Stock Inventory Check', 'success', err.message, false);
  }

  // 6. Test Role-Based Restriction: Gate user asking for Invoice Box Mapping
  try {
    const askRes4 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gateToken}`,
      },
      body: JSON.stringify({ query: 'Which invoices are waiting for box mapping?' }),
    });
    const ans4 = await askRes4.json();
    const isRestricted = ans4.status === 'access_denied' && ans4.security_audit?.authorized === false;
    record(7, 'Role-Aware Security Restriction for Gate Operator', 'status access_denied, authorized false', { status: ans4.status, authorized: ans4.security_audit?.authorized }, isRestricted);
  } catch (err) {
    record(7, 'Role-Aware Security Restriction for Gate Operator', 'access_denied', err.message, false);
  }

  // 7. Test Navigation Shortcut Query: "Where do I add a new part?"
  try {
    const askRes5 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ query: 'Where do I add a new part?' }),
    });
    const ans5 = await askRes5.json();
    const hasNav = ans5.status === 'success' && Array.isArray(ans5.suggested_actions) && ans5.suggested_actions.some((a) => a.url === '/part_master');
    record(8, 'Navigation Shortcut Extraction', 'suggests /part_master', { actions: ans5.suggested_actions?.map((a) => a.url) }, hasNav);
  } catch (err) {
    record(8, 'Navigation Shortcut Extraction', 'navigation link', err.message, false);
  }

  // 8. Test Question: "how many notification messages are remaining?"
  try {
    const askRes6 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ query: 'how many notification messages are remaining?' }),
    });
    const ans6 = await askRes6.json();
    const valid6 = ans6.status === 'success' && ans6.intent === 'NOTIFICATION_STATUS_QUERY' && ans6.data_summary?.count !== undefined;
    record(9, 'Query: How many notification messages are remaining?', 'status success, intent NOTIFICATION_STATUS_QUERY', { status: ans6.status, intent: ans6.intent, answer: ans6.direct_answer }, valid6);
  } catch (err) {
    record(9, 'Query: How many notification messages are remaining?', 'success', err.message, false);
  }

  // 9. Test Question: "how many entities in part master?"
  try {
    const askRes7 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ query: 'how many entities in part master?' }),
    });
    const ans7 = await askRes7.json();
    const valid7 = ans7.status === 'success' && ans7.intent === 'PART_MASTER_COUNT_QUERY' && ans7.data_summary?.count > 0;
    record(10, 'Query: How many entities in part master?', 'status success, intent PART_MASTER_COUNT_QUERY', { status: ans7.status, intent: ans7.intent, count: ans7.data_summary?.count }, valid7);
  } catch (err) {
    record(10, 'Query: How many entities in part master?', 'success', err.message, false);
  }

  // 10. Test Question: "how many gate pass has been generated?"
  try {
    const askRes8 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ query: 'how many gate pass has been generated?' }),
    });
    const ans8 = await askRes8.json();
    const valid8 = ans8.status === 'success' && ans8.intent === 'GATE_PASS_COUNT_QUERY' && ans8.data_summary?.count !== undefined;
    record(11, 'Query: How many gate pass has been generated?', 'status success, intent GATE_PASS_COUNT_QUERY', { status: ans8.status, intent: ans8.intent, answer: ans8.direct_answer }, valid8);
  } catch (err) {
    record(11, 'Query: How many gate pass has been generated?', 'success', err.message, false);
  }

  // 11. Test Question: "how many customer count ?"
  try {
    const askRes9 = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ query: 'how many customer count ?' }),
    });
    const ans9 = await askRes9.json();
    const valid9 = ans9.status === 'success' && ans9.intent === 'CUSTOMER_COUNT_QUERY' && ans9.data_summary?.count > 0;
    record(12, 'Query: How many customer count ?', 'status success, intent CUSTOMER_COUNT_QUERY', { status: ans9.status, intent: ans9.intent, count: ans9.data_summary?.count }, valid9);
  } catch (err) {
    record(12, 'Query: How many customer count ?', 'success', err.message, false);
  }

  console.log('\n====================================================');
  console.log('              REGRESSION SUITE SUMMARY');
  console.log('====================================================');
  const allPassed = results.every((r) => r.status === 'PASS');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed:      ${results.filter((r) => r.status === 'PASS').length}`);
  console.log(`Failed:      ${results.filter((r) => r.status === 'FAIL').length}`);
  console.log(`Final Verdict: ${allPassed ? 'ALL TESTS PASSED' : 'TESTS FAILED'}`);

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
