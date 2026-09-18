import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { Eye, Trash2, X } from 'lucide-react';
import { DataTablePagination } from '../components/DataTablePagination';

export const CreateInvoicePage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [qty, setQty] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    if (!invoiceNumber.trim() || !selectedPartId || !qty) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.post('/invoices', {
        invoice_number: invoiceNumber.trim(),
        part_id: Number(selectedPartId),
        qty: Number(qty),
      });
      alert('Invoice Created Successfully');
      setInvoiceNumber('');
      setQty('');
      fetchData();
    } catch (err: any) {
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

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

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
                  <button type="submit" className="btn btn-info" style={{ height: '38px' }}>
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
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    paginated.map((inv, idx) => (
                      <tr key={inv.id}>
                        <td>{(page - 1) * pageSize + idx + 1}</td>
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

            <DataTablePagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
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
