import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
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
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Select Part <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <Select
                    options={parts.map((p) => ({ value: p.id, label: `${p.part_number} / ${p.part_description}` }))}
                    value={parts.map((p) => ({ value: p.id, label: `${p.part_number} / ${p.part_description}` })).find(o => o.value === selectedPartId) || null}
                    onChange={(option) => setSelectedPartId(option ? option.value : '')}
                    placeholder="Filter by Part Number or Part Name..."
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '38px',
                        fontSize: '14px',
                        borderColor: '#ced4da',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#80bdff'
                        }
                      })
                    }}
                  />
                </div>

                <div style={{ width: '180px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
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
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};
