import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Printer, Download } from 'lucide-react';

export const GateOutReportPage: React.FC = () => {
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
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

  return (
    <div>
      {/* Content Header matching screenshot 13_gate_out_report.png */}
      <div className="content-header">
        <h1>Gate Out Report</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 className="card-title">Dispatched & Gate Cleared Records</h3>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-sm btn-primary"
            >
              <Printer size={14} /> Print Report
            </button>
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
                <select className="form-control" style={{ width: '70px', padding: '4px 8px' }}>
                  <option>10</option>
                  <option>25</option>
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
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, idx) => (
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
              Showing 1 to {filtered.length} of {filtered.length} entries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
