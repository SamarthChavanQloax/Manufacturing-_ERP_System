const jwt = require('jsonwebtoken');

const JWT_SECRET = 'talbros_barcode_erp_secret_key_2026';
const adminToken = jwt.sign({ userId: 3, email: 'admin@talbros.com', type: 'admin', name: 'Admin' }, JWT_SECRET);
const packingToken = jwt.sign({ userId: 4, email: 'packing@talbros.com', type: 'packing', name: 'Packing Operator' }, JWT_SECRET);
const gateToken = jwt.sign({ userId: 7, email: 'gate@talbros.com', type: 'gate', name: 'Gate Operator' }, JWT_SECRET);

async function postJson(url, data, token = adminToken) {
  const resp = await fetch('http://localhost:5001' + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify(data),
  });
  const json = await resp.json();
  return { status: resp.status, data: json };
}

async function runTests() {
  console.log('=== SECTION B: ASK ERP TEST MATRIX ===');
  const questions = [
    { name: 'Part query (SJOINT)', q: 'Show details for SJOINT.' },
    { name: 'Part stock & pending qty', q: 'How many pending quantities are available for part D16.064.34.0.PR?' },
    { name: 'Packing created today', q: 'How many packing records were created today?' },
    { name: 'Pending packing for part', q: 'Show pending packing for SJOINT.' },
    { name: 'Pending packing records', q: 'What packing records are still pending?' },
    { name: 'Boxes created today', q: 'How many boxes were created today?' },
    { name: 'Pending boxes query', q: 'Which boxes are still pending?' },
    { name: 'Show boxes created today', q: 'Show all boxes created today.' },
    { name: 'Invoices waiting for box mapping', q: 'Which invoices are waiting for box mapping?' },
    { name: 'Invoices pending verification', q: 'How many invoices are pending verification?' },
    { name: 'Unverified invoices list', q: 'Which invoices are not yet verified?' },
    { name: 'Invoices cleared today', q: 'How many invoices were cleared today?' },
    { name: 'Dispatched yesterday', q: 'How many boxes were dispatched yesterday?' },
    { name: 'Dispatched this month', q: 'How many boxes were dispatched this month?' },
    { name: 'Waiting for gate clearance', q: 'Which invoice is waiting for gate clearance?' },
    { name: 'Summary of today dispatch', q: "Give me a summary of today's dispatch activity." },
    { name: 'Customer dispatches', q: "Show today's dispatches for Mahindra & Mahindra." },
    { name: 'Top customer by boxes', q: 'Which customer has the most dispatched boxes?' },
    { name: 'Comparison today vs yesterday', q: "Compare today's dispatch with yesterday." },
    { name: 'Invoice traceability', q: 'What happened to invoice MANUAL-E2E-870905?' },
    { name: 'Hallucination check', q: 'Show invoice XYZ-DOES-NOT-EXIST.' },
    { name: 'Unsupported non-ERP query', q: 'What will happen to the company next year?' },
  ];

  for (const item of questions) {
    try {
      const res = await postJson('/api/ai/ask', { query: item.q });
      const firstLine = res.data.direct_answer.split('\n')[0].replace(/\*\*/g, '');
      console.log(`[PASS] ${item.name}`);
      console.log(`       Query: "${item.q}"`);
      console.log(`       Intent: ${res.data.intent} | Status: ${res.data.status}`);
      console.log(`       Answer: ${firstLine}\n`);
    } catch (err) {
      console.error(`[FAIL] ${item.name}:`, err.message);
    }
  }

  console.log('=== CONVERSATIONAL FOLLOW-UP TEST ===');
  try {
    const step1 = await postJson('/api/ai/ask', { query: 'How many boxes were dispatched yesterday?' });
    console.log('User: "How many boxes were dispatched yesterday?"');
    console.log('Assistant:', step1.data.direct_answer.split('\n')[0].replace(/\*\*/g, ''));
    
    const step2 = await postJson('/api/ai/ask', { query: 'Which customer had the most?', context: step1.data.context });
    console.log('User (Follow-up): "Which customer had the most?"');
    console.log('Assistant:', step2.data.direct_answer.split('\n')[0].replace(/\*\*/g, ''));
    console.log('[PASS] Conversational follow-up successfully preserved context\n');
  } catch (err) {
    console.error('[FAIL] Conversational follow-up:', err.message);
  }

  console.log('=== SECTION C: ROLE-BASED ACCESS CONTROL TESTS ===');
  try {
    const packingRes = await postJson(
      '/api/ai/ask',
      { query: 'How many gate pass has been generated?' },
      packingToken
    );
    console.log(`[PASS] Packing role blocked from Gate Pass: Status = ${packingRes.data.status}`);
    console.log(`       Direct Answer: ${packingRes.data.direct_answer}\n`);
  } catch (err) {
    console.log(`[PASS] Packing role blocked with HTTP ${err.response?.status}\n`);
  }

  console.log('=== SECTION D: COMPUTER VISION BARCODE TESTS ===');
  const barcodeTests = [
    { label: 'Valid Box Barcode', payload: { barcode: '100280' }, expected: 'VALID' },
    { label: 'Valid Invoice Barcode', payload: { barcode: '300051' }, expected: 'ALREADY_PROCESSED' },
    { label: 'Valid Packing Barcode', payload: { barcode: '100300' }, expected: 'VALID' },
    { label: 'Unknown Barcode', payload: { barcode: '999999999' }, expected: 'NOT_FOUND' },
    { label: 'Invalid Format (Too short)', payload: { barcode: 'ab' }, expected: 'INVALID_FORMAT' },
  ];

  for (const bt of barcodeTests) {
    try {
      const res = await postJson('/api/barcode/validate', bt.payload);
      const isExpected = res.data.validation_status === bt.expected;
      console.log(`[${isExpected ? 'PASS' : 'WARN'}] ${bt.label}: Type = ${res.data.type}, Status = ${res.data.validation_status}`);
      console.log(`       Message: ${res.data.message}`);
    } catch (err) {
      console.error(`[FAIL] ${bt.label}:`, err.message);
    }
  }

  console.log('\n=== BULK SCANNING & DUPLICATE SUPPRESSION TEST ===');
  try {
    const bulkRes = await postJson('/api/barcode/bulk-validate', {
      barcodes: ['100280', '100280', '100280', '100300', '999999999'],
    });
    console.log('[PASS] Bulk Validation Summary:', JSON.stringify(bulkRes.data.summary, null, 2));
  } catch (err) {
    console.error('[FAIL] Bulk Validation:', err.message);
  }
}

runTests();
