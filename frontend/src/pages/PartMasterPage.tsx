import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Search, X, FileSpreadsheet, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { exportToExcel } from '../utils/excelExport';
import { BarcodeCard } from '../components/BarcodeCard';

export const PartMasterPage: React.FC = () => {
  const { user } = useAuth();
  const [parts, setParts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [partNumber, setPartNumber] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [qty, setQty] = useState<number | string>(0);
  const [barcodeModalData, setBarcodeModalData] = useState<any>(null);
  const [editModalData, setEditModalData] = useState<any | null>(null);
  const [editQty, setEditQty] = useState<number | string>(0);

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
        'Packing Qty': p.qty || 1,
      }));
      exportToExcel(exportData, 'Part_Master', 'Part Master');
    } catch (err) {
      console.error('Error exporting parts', err);
    }
  };

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
      });
      alert('Part Added Successfully to Master');
      setModalOpen(false);
      setPartNumber('');
      setPartDesc('');
      setQty(0);
      setSearch('');
      setPage(1);
      fetchParts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error Adding Part');
    }
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
                >
                  <Plus size={15} /> Add
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
            {/* Controls matching screenshot 03_part_master.png */}
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

            {/* Table matching screenshot 03_part_master.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th style={{ width: '130px' }}>Remaining Stock</th>
                    <th style={{ width: '130px' }}>Barcode</th>
                    <th style={{ width: '100px' }}>Action</th>
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
                        <td style={{ fontWeight: 600, color: '#111827' }}>{p.part_number}</td>
                        <td>{p.part_description}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: Number(p.qty) > 0 ? '#15803d' : '#dc2626',
                              background: Number(p.qty) > 0 ? '#f0fdf4' : '#fef2f2',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12.5px',
                            }}
                          >
                            {p.qty ?? 0}
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
                          <button
                            type="button"
                            onClick={() => {
                              setEditModalData(p);
                              setEditQty(p.qty ?? 0);
                            }}
                            className="btn btn-sm btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer with page shift (1, 2, 3... totalPages) */}
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

      {/* Add Modal matching screenshot modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Add Part</h5>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
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
                <div className="form-group">
                  <label>Part Description / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Part Name / Description (e.g. Front Brake Disc)..."
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
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Save changes
                </button>
              </div>
            </form>
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
                qty={barcodeModalData.qty || 1}
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
                    Adjusting this quantity directly sets the available remaining parts for packing.
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
    </div>
  );
};
