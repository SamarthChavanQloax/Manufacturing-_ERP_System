import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, X, Printer, Download } from 'lucide-react';
import { BarcodeCard } from '../components/BarcodeCard';
import html2canvas from 'html2canvas';

export const CreatePackingBulkPage: React.FC = () => {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [partQty, setPartQty] = useState<number | string>(0);
  const [packingQty, setPackingQty] = useState<number | string>(0);

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
    if (!bulkTickets || bulkTickets.length === 0) return;

    // Collect the inner HTML of every barcode card
    const cardsHtml = bulkTickets.map((t) => {
      const el = document.getElementById(`barcode-card-${t.barcode}`);
      return el ? `<div class="sticker">${el.innerHTML}</div>` : '';
    }).join('');

    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bulk Barcodes</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { margin: 0; padding: 10px; background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: flex-start; }
            .sticker {
              border: 2px solid #cbd5e1;
              border-top: 6px solid #2563eb;
              border-radius: 10px;
              padding: 16px;
              width: 280px;
              box-sizing: border-box;
              page-break-inside: avoid;
              background: #fff;
              font-size: 12px;
              color: #0f172a;
            }
            svg { width: 100%; height: 55px; display: block; }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml}</div>
          <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownloadAll = async () => {
    if (!bulkTickets || bulkTickets.length === 0) return;
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.background = '#fff';
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.width = '800px';
      container.style.gap = '20px';
      container.style.padding = '20px';
      
      // Clone all barcode elements to it
      for (const t of bulkTickets) {
        const el = document.getElementById(`barcode-card-${t.barcode}`);
        if (el) {
          const clone = el.cloneNode(true) as HTMLElement;
          container.appendChild(clone);
        }
      }
      
      document.body.appendChild(container);
      
      // Render entire container
      const canvas = await html2canvas(container, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/png', 1.0);
      
      // Cleanup
      document.body.removeChild(container);
      
      // Download
      const link = document.createElement('a');
      link.href = image;
      link.download = `Bulk_Barcodes_${new Date().getTime()}.png`;
      link.click();
    } catch (err) {
      console.error('Error generating bulk image', err);
      alert('Error generating download.');
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
                  onClick={handleDownloadAll}
                  className="btn btn-sm btn-success"
                  style={{ background: '#10b981', border: 'none' }}
                >
                  <Download size={14} /> Download All
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
                    <th style={{ width: '120px' }}>Action</th>
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
                              setPackingQty(5);
                              setModalOpen(true);
                            }}
                            className="btn btn-sm btn-primary"
                          >
                            Bulk Pack
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
                    value={partQty === 0 ? '' : partQty}
                    onFocus={() => { if (partQty === 0) setPartQty(''); }}
                    onBlur={() => { if (partQty === '') setPartQty(0); }}
                    onChange={(e) => setPartQty(e.target.value === '' ? '' : Number(e.target.value))}
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
                    value={packingQty === 0 ? '' : packingQty}
                    onFocus={() => { if (packingQty === 0) setPackingQty(''); }}
                    onBlur={() => { if (packingQty === '') setPackingQty(0); }}
                    onChange={(e) => setPackingQty(e.target.value === '' ? '' : Number(e.target.value))}
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
