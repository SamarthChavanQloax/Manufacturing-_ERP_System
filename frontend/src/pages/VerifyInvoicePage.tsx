import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, RotateCcw, X, ShieldCheck } from 'lucide-react';
import { DataTablePagination } from '../components/DataTablePagination';

export const VerifyInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [invoiceBarcode, setInvoiceBarcode] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Return Invoice modal
  const [returnMatch, setReturnMatch] = useState<any | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/verification');
      setMatches(res.data);
    } catch (err) {
      console.error('Error fetching verification matches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleStartVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceBarcode.trim()) return;

    try {
      const res = await api.post('/verification/start', {
        invoice_barcode: invoiceBarcode.trim(),
      });
      alert('Added Successfully');
      navigate(`/add_box_to_invoice_verify/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error starting verification');
    }
  };

  const handleReturnInvoice = async () => {
    if (!returnMatch) return;
    try {
      await api.post('/verification/return', {
        match_id: returnMatch.id,
        invoice_barcode: returnMatch.invoice_number,
      });
      alert('Invoice Returned Successfully');
      setReturnMatch(null);
      fetchMatches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error returning invoice');
    }
  };

  const filtered = matches.filter((m) => {
    return m.invoice_number?.toLowerCase().includes(search.toLowerCase());
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {/* Content Header matching screenshot 12_verify_invoice.png */}
      <div className="content-header">
        <h1>Verify Invoice</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header">
            {/* Form matching screenshot 12_verify_invoice.png */}
            <form onSubmit={handleStartVerification} style={{ display: 'flex', gap: '14px', alignItems: 'flex-end' }}>
              <div style={{ width: '260px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Invoice Barcode <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Invoice Barcode (e.g. 300000)"
                  className="form-control"
                  value={invoiceBarcode}
                  onChange={(e) => setInvoiceBarcode(e.target.value)}
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-danger" style={{ height: '38px' }}>
                Submit
              </button>
            </form>
          </div>

          <div className="card-body">
            {/* Table controls matching screenshot 12_verify_invoice.png */}
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
                  style={{ width: '70px', padding: '4px 8px' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>entries</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563', fontWeight: 600 }}>Search:</span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="form-control"
                  style={{ width: '220px', padding: '6px 10px' }}
                />
              </div>
            </div>

            {/* Table matching screenshot 12_verify_invoice.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Invoice Number (Barcode)</th>
                    <th>Status</th>
                    <th style={{ width: '130px' }}>View Details</th>
                    <th style={{ width: '150px' }}>Return Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading verification list...
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    paginated.map((m, idx) => (
                      <tr key={m.id}>
                        <td>{(page - 1) * pageSize + idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{m.invoice_number}</td>
                        <td>
                          <span
                            className={`badge ${m.status === 'verified' ? 'badge-verified' : 'badge-pending'}`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/add_box_to_invoice_verify/${m.id}`}
                            className="btn btn-sm btn-primary"
                            title="Verify and Scan Boxes"
                          >
                            <Eye size={14} /> View
                          </Link>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setReturnMatch(m)}
                            className="btn btn-sm btn-danger"
                          >
                            Return Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <DataTablePagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Return Invoice Confirmation Modal matching legacy */}
      {returnMatch && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Return</h5>
              <button
                type="button"
                onClick={() => setReturnMatch(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '15px', color: '#374151' }}>
                Are You Sure Want To Return This Invoice ? (Barcode: {returnMatch.invoice_number})
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setReturnMatch(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleReturnInvoice}
                className="btn btn-danger"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
