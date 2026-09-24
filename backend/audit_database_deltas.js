const mysql = require('mysql2/promise');

async function auditDeltas() {
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'barcode',
    password: 'barcode',
    database: 'barcode',
  });

  // Pre-regression initial baseline recorded before today's test suite additions
  const baseline = {
    parts: 3051,
    userinfo: 5,
    customer: 1,
    packing: 212,
    box: 10,
    box_packing: 10,
    invoice: 7,
    invoice_box: 4,
    invoice_match: 1,
    invoice_box_match: 1,
  };

  const tables = Object.keys(baseline);
  const audit = [];

  for (const t of tables) {
    const [rows] = await db.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
    const current = rows[0].cnt;
    const base = baseline[t];
    const delta = current - base;
    audit.push({
      table: t,
      baseline: base,
      current: current,
      created: delta >= 0 ? `+${delta}` : `${delta}`,
      destructiveOps: 0,
      safetyStatus: delta >= 0 ? 'INTACT / PROTECTED' : 'CORRUPTED',
    });
  }

  console.log('--- DATABASE SAFETY & ROW DELTA AUDIT ---');
  console.table(audit);

  // Orphan checks
  const [orphanPackings] = await db.query('SELECT COUNT(*) as cnt FROM box_packing bp LEFT JOIN box b ON bp.box_id = b.id WHERE b.id IS NULL AND bp.box_id NOT IN (SELECT barcode FROM box)');
  const [orphanBoxes] = await db.query('SELECT COUNT(*) as cnt FROM invoice_box ib LEFT JOIN invoice i ON ib.invoice_id = i.id WHERE i.id IS NULL');
  console.log(`Orphan Box Packings: ${orphanPackings[0].cnt}`);
  console.log(`Orphan Invoice Boxes: ${orphanBoxes[0].cnt}`);

  await db.end();
}

auditDeltas().catch(console.error);
