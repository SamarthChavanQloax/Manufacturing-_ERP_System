import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  ScanLine,
  UserCheck,
  TrendingUp,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import { AiGateRiskReviewModal } from './AiGateRiskReviewModal';

interface AiGateRiskCardProps {
  analysis: any;
  onRefresh?: () => void;
  compact?: boolean;
}

export const AiGateRiskCard: React.FC<AiGateRiskCardProps> = ({ analysis, onRefresh, compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  if (!analysis) return null;

  const score = analysis.risk_score || 0;
  const level = analysis.risk_level || 'LOW';

  const getRiskColor = (lvl: string) => {
    switch (lvl) {
      case 'HIGH':
        return '#dc2626';
      case 'MEDIUM':
        return '#d97706';
      default:
        return '#16a34a';
    }
  };

  const getRiskBg = (lvl: string) => {
    switch (lvl) {
      case 'HIGH':
        return 'rgba(239, 68, 68, 0.12)';
      case 'MEDIUM':
        return 'rgba(245, 158, 11, 0.12)';
      default:
        return 'rgba(34, 197, 94, 0.12)';
    }
  };

  const getRiskBorder = (lvl: string) => {
    switch (lvl) {
      case 'HIGH':
        return 'rgba(239, 68, 68, 0.35)';
      case 'MEDIUM':
        return 'rgba(245, 158, 11, 0.35)';
      default:
        return 'rgba(34, 197, 94, 0.35)';
    }
  };

  const color = getRiskColor(level);
  const bg = getRiskBg(level);
  const border = getRiskBorder(level);

  const reasons: string[] = Array.isArray(analysis.reasons)
    ? analysis.reasons
    : typeof analysis.reasons === 'string'
    ? JSON.parse(analysis.reasons || '[]')
    : [];

  const factors = analysis.risk_factors || {};
  const metrics = analysis.metrics || {};

  // Circumference for circular gauge
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${border}`,
        borderRadius: '12px',
        boxShadow: '0 4px 14px -2px rgba(0, 0, 0, 0.12)',
        marginBottom: '20px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: bg,
          borderBottom: `1px solid ${border}`,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Circular Score Gauge */}
          <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
            <svg width="84" height="84" viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r={radius}
                fill="transparent"
                stroke="var(--card-border, #374151)"
                strokeWidth="7"
              />
              <circle
                cx="45"
                cy="45"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 45 45)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: 800, color: color, lineHeight: '1' }}>
                {score}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                / 100
              </span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                }}
              >
                AI Gate Risk Assessment
              </span>
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
                {level} RISK
              </span>
              {analysis.review_status === 'reviewed' && (
                <span
                  style={{
                    background: analysis.review_decision === 'rejected'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : analysis.review_decision === 'flagged'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                    color: analysis.review_decision === 'rejected'
                      ? '#ef4444'
                      : analysis.review_decision === 'flagged'
                      ? '#f59e0b'
                      : '#10b981',
                    border: `1px solid ${
                      analysis.review_decision === 'rejected'
                        ? 'rgba(239, 68, 68, 0.35)'
                        : analysis.review_decision === 'flagged'
                        ? 'rgba(245, 158, 11, 0.35)'
                        : 'rgba(16, 185, 129, 0.35)'
                    }`,
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    className={`ai-reviewed-dot ${
                      analysis.review_decision === 'rejected'
                        ? 'ai-reviewed-dot-rejected'
                        : analysis.review_decision === 'flagged'
                        ? 'ai-reviewed-dot-flagged'
                        : 'ai-reviewed-dot-approved'
                    }`}
                    title={`Admin Action: ${analysis.review_decision || 'reviewed'}`}
                  />
                  <FileCheck2 size={12} /> {analysis.review_decision ? analysis.review_decision.toUpperCase() : 'REVIEWED'}
                </span>
              )}
            </div>

            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {level === 'HIGH' ? (
                <>
                  <ShieldAlert size={18} color="#dc2626" />
                  <span>High Risk Dispatch &bull; Human Review Required</span>
                </>
              ) : level === 'MEDIUM' ? (
                <>
                  <AlertTriangle size={18} color="#d97706" />
                  <span>Review Recommended &bull; Advisory Signals Detected</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} color="#16a34a" />
                  <span>Normal Dispatch &bull; All Verification Signals Match</span>
                </>
              )}
            </div>

            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '600px' }}>
              {analysis.recommendation}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="btn btn-sm"
            style={{
              background: 'var(--card-bg)',
              border: `1px solid ${level === 'LOW' ? 'var(--border-color)' : color}`,
              color: level === 'LOW' ? 'var(--text-main)' : color,
              fontWeight: 700,
              fontSize: '12.5px',
              padding: '6px 14px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <UserCheck size={15} />
            {analysis.review_status === 'reviewed' ? 'Update Review' : 'Review Risk'}
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            <span>{expanded ? 'Hide Details' : 'Show Details'}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content Body */}
      {expanded && (
        <div style={{ padding: '20px' }}>
          {/* Key Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <div style={{ background: 'var(--card-sub-bg)', border: '1px solid var(--card-border)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Invoice Qty</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{analysis.invoice_qty} pcs</div>
            </div>

            <div style={{ background: 'var(--card-sub-bg)', border: '1px solid var(--card-border)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cust. 90D Avg</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {metrics.historical_avg_qty ? `${metrics.historical_avg_qty} pcs` : 'New Baseline'}
              </div>
            </div>

            <div style={{ background: 'var(--card-sub-bg)', border: '1px solid var(--card-border)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Qty Deviation</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: metrics.quantity_ratio >= 2 ? '#dc2626' : '#16a34a',
                }}
              >
                {metrics.quantity_ratio ? `${metrics.quantity_ratio}x Normal` : '1.0x (Normal)'}
              </div>
            </div>

            <div style={{ background: 'var(--card-sub-bg)', border: '1px solid var(--card-border)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Scan Window</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: metrics.is_off_hours ? '#dc2626' : 'var(--text-main)' }}>
                {metrics.scan_time || 'Standard Shift'}
              </div>
            </div>

            <div style={{ background: 'var(--card-sub-bg)', border: '1px solid var(--card-border)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Failed Scans</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: metrics.failed_scans_count > 0 ? '#dc2626' : '#16a34a',
                }}
              >
                {metrics.failed_scans_count || 0} attempts
              </div>
            </div>
          </div>

          {/* Explainable Reasons */}
          <div style={{ marginBottom: '20px' }}>
            <h4
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <TrendingUp size={16} color="#0284c7" />
              AI Risk Explanation & Evidence Chain
            </h4>

            <div
              style={{
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              {reasons.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#16a34a' }}>No anomalous patterns detected. All indicators normal.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reasons.map((r, idx) => (
                    <li key={idx} style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.45' }}>
                      <span style={{ fontWeight: 600 }}>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Risk Factors Breakdown Table */}
          <div>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
              Transparent Scoring Breakdown ({Object.keys(factors).length} Factors)
            </h4>

            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th>Risk Signal</th>
                    <th style={{ width: '100px' }}>Contribution</th>
                    <th style={{ width: '90px' }}>Status</th>
                    <th>Signal Analysis & Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(factors).map(([key, f]: [string, any]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{f.name}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: f.score > 0 ? getRiskColor(level) : 'var(--text-muted)',
                          }}
                        >
                          +{f.score} / {f.maxScore} pts
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            f.detected ? (level === 'HIGH' ? 'badge-danger' : 'badge-warning') : 'badge-verified'
                          }`}
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          {f.detected ? 'ANOMALY' : 'NORMAL'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{f.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logging / Review History Box */}
          {analysis.reviewed_by_name && (
            <div
              style={{
                marginTop: '16px',
                background: 'rgba(22, 163, 74, 0.12)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#4ade80',
              }}
            >
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80' }}>
                <FileCheck2 size={16} /> Supervisor Review Audit Logged:
              </div>
              <div style={{ marginTop: '4px', color: 'var(--text-main)' }}>
                Decision: <strong style={{ color: '#22c55e' }}>{analysis.review_decision?.toUpperCase()}</strong> &bull; Reviewed by:{' '}
                <strong>{analysis.reviewed_by_name}</strong> on{' '}
                {analysis.review_timestamp ? new Date(analysis.review_timestamp).toLocaleString() : 'N/A'}
              </div>
              {analysis.review_note && (
                <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  Note: "{analysis.review_note}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      <AiGateRiskReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        analysis={analysis}
        onReviewSubmitted={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
