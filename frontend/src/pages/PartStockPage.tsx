import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Search } from 'lucide-react';
import { DataTablePagination } from '../components/DataTablePagination';

export const PartStockPage: React.FC = () => {
  const [stockList, setStockList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
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
                  placeholder="Search Part..."
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

            {/* Table matching screenshot 04_part_stock.png */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>FG Rack stock</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Box pack stock</th>
                    <th style={{ width: '220px', textAlign: 'right' }}>
                      Invoice Barcode Generated stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        Loading real-time stock balances...
                      </td>
                    </tr>
                  ) : stockList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    stockList.map((s, idx) => (
                      <tr key={s.id}>
                        <td>{startEntry + idx}</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>{s.part_number}</td>
                        <td>{s.part_description}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#0284c7' }}>
                          {s.fg_stock}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#d97706' }}>
                          {s.box_stock}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                          {s.inv_stock}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer matching screenshot */}
            <DataTablePagination
              currentPage={page}
              totalItems={total}
              pageSize={limit}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
