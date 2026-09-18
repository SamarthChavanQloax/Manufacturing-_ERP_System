import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { BarcodeCard } from '../components/BarcodeCard';
import { ArrowLeft, Printer } from 'lucide-react';

export const ViewPackingByIdPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [packing, setPacking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPacking = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/packing/${id}`);
        setPacking(res.data);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Packing record not found');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchPacking();
    }
  }, [id]);

  return (
    <div>
      {/* Content Header matching legacy view_packing_by_id.php */}
      <div className="content-header">
        <h1>Part Master</h1>
        <div className="breadcrumbs">
          <Link to="/index" style={{ color: '#0284c7', textDecoration: 'none' }}>
            Home
          </Link>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Packing Barcode Details (ID: #{id})</h3>
            <Link to="/view_packing" className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={14} /> Back to View Packing
            </Link>
          </div>

          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                Loading packing barcode record...
              </div>
            ) : !packing ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                No packing record found for ID #{id}
              </div>
            ) : (
              <div>
                {/* Legacy Table Structure from view_packing_by_id.php */}
                <div className="table-responsive" style={{ marginBottom: '24px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Sr. No.</th>
                        <th>Part Number</th>
                        <th>Part Description</th>
                        <th style={{ width: '120px', textAlign: 'right' }}>Packing Qty</th>
                        <th style={{ width: '220px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td style={{ fontWeight: 600, color: '#111827' }}>
                          {packing.part?.part_number || '—'}
                        </td>
                        <td>{packing.part?.part_description || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#0284c7' }}>
                          {packing.part_qty}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="badge"
                            style={{
                              background: packing.status === 'pending' ? '#dbeafe' : '#f3f4f6',
                              color: packing.status === 'pending' ? '#1d4ed8' : '#374151',
                            }}
                          >
                            {packing.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Printable Barcode Label Card */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <h4 style={{ marginBottom: '16px', color: '#374151', fontWeight: 600 }}>
                    Click Barcode To Download / Print Sticker
                  </h4>
                  <BarcodeCard
                    barcode={packing.barcode}
                    partNumber={packing.part?.part_number || ''}
                    qty={packing.part_qty}
                    dateStr={packing.created_time || ''}
                    customerName={packing.part?.customer?.customer_name || 'Talbros Automotive'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
