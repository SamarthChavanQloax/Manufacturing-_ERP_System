import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Search, FileSpreadsheet, Trash2, X } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { exportToExcel } from '../utils/excelExport';

export const PartStockPage: React.FC = () => {
  const [stockList, setStockList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletePart, setDeletePart] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parts/stock', {
        params: { search, page, limit },
      });
      setStockList(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error fetching stock', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [page, limit, search]);

  const handleDeletePart = async () => {
    if (!deletePart) return;
    setDeleting(true);
    try {
      await api.delete(`/parts/${deletePart.id}`);
      alert(`Part "${deletePart.part_number}" removed successfully`);
      setDeletePart(null);
      if (stockList.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchStock();
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
            if (stockList.length === 1 && page > 1) {
              setPage(page - 1);
            } else {
              fetchStock();
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

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/parts/stock', { params: { search, page: 1, limit: 1000000 } });
      const exportData = res.data.items.map((s: any, idx: number) => ({
        'Sr. No.': idx + 1,
        'Part Number': s.part_number,
        'Part Description': s.part_description,
        'Remaining Part stock': s.remaining_stock || 0,
        'FG Rack stock': s.fg_stock || 0,
        'Box pack stock': s.box_stock || 0,
        'Invoice Barcode Generated stock': s.inv_stock || 0,
      }));
      exportToExcel(exportData, 'Part_Stock_Report', 'Part Stock');
    } catch (err) {
      console.error('Error exporting stock report', err);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <h1>Part Stock</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Stock</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
            {/* Controls matching screenshot 04_part_stock.png */}
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

            {/* Table matching screenshot 04_part_stock.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Remaining Stock</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>FG Rack stock</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Box pack stock</th>
                    <th style={{ width: '200px', textAlign: 'right' }}>
                      Invoice Barcode Generated stock
                    </th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading real-time stock balances...
                      </td>
                    </tr>
                  ) : stockList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    stockList.map((s, idx) => (
                      <tr key={s.id}>
                        <td>{startEntry + idx}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.part_number}</td>
                        <td>{s.part_description}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: Number(s.remaining_stock ?? 0) > 0 ? '#15803d' : '#dc2626' }}>
                          {s.remaining_stock ?? 0}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#0284c7' }}>
                          {s.fg_stock}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#d97706' }}>
                          {s.box_stock}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                          {s.inv_stock}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setDeletePart(s)}
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

