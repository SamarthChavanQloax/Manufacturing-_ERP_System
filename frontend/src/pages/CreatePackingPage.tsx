import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarcodeCard } from '../components/BarcodeCard';

export const CreatePackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [partQty, setPartQty] = useState<number>(1);
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
    try {
      const res = await api.post('/packing/single', {
        part_id: pId,
        part_qty: qVal,
      });
      setCreatedBarcode(res.data);
      setModalOpen(false);
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
        <h1>Part Master</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
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
            <div className="card-body" style={{ textAlign: 'center' }}>
              <BarcodeCard
                partNumber={createdBarcode.part_number}
                qty={createdBarcode.part_qty}
                dateStr={createdBarcode.created_time}
                barcode={createdBarcode.barcode}
              />
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
                    <th style={{ width: '120px' }}>Packing Qty</th>
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
                        <td>{p.qty || 1}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartId(p.id);
                              setPartQty(p.qty || 1);
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
                    onChange={(e) => setSelectedPartId(Number(e.target.value))}
                  >
                    <option value="">-- Select Part --</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.part_number} / {p.part_description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Part Qty *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-control"
                    value={partQty}
                    onChange={(e) => setPartQty(Number(e.target.value))}
                  />
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
                <button type="submit" className="btn btn-primary">
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
