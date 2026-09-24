import React from 'react';
import { BarcodeCard } from './BarcodeCard';
import { Trash2 } from 'lucide-react';

interface Props {
  barcodes: any[];
  parts: any[];
}

export const BarcodeInlineTable: React.FC<Props> = ({ barcodes, parts }) => {
  return (
    <div className="table-responsive">
      <table className="data-table" style={{ verticalAlign: 'middle' }}>
        <thead>
          <tr>
            <th style={{ width: '60px' }}>Sr. No.</th>
            <th>Part Number</th>
            <th>Part Description</th>
            <th style={{ width: '100px' }}>Packing Qty</th>
            <th style={{ width: '100px' }}>Status</th>
            <th style={{ width: '320px' }}>Click Barcode To Download</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Delete</th>
          </tr>
        </thead>
        <tbody>
          {barcodes.map((b, idx) => {
            const desc = parts.find(p => p.part_number === b.part_number)?.part_description || '-';
            return (
              <tr key={b.barcode || idx}>
                <td>{idx + 1}</td>
                <td style={{ fontWeight: 600 }}>{b.part_number}</td>
                <td>{desc}</td>
                <td style={{ fontWeight: 600 }}>{b.part_qty}</td>
                <td>
                  <span style={{ 
                    background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 
                  }}>Pending</span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ width: '300px', margin: '0 auto' }}>
                    <BarcodeCard
                      partNumber={b.part_number}
                      qty={b.part_qty}
                      dateStr={b.created_time || new Date().toISOString().split('T')[0]}
                      barcode={b.barcode}
                    />
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-danger" 
                    style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
