import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { Eye, PackagePlus } from 'lucide-react';
import { DataTablePagination } from '../components/DataTablePagination';

export const ViewBoxPage: React.FC = () => {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [selectedPartNumber, setSelectedPartNumber] = useState('');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partsRes, boxesRes] = await Promise.all([
        api.get('/parts/simple'),
        api.get('/boxes', { params: { from_date: fromDate, to_date: toDate } }),
      ]);
      setParts(partsRes.data);
      if (partsRes.data.length > 0 && !selectedPartNumber) {
        setSelectedPartNumber(partsRes.data[0].part_number);
      }
      setBoxes(boxesRes.data);
    } catch (err) {
      console.error('Error loading view boxes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBoxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartNumber) return;
    try {
      await api.post('/boxes', { box_name: selectedPartNumber });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to Add');
    }
  };

  const handleDateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const filtered = boxes.filter((b) => {
    const q = search.toLowerCase();
    return b.box_name?.toLowerCase().includes(q) || b.barcode?.toLowerCase().includes(q);
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {/* Content Header matching screenshot 10_view_box.png */}
      <div className="content-header">
        <h1>View Box</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>View Box</span>
        </div>
      </div>

      <div className="content-body">
        {/* Create Box Row matching screenshot 10_view_box.png */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h5 className="card-title">Create Box</h5>
          </div>
          <div className="card-body">
            <form
              onSubmit={handleCreateBoxSubmit}
              style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}
            >
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Part Number *
                </label>
                <select
                  className="form-control"
                  value={selectedPartNumber}
                  onChange={(e) => setSelectedPartNumber(e.target.value)}
                  required
                >
                  <option value="">Select Part Number</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.part_number}>
                      {p.part_number} - {p.part_description}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: '180px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  From Date
                </label>
                <input
                  type="date"
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
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>
                Create Box
              </button>
            </form>
          </div>
        </div>

        {/* Box List Card */}
        <div className="card">
          <div className="card-header">
            <h5 className="card-title">Box Master List</h5>
          </div>
          <div className="card-body">
            {/* Table controls matching screenshot 10_view_box.png */}
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
                  placeholder="Search Box..."
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

            {/* Table columns matching screenshot 10_view_box.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Box Name</th>
                    <th>Part Qty</th>
                    <th>Status</th>
                    <th>Barcode</th>
                    <th style={{ width: '130px' }}>Add Packing</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading boxes...
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    paginated.map((b, idx) => (
                      <tr key={b.id}>
                        <td>{(page - 1) * pageSize + idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{b.box_name}</td>
                        <td style={{ fontWeight: 600 }}>{b.part_qty}</td>
                        <td>
                          <span
                            className={`badge ${
                              b.status === 'used'
                                ? 'badge-used'
                                : b.lock_status === 'yes'
                                ? 'badge-verified'
                                : 'badge-pending'
                            }`}
                          >
                            {b.lock_status === 'yes' ? 'Locked' : b.status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#007bff' }}>{b.barcode}</td>
                        <td>
                          <Link
                            to={`/add_packing_to_box/${b.id}`}
                            className="btn btn-sm btn-primary"
                          >
                            <PackagePlus size={13} /> Add Packing
                          </Link>
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
    </div>
  );
};
