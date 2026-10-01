import React from 'react';
import { X, ShieldAlert, AlertTriangle, ShieldCheck, Clock, ExternalLink, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface AiSecurityEventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  dateStr?: string;
  onEventReviewed?: () => void;
}

export const AiSecurityEventDetailModal: React.FC<AiSecurityEventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  dateStr,
  onEventReviewed,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !event) return null;

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'CRITICAL':
      case 'HIGH':
        return '#f87171';
      case 'MEDIUM':
        return '#fbbf24';
      default:
        return '#38bdf8';
    }
  };

  const getPriorityBg = (p: string) => {
    switch (p) {
      case 'CRITICAL':
      case 'HIGH':
        return 'rgba(239, 68, 68, 0.15)';
      case 'MEDIUM':
        return 'rgba(245, 158, 11, 0.15)';
      default:
        return 'rgba(56, 189, 248, 0.15)';
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
          background: 'var(--card-bg, #111827)',
          borderRadius: '16px',
          width: '720px',
          maxWidth: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-color, #374151)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #374151)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: 'var(--card-sub-bg, #1f2937)',
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
                {(event.review_status === 'reviewed' || evidence.review_status === 'reviewed') && (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span className="ai-reviewed-dot ai-reviewed-dot-approved" title="Admin Reviewed" />
                    REVIEWED
                  </span>
                )}
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
                  Category: {event.category}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
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
              color: 'var(--text-muted, #94a3b8)',
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
                color: 'var(--text-muted, #94a3b8)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              1. WHAT HAPPENED?
            </div>
            <div
              style={{
                background: 'var(--card-sub-bg, #1f2937)',
                border: '1px solid var(--border-color, #374151)',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '14px',
                color: 'var(--text-main, #f8fafc)',
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
                color: 'var(--text-muted, #94a3b8)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              2. WHY DOES IT MATTER?
            </div>
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '14px',
                color: 'var(--text-main, #f8fafc)',
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
                color: 'var(--text-muted, #94a3b8)',
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
                background: 'var(--card-sub-bg, #1f2937)',
                border: '1px solid var(--border-color, #374151)',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Invoice # / Barcode</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                  {evidence.invoice_number || evidence.invoice_barcode || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Customer Name</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                  {evidence.customer_name || 'Standard Account'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Part / Dispatch Qty</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                  {evidence.part_number || 'N/A'}{' '}
                  {evidence.quantity ? `(${evidence.quantity} pcs)` : ''}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Gate Risk Score</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: color }}>
                  {evidence.risk_score ? `${evidence.risk_score} / 100 (${evidence.risk_level})` : 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Failed Scans Count</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: evidence.failed_scans_count > 0 ? '#ef4444' : '#10b981',
                  }}
                >
                  {evidence.failed_scans_count || 0} attempts
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Scan Timestamp</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                  {evidence.scan_time || 'Standard Shift'}
                </div>
              </div>
            </div>

            {/* Scan Timeline Table */}
            {scanTimeline.length > 0 && (
              <div>
                <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main, #f8fafc)', marginBottom: '8px' }}>
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
                          <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.barcode}</td>
                          <td>{item.scan_type}</td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: item.is_valid ? '#10b981' : '#ef4444',
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
                          <td style={{ color: 'var(--text-muted, #94a3b8)' }}>{item.failure_reason || 'Scan matched'}</td>
                          <td style={{ color: 'var(--text-muted, #94a3b8)' }}>{item.user_name || 'Gate Operator'}</td>
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
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#10b981',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} /> Supervisor Audit Record:
              </div>
              <div style={{ marginTop: '4px' }}>
                Reviewed by: <strong>{evidence.reviewed_by || 'Admin'}</strong>
                {evidence.review_note && (
                  <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-main, #f8fafc)' }}>
                    Note: "{evidence.review_note}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color, #374151)', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/verify_invoice');
              }}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} /> Open Gate Verification
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!(event.review_status === 'reviewed' || evidence.review_status === 'reviewed') ? (
                <button
                  type="button"
                  onClick={async () => {
                    const note = prompt('Enter supervisor review note to sign off & resolve this incident:', 'Reviewed and cleared for dispatch by supervisor.');
                    if (note === null) return;
                    try {
                      const res = await api.post(`/ai/security-briefing/${dateStr || new Date().toISOString().split('T')[0]}/events/${event.id}/review`, {
                        decision: 'approved',
                        note: note.trim() || 'Reviewed and verified by supervisor.',
                      });
                      alert('Incident has been reviewed and closed successfully.');
                      if (onEventReviewed) onEventReviewed();
                      onClose();
                    } catch (err: any) {
                      alert(err.response?.data?.message || 'Error reviewing incident');
                    }
                  }}
                  className="btn btn-success"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={16} /> Mark Incident as Reviewed
                </button>
              ) : (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="ai-reviewed-dot ai-reviewed-dot-approved" />
                  <CheckCircle2 size={14} /> Review Complete
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
