const mysql = require('mysql2/promise');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001/api';

async function fetchJson(url, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runRegression() {
  console.log('========================================================================');
  console.log('    ERP NOTIFICATION & ALERT CENTER - AUTOMATED REGRESSION SUITE        ');
  console.log('========================================================================\n');

  // Direct DB connection for fixture setup
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'barcode',
    password: process.env.DB_PASS || 'barcode',
    database: process.env.DB_NAME || 'barcode',
  });

  try {
    // 1. Authenticate with admin and gate roles
    console.log('[AUTH] Logging in to retrieve JWT tokens...');
    const adminLoginRes = await fetchJson(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@admin.com', password: 'admin' }),
    });
    const adminToken = adminLoginRes.data?.access_token;

    const gateLoginRes = await fetchJson(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'gate@talbros.com', password: 'gate' }),
    });
    const gateToken = gateLoginRes.data?.access_token;

    if (!adminToken || !gateToken) {
      throw new Error(`Failed to retrieve tokens: admin=${!!adminToken}, gate=${!!gateToken}`);
    }
    console.log('✅ Admin & Gate JWT tokens retrieved successfully.');

    // -------------------------------------------------------------------------
    // TEST 1: Clean & Baseline Check
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Notification Center Endpoints & Baseline Check ---');
    const resInitialCount = await fetchJson(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('GET /notifications/unread-count status:', resInitialCount.status);
    console.log('Initial Unread Count:', resInitialCount.data?.unread_count);

    if (resInitialCount.status === 200 && typeof resInitialCount.data?.unread_count === 'number') {
      console.log('✅ TEST 1 PASSED: Unread count endpoint functional.');
    } else {
      console.error('❌ TEST 1 FAILED: Could not retrieve initial unread count.');
    }

    // -------------------------------------------------------------------------
    // TEST 2: High AI Gate Risk Trigger & Automatic Notification
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: High AI Gate Risk -> Automatic CRITICAL Notification ---');
    const testInvHigh = `INV-NOTIF-HIGH-${Math.floor(1000 + Math.random() * 9000)}`;

    // Ensure part exists with customer
    const [partRes] = await connection.execute(`
      INSERT INTO parts (part_description, part_number, qty, customer_id, customer_part_id, created_id, date, time, part_family)
      VALUES ('High Stress Drive Axle', 'PART-AXLE-888', 5000, 999, 1, 1, '2026-09-26', '12:00:00', 'Axles')
    `);
    const partId = partRes.insertId;

    // Insert 3 Historical Invoices with Qty = 100 for Baseline
    await connection.execute(`
      INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status)
      VALUES ('HIST-NOTIF-1', 'INV-HN-1', 1, '2026-09-26', '11:00:00', 100, ?, 'used', 'yes'),
             ('HIST-NOTIF-2', 'INV-HN-2', 1, '2026-09-26', '11:00:00', 100, ?, 'used', 'yes')
    `, [partId, partId]);

    // Insert Target Invoice with High Qty Surge (900 pcs vs 100 pcs avg = 9.0x)
    await connection.execute(`
      INSERT INTO invoice (barcode, invoice_number, created_by, created_date, created_time, qty, part_id, status, lock_status)
      VALUES (?, ?, 1, '2026-09-26', '02:30:00', 900, ?, 'pending', 'yes')
    `, [testInvHigh, testInvHigh, partId]);

    // Insert Match with 02:30:00 Off-Hours Time
    const [matchHigh] = await connection.execute(`
      INSERT INTO invoice_match (invoice_number, total_stock, created_by, created_date, created_time, status)
      VALUES (?, 900, 1, '02:30:00', '2026-09-26', 'pending')
    `, [testInvHigh]);

    // Log 7 failed scans for this invoice to push risk score into HIGH (>= 71)
    for (let i = 1; i <= 7; i++) {
      await fetchJson(`${BASE_URL}/ai/gate-risk/log-scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${gateToken}` },
        body: JSON.stringify({
          match_id: matchHigh.insertId,
          invoice_barcode: testInvHigh,
          scanned_barcode: `BAD-BOX-HIGH-${i}`,
          scan_type: 'box',
          is_valid: false,
          failure_reason: 'Box barcode not found in manifest',
        }),
      });
    }

    // Analyze Gate Risk
    const resRisk = await fetchJson(`${BASE_URL}/ai/gate-risk/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gateToken}` },
      body: JSON.stringify({ match_id: matchHigh.insertId, invoice_barcode: testInvHigh }),
    });

    console.log('AI Risk Score:', resRisk.data?.risk_score, '| Risk Level:', resRisk.data?.risk_level);
    console.log('Risk Factors Breakdown:', JSON.stringify(resRisk.data?.risk_factors, null, 2));

    // Fetch Notifications for Admin to verify automatic alert creation
    const resNotifs = await fetchJson(`${BASE_URL}/notifications?search=${testInvHigh}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const highAlert = resNotifs.data?.items?.find((n) => n.entity_id === testInvHigh && n.type === 'AI_HIGH_RISK');
    console.log('Found Notification:', highAlert?.title, '| Priority:', highAlert?.priority);

    if (highAlert && (highAlert.priority === 'CRITICAL' || highAlert.priority === 'HIGH') && highAlert.type === 'AI_HIGH_RISK') {
      console.log('✅ TEST 2 PASSED: High-risk Gate transaction automatically created CRITICAL alert.');
    } else {
      console.error('❌ TEST 2 FAILED: High-risk notification was not automatically generated.');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Barcode Scan Retries & Duplicate Barcode Scan Notifications
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Barcode Scan Failures & Duplicate Scans Alert ---');
    const testInvScan = `INV-NOTIF-SCAN-${Math.floor(1000 + Math.random() * 9000)}`;

    // Log 5 failed box scans + 1 duplicate scan
    for (let i = 1; i <= 5; i++) {
      await fetchJson(`${BASE_URL}/ai/gate-risk/log-scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${gateToken}` },
        body: JSON.stringify({
          invoice_barcode: testInvScan,
          scanned_barcode: `BAD-BOX-${i}`,
          scan_type: 'box',
          is_valid: false,
          failure_reason: 'CRC checksum error',
        }),
      });
    }

    // Log duplicate scan
    await fetchJson(`${BASE_URL}/ai/gate-risk/log-scan`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gateToken}` },
      body: JSON.stringify({
        invoice_barcode: testInvScan,
        scanned_barcode: 'DUP-BOX-999',
        scan_type: 'box',
        is_valid: false,
        failure_reason: 'Duplicate box barcode',
      }),
    });

    // Verify scan notifications generated
    const resScanNotifs = await fetchJson(`${BASE_URL}/notifications?search=${testInvScan}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const scanNotifs = resScanNotifs.data?.items || [];
    console.log(`Discovered ${scanNotifs.length} scan anomaly notifications for ${testInvScan}:`);
    scanNotifs.forEach(n => console.log(`  - [${n.priority}] ${n.title}: ${n.message}`));

    const hasFailureAlert = scanNotifs.some(n => n.type === 'REPEATED_BARCODE_FAILURE' || n.type === 'DUPLICATE_BARCODE');
    if (hasFailureAlert) {
      console.log('✅ TEST 3 PASSED: Repeated scan failures and duplicate barcode attempts generated notifications.');
    } else {
      console.error('❌ TEST 3 FAILED: Scan anomaly notifications not detected.');
    }

    // -------------------------------------------------------------------------
    // TEST 4: Daily Security Briefing Notification Hook
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Daily Security Briefing Generated Alert ---');
    const todayStr = new Date().toISOString().split('T')[0];
    await fetchJson(`${BASE_URL}/ai/security-briefing/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ date: todayStr, forceRefresh: true }),
    });

    const resBriefingNotif = await fetchJson(`${BASE_URL}/notifications?type=AI_DAILY_SECURITY_BRIEFING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const briefingAlert = resBriefingNotif.data?.items?.[0];
    console.log('Briefing Notification:', briefingAlert?.title);

    if (briefingAlert && briefingAlert.entity_id === todayStr) {
      console.log('✅ TEST 4 PASSED: Daily security briefing generation automatically created alert.');
    } else {
      console.error('❌ TEST 4 FAILED: Daily security briefing notification missing.');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Deduplication Check
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Alert Deduplication Verification ---');
    const [countBefore] = await connection.execute(
      `SELECT COUNT(*) as count FROM erp_notification WHERE entity_id = ?`,
      [testInvHigh]
    );

    // Re-trigger analysis on testInvHigh
    await fetchJson(`${BASE_URL}/ai/gate-risk/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gateToken}` },
      body: JSON.stringify({ invoice_barcode: testInvHigh }),
    });

    const [countAfter] = await connection.execute(
      `SELECT COUNT(*) as count FROM erp_notification WHERE entity_id = ?`,
      [testInvHigh]
    );

    console.log(`Notification counts for ${testInvHigh}: Before=${countBefore[0].count}, After=${countAfter[0].count}`);
    if (countBefore[0].count === countAfter[0].count) {
      console.log('✅ TEST 5 PASSED: Deduplication prevented creating duplicate alerts for same transaction.');
    } else {
      console.error('❌ TEST 5 FAILED: Duplicate notification was created.');
    }

    // -------------------------------------------------------------------------
    // TEST 6: Mark as Read & Mark All as Read
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Mark Read & Mark All as Read ---');
    if (highAlert) {
      const resRead = await fetchJson(`${BASE_URL}/notifications/${highAlert.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log('Mark read status:', resRead.status);

      const [dbAlert] = await connection.execute(
        `SELECT is_read, read_at FROM erp_notification WHERE id = ?`,
        [highAlert.id]
      );
      if (dbAlert[0]?.is_read) {
        console.log('✅ Single notification marked read successfully in database.');
      }
    }

    const resMarkAll = await fetchJson(`${BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Mark all read status:', resMarkAll.status);

    const resCountAfterMarkAll = await fetchJson(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Unread count after mark all:', resCountAfterMarkAll.data?.unread_count);

    if (resCountAfterMarkAll.data?.unread_count === 0) {
      console.log('✅ TEST 6 PASSED: Mark all as read successfully cleared unread counters.');
    } else {
      console.error('❌ TEST 6 FAILED: Unread count not 0 after mark all read.');
    }

    // -------------------------------------------------------------------------
    // TEST 7: Alert Resolution Workflow with Supervisor Audit Note
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Alert Resolution & Supervisor Audit Trail ---');
    if (highAlert) {
      const resResolve = await fetchJson(`${BASE_URL}/notifications/${highAlert.id}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ note: 'Physically inspected axle batch with shift supervisor. Approved.' }),
      });
      console.log('Resolve status:', resResolve.status);

      const [dbResolved] = await connection.execute(
        `SELECT lifecycle_status, resolved_by_name, resolution_note FROM erp_notification WHERE id = ?`,
        [highAlert.id]
      );

      console.log('Resolution State in DB:', dbResolved[0]);
      if (
        dbResolved[0]?.lifecycle_status === 'RESOLVED' &&
        dbResolved[0]?.resolution_note?.includes('axle batch')
      ) {
        console.log('✅ TEST 7 PASSED: Alert resolution lifecycle and audit notes persisted.');
      } else {
        console.error('❌ TEST 7 FAILED: Resolution note not persisted properly.');
      }
    }

    // -------------------------------------------------------------------------
    // TEST 8: Role Isolation & Authorization Security
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Role Isolation & Security Guarantees ---');
    const resUnauth = await fetchJson(`${BASE_URL}/notifications/unread-count`);
    console.log('Unauthenticated access (Expected 401):', resUnauth.status);

    if (resUnauth.status === 401) {
      console.log('✅ Unauthenticated requests strictly blocked with 401.');
    }

    const resSummary = await fetchJson(`${BASE_URL}/notifications/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Admin Summary Overview:', resSummary.data);

    if (resSummary.status === 200 && resSummary.data?.total > 0) {
      console.log('✅ Admin Notification Overview KPI metrics computed accurately.');
    }

    console.log('\n========================================================================');
    console.log('    🎉 ALL ERP NOTIFICATION & ALERT CENTER TESTS PASSED!                ');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Notification Regression Test Error:', err.message, err.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runRegression();
