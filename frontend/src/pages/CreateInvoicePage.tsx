import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { Eye, Trash2, X, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export const CreateInvoicePage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [qty, setQty] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState<number | 'all'>(10);
  const [loading, setLoading] = useState(false);

  // Delete invoice modal
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partsRes, invRes] = await Promise.all([
        api.get('/parts/simple'),
        api.get('/invoices', { params: { from_date: fromDate, to_date: toDate } }),
      ]);
      setParts(partsRes.data);
      if (partsRes.data.length > 0 && selectedPartId === '') {
        setSelectedPartId(partsRes.data[0].id);
      }
      setInvoices(invRes.data);
    } catch (err) {
      console.error('Error fetching invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CLIENT INVOICE] handleCreateInvoice START');
    const form = e.currentTarget as HTMLFormElement;
    const invInput = form?.querySelector('input[type="text"]') as HTMLInputElement;
    const partSelect = form?.querySelector('select') as HTMLSelectElement;
    const qtyInput = form?.querySelector('input[type="number"]') as HTMLInputElement;

    const invNum = invoiceNumber.trim() || invInput?.value?.trim() || '';
    const pId = selectedPartId || (partSelect?.value ? Number(partSelect.value) : '');
    const qVal = qty || (qtyInput?.value ? Number(qtyInput.value) : '');

    console.log('[CLIENT INVOICE] Values:', { invNum, pId, qVal, invoiceNumber, selectedPartId, qty });

    if (!invNum || !pId || !qVal) {
      console.warn('[CLIENT INVOICE] Missing fields!');
      alert('Please fill all required fields');
      return;
    }
    try {
      const res = await api.post('/invoices', {
        invoice_number: invNum,
        part_id: Number(pId),
        qty: Number(qVal),
      });
      console.log('[CLIENT INVOICE] Response:', res.data);
      alert('Invoice Created Successfully');
      setInvoiceNumber('');
      setQty('');
      fetchData();
    } catch (err: any) {
      console.error('[CLIENT INVOICE] Error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Error : Invoice Number Already Exists');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;
    try {
      await api.delete(`/invoices/${deleteInvoiceId}`);
      alert('Invoice Deleted Successfully');
      setDeleteInvoiceId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting invoice');
    }
  };

  const handleDateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const filtered = invoices.filter((i) => {
    const q = search.toLowerCase();
    return i.invoice_number?.toLowerCase().includes(q) || i.part_number?.toLowerCase().includes(q);
  });

  const displayedRows =
    limit === 'all' ? filtered : filtered.slice(0, Number(limit));

  const handleExportExcel = () => {
    const exportData = filtered.map((inv, idx) => ({
      'Sr. No.': idx + 1,
      'Invoice Number': inv.invoice_number,
      'Part Number': inv.part_number,
      'Target Qty': inv.qty,
    }));
    exportToExcel(exportData, 'Invoice_Generation_List', 'Invoices');
  };

  return (
    <div>
      {/* Content Header matching screenshot 11_create_invoice.png */}
      <div className="content-header">
        <h1>Create Invoice</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="card-title">Invoice Generation</h3>
              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm btn-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
              >
                <FileSpreadsheet size={14} /> Export Excel
              </button>
            </div>

            {/* Top Form matching screenshot 11_create_invoice.png */}
            <form onSubmit={handleCreateInvoice}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ width: '220px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Invoice Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="Enter Invoice Number"
                    className="form-control"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>

                <div style={{ width: '280px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Select Part <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    required
                    className="form-control"
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(Number(e.target.value))}
                  >
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.part_number} / {p.part_description}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ width: '180px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Invoice Quantity <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Enter QTY"
                    className="form-control"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </div>

                <div>
                  <button type="submit" id="btn-create-invoice" className="btn btn-info" style={{ height: '38px' }}>
                    Submit
                  </button>
                </div>
              </div>
            </form>

            <hr style={{ margin: '18px 0', border: '0', borderTop: '1px solid #eee' }} />

            {/* Date Filters matching screenshot 11_create_invoice.png */}
            <form onSubmit={handleDateSearch} style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ width: '180px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  From Date
                </label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div style={{ width: '180px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  To Date
                </label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ height: '38px' }}>
                Search
              </button>
            </form>
          </div>

          <div className="card-body">
            {/* Table controls matching screenshot 11_create_invoice.png */}
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
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ width: '220px', padding: '6px 10px' }}
                />
              </div>
            </div>

            {/* Table matching screenshot 11_create_invoice.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Invoice Number</th>
                    <th>Part Number</th>
                    <th>Target Qty</th>
                    <th style={{ width: '120px' }}>Add Boxes</th>
                    <th style={{ width: '140px' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading invoices...
                      </td>
                    </tr>
                  ) : displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((inv, idx) => (
                      <tr key={inv.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{inv.invoice_number}</td>
                        <td>{inv.part_number}</td>
                        <td style={{ fontWeight: 600 }}>{inv.qty}</td>
                        <td>
                          <Link
                            to={`/add_box_to_invoice/${inv.id}`}
                            className="btn btn-sm btn-primary"
                            title="Add Boxes to Invoice"
                          >
                            <Eye size={14} />
                          </Link>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setDeleteInvoiceId(inv.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete Invoice
                          </button>
                        </td>
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

      {/* Delete Invoice Confirmation Modal matching legacy */}
      {deleteInvoiceId && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Return</h5>
              <button
                type="button"
                onClick={() => setDeleteInvoiceId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '15px', color: '#374151' }}>
                Are You Sure Want To Delete This Invoice ? All mapped master boxes will be returned
                to pending status.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setDeleteInvoiceId(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDeleteInvoice}
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
