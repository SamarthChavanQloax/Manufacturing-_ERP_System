import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle, FileText, User } from 'lucide-react';
import api from '../api/client';

interface AiGateRiskReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: any;
  onReviewSubmitted: () => void;
}

export const AiGateRiskReviewModal: React.FC<AiGateRiskReviewModalProps> = ({
  isOpen,
  onClose,
  analysis,
  onReviewSubmitted,
}) => {
  const [decision, setDecision] = useState<'approved' | 'flagged' | 'rejected'>('approved');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !analysis) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return '#dc2626';
      case 'MEDIUM':
        return '#d97706';
      default:
        return '#16a34a';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'HIGH':
        return '#fef2f2';
      case 'MEDIUM':
        return '#fffbeb';
      default:
        return '#f0fdf4';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      alert('Please enter a supervisor review note explaining your decision.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/ai/gate-risk/review', {
        analysis_id: analysis.id,
        decision,
        note: note.trim(),
      });
      alert('Risk review recorded successfully.');
      onReviewSubmitted();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording risk review');
    } finally {
      setSubmitting(false);
    }
  };

  const reasons: string[] = Array.isArray(analysis.reasons) ? analysis.reasons : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        zIndex: 1050,
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
          background: 'var(--card-bg)',
          borderRadius: '16px',
          width: '600px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--card-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--card-sub-bg)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: getRiskBg(analysis.risk_level),
                color: getRiskColor(analysis.risk_level),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                Review Gate Dispatch Risk
              </h3>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Invoice: <strong>{analysis.invoice_number || analysis.invoice_barcode}</strong> &bull; Customer: <strong>{analysis.customer_name || 'N/A'}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Risk Level & Score Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: getRiskBg(analysis.risk_level),
              border: `1px solid ${getRiskColor(analysis.risk_level)}40`,
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                AI Evaluated Risk Level
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: getRiskColor(analysis.risk_level) }}>
                {analysis.risk_level} RISK &bull; Score: {analysis.risk_score} / 100
              </div>
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: analysis.review_status === 'reviewed' ? '#16a34a' : '#d97706',
                background: 'var(--card-bg)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
              }}
            >
              {analysis.review_status === 'reviewed' ? 'Previously Reviewed' : 'Pending Supervisor Review'}
            </div>
          </div>

          {/* AI Explanation Reasons */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              AI Identified Risk Signals ({reasons.length})
            </label>
            <div
              style={{
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              {reasons.length === 0 ? (
                <div style={{ fontSize: '13.5px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={15} /> All transaction parameters align with historical standards.
                </div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reasons.map((r, idx) => (
                    <li key={idx} style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.45' }}>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Decision Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              Supervisor Review Decision <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <label
                style={{
                  border: `2px solid ${decision === 'approved' ? '#16a34a' : 'var(--border-color)'}`,
                  background: decision === 'approved' ? 'rgba(22, 163, 74, 0.12)' : 'var(--card-sub-bg)',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="decision"
                    value="approved"
                    checked={decision === 'approved'}
                    onChange={() => setDecision('approved')}
                  />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#16a34a' }}>Approve</span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Override warnings & proceed</span>
              </label>

              <label
                style={{
                  border: `2px solid ${decision === 'flagged' ? '#d97706' : 'var(--border-color)'}`,
                  background: decision === 'flagged' ? 'rgba(245, 158, 11, 0.12)' : 'var(--card-sub-bg)',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="decision"
                    value="flagged"
                    checked={decision === 'flagged'}
                    onChange={() => setDecision('flagged')}
                  />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#d97706' }}>Investigate</span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Flag for security inquiry</span>
              </label>

              <label
                style={{
                  border: `2px solid ${decision === 'rejected' ? '#dc2626' : 'var(--border-color)'}`,
                  background: decision === 'rejected' ? 'rgba(220, 38, 38, 0.12)' : 'var(--card-sub-bg)',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="decision"
                    value="rejected"
                    checked={decision === 'rejected'}
                    onChange={() => setDecision('rejected')}
                  />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#dc2626' }}>Reject</span>
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Hold & return dispatch</span>
              </label>
            </div>
          </div>

          {/* Supervisor Review Note */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
              Supervisor Review Audit Note <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Verified with Sales GM: Customer placed an urgent advance batch order for PO #8891. Physical quantity and seal inspected at Gate."
              className="form-control"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                lineHeight: '1.5',
              }}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              This note will be permanently logged in the audit trail with your username and timestamp.
            </div>
          </div>

          {/* Existing Review Info if already reviewed */}
          {analysis.reviewed_by_name && (
            <div
              style={{
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '12.5px',
                color: 'var(--text-muted)',
              }}
            >
              <strong style={{ color: 'var(--text-main)' }}>Previous Review:</strong> {analysis.review_decision?.toUpperCase()} by {analysis.reviewed_by_name} on{' '}
              {analysis.review_timestamp ? new Date(analysis.review_timestamp).toLocaleString() : 'N/A'}.
              {analysis.review_note && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>"{analysis.review_note}"</div>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                background: decision === 'approved' ? '#16a34a' : decision === 'rejected' ? '#dc2626' : '#d97706',
                borderColor: 'transparent',
                color: '#ffffff',
              }}
            >
              {submitting ? 'Recording...' : 'Submit Risk Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
