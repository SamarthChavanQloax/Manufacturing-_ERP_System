import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';

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
          width: 2,
          height: 48,
          displayValue: false,
          margin: 0,
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
        .barcode-card { max-width: 280px; font-weight: bold; font-size: 15px; line-height: 1.4; color: #000; }
        svg { width: 100%; max-height: 50px; margin: 5px 0; }
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

  return (
    <div className="barcode-container" style={{ display: 'inline-block', margin: '8px' }}>
      <div
        id={cardId}
        style={{
          background: '#ffffff',
          border: '1px solid #ced4da',
          borderRadius: '6px',
          padding: '14px',
          width: '260px',
          color: '#212529',
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          textAlign: 'left',
        }}
      >
        {/* Customer Name is ONLY shown for Master Box labels, matching legacy */}
        {isBox && customerName && (
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a56db', marginBottom: '4px' }}>
            {customerName}
          </div>
        )}

        {/* Invoice Number if this is an invoice label */}
        {isInvoice && invoiceNumber && (
          <div style={{ fontSize: '15px', color: '#111827', marginBottom: '2px' }}>
            Invoice Number : <span style={{ fontWeight: 700 }}>{invoiceNumber}</span>
          </div>
        )}

        {/* Part Number */}
        <div style={{ fontSize: '14px', color: '#111827', marginBottom: '2px' }}>
          {isBox ? 'Box Name (Part No): ' : 'Part No : '}
          <span style={{ fontWeight: 700 }}>{partNumber}</span>
        </div>

        {/* Quantity */}
        <div style={{ fontSize: '13px', color: '#4b5563' }}>
          {isBox ? 'Part Qty: ' : isInvoice ? 'Total Part Qty: ' : 'Qty : '}
          <span style={{ fontWeight: 700, color: '#111827' }}>{qty}</span>
        </div>

        {/* Date */}
        <div style={{ fontSize: '13px', color: '#4b5563' }}>
          {isBox || isInvoice ? 'Pkg Date : ' : 'Mfg.Date : '}
          <span>{dateStr}</span>
        </div>

        {/* Time (for Box or Invoice) */}
        {(isBox || isInvoice) && timeStr && (
          <div style={{ fontSize: '13px', color: '#4b5563' }}>
            Pkg Time : <span>{timeStr}</span>
          </div>
        )}

        {/* Barcode Number */}
        <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '2px' }}>
          {isBox ? 'Bar Code: ' : isInvoice ? 'Barcode: ' : 'Bar Code: '}
          <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{barcode}</span>
        </div>

        {/* Barcode SVG */}
        <div style={{ margin: '8px 0', textAlign: 'center' }}>
          <svg ref={barcodeRef} style={{ width: '100%', height: '48px' }}></svg>
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            textAlign: 'center',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '6px',
          }}
        >
          Talbros Automotive Components Ltd. Pune
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button
          onClick={handlePrint}
          type="button"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <Printer size={13} /> Print
        </button>
      </div>
    </div>
  );
};
