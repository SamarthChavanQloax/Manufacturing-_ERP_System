import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, X, ShieldCheck } from 'lucide-react';

interface GatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const GatePassModal: React.FC<GatePassModalProps> = ({ isOpen, onClose, data }) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  const gateOutCode = data?.gate_out_code || '';
  const invoice = data?.invoice;
  const match = data?.match;
  const scannedBoxes = data?.scanned_boxes || [];

  useEffect(() => {
    if (isOpen && barcodeRef.current && gateOutCode) {
      try {
        JsBarcode(barcodeRef.current, String(gateOutCode), {
          format: 'CODE128',
          width: 2,
          height: 48,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        console.error('Error generating gate pass barcode:', err);
      }
    }
  }, [isOpen, gateOutCode]);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    const printElement = document.getElementById('printable-gate-pass');
    if (!printElement) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=880,height=900');
    if (!printWin) {
      window.print();
      return;
    }

    const printStyles = `
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #111;
        }
        body {
          padding: 10px;
          background: #fff;
        }
        .pass-container {
          border: 2px solid #000;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company-name {
          font-size: 20px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sub-header {
          font-size: 11px;
          color: #444;
          margin-top: 3px;
        }
        .doc-title {
          font-size: 16px;
          font-weight: 800;
          margin-top: 8px;
          display: inline-block;
          border: 1.5px solid #000;
          padding: 3px 18px;
          border-radius: 3px;
          background: #f0f0f0;
          letter-spacing: 0.5px;
        }
        .barcode-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #ccc;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .code-box {
          font-size: 13px;
        }
        .code-box strong {
          font-size: 17px;
          display: block;
          margin-top: 2px;
          letter-spacing: 1px;
        }
        .barcode-svg {
          max-height: 48px;
        }
        .grid-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
          background: #fdfdfd;
          border: 1px solid #e0e0e0;
          padding: 12px 14px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dashed #e5e5e5;
          padding-bottom: 4px;
        }
        .info-label {
          color: #555;
          font-weight: 500;
        }
        .info-val {
          font-weight: 700;
          color: #000;
        }
        .boxes-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #333;
          padding: 7px 10px;
          text-align: left;
        }
        th {
          background: #eaeaea;
          font-weight: 700;
        }
        .badge-ver {
          font-weight: 700;
          color: #166534;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: 36px;
          padding-top: 10px;
          text-align: center;
        }
        .sig-box {
          border-top: 1px solid #000;
          padding-top: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .sig-role {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }
        .footer-note {
          font-size: 10px;
          color: #777;
          text-align: center;
          margin-top: 20px;
          border-top: 1px solid #eee;
          padding-top: 8px;
        }
      </style>
    `;

    const contentHtml = printElement.innerHTML;
    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Pass - ${gateOutCode}</title>
          ${printStyles}
        </head>
        <body onload="window.print(); window.close();">
          ${contentHtml}
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="modal-backdrop no-print" style={{ zIndex: 9999, overflowY: 'auto', padding: '20px 0' }}>
      <div
        className="modal-dialog"
        style={{
          maxWidth: '780px',
          width: '95%',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          margin: '20px auto',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 20px',
            background: '#1e293b',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
            <ShieldCheck size={18} color="#4ade80" />
            <span>Official Gate Pass Voucher (Outward)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-sm btn-success"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px' }}
            >
              <Printer size={14} /> Print Gate Pass
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: Printable Gate Pass Content */}
        <div style={{ padding: '24px', background: '#f8fafc', maxHeight: '75vh', overflowY: 'auto' }}>
          <div
            id="printable-gate-pass"
            style={{
              background: '#fff',
              border: '2px solid #000',
              padding: '24px',
              borderRadius: '2px',
              color: '#000',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                TALBROS AUTOMOTIVE COMPONENTS LIMITED
              </div>
              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
                MANUFACTURING &amp; BARCODE ERP SYSTEM • OUTWARD DISPATCH GATE SECURITY
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  marginTop: '10px',
                  display: 'inline-block',
                  border: '1.5px solid #000',
                  padding: '4px 20px',
                  borderRadius: '3px',
                  background: '#f1f5f9',
                  letterSpacing: '0.5px',
                }}
              >
                SECURITY GATE PASS (OUTWARD DISPATCH)
              </div>
            </div>

            {/* Gate Pass Code & Barcode */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #d1d5db',
                paddingBottom: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Gate Out Code:
                </span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>
                  {gateOutCode}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <svg ref={barcodeRef} style={{ maxHeight: '48px' }} />
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', letterSpacing: '2px' }}>
                  *{gateOutCode}*
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 24px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '14px 18px',
                borderRadius: '4px',
                marginBottom: '18px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Invoice Number:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{invoice?.invoice_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Invoice Barcode:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{invoice?.barcode || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Total Quantity:</span>
                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '14px' }}>{invoice?.qty || 0} Units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Physical Boxes Verified:</span>
                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '14px' }}>
                  {data?.scanned_boxes_count || 0} of {data?.expected_boxes_count || 0} Boxes
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Verification Date:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{match?.created_date || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Verification Time:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{match?.created_time || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2', paddingTop: '2px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Dispatch Status:</span>
                <span style={{ fontWeight: 800, color: '#166534', letterSpacing: '0.5px' }}>
                  ✓ 100% PHYSICALLY AUDITED &amp; CLEARED FOR GATE OUT
                </span>
              </div>
            </div>

            {/* Scanned Boxes Table */}
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', color: '#1e293b' }}>
              Verified Boxes Loaded on Vehicle ({scannedBoxes.length}):
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #000' }}>
                  <th style={{ border: '1px solid #333', padding: '6px 10px', width: '60px', textAlign: 'center' }}>Sr No.</th>
                  <th style={{ border: '1px solid #333', padding: '6px 10px' }}>Box Barcode</th>
                  <th style={{ border: '1px solid #333', padding: '6px 10px' }}>Scan Date</th>
                  <th style={{ border: '1px solid #333', padding: '6px 10px' }}>Scan Time</th>
                  <th style={{ border: '1px solid #333', padding: '6px 10px', width: '90px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {scannedBoxes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ border: '1px solid #333', textAlign: 'center', padding: '14px', color: '#64748b' }}>
                      No boxes recorded
                    </td>
                  </tr>
                ) : (
                  scannedBoxes.map((b: any, idx: number) => (
                    <tr key={b.id || idx}>
                      <td style={{ border: '1px solid #333', textAlign: 'center', padding: '6px 10px', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td style={{ border: '1px solid #333', padding: '6px 10px', fontWeight: 700, color: '#0369a1' }}>
                        {b.box_id}
                      </td>
                      <td style={{ border: '1px solid #333', padding: '6px 10px' }}>{b.created_date}</td>
                      <td style={{ border: '1px solid #333', padding: '6px 10px' }}>{b.created_time}</td>
                      <td style={{ border: '1px solid #333', padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#166534' }}>
                        Verified
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Signatures & Security Stamp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '30px', textAlign: 'center' }}>
              <div style={{ borderTop: '1.5px solid #000', paddingTop: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Store In-Charge</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Prepared &amp; Loaded</div>
              </div>
              <div style={{ borderTop: '1.5px solid #000', paddingTop: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Driver / Transporter</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Sign &amp; Vehicle Reg. No.</div>
              </div>
              <div style={{ borderTop: '1.5px solid #000', paddingTop: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Security Gate Officer</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Verified &amp; Out Stamp</div>
              </div>
            </div>

            {/* Footer Notice */}
            <div
              style={{
                fontSize: '10px',
                color: '#64748b',
                textAlign: 'center',
                marginTop: '22px',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '8px',
              }}
            >
              This is a computer-generated gate pass verified with barcode scanning. Original to accompany goods; duplicate for security records.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f1f5f9',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button type="button" onClick={handlePrint} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={15} /> Print Gate Pass Now
          </button>
        </div>
      </div>
    </div>
  );
};
