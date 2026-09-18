import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [qty, setQty] = useState(1);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/parts', {
        part_number: partNumber,
        part_desc: partDesc,
        qty: Number(qty),
      });
      alert('Part Added Successfully');
      setModalOpen(false);
      setPartNumber('');
      setPartDesc('');
      setQty(1);
      fetchParts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error Adding Part');
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
          <div className="card-header">
            {user?.type === 'admin' && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus size={15} /> Add
              </button>
            )}
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
                  style={{ width: '70px', padding: '4px 8px' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>entries</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563', fontWeight: 600 }}>Search:</span>
                <input
                  type="text"
                  placeholder="Search Part Number..."
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

            {/* Table matching screenshot 03_part_master.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th style={{ width: '120px' }}>Packing Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading parts catalog...
                      </td>
                    </tr>
                  ) : parts.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    parts.map((p, idx) => (
                      <tr key={p.id}>
                        <td>{startEntry + idx}</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{p.part_number}</td>
                        <td>{p.part_description}</td>
                        <td>{p.qty || 1}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer matching screenshot 03_part_master.png */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {startEntry} to {endEntry} of {total} entries
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="btn btn-sm btn-secondary"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ minWidth: '32px' }}
                >
                  {page}
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn btn-sm btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
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
                    placeholder="Enter Part Number"
                    className="form-control"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Part Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Description"
                    className="form-control"
                    value={partDesc}
                    onChange={(e) => setPartDesc(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Packing Qty *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-control"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
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
    </div>
  );
};
