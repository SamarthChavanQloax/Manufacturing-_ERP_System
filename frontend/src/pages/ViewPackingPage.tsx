import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Search, Trash2, X } from 'lucide-react';
import { BarcodeCard } from '../components/BarcodeCard';

export const ViewPackingPage: React.FC = () => {
  const [packingList, setPackingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  // Delete modal
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchPacking = async () => {
    setLoading(true);
    try {
      const res = await api.get('/packing', {
        params: { from_date: fromDate, to_date: toDate },
      });
      setPackingList(res.data);
    } catch (err) {
      console.error('Error fetching packing history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacking();
  }, []);

  const handleDateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPacking();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/packing/${deleteId}`);
      alert('Deleted Successfully');
      setDeleteId(null);
      fetchPacking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting packing record');
    }
  };

  const filtered = packingList.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.part_number?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.part_description?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Content Header matching screenshot 08_view_packing.png */}
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
          <div className="card-body">
            {/* Date Filters matching screenshot 08_view_packing.png */}
            <form
              onSubmit={handleDateSearch}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '14px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
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

              <button type="submit" className="btn btn-danger" style={{ height: '38px' }}>
                Search
              </button>
            </form>

            {/* Table Controls matching screenshot 08_view_packing.png */}
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
                  <option>50</option>
                </select>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>entries</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563', fontWeight: 600 }}>Search:</span>
                <input
                  type="text"
                  placeholder="Search barcode, part..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ width: '220px', padding: '6px 10px' }}
                />
              </div>
            </div>

            {/* Table columns matching screenshot 08_view_packing.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Sr. No.</th>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th style={{ width: '110px' }}>Packing Qty</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '310px' }}>Click Barcode To Download</th>
                    <th style={{ width: '90px' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading packing ledger...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, idx) => (
                      <tr key={p.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{p.part_number}</td>
                        <td>{p.part_description}</td>
                        <td style={{ fontWeight: 600 }}>{p.part_qty}</td>
                        <td>
                          <span
                            className={`badge ${p.status === 'used' ? 'badge-used' : 'badge-pending'}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <BarcodeCard
                            partNumber={p.part_number}
                            qty={p.part_qty}
                            dateStr={p.created_time}
                            barcode={p.barcode}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setDeleteId(p.id)}
                            className="btn btn-sm btn-danger"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
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

      {/* Delete Confirmation Modal matching legacy */}
      {deleteId && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Delete</h5>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: '#374151' }}>
                Are You Sure Want To Delete This Packing ? it can not be retrive again
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="button" onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
