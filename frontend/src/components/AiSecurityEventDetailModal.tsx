import React from 'react';
import { X, ShieldAlert, AlertTriangle, ShieldCheck, Clock, ExternalLink, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AiSecurityEventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  dateStr?: string;
}

export const AiSecurityEventDetailModal: React.FC<AiSecurityEventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  dateStr,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !event) return null;

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'CRITICAL':
      case 'HIGH':
        return '#dc2626';
      case 'MEDIUM':
        return '#d97706';
      default:
        return '#2563eb';
    }
  };

  const getPriorityBg = (p: string) => {
    switch (p) {
      case 'CRITICAL':
      case 'HIGH':
        return '#fef2f2';
      case 'MEDIUM':
        return '#fffbeb';
      default:
        return '#eff6ff';
    }
  };

  const color = getPriorityColor(event.priority);
  const bg = getPriorityBg(event.priority);
  const evidence = event.evidence || {};
  const scanTimeline = Array.isArray(evidence.scan_timeline) ? evidence.scan_timeline : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        zIndex: 1060,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '720px',
          maxWidth: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: '#f8fafc',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: bg,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    background: color,
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
                  {event.priority} PRIORITY
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Category: {event.category}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {event.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Section 1: What Happened */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              1. WHAT HAPPENED?
            </div>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '14px',
                color: '#1e293b',
                lineHeight: '1.5',
                fontWeight: 600,
              }}
            >
              {event.what_happened}
            </div>
          </div>

          {/* Section 2: Why It Matters */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              2. WHY DOES IT MATTER?
            </div>
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '14px',
                color: '#92400e',
                lineHeight: '1.5',
              }}
            >
              {event.why_it_matters}
            </div>
          </div>

          {/* Section 3: Factual Evidence Trace */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              3. FACTUAL EVIDENCE TRACE
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Invoice # / Barcode</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {evidence.invoice_number || evidence.invoice_barcode || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Customer Name</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {evidence.customer_name || 'Standard Account'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Part / Dispatch Qty</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {evidence.part_number || 'N/A'}{' '}
                  {evidence.quantity ? `(${evidence.quantity} pcs)` : ''}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Gate Risk Score</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: color }}>
                  {evidence.risk_score ? `${evidence.risk_score} / 100 (${evidence.risk_level})` : 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Failed Scans Count</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: evidence.failed_scans_count > 0 ? '#dc2626' : '#16a34a',
                  }}
                >
                  {evidence.failed_scans_count || 0} attempts
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Scan Timestamp</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {evidence.scan_time || 'Standard Shift'}
                </div>
              </div>
            </div>

            {/* Scan Timeline Table */}
            {scanTimeline.length > 0 && (
              <div>
                <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Scan Attempt Event Timeline ({scanTimeline.length} events logged)
                </h5>
                <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Time</th>
                        <th>Scanned Barcode</th>
                        <th>Type</th>
                        <th style={{ width: '90px' }}>Result</th>
                        <th>Observation / Error</th>
                        <th>Operator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanTimeline.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td>{item.time}</td>
                          <td style={{ fontWeight: 600, color: '#0284c7' }}>{item.barcode}</td>
                          <td>{item.scan_type}</td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: item.is_valid ? '#16a34a' : '#dc2626',
                              }}
                            >
                              {item.is_valid ? (
                                <>
                                  <CheckCircle2 size={12} /> VALID
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} /> FAILED
                                </>
                              )}
                            </span>
                          </td>
                          <td style={{ color: '#475569' }}>{item.failure_reason || 'Scan matched'}</td>
                          <td style={{ color: '#64748b' }}>{item.user_name || 'Gate Operator'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Supervisor Action & Audit */}
          {evidence.review_status === 'reviewed' && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#166534',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} /> Supervisor Audit Record:
              </div>
              <div style={{ marginTop: '4px' }}>
                Reviewed by: <strong>{evidence.reviewed_by || 'Admin'}</strong>
                {evidence.review_note && (
                  <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                    Note: "{evidence.review_note}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/verify_invoice');
              }}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} /> Open Gate Verification List
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 600 }}
            >
              Close Briefing Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
