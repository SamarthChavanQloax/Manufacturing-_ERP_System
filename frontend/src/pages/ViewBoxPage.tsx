import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { Eye, PackagePlus, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export const ViewBoxPage: React.FC = () => {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [selectedPartNumber, setSelectedPartNumber] = useState('');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState<number | 'all'>(10);
  const [loading, setLoading] = useState(false);

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
    const partNum = selectedPartNumber;
    if (!partNum) return;
    try {
      await api.post('/boxes', { box_name: partNum });
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
    return (
      b.box_name?.toLowerCase().includes(q) ||
      b.part_description?.toLowerCase().includes(q) ||
      b.barcode?.toLowerCase().includes(q)
    );
  });

  const displayedRows =
    limit === 'all' ? filtered : filtered.slice(0, Number(limit));

  const handleExportExcel = () => {
    const exportData = filtered.map((b, idx) => ({
      'Sr. No.': idx + 1,
      'Box Name': b.box_name,
      'Part Qty': b.part_qty,
      'Status': b.lock_status === 'yes' ? 'Locked' : b.status,
      'Barcode': b.barcode,
    }));
    exportToExcel(exportData, 'View_Boxes', 'Boxes');
  };

  return (
    <div>
      {/* Content Header matching screenshot 10_view_box.png */}
      <div className="content-header">
        <h1>View Box</h1>
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
              <h3 className="card-title">Box Packing Management</h3>
              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm btn-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
              >
                <FileSpreadsheet size={14} /> Export Excel
              </button>
            </div>

            {/* Top Form matching screenshot 10_view_box.png */}
            <form onSubmit={handleCreateBoxSubmit}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ width: '320px', zIndex: 10 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    Part Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <Select
                    options={parts.map((p) => ({ value: p.part_number, label: `${p.part_number} / ${p.part_description}` }))}
                    value={parts.map((p) => ({ value: p.part_number, label: `${p.part_number} / ${p.part_description}` })).find(o => o.value === selectedPartNumber) || null}
                    onChange={(option) => setSelectedPartNumber(option ? option.value : '')}
                    placeholder="Search Part Number or Part Name..."
                    isClearable
                    classNamePrefix="react-select"
                  />
                </div>

                <div>
                  <button type="submit" className="btn btn-danger" style={{ height: '38px' }}>
                    Submit
                  </button>
                </div>
              </div>
            </form>

            <hr style={{ margin: '16px 0', border: '0', borderTop: '1px solid #eee' }} />

            {/* Date Filters matching screenshot 10_view_box.png */}
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

              <button type="submit" className="btn btn-danger" style={{ height: '38px' }}>
                Search
              </button>
            </form>
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
                  placeholder="Search by Barcode, Part Number or Part Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ width: '280px', padding: '6px 10px' }}
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
                  ) : displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((b, idx) => (
                      <tr key={b.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.box_name}</td>
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

            <div style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
              Showing 1 to {displayedRows.length} of {filtered.length} entries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
