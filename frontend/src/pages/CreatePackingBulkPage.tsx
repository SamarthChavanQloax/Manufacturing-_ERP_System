import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, X, Printer, Download, AlertCircle } from 'lucide-react';
import Select from 'react-select';
import { BarcodeCard } from '../components/BarcodeCard';
import { BarcodeInlineTable } from '../components/BarcodeInlineTable';
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

    const currentPart = parts.find((p) => p.id === Number(selectedPartId));
    const availableStock = currentPart ? Number(currentPart.qty ?? 0) : 0;
    const totalRequired = Number(partQty || 0) * Number(packingQty || 0);

    if (totalRequired > availableStock) {
      alert(`You don't have enough stock! Available stock is ${availableStock}, but total required is ${totalRequired} (${packingQty} items × ${partQty}).`);
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
      fetchParts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to Add');
    }
  };

  const handlePrintAll = () => {
    if (!bulkTickets || bulkTickets.length === 0) return;

    // Collect the outer HTML of every barcode card
    const cardsHtml = bulkTickets.map((t) => {
      const el = document.getElementById(`barcode-card-${t.barcode}`);
      return el ? `<div style="page-break-inside: avoid;">${el.outerHTML}</div>` : '';
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
            body { margin: 0; padding: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: flex-start; }
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
            <div className="card-body">
              <BarcodeInlineTable barcodes={bulkTickets} parts={parts} />
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
                  placeholder="Search by Part Number or Part Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ width: '280px', padding: '6px 10px' }}
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
                              setPackingQty(Number(p.qty) >= 5 ? 5 : 1);
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
                <div className="form-group" style={{ zIndex: 10 }}>
                  <label>Select Part Type *</label>
                  <Select
                    options={parts.map((p) => ({ value: p.id, label: `${p.part_number} / ${p.part_description} (Stock: ${p.qty ?? 0})` }))}
                    value={parts.map((p) => ({ value: p.id, label: `${p.part_number} / ${p.part_description} (Stock: ${p.qty ?? 0})` })).find(o => o.value === selectedPartId) || null}
                    onChange={(option) => setSelectedPartId(option ? option.value : '')}
                    placeholder="-- Select Part --"
                    isClearable
                    classNamePrefix="react-select"
                  />
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
                  <label>Part Qty (Pieces per package) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="form-control"
                    placeholder="Enter Quantity Per Package (e.g. 10)..."
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
                    placeholder="Enter Number of Labels to Generate (e.g. 5)..."
                    value={packingQty === 0 ? '' : packingQty}
                    onFocus={() => { if (packingQty === 0) setPackingQty(''); }}
                    onBlur={() => { if (packingQty === '') setPackingQty(0); }}
                    onChange={(e) => setPackingQty(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  {selectedPartId !== '' && (() => {
                    const selPart = parts.find((p) => p.id === Number(selectedPartId));
                    const stock = selPart ? Number(selPart.qty ?? 0) : 0;
                    const totalReq = Number(partQty || 0) * Number(packingQty || 0);
                    if (totalReq > stock) {
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
                          <span>You don't have enough stock! Available: {stock}, Total Required: {totalReq}</span>
                        </div>
                      );
                    }
                    return (
                      <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                        Total parts required: <strong>{totalReq}</strong>
                      </div>
                    );
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
                    const totalReq = Number(partQty || 0) * Number(packingQty || 0);
                    return totalReq > stock;
                  })()}
                >
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
