import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, Box, CheckCircle } from 'lucide-react';

export const AddBoxToInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [boxBarcode, setBoxBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching invoice details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const handleAddBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxBarcode.trim()) return;

    try {
      await api.post('/invoices/add-box', {
        invoice_id: Number(id),
        box_id: boxBarcode.trim(),
      });
      alert('Box Added to Invoice Successfully');
      setBoxBarcode('');
      fetchInvoiceDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding box to invoice');
    }
  };

  if (!data && loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading invoice details...</div>;
  }

  const invoice = data?.invoice;
  const isFulfilled = data?.total_part_qty >= invoice?.qty;

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/create_invoice" className="btn btn-sm btn-secondary">
            <ArrowLeft size={14} /> Back
          </Link>
          <h1>Add Box To Invoice</h1>
        </div>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header">
            {/* Box Barcode Scan input */}
            <form onSubmit={handleAddBox} style={{ display: 'flex', gap: '14px', alignItems: 'flex-end' }}>
              <div style={{ width: '260px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Scan Box Barcode
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Box Barcode (e.g. 200000)"
                  className="form-control"
                  value={boxBarcode}
                  onChange={(e) => setBoxBarcode(e.target.value)}
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-danger" style={{ height: '38px' }}>
                Submit
              </button>
            </form>
          </div>

          <div className="card-body">
            {/* Invoice metadata overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Invoice Number:</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {invoice?.invoice_number}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Invoice Barcode:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0284c7' }}>
                  {invoice?.barcode}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Target Part:</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  {data?.part?.part_number}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Target Quantity:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  {invoice?.qty} Pcs
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Currently Packed Qty:</span>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: isFulfilled ? '#16a34a' : '#ea580c',
                  }}
                >
                  {data?.total_part_qty || 0} / {invoice?.qty} Pcs
                </div>
              </div>
            </div>

            {/* Mapped Boxes Table */}
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
              Boxes Mapped to this Invoice ({data?.boxes?.length || 0})
            </h4>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Sr. No.</th>
                    <th>Box Barcode</th>
                    <th>Box Name (Part)</th>
                    <th>Quantity</th>
                    <th>Date Mapped</th>
                  </tr>
                </thead>
                <tbody>
                  {!data?.boxes || data.boxes.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                        No boxes mapped to this invoice yet. Scan box barcode above to add.
                      </td>
                    </tr>
                  ) : (
                    data.boxes.map((b: any, idx: number) => (
                      <tr key={b.id || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#0284c7' }}>{b.box_barcode}</td>
                        <td>{b.box_name}</td>
                        <td style={{ fontWeight: 600, color: '#16a34a' }}>{b.box_qty}</td>
                        <td>{b.created_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
