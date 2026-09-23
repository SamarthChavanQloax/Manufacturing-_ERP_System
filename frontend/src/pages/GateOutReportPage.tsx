import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Printer, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export const GateOutReportPage: React.FC = () => {
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState<number | 'all'>(10);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/gate-out');
      setReportRows(res.data);
    } catch (err) {
      console.error('Error loading gate out report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filtered = reportRows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.invoice_number?.toLowerCase().includes(q) ||
      r.part_number?.toLowerCase().includes(q) ||
      r.gateout_code?.toLowerCase().includes(q)
    );
  });

  const displayedRows =
    limit === 'all' ? filtered : filtered.slice(0, Number(limit));

  const handleExportExcel = () => {
    const exportData = filtered.map((r, idx) => ({
      'Sr. No.': idx + 1,
      'INVOICE NO': r.invoice_number || '',
      'PART CODE': r.part_number || '',
      'PART DESCRIPTION': r.part_description || '',
      'QTY': r.qty || 0,
      'GATEOUT CODE': r.gateout_code || '',
      'GATE OUT DATE': r.gateout_date || '',
    }));
    exportToExcel(exportData, 'Gate_Out_Report', 'Gate Out Report');
  };

  const handlePrintReport = () => {
    const rows = filtered;
    if (rows.length === 0) { alert('No data to print.'); return; }

    const rowsHtml = rows.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${r.invoice_number || ''}</strong></td>
        <td style="color:#0284c7;font-weight:700">${r.part_number || ''}</td>
        <td>${r.part_description || ''}</td>
        <td><strong>${r.qty || 0}</strong></td>
        <td style="color:#16a34a;font-weight:700">${r.gateout_code || ''}</td>
        <td>${r.gateout_date || ''}</td>
      </tr>
    `).join('');

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Out Report</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { margin: 0; padding: 16px; font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; }
            h2 { margin: 0 0 4px 0; font-size: 18px; color: #1e3a5f; }
            p.subtitle { margin: 0 0 14px 0; font-size: 12px; color: #555; }
            table { width: 100%; border-collapse: collapse; }
            thead tr { background: #1e3a5f; }
            th { color: #fff; padding: 9px 10px; text-align: left; font-weight: 700; font-size: 12px; }
            td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
            tbody tr:nth-child(even) td { background: #f8fafc; }
            tfoot td { font-weight: 700; padding: 9px 10px; border-top: 2px solid #1e3a5f; }
          </style>
        </head>
        <body>
          <h2>Gate Out Report</h2>
          <p class="subtitle">Printed on: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Total Records: ${rows.length}</p>
          <table>
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Invoice No</th>
                <th>Part Code</th>
                <th>Part Description</th>
                <th>Qty</th>
                <th>Gateout Code</th>
                <th>Gate Out Date</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
            <tfoot>
              <tr><td colspan="4">Total Records: ${rows.length}</td><td>${rows.reduce((s, r) => s + (Number(r.qty) || 0), 0)}</td><td colspan="2"></td></tr>
            </tfoot>
          </table>
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div>
      {/* Content Header matching screenshot 13_gate_out_report.png */}
      <div className="content-header">
        <h1>Gate Out Report</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Gate Out Report</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Dispatched & Gate Cleared Records</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm btn-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
              >
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button
                type="button"
                onClick={handlePrintReport}
                className="btn btn-sm btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} /> Print Report
              </button>
            </div>
          </div>

          <div className="card-body">
            {/* Table controls matching screenshot 13_gate_out_report.png */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>Show</span>
                <select
                  className="form-control"
                  style={{ width: '84px', padding: '4px 8px' }}
                  value={limit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLimit(val === 'all' ? 'all' : Number(val));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value="all">All</option>
                </select>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>entries</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563', fontWeight: 600 }}>Search:</span>
                <input
                  type="text"
                  placeholder="Search invoice, part, gate code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ width: '240px', padding: '6px 10px' }}
                />
              </div>
            </div>

            {/* Table matching screenshot 13_gate_out_report.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Sr. No.</th>
                    <th>INVOICE NO</th>
                    <th>PART CODE</th>
                    <th>PART DESCRIPTION</th>
                    <th style={{ width: '100px' }}>QTY</th>
                    <th>GATEOUT CODE</th>
                    <th>GATE OUT DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading gate out records...
                      </td>
                    </tr>
                  ) : displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((r, idx) => (
                      <tr key={r.id || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{r.invoice_number}</td>
                        <td style={{ fontWeight: 600, color: '#0284c7' }}>{r.part_number}</td>
                        <td>{r.part_description}</td>
                        <td style={{ fontWeight: 600 }}>{r.qty}</td>
                        <td style={{ fontWeight: 700, color: '#16a34a' }}>{r.gateout_code}</td>
                        <td>{r.gateout_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
              Showing 1 to {displayedRows.length} of {filtered.length} entries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
