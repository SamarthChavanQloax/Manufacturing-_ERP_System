import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, X, Printer } from 'lucide-react';
import { BarcodeCard } from '../components/BarcodeCard';

export const CreatePackingBulkPage: React.FC = () => {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [partQty, setPartQty] = useState<number>(1);
  const [packingQty, setPackingQty] = useState<number>(5);

  // Bulk generated tickets
  const [bulkTickets, setBulkTickets] = useState<any[] | null>(null);

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

  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) {
      alert('Please select a part');
      return;
    }
    try {
      const res = await api.post('/packing/bulk', {
        part_id: selectedPartId,
        part_qty: partQty,
        packing_qty: packingQty,
      });
      setBulkTickets(res.data);
      setModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to Add');
    }
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div>
      {/* Content Header matching screenshot 07_create_packing_bulk.png */}
      <div className="content-header">
        <h1>Create Packing Bulk</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        {/* If bulk tickets generated, display bulk thermal printing grid matching bulk_barcode.php */}
        {bulkTickets && (
          <div className="card" style={{ border: '2px solid #007bff', marginBottom: '24px' }}>
            <div
              className="card-header"
              style={{ background: '#eff6ff', display: 'flex', justifyContent: 'space-between' }}
            >
              <h3 className="card-title" style={{ color: '#1d4ed8' }}>
                Batch Generated {bulkTickets.length} Barcode Tickets
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrintAll}
                  className="btn btn-sm btn-danger"
                >
                  <Printer size={14} /> Print All
                </button>
                <button
                  type="button"
                  onClick={() => setBulkTickets(null)}
                  className="btn btn-sm btn-secondary"
                >
                  Close Batch
                </button>
              </div>
            </div>
            <div
              className="card-body"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                justifyContent: 'center',
                background: '#fafafa',
              }}
            >
              {bulkTickets.map((ticket, idx) => (
                <BarcodeCard
                  key={ticket.id || idx}
                  partNumber={ticket.part_number}
                  qty={ticket.part_qty}
                  dateStr={ticket.created_time}
                  barcode={ticket.barcode}
                />
              ))}
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
            {/* Table layout matching screenshot 07_create_packing_bulk.png */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>Show</span>
                <select className="form-control" style={{ width: '70px', padding: '4px 8px' }}>
                  <option>10</option>
                </select>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>entries</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563', fontWeight: 600 }}>Search:</span>
                <input
                  type="text"
                  placeholder="Search..."
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
                    <th style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.slice(0, 10).map((p, idx) => (
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
                            setPackingQty(5);
                            setModalOpen(true);
                          }}
                          className="btn btn-sm btn-primary"
                        >
                          Bulk Pack
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Bulk Modal matching screenshot */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Create Bulk Packing</h5>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateBulk}>
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
                  <label>Part Qty (Pieces per package) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-control"
                    value={partQty}
                    onChange={(e) => setPartQty(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>Packing Qty (Number of barcode labels to create) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    className="form-control"
                    value={packingQty}
                    onChange={(e) => setPackingQty(Number(e.target.value))}
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
                  Generate Barcodes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
