import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Printer } from 'lucide-react';
import { GatePassModal } from '../components/GatePassModal';

export const InvoiceVerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [boxBarcode, setBoxBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);

  const fetchMatchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/verification/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching match details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetails();
  }, [id]);

  const handleScanBox = async (e: React.FormEvent) => {
    e.preventDefault();
    const barcodeVal = boxBarcode.trim() || (e.currentTarget.querySelector('input') as HTMLInputElement)?.value.trim();
    if (!barcodeVal) return;

    try {
      await api.post('/verification/scan-box', {
        match_id: Number(id),
        box_barcode: barcodeVal,
      });
      alert('Added Successfully');
      setBoxBarcode('');
      fetchMatchDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error scanning box');
    }
  };

  if (!data && loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading verification details...</div>;
  }

  const isMatched = data?.checked === true;
  const invoice = data?.invoice;
  const match = data?.match;

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/verify_invoice" className="btn btn-sm btn-secondary">
            <ArrowLeft size={14} /> Back
          </Link>
          <h1>Add Box To Invoice Verify</h1>
        </div>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Part Master</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'block' }}>
            {/* Box Barcode Scan input (if not yet matched) */}
            {!isMatched ? (
              <form onSubmit={handleScanBox} style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ width: '260px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Scan Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Barcode Number (e.g. 200000)"
                    className="form-control"
                    value={boxBarcode}
                    onChange={(e) => setBoxBarcode(e.target.value)}
                    autoFocus
                  />
                </div>

                <button type="submit" id="btn-scan-box-gate" className="btn btn-danger" style={{ height: '38px' }}>
                  Submit
                </button>
              </form>
            ) : null}

            {/* Verification Status Banner matching legacy */}
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                  Invoice Match Status
                </label>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: isMatched ? '#16a34a' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isMatched ? (
                    <>
                      <CheckCircle2 size={24} />
                      <span>Invoice Matched !!!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={24} />
                      <span>In-Complete</span>
                    </>
                  )}
                </div>
              </div>

              {isMatched && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                    Invoice Match Number (Gate Out Code) :
                  </label>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '0.5px' }}>
                    {data?.gate_out_code}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                  Invoice Qty
                </label>
                <div style={{ fontSize: '22px', fontWeight: 700, color: isMatched ? '#16a34a' : '#dc2626' }}>
                  {invoice?.qty}
                </div>
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* Manifest progress */}
            <div
              style={{
                background: isMatched ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${isMatched ? '#bbf7d0' : '#fde68a'}`,
                padding: '14px 18px',
                borderRadius: '6px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: isMatched ? '#166534' : '#92400e' }}>
                  Verification Audit Progress: {data?.scanned_boxes_count || 0} of {data?.expected_boxes_count || 0} Boxes Physically Verified
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  Invoice: {invoice?.invoice_number} (Barcode: {invoice?.barcode})
                </div>
              </div>

              {isMatched && (
                <button
                  type="button"
                  onClick={() => setShowGatePassModal(true)}
                  className="btn btn-sm btn-success"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                >
                  <Printer size={15} /> Print Gate Pass
                </button>
              )}
            </div>

            {/* Physically Scanned Boxes Table */}
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>
              Physically Verified Boxes Loaded on Vehicle ({data?.scanned_boxes?.length || 0})
            </h4>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Box Barcode</th>
                    <th>Scan Date</th>
                    <th>Scan Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!data?.scanned_boxes || data.scanned_boxes.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                        No physical boxes scanned yet. Scan each box loaded onto the truck above.
                      </td>
                    </tr>
                  ) : (
                    data.scanned_boxes.map((b: any, idx: number) => (
                      <tr key={b.id || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#0284c7' }}>{b.box_id}</td>
                        <td>{b.created_date}</td>
                        <td>{b.created_time}</td>
                        <td>
                          <span className="badge badge-verified">Verified</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Official Printable Gate Pass Modal */}
      <GatePassModal
        isOpen={showGatePassModal}
        onClose={() => setShowGatePassModal(false)}
        data={data}
      />
    </div>
  );
};
