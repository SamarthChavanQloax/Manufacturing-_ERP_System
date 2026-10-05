import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  Plus,
  Search,
  X,
  FileSpreadsheet,
  Edit2,
  Trash2,
  History,
  PackagePlus,
  Eye,
  Clock,
  Calendar,
  Truck,
  User,
  AlertTriangle,
  CheckCircle,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { exportToExcel } from '../utils/excelExport';
import { BarcodeCard } from '../components/BarcodeCard';

export interface PartHistoryItem {
  id: number;
  part_id: number;
  event_type: 'STOCK_ADDED' | 'STOCK_CONSUMED' | 'STOCK_FINISHED' | 'STOCK_ADJUSTED';
  quantity_change: number;
  previous_qty: number;
  new_qty: number;
  supplier_name?: string | null;
  supplier_contact?: string | null;
  supplier_invoice_no?: string | null;
  supplier_notes?: string | null;
  created_by_user_id?: number | null;
  created_by_user_name?: string | null;
  created_by_user_role?: string | null;
  entry_date: string;
  entry_time: string;
  created_at: string;
  notes?: string | null;
}

export const PartMasterPage: React.FC = () => {
  const { user } = useAuth();
  const [parts, setParts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal 1: Add New Part (Normal Part Details + Supplier Details)
  const [modalOpen, setModalOpen] = useState(false);
  const [partNumber, setPartNumber] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [qty, setQty] = useState<number | string>(0);
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Modal 2: Add Stock to Existing Part (ONLY Quantity + Supplier Details)
  const [addStockModalData, setAddStockModalData] = useState<any | null>(null);
  const [addStockQty, setAddStockQty] = useState<number | string>('');
  const [addStockSupplierName, setAddStockSupplierName] = useState('');
  const [addStockSupplierContact, setAddStockSupplierContact] = useState('');
  const [addStockSupplierInvoiceNo, setAddStockSupplierInvoiceNo] = useState('');
  const [addStockSupplierNotes, setAddStockSupplierNotes] = useState('');
  const [submittingStock, setSubmittingStock] = useState(false);

  // Modal 3: View Details & History Log
  const [detailsModalData, setDetailsModalData] = useState<any | null>(null);
  const [partHistory, setPartHistory] = useState<PartHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'ADDED' | 'FINISHED'>('ALL');

  // Other Modals
  const [barcodeModalData, setBarcodeModalData] = useState<any>(null);
  const [editModalData, setEditModalData] = useState<any | null>(null);
  const [editQty, setEditQty] = useState<number | string>(0);
  const [deletePart, setDeletePart] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parts', {
        params: { search, page, limit },
      });
      setParts(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching parts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [page, limit, search]);

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/parts', { params: { search, page: 1, limit: 1000000 } });
      const exportData = res.data.items.map((p: any, idx: number) => ({
        'Sr. No.': idx + 1,
        'Part Number': p.part_number,
        'Part Description': p.part_description,
        'Remaining Stock': p.qty || 0,
      }));
      exportToExcel(exportData, 'Part_Master', 'Part Master');
    } catch (err) {
      console.error('Error exporting parts', err);
    }
  };

  // Feature 2 Flow 1: Create New Part (Part details + Supplier details)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNumber.trim() || !partDesc.trim()) {
      alert('Part Number and Part Description are required.');
      return;
    }
    try {
      await api.post('/parts', {
        part_number: partNumber.trim(),
        part_desc: partDesc.trim(),
        qty: Number(qty) || 0,
        supplier_name: supplierName.trim() || 'Direct Central Store',
        supplier_contact: supplierContact.trim(),
        supplier_invoice_no: supplierInvoiceNo.trim(),
        supplier_notes: supplierNotes.trim(),
      });
      alert('Part Added Successfully to Master with Supplier Details');
      setModalOpen(false);
      setPartNumber('');
      setPartDesc('');
      setQty(0);
      setSupplierName('');
      setSupplierContact('');
      setSupplierInvoiceNo('');
      setSupplierNotes('');
      setSearch('');
      setPage(1);
      fetchParts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error Adding Part');
    }
  };

  // Feature 2 Flow 2: Add Stock to Existing Part (Only Quantity + Supplier details)
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStockModalData) return;
    const addedAmount = Number(addStockQty);
    if (isNaN(addedAmount) || addedAmount <= 0) {
      alert('Please enter a valid stock quantity greater than 0.');
      return;
    }
    if (!addStockSupplierName.trim()) {
      alert('Supplier Name is required when adding stock.');
      return;
    }

    setSubmittingStock(true);
    try {
      const res = await api.post(`/parts/${addStockModalData.id}/add-stock`, {
        qty: addedAmount,
        supplier_name: addStockSupplierName.trim(),
        supplier_contact: addStockSupplierContact.trim(),
        supplier_invoice_no: addStockSupplierInvoiceNo.trim(),
        supplier_notes: addStockSupplierNotes.trim(),
      });
      alert(res.data?.message || 'Stock added successfully!');
      setAddStockModalData(null);
      setAddStockQty('');
      setAddStockSupplierName('');
      setAddStockSupplierContact('');
      setAddStockSupplierInvoiceNo('');
      setAddStockSupplierNotes('');
      fetchParts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding stock');
    } finally {
      setSubmittingStock(false);
    }
  };

  // Feature 2: View Details & History
  const handleOpenDetails = async (part: any) => {
    setDetailsModalData(part);
    setHistoryFilter('ALL');
    setHistoryLoading(true);
    try {
      const res = await api.get(`/parts/${part.id}/history`);
      setPartHistory(res.data.history || []);
    } catch (err) {
      console.error('Error fetching part history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExportPartHistory = () => {
    if (!detailsModalData || partHistory.length === 0) return;
    const exportData = partHistory.map((item, idx) => ({
      'Sr. No.': idx + 1,
      'Event Type': item.event_type,
      'Quantity Change': item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change,
      'Previous Balance': item.previous_qty,
      'New Balance': item.new_qty,
      'Supplier Name': item.supplier_name || 'N/A',
      'Supplier Contact': item.supplier_contact || 'N/A',
      'Supplier Invoice/PO': item.supplier_invoice_no || 'N/A',
      'Date': item.entry_date,
      'Time': item.entry_time,
      'Active User': `${item.created_by_user_name || 'Operator'} (${item.created_by_user_role || 'user'})`,
      'Notes': item.supplier_notes || item.notes || '',
    }));
    exportToExcel(
      exportData,
      `Part_History_${detailsModalData.part_number}`,
      `History - ${detailsModalData.part_number}`
    );
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalData) return;
    try {
      await api.patch(`/parts/${editModalData.id}`, {
        qty: Number(editQty),
      });
      alert('Part Stock Updated Successfully');
      setEditModalData(null);
      fetchParts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating stock');
    }
  };

  const handleDeletePart = async () => {
    if (!deletePart) return;
    setDeleting(true);
    try {
      await api.delete(`/parts/${deletePart.id}`);
      alert(`Part "${deletePart.part_number}" removed successfully`);
      setDeletePart(null);
      if (parts.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchParts();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error removing part';
      if (msg.includes('linked to existing records')) {
        const confirmForce = window.confirm(
          `${msg}\n\nDo you want to FORCE remove this part anyway?`
        );
        if (confirmForce) {
          try {
            await api.delete(`/parts/${deletePart.id}?force=true`);
            alert(`Part "${deletePart.part_number}" force removed successfully`);
            setDeletePart(null);
            if (parts.length === 1 && page > 1) {
              setPage(page - 1);
            } else {
              fetchParts();
            }
          } catch (forceErr: any) {
            alert(forceErr.response?.data?.message || 'Error force removing part');
          }
        }
      } else {
        alert(msg);
      }
    } finally {
      setDeleting(false);
    }
  };

  const filteredHistory = partHistory.filter((item) => {
    if (historyFilter === 'ADDED') return item.event_type === 'STOCK_ADDED';
    if (historyFilter === 'FINISHED') return item.event_type === 'STOCK_FINISHED';
    return true;
  });

  const totalPages = Math.ceil(total / limit) || 1;
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <h1>Part Master</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['admin', 'packing'].includes((user?.type || '').toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add New Part
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="btn btn-sm btn-success"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>
          </div>

          <div className="card-body">
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
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="form-control"
                  style={{ width: '84px', padding: '4px 8px' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value={1000000}>All</option>
                </select>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>entries</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563', fontWeight: 600 }}>Search:</span>
                <input
                  type="text"
                  placeholder="Search by Part Number or Part Name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="form-control"
                  style={{ width: '280px', padding: '6px 10px' }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Sr. No.</th>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th style={{ width: '130px' }}>Remaining Stock</th>
                    <th style={{ width: '130px' }}>Barcode</th>
                    <th style={{ width: '310px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading parts catalog...
                      </td>
                    </tr>
                  ) : parts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    parts.map((p, idx) => (
                      <tr key={p.id}>
                        <td>{startEntry + idx}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(p)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left',
                              fontSize: '13.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Click to View Details & History"
                          >
                            {p.part_number}
                          </button>
                        </td>
                        <td>{p.part_description}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: Number(p.qty) > 0 ? '#15803d' : '#dc2626',
                              background: Number(p.qty) > 0 ? '#f0fdf4' : '#fef2f2',
                              border: `1px solid ${Number(p.qty) > 0 ? '#bbf7d0' : '#fecaca'}`,
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '12.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {Number(p.qty) === 0 && <AlertTriangle size={12} />}
                            {p.qty ?? 0} {Number(p.qty) === 0 ? '(Finished)' : 'pcs'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setBarcodeModalData(p)}
                            className="btn btn-sm btn-info"
                          >
                            View / Download
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Feature 2: View Details Action */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(p)}
                              className="btn btn-sm btn-secondary"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                borderColor: '#3b82f6',
                                color: '#2563eb',
                                background: '#eff6ff',
                              }}
                              title="View Details & History Log"
                            >
                              <History size={13} /> View Details
                            </button>

                            {/* Feature 2 Flow 2: Add Stock Action (Only Qty + Supplier) */}
                            {['admin', 'packing'].includes((user?.type || '').toLowerCase()) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddStockModalData(p);
                                  setAddStockQty('');
                                  setAddStockSupplierName('');
                                  setAddStockSupplierContact('');
                                  setAddStockSupplierInvoiceNo('');
                                  setAddStockSupplierNotes('');
                                }}
                                className="btn btn-sm btn-success"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: '#16a34a',
                                  color: '#fff',
                                  border: 'none',
                                }}
                                title="Add Stock (Quantity & Supplier Details)"
                              >
                                <PackagePlus size={13} /> Add Stock
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditModalData(p);
                                setEditQty(p.qty ?? 0);
                              }}
                              className="btn btn-sm btn-secondary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Edit Stock"
                            >
                              <Edit2 size={13} /> Edit
                            </button>

                            {['admin'].includes((user?.type || '').toLowerCase()) && (
                              <button
                                type="button"
                                onClick={() => setDeletePart(p)}
                                className="btn btn-sm btn-danger"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: '#dc2626',
                                  color: '#fff',
                                  border: 'none',
                                }}
                                title="Remove Part"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalEntries={total}
              pageSize={limit}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Feature 2 Flow 1: Add New Part Modal (Normal details + Supplier details) */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h5 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} style={{ color: '#2563eb' }} /> Add New Part & Supplier
              </h5>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Section A: Part Details */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={15} style={{ color: '#3b82f6' }} /> 1. Part Details
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label>Part Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Part Number (e.g. 1234567890)..."
                      className="form-control"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label>Part Description / Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Part Description (e.g. Front Brake Disc Rotor)..."
                      className="form-control"
                      value={partDesc}
                      onChange={(e) => setPartDesc(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Stock / Quantity *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="Enter Initial Stock Quantity (e.g. 100)..."
                      className="form-control"
                      value={qty === 0 ? '' : qty}
                      onFocus={() => { if (qty === 0) setQty(''); }}
                      onBlur={() => { if (qty === '') setQty(0); }}
                      onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Section B: Supplier Details */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={15} style={{ color: '#16a34a' }} /> 2. Supplier Details
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label>Supplier Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Supplier / Vendor Name (e.g. Tata Steel Ltd, Bosch Automotive)..."
                      className="form-control"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div className="form-group">
                      <label>Supplier Contact / Phone</label>
                      <input
                        type="text"
                        placeholder="Phone or Email..."
                        className="form-control"
                        value={supplierContact}
                        onChange={(e) => setSupplierContact(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Supplier Invoice / PO No.</label>
                      <input
                        type="text"
                        placeholder="Invoice / PO / Challan..."
                        className="form-control"
                        value={supplierInvoiceNo}
                        onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes / Delivery Remarks</label>
                    <textarea
                      placeholder="Optional delivery or lot remarks..."
                      className="form-control"
                      rows={2}
                      value={supplierNotes}
                      onChange={(e) => setSupplierNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Part & Log History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature 2 Flow 2: Add Stock Modal (ONLY Quantity and Supplier Details) */}
      {addStockModalData && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h5 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PackagePlus size={18} style={{ color: '#16a34a' }} /> Add Stock - {addStockModalData.part_number}
                </h5>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {addStockModalData.part_description} (Current Stock: <strong>{addStockModalData.qty ?? 0} pcs</strong>)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddStockModalData(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddStockSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(37, 99, 235, 0.07)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    fontSize: '12.5px',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Info size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <span>Only quantity and supplier details are required to record this replenishment.</span>
                </div>

                {/* 1. Quantity to Add */}
                <div className="form-group">
                  <label>Quantity to Add *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Enter units to add (e.g. 50, 100)..."
                    className="form-control"
                    value={addStockQty}
                    onChange={(e) => setAddStockQty(e.target.value === '' ? '' : Number(e.target.value))}
                    autoFocus
                  />
                  {Number(addStockQty) > 0 && (
                    <small style={{ color: '#16a34a', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                      New Total Stock will be: {(Number(addStockModalData.qty) || 0) + Number(addStockQty)} pcs
                    </small>
                  )}
                </div>

                {/* 2. Supplier Details */}
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Supplier / Vendor name..."
                    className="form-control"
                    value={addStockSupplierName}
                    onChange={(e) => setAddStockSupplierName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Supplier Contact / Phone</label>
                    <input
                      type="text"
                      placeholder="Phone or Email..."
                      className="form-control"
                      value={addStockSupplierContact}
                      onChange={(e) => setAddStockSupplierContact(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Supplier Invoice / PO No.</label>
                    <input
                      type="text"
                      placeholder="Invoice / PO / DC ref..."
                      className="form-control"
                      value={addStockSupplierInvoiceNo}
                      onChange={(e) => setAddStockSupplierInvoiceNo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Supplier Delivery Remarks / Notes</label>
                  <textarea
                    placeholder="Optional delivery details, batch remarks..."
                    className="form-control"
                    rows={2}
                    value={addStockSupplierNotes}
                    onChange={(e) => setAddStockSupplierNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setAddStockModalData(null)}
                  className="btn btn-secondary"
                  disabled={submittingStock}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submittingStock}
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                >
                  {submittingStock ? 'Adding Stock...' : 'Confirm & Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature 2: View Details & History Modal */}
      {detailsModalData && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '840px', width: '95%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                  }}
                >
                  <History size={20} />
                </div>
                <div>
                  <h5 className="modal-title" style={{ margin: 0, fontSize: '16px' }}>
                    Part History & Details — {detailsModalData.part_number}
                  </h5>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {detailsModalData.part_description}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalData(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Part Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Stock</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: Number(detailsModalData.qty) > 0 ? '#16a34a' : '#dc2626' }}>
                    {detailsModalData.qty ?? 0} pcs
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                  <div>
                    {Number(detailsModalData.qty) > 0 ? (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> In Stock
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={14} /> Stock Finished
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total History Events</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {partHistory.length} entries
                  </div>
                </div>
              </div>

              {/* History Controls Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('ALL')}
                    className={`btn btn-sm ${historyFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px' }}
                  >
                    All History ({partHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('ADDED')}
                    className={`btn btn-sm ${historyFilter === 'ADDED' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px' }}
                  >
                    Stock Added ({partHistory.filter((i) => i.event_type === 'STOCK_ADDED').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('FINISHED')}
                    className={`btn btn-sm ${historyFilter === 'FINISHED' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px' }}
                  >
                    Stock Finished ({partHistory.filter((i) => i.event_type === 'STOCK_FINISHED').length})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleExportPartHistory}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FileSpreadsheet size={13} /> Export Log
                  </button>
                  {['admin', 'packing'].includes((user?.type || '').toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddStockModalData(detailsModalData);
                        setAddStockQty('');
                        setAddStockSupplierName('');
                        setAddStockSupplierContact('');
                        setAddStockSupplierInvoiceNo('');
                        setAddStockSupplierNotes('');
                      }}
                      className="btn btn-sm btn-success"
                      style={{ fontSize: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <PackagePlus size={13} /> + Add Stock
                    </button>
                  )}
                </div>
              </div>

              {/* History Timeline / Log Entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historyLoading ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading history log...
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', background: 'var(--card-sub-bg)', borderRadius: '8px' }}>
                    No history log entries matching filter.
                  </div>
                ) : (
                  filteredHistory.map((item) => {
                    const isAdded = item.event_type === 'STOCK_ADDED';
                    const isFinished = item.event_type === 'STOCK_FINISHED';
                    const badgeBg = isAdded ? 'rgba(22, 163, 74, 0.1)' : isFinished ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)';
                    const badgeColor = isAdded ? '#16a34a' : isFinished ? '#dc2626' : '#2563eb';
                    const badgeBorder = isAdded ? '#bbf7d0' : isFinished ? '#fecaca' : '#bfdbfe';
                    const label = isAdded ? 'Stock Added' : isFinished ? 'Stock Finished' : 'Stock Consumed';

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '8px',
                          border: `1px solid var(--border-color)`,
                          borderLeft: `4px solid ${badgeColor}`,
                          background: 'var(--card-bg)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        {/* Row 1: Event Type, Quantity, Date & Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                background: badgeBg,
                                color: badgeColor,
                                border: `1px solid ${badgeBorder}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {isAdded && <ArrowUpRight size={13} />}
                              {isFinished && <AlertTriangle size={13} />}
                              {!isAdded && !isFinished && <ArrowDownRight size={13} />}
                              {label}
                            </span>

                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                              {item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change} pcs
                            </span>

                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              (Balance: {item.previous_qty} ➔ <strong>{item.new_qty} pcs</strong>)
                            </span>
                          </div>

                          {/* Date and Time for each entry */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={13} /> {item.entry_date}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} /> {item.entry_time}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Supplier Details */}
                        <div
                          style={{
                            background: 'var(--card-sub-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '12.5px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '6px',
                          }}
                        >
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Supplier Name:</span>
                            <strong style={{ color: 'var(--text-main)' }}>{item.supplier_name || 'N/A / Internal'}</strong>
                          </div>
                          {item.supplier_contact && (
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Contact / Phone:</span>
                              <span>{item.supplier_contact}</span>
                            </div>
                          )}
                          {item.supplier_invoice_no && (
                            <div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Invoice / PO Ref:</span>
                              <span style={{ fontWeight: 600 }}>{item.supplier_invoice_no}</span>
                            </div>
                          )}
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Active User:</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} style={{ color: '#2563eb' }} />
                              {item.created_by_user_name || 'Operator'} ({String(item.created_by_user_role || 'user').toUpperCase()})
                            </span>
                          </div>
                        </div>

                        {/* Row 3: Notes if any */}
                        {(item.supplier_notes || item.notes) && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px' }}>
                            Note: {item.supplier_notes || item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setDetailsModalData(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {barcodeModalData && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ width: 'auto' }}>
            <div className="modal-header">
              <h5 className="modal-title">Part Barcode</h5>
              <button
                type="button"
                onClick={() => setBarcodeModalData(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center' }}>
              <BarcodeCard
                partNumber={barcodeModalData.part_number}
                qty={barcodeModalData.qty ?? 0}
                dateStr={new Date().toISOString().split('T')[0]}
                barcode={barcodeModalData.part_number}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {editModalData && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Edit Part Stock - {editModalData.part_number}</h5>
              <button
                type="button"
                onClick={() => setEditModalData(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateStock}>
              <div className="modal-body">
                <div style={{ marginBottom: '14px', fontSize: '13.5px', color: '#4b5563' }}>
                  <strong>Description:</strong> {editModalData.part_description}
                </div>
                <div className="form-group">
                  <label>Available / Remaining Part Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="form-control"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Adjusting this quantity will update remaining stock and log an adjustment in the history log.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditModalData(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Part Confirmation Modal */}
      {deletePart && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '460px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #fee2e2', backgroundColor: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <h5 className="modal-title" style={{ color: '#991b1b', margin: 0, fontWeight: 700 }}>
                  Confirm Part Removal
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setDeletePart(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '14px', color: '#1f2937', marginBottom: '12px', lineHeight: '1.5' }}>
                Are you sure you want to remove part <strong style={{ color: '#dc2626' }}>"{deletePart.part_number}"</strong> ({deletePart.part_description}) from Part Master?
              </p>
              <div
                style={{
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#be123c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span>
                <span><strong>Warning:</strong> This action cannot be undone.</span>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #f3f4f6', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDeletePart(null)}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePart}
                className="btn btn-danger"
                disabled={deleting}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  padding: '6px 16px',
                }}
              >
                <Trash2 size={14} />
                {deleting ? 'Removing...' : 'Yes, Remove Part'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
