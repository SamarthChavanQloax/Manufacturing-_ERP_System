import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, CheckCircle, Lock, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { BarcodeCard } from '../components/BarcodeCard';

export const AddBoxToInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [boxBarcode, setBoxBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{ message: string; isRepeatedRisk: boolean } | null>(null);

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

  const scanBoxDirect = async (barcodeVal: string) => {
    const code = barcodeVal.trim();
    if (!code) return;
    try {
      setErrorAlert(null);
      await api.post('/invoices/add-box', {
        invoice_id: Number(id),
        box_id: code,
      });
      fetchInvoiceDetails();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error adding box to invoice';
      const isRisk =
        msg.includes('Repeated') ||
        msg.includes('security alert') ||
        msg.includes('Security alert') ||
        msg.includes('Attempt #');
      setErrorAlert({ message: msg, isRepeatedRisk: isRisk });
    }
  };

  const handleAddBox = async (e: React.FormEvent) => {
    e.preventDefault();
    const barcodeVal = boxBarcode.trim() || (e.currentTarget?.querySelector('input') as HTMLInputElement)?.value?.trim() || (document.querySelector('input[placeholder*="Box Barcode"]') as HTMLInputElement)?.value?.trim();
    if (!barcodeVal) return;
    await scanBoxDirect(barcodeVal);
    setBoxBarcode('');
  };

  const handleLockInvoice = async () => {
    try {
      await api.post('/invoices/lock', { invoice_id: Number(id) });
      alert('Invoice Locked Successfully');
      setLockModalOpen(false);
      fetchInvoiceDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error locking invoice');
    }
  };

  if (!data && loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading invoice details...</div>;
  }

  const invoice = data?.invoice;
  const totalPartQty = data?.total_part_qty || 0;
  const isLocked = invoice?.lock_status === 'yes';
  const isMatched = totalPartQty === invoice?.qty;

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
          <span>Invoices</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Add Box To Invoice</span>
        </div>
      </div>

      <div className="content-body">
        {errorAlert && (
          <div
            id="box-mismatch-alert-banner"
            style={{
              marginBottom: '16px',
              padding: '14px 18px',
              borderRadius: '8px',
              background: errorAlert.isRepeatedRisk ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: errorAlert.isRepeatedRisk ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {errorAlert.isRepeatedRisk ? (
              <ShieldAlert size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: errorAlert.isRepeatedRisk ? '#ef4444' : '#f59e0b' }}>
                  {errorAlert.isRepeatedRisk ? 'Security Risk Alert: Repeated Quantity Mismatch' : 'Box Quantity Mismatch Detected'}
                </span>
                {errorAlert.isRepeatedRisk && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    High Risk Alert Dispatched
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-main)' }}>
                {errorAlert.message}
              </div>
              {errorAlert.isRepeatedRisk && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                  ⚠️ A formal incident report detailing Part, Box, Pack breakdown and operator credentials has been sent to Administrators.
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setErrorAlert(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: errorAlert.isRepeatedRisk ? '#ef4444' : '#f59e0b',
                padding: '4px',
              }}
              title="Dismiss Alert"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="card">
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            {/* Left Controls: Scan or Lock or Status */}
            <div>
              {!isLocked && !isMatched && (
                <form onSubmit={handleAddBox} style={{ display: 'flex', gap: '14px', alignItems: 'flex-end' }}>
                  <div style={{ width: '320px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      Scan Box Barcode <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        required
                        placeholder="Scan / Enter Box Barcode (e.g. 200000)..."
                        className="form-control"
                        value={boxBarcode}
                        onChange={(e) => setBoxBarcode(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" id="btn-add-box-to-invoice" className="btn btn-danger" style={{ height: '38px' }}>
                    Submit
                  </button>
                </form>
              )}

              {!isLocked && isMatched && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#16a34a' }}>
                    Status : Invoice Qty Matched
                  </div>
                  <button
                    type="button"
                    id="btn-lock-invoice"
                    onClick={() => setLockModalOpen(true)}
                    className="btn btn-primary"
                    style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Lock size={15} /> Lock Invoice
                  </button>
                </div>
              )}

              {isLocked && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  <CheckCircle size={20} />
                  <span>Status : Invoice Locked !!</span>
                </div>
              )}
            </div>

            {/* Right: Printable Invoice Barcode Sticker when locked */}
            {isLocked && invoice && (
              <div style={{ textAlign: 'right' }}>
                <BarcodeCard
                  partNumber={data?.part?.part_number || ''}
                  qty={totalPartQty}
                  dateStr={invoice.created_time}
                  timeStr={invoice.created_date}
                  barcode={invoice.barcode}
                  invoiceNumber={invoice.invoice_number}
                  isInvoice={true}
                />
              </div>
            )}
          </div>

          <div className="card-body">
            {/* Invoice metadata overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                background: 'var(--card-sub-bg)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '24px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Invoice Number:</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {invoice?.invoice_number || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Invoice Barcode:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>
                  {invoice?.barcode ? `#${invoice.barcode}` : 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Part:</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {data?.part?.part_number || 'N/A'} {data?.part?.part_description ? ` / ${data.part.part_description}` : ''}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Invoice Quantity Required:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {invoice?.qty ?? 0} Pcs
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Added Box Qty:</span>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: totalPartQty === invoice?.qty ? '#10b981' : '#f97316',
                  }}
                >
                  {totalPartQty} / {invoice?.qty ?? 0} Pcs
                </div>
              </div>
            </div>

            {/* Mapped Boxes Table */}
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
              Boxes Mapped to this Invoice ({data?.boxes?.length || 0})
            </h4>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Sr. No.</th>
                    <th>Box Barcode</th>
                    <th>Box Name (Part)</th>
                    <th>Total Part Qty</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th>Date Mapped</th>
                  </tr>
                </thead>
                <tbody>
                  {!data?.boxes || data.boxes.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
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
                        <td>
                          <span className={`badge badge-used`}>
                            {b.status || 'used'}
                          </span>
                        </td>
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

      {/* Lock Invoice Modal matching legacy */}
      {lockModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Lock Invoice</h5>
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                Are You Sure Want To Lock This Invoice ? Once locked, the invoice is finalized and ready for Gate Pass verification.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button type="button" id="btn-confirm-lock-invoice" onClick={handleLockInvoice} className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
