import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { X, Boxes, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';
import Select from 'react-select';

export const CreateInvoicePage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [partFilter, setPartFilter] = useState('');
  const [qty, setQty] = useState<number | string>(0);
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState<number | 'all'>(10);
  const [loading, setLoading] = useState(false);

  // Delete invoice modal
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const partsRes = await api.get('/parts/simple');
      setParts(partsRes.data);
      if (partsRes.data.length > 0 && selectedPartId === '') {
        setSelectedPartId(partsRes.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching parts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !selectedPartId || !qty) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.post('/invoices', {
        invoice_number: invoiceNumber,
        part_id: Number(selectedPartId),
        qty: Number(qty),
      });
      alert('Invoice Created Successfully');
      setInvoiceNumber('');
      setQty('');
      setSelectedPartId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error : Invoice Number Already Exists');
    }
  };

  const selectedPart = parts.find((p) => p.id === selectedPartId);
  const currentPartStock = selectedPart ? Number(selectedPart.qty) || 0 : null;
  const numericQty = Number(qty) || 0;
  const isHighQty = numericQty > 5000;
  const isStockDeficit = currentPartStock !== null && numericQty > 0 && numericQty > currentPartStock;

  return (
    <div>
      {/* Content Header matching screenshot 11_create_invoice.png */}
      <div className="content-header">
        <h1>Create Invoice</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Create Invoice</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="card-title">Invoice Generation</h3>
            </div>

            {/* Top Form matching screenshot 11_create_invoice.png */}
            <form onSubmit={handleCreateInvoice}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ width: '220px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Invoice Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="Enter Invoice Number (e.g. INV-2026-001)..."
                    className="form-control"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>

                <div style={{ width: '320px', zIndex: 10 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    Select Part <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <Select
                    options={parts.map((p) => ({ value: p.id, label: `${p.part_number} / ${p.part_description}` }))}
                    value={parts.map((p) => ({ value: p.id, label: `${p.part_number} / ${p.part_description}` })).find(o => o.value === selectedPartId) || null}
                    onChange={(option) => setSelectedPartId(option ? option.value : '')}
                    placeholder="Filter by Part Number or Part Name..."
                    isClearable
                    classNamePrefix="react-select"
                  />
                </div>

                <div style={{ width: '180px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    Invoice Quantity <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Enter Invoice Quantity Required (e.g. 50)..."
                    className="form-control"
                    value={qty === 0 ? '' : qty}
                    onFocus={() => { if (qty === 0) setQty(''); }}
                    onBlur={() => { if (qty === '') setQty(0); }}
                    onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>

                <div>
                  <button type="submit" id="btn-create-invoice" className="btn btn-info" style={{ height: '38px' }}>
                    Submit
                  </button>
                </div>
              </div>

              {/* Part Master Live Stock Check Banner */}
              {selectedPart && (
                <div
                  id="part-stock-check-indicator"
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: isStockDeficit || isHighQty ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.06)',
                    border: `1px solid ${isStockDeficit || isHighQty ? 'rgba(245, 158, 11, 0.35)' : 'rgba(59, 130, 246, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Boxes size={20} style={{ color: isStockDeficit || isHighQty ? '#f59e0b' : '#3b82f6', flexShrink: 0 }} />
                    <div>
                      <div>
                        <strong>Part Stock Check:</strong> Available inventory for{' '}
                        <strong style={{ color: 'var(--text-main)' }}>{selectedPart.part_number}</strong> is{' '}
                        <strong style={{ color: (currentPartStock ?? 0) > 0 ? '#10b981' : '#ef4444' }}>
                          {currentPartStock} pcs
                        </strong>
                        {selectedPart.part_description && ` (${selectedPart.part_description})`}.
                      </div>
                      {(isStockDeficit || isHighQty) && (
                        <div style={{ fontSize: '11.5px', color: '#d97706', marginTop: '2px' }}>
                          ⚠️ Invoices exceeding 5,000 pcs or exceeding available stock will be placed on <strong>Waiting for Admin Approval</strong> hold.
                        </div>
                      )}
                    </div>
                  </div>

                  {numericQty > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isStockDeficit ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            fontWeight: 700,
                            fontSize: '12px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          <AlertTriangle size={14} /> Deficit: -{numericQty - (currentPartStock ?? 0)} pcs (Approval Required)
                        </span>
                      ) : isHighQty ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#d97706',
                            fontWeight: 700,
                            fontSize: '12px',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          <ShieldAlert size={14} /> High Lot Anomaly: {numericQty} pcs (Approval Required)
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            fontWeight: 600,
                            fontSize: '12px',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <CheckCircle size={14} /> Sufficient Stock Available
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};
