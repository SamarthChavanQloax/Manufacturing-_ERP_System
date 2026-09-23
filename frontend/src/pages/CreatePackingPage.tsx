import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, X, Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarcodeCard } from '../components/BarcodeCard';
import { BarcodeInlineTable } from '../components/BarcodeInlineTable';

export const CreatePackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [partQty, setPartQty] = useState<number | string>(0);
  const [createdBarcode, setCreatedBarcode] = useState<any | null>(null);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parts/simple');
      setParts(res.data);
      if (res.data.length > 0 && selectedPartId === '') {
        setSelectedPartId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching parts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handleCreatePacking = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const partSelect = form?.querySelector('select') as HTMLSelectElement;
    const qtyInput = form?.querySelector('input[type="number"]') as HTMLInputElement;

    const pId = selectedPartId || (partSelect?.value ? Number(partSelect.value) : '');
    const qVal = partQty || (qtyInput?.value ? Number(qtyInput.value) : 1);

    if (!pId) {
      alert('Please select a part');
      return;
    }

    const currentPart = parts.find((p) => p.id === Number(pId));
    const availableStock = currentPart ? Number(currentPart.qty ?? 0) : 0;
    if (Number(qVal) > availableStock) {
      alert(`You don't have enough stock! Available stock is ${availableStock}, but requested is ${qVal}.`);
      return;
    }

    try {
      const res = await api.post('/packing/single', {
        part_id: pId,
        part_qty: qVal,
      });
      setCreatedBarcode(res.data);
      setModalOpen(false);
      fetchParts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to Add');
    }
  };

  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState<number | 'all'>(10);

  const filteredParts = parts.filter(
    (p) =>
      p.part_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.part_description?.toLowerCase().includes(search.toLowerCase())
  );

  const displayedRows =
    limit === 'all' ? filteredParts : filteredParts.slice(0, Number(limit));

  return (
    <div>
      {/* Content Header matching screenshot 06_create_packing.png */}
      <div className="content-header">
        <h1>Create Packing</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Create Packing</span>
        </div>
      </div>

      <div className="content-body">
        {/* If newly created barcode, display thermal barcode ticket for immediate printing */}
        {createdBarcode && (
          <div className="card" style={{ border: '2px solid #28a745', marginBottom: '20px' }}>
            <div className="card-header" style={{ background: '#f0fdf4' }}>
              <h3 className="card-title" style={{ color: '#166534' }}>
                Barcode Generated Successfully!
              </h3>
              <button
                type="button"
                onClick={() => setCreatedBarcode(null)}
                className="btn btn-sm btn-secondary"
              >
                Dismiss
              </button>
            </div>
            <div className="card-body">
              <BarcodeInlineTable barcodes={[createdBarcode]} parts={parts} />
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={15} /> Add
            </button>
          </div>

          <div className="card-body">
            {/* Table layout matching screenshot 06_create_packing.png */}
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
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ width: '200px', padding: '6px 10px' }}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th style={{ width: '130px' }}>Remaining Stock</th>
                    <th style={{ width: '100px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((p, idx) => (
                      <tr key={p.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p.part_number}</td>
                        <td>{p.part_description}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: Number(p.qty) > 0 ? '#15803d' : '#dc2626',
                              background: Number(p.qty) > 0 ? '#f0fdf4' : '#fef2f2',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12.5px',
                            }}
                          >
                            {p.qty ?? 0}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartId(p.id);
                              setPartQty(Number(p.qty) > 0 ? Math.min(Number(p.qty), 1) : 1);
                              setModalOpen(true);
                            }}
                            className="btn btn-sm btn-primary"
                            title="Generate Barcode"
                          >
                            Pack
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
              Showing 1 to {displayedRows.length} of {filteredParts.length} entries
            </div>
          </div>
        </div>
      </div>

      {/* Add Single Packing Modal matching screenshot */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Add</h5>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePacking}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Part Type *</label>
                  <select
                    required
                    className="form-control"
                    value={selectedPartId}
                    onChange={(e) => {
                      const newId = Number(e.target.value);
                      setSelectedPartId(newId);
                      const p = parts.find((part) => part.id === newId);
                      if (p && Number(p.qty) > 0 && Number(partQty) > Number(p.qty)) {
                        setPartQty(Number(p.qty));
                      }
                    }}
                  >
                    <option value="">-- Select Part --</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.part_number} / {p.part_description} (Stock: {p.qty ?? 0})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPartId !== '' && (() => {
                  const selPart = parts.find((p) => p.id === Number(selectedPartId));
                  const stock = selPart ? Number(selPart.qty ?? 0) : 0;
                  return (
                    <div
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: stock > 0 ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${stock > 0 ? '#bbf7d0' : '#fecaca'}`,
                        color: stock > 0 ? '#166534' : '#991b1b',
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Remaining Part Stock:</span>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>
                        {stock}
                      </span>
                    </div>
                  );
                })()}

                <div className="form-group">
                  <label>Part Qty *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-control"
                    value={partQty === 0 ? '' : partQty}
                    onFocus={() => { if (partQty === 0) setPartQty(''); }}
                    onBlur={() => { if (partQty === '') setPartQty(0); }}
                    onChange={(e) => setPartQty(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  {selectedPartId !== '' && (() => {
                    const selPart = parts.find((p) => p.id === Number(selectedPartId));
                    const stock = selPart ? Number(selPart.qty ?? 0) : 0;
                    if (Number(partQty) > stock) {
                      return (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            fontSize: '13px',
                            fontWeight: 600,
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <AlertCircle size={16} style={{ flexShrink: 0 }} />
                          <span>You don't have enough stock! Available: {stock}, Requested: {partQty}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={selectedPartId !== '' && (() => {
                    const selPart = parts.find((p) => p.id === Number(selectedPartId));
                    const stock = selPart ? Number(selPart.qty ?? 0) : 0;
                    return Number(partQty) > stock;
                  })()}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
