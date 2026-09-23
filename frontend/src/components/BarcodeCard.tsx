import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface BarcodeCardProps {
  partNumber: string;
  qty: number | string;
  dateStr: string;
  timeStr?: string;
  barcode: string;
  customerName?: string;
  isBox?: boolean;
  isInvoice?: boolean;
  invoiceNumber?: string;
}

export const BarcodeCard: React.FC<BarcodeCardProps> = ({
  partNumber,
  qty,
  dateStr,
  timeStr,
  barcode,
  customerName,
  isBox = false,
  isInvoice = false,
  invoiceNumber,
}) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const cardId = `barcode-card-${barcode}`;

  useEffect(() => {
    if (barcodeRef.current && barcode) {
      try {
        JsBarcode(barcodeRef.current, String(barcode), {
          format: 'CODE128',
          width: 2.2,
          height: 55,
          displayValue: false,
          margin: 0,
          lineColor: '#0f172a',
        });
      } catch (err) {
        console.error('Error rendering barcode:', err);
      }
    }
  }, [barcode]);

  const handlePrint = () => {
    const printContent = document.getElementById(cardId);
    if (!printContent) return;

    const win = window.open('', '', 'height=500, width=500');
    if (!win) return;

    win.document.write('<html><head><title>Print Barcode</title>');
    win.document.write(`
      <style>
        @page { size: auto; margin: 5mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 5px; }
        .barcode-card { max-width: 320px; font-weight: bold; font-size: 15px; line-height: 1.4; color: #000; }
        svg { width: 100%; max-height: 60px; margin: 5px 0; }
      </style>
    `);
    win.document.write('</head><body>');
    win.document.write('<div class="barcode-card">' + printContent.innerHTML + '</div>');
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  const handleDownload = async () => {
    const element = document.getElementById(cardId);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Barcode-${barcode}.png`;
      link.click();
    } catch (err) {
      console.error('Error generating image', err);
    }
  };

  return (
    <div className="barcode-container" style={{ display: 'inline-block', margin: '12px' }}>
      <div
        id={cardId}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '2px solid #cbd5e1',
          borderTop: '6px solid #2563eb', // Premium theme accent
          borderRadius: '10px',
          padding: '18px',
          width: '320px',
          color: '#0f172a',
          fontWeight: 600,
          boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Watermark or branding could go here */}
        <div style={{
          position: 'absolute',
          top: '-15px',
          right: '-15px',
          opacity: 0.03,
          fontSize: '100px',
          pointerEvents: 'none'
        }}>
          🎫
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            {/* Customer Name is ONLY shown for Master Box labels, matching legacy */}
            {isBox && customerName && (
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8', letterSpacing: '0.5px' }}>
                {customerName}
              </div>
            )}
            {/* Invoice Number if this is an invoice label */}
            {isInvoice && invoiceNumber && (
              <div style={{ fontSize: '15px', color: '#1e293b' }}>
                Invoice: <span style={{ fontWeight: 800, color: '#b91c1c' }}>{invoiceNumber}</span>
              </div>
            )}
          </div>
          
          <div style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
            {isBox ? 'BOX' : isInvoice ? 'INV' : 'PACK'}
          </div>
        </div>

        {/* Part Number & Qty Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: '#f1f5f9', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isBox ? 'Box Part No' : 'Part Number'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              {partNumber}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isBox ? 'Box Qty' : isInvoice ? 'Total Qty' : 'Quantity'}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#047857' }}>
              {qty} <span style={{fontSize: '12px'}}>pcs</span>
            </div>
          </div>
        </div>

        {/* Date & Time Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
          <div>
            <span style={{color: '#94a3b8'}}>Date:</span> <span style={{fontWeight: 700}}>{dateStr}</span>
          </div>
          {(isBox || isInvoice) && timeStr && (
            <div>
              <span style={{color: '#94a3b8'}}>Time:</span> <span style={{fontWeight: 700}}>{timeStr}</span>
            </div>
          )}
        </div>

        {/* Barcode Number & SVG */}
        <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Barcode ID: <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{barcode}</span>
          </div>
          <svg ref={barcodeRef} style={{ width: '100%', height: '55px' }}></svg>
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: '11px',
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: '12px',
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}
        >
          Talbros Automotive Components Ltd. Pune
        </div>
      </div>

      {/* Action Buttons */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button
          onClick={handlePrint}
          type="button"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px',
            fontSize: '13px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
          onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
        >
          <Printer size={15} /> Print
        </button>
        <button
          onClick={handleDownload}
          type="button"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px',
            fontSize: '13px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
        >
          <Download size={15} /> Download
        </button>
      </div>
    </div>
  );
};
