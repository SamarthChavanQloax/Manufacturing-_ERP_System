import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, Lock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { BarcodeCard } from '../components/BarcodeCard';

export const AddPackingToBoxPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const fetchBoxDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/boxes/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching box details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxDetails();
  }, [id]);

  const handleScanPacking = async (e: React.FormEvent) => {
    e.preventDefault();
    const packVal = scanCode.trim() || (e.currentTarget?.querySelector('input') as HTMLInputElement)?.value?.trim() || '';
    if (!packVal) return;

    try {
      await api.post('/boxes/add-packing', {
        box_id: Number(id),
        pack_id: packVal,
      });
      alert('Added Successfully');
      setScanCode('');
      fetchBoxDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Unable to Add');
    }
  };

  const handleLockBox = async () => {
    try {
      await api.post('/boxes/lock', { box_id: Number(id) });
      alert('Box Locked Successfully');
      setLockModalOpen(false);
      fetchBoxDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error locking box');
    }
  };

  if (!data && loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading box details...</div>;
  }

  const box = data?.box;
  const isLocked = box?.lock_status === 'yes';

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/view_box" className="btn btn-sm btn-secondary">
            <ArrowLeft size={14} /> Back
          </Link>
          <h1>Create Box Packing</h1>
        </div>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            {/* Scan Controls / Status */}
            <div>
              {!isLocked ? (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <form onSubmit={handleScanPacking} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ width: '240px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                        Scan Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter Packing Barcode"
                        className="form-control"
                        value={scanCode}
                        onChange={(e) => setScanCode(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <button type="submit" id="btn-add-packing" className="btn btn-danger" style={{ height: '38px' }}>
                      Submit
                    </button>
                  </form>

                  <button
                    type="button"
                    id="btn-lock-box"
                    onClick={() => {
                      if (!data?.items || data.items.length === 0) {
                        alert('Error: Cannot lock an empty box! Please scan packing items first.');
                        return;
                      }
                      setLockModalOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ height: '38px' }}
                  >
                    <Lock size={15} /> Lock Box
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#065f46',
                    background: '#d1fae5',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  <CheckCircle size={20} />
                  <span>Status : Box Locked !!</span>
                </div>
              )}
            </div>

            {/* If box is locked, display printable master container thermal sticker card */}
            {isLocked && box && (
              <div style={{ textAlign: 'right' }}>
                <BarcodeCard
                  partNumber={box.box_name}
                  qty={data?.total_part_qty || 0}
                  dateStr={box.created_time}
                  timeStr={box.created_date}
                  barcode={box.barcode}
                  customerName={data?.customer?.customer_name}
                  isBox={true}
                />
              </div>
            )}
          </div>

          <div className="card-body">
            {/* Box summary metadata */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Box Barcode:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0284c7' }}>
                  {box?.barcode}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Part Number:</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  {box?.box_name}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Target Customer:</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  {data?.customer?.customer_name || 'General / Unassigned'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Total Quantity Inside:</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>
                  {data?.total_part_qty} Pcs
                </div>
              </div>
            </div>

            {/* Table of items packed in this box */}
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>
              Packed Items in this Master Box ({data?.items?.length || 0})
            </h4>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Sr. No.</th>
                    <th>Pack Barcode</th>
                    <th>Part Number</th>
                    <th>Part Description</th>
                    <th style={{ width: '120px' }}>Quantity</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '130px' }}>Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {!data?.items || data.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                        No packing barcodes scanned into this box yet.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((item: any, idx: number) => (
                      <tr key={item.id || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#007bff' }}>{item.pack_id}</td>
                        <td style={{ fontWeight: 600 }}>{item.part_number}</td>
                        <td>{item.part_description}</td>
                        <td style={{ fontWeight: 600, color: '#16a34a' }}>{item.part_qty}</td>
                        <td>
                          <span className={`badge badge-used`}>
                            {item.status || 'used'}
                          </span>
                        </td>
                        <td>{item.created_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Lock Box Modal matching legacy */}
      {lockModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">Lock Box</h5>
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '15px', color: '#374151' }}>
                Are You Sure Want To Lock This Box ? Once locked, no more items can be added and the
                thermal box barcode sticker will be generated.
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
              <button type="button" onClick={handleLockBox} className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
