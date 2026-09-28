const BASE_URL = process.env.BASE_URL || 'http://localhost:5001/api';

const TEST_QUESTIONS = [
  {
    id: 1,
    query: 'give me reports of yesterday',
    check: (res) => {
      const ans = res.direct_answer || '';
      const containsSnapshot = ans.toLowerCase().includes('current real-time factory snapshot');
      const hasAnswer = ans.includes('### Answer');
      const hasPeriod = ans.includes('### Time Period') && ans.includes('27 September 2026');
      const hasAnalysis = ans.includes('### Analysis');
      const hasEvidence = ans.includes('### Evidence');
      const hasZeroPasses = ans.includes('0 gate pass(es) cleared') || ans.includes('0 gate pass');
      return !containsSnapshot && hasAnswer && hasPeriod && hasAnalysis && hasEvidence && hasZeroPasses;
    },
    description: 'Yesterday broad operations report with actual period facts (0 passes, not global snapshot)',
  },
  {
    id: 2,
    query: 'How many boxes were dispatched yesterday?',
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('0 boxes') &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: 'Boxes dispatched yesterday (0 boxes, 27 September 2026)',
  },
  {
    id: 3,
    query: 'How many invoices were created yesterday?',
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('0 invoices') &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: 'Invoices created yesterday (0 invoices, 27 September 2026)',
  },
  {
    id: 4,
    query: 'Which invoices were waiting for box mapping yesterday?',
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('85 invoice(s)') &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: 'Invoices waiting for box mapping yesterday (85 invoices)',
  },
  {
    id: 5,
    query: 'How many gate passes were generated yesterday?',
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('0 gate passes') &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: 'Gate passes generated yesterday (0 passes, 27 September 2026)',
  },
  {
    id: 6,
    query: "Show yesterday's packing activity.",
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('0 packing batches') &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: "Yesterday's packing activity (0 batches, 27 September 2026)",
  },
  {
    id: 7,
    query: "Show yesterday's dispatch summary.",
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes("Yesterday's Dispatch Summary") &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: "Yesterday's dispatch summary (0 cleared passes, 0 boxes)",
  },
  {
    id: 8,
    query: "Compare yesterday's dispatch with today.",
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('Yesterday') &&
        ans.includes('Today') &&
        ans.includes('### Time Period') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: "Compare yesterday's dispatch with today (0 cleared yesterday vs 9 pending today)",
  },
  {
    id: 9,
    query: 'Which customer had the most dispatched boxes yesterday?',
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('0 boxes were dispatched yesterday') &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: 'Top customer dispatched boxes yesterday (0 boxes across all customers)',
  },
  {
    id: 10,
    query: "Show yesterday's activity for SJOINT.",
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('0 activity transactions were recorded for SJOINT') &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: "Yesterday's activity for SJOINT (0 transactions on 2026-09-27)",
  },
  {
    id: 11,
    query: 'What happened yesterday with invoice MANUAL-E2E-870905?',
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('No status changes or actions occurred yesterday') &&
        ans.includes('MANUAL-E2E-870905') &&
        ans.includes('2026-09-19') &&
        ans.includes('### Time Period') &&
        ans.includes('27 September 2026') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: 'What happened yesterday with invoice MANUAL-E2E-870905 (cleared 2026-09-19, 0 events yesterday)',
  },
  {
    id: 12,
    query: "Show me today's report.",
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('28 September 2026') &&
        ans.includes('### Time Period') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: "Show me today's report (Dynamic daily report for 28 September 2026)",
  },
  {
    id: 13,
    query: "Show me last week's report.",
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('gate pass(es) cleared') &&
        ans.includes('### Time Period') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: "Show me last week's report (Dynamic period report for last week)",
  },
  {
    id: 14,
    query: "Show me this month's dispatch summary.",
    check: (res) => {
      const ans = res.direct_answer || '';
      return (
        !ans.includes('current real-time factory snapshot') &&
        ans.includes('### Answer') &&
        ans.includes('September 2026 Dispatch Summary') &&
        ans.includes('23 boxes') &&
        ans.includes('18 verified gate passes') &&
        ans.includes('### Time Period') &&
        ans.includes('### Analysis') &&
        ans.includes('### Evidence')
      );
    },
    description: "This month's dispatch summary (23 boxes across 18 verified gate passes)",
  },
];

async function run() {
  console.log('===============================================================');
  console.log('  RUNNING 14-QUESTION TIME-AWARE ERP ANALYSIS VERIFICATION SUITE');
  console.log('===============================================================\n');

  // Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@admin.com', password: 'admin' }),
  });

  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    process.exit(1);
  }

  const { access_token } = await loginRes.json();
  console.log('Authenticated as ADMIN successfully.\n');

  let passed = 0;
  let failed = 0;

  for (const t of TEST_QUESTIONS) {
    console.log(`---------------------------------------------------------------`);
    console.log(`[TEST ${t.id}] "${t.query}"`);
    console.log(`Expectation: ${t.description}`);

    try {
      const res = await fetch(`${BASE_URL}/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ query: t.query }),
      });

      if (!res.ok) {
        console.error(`  FAIL - HTTP Status ${res.status}: ${await res.text()}`);
        failed++;
        continue;
      }

      const data = await res.json();
      const ok = t.check(data);

      if (ok) {
        console.log(`  RESULT: PASS`);
        console.log(`  Sample Response Snippet:\n  ` + data.direct_answer.split('\n').slice(0, 4).join('\n  '));
        passed++;
      } else {
        console.error(`  RESULT: FAIL`);
        console.error(`  Actual direct_answer:\n${data.direct_answer}`);
        failed++;
      }
    } catch (err) {
      console.error(`  FAIL - Network/Execution Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n===============================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${TEST_QUESTIONS.length})`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
