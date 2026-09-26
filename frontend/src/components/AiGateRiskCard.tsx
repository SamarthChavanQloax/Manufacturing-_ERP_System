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
        return '#fef2f2';
      case 'MEDIUM':
        return '#fffbeb';
      default:
        return '#f0fdf4';
    }
  };

  const getRiskBorder = (lvl: string) => {
    switch (lvl) {
      case 'HIGH':
        return '#fecaca';
      case 'MEDIUM':
        return '#fde68a';
      default:
        return '#bbf7d0';
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
        background: '#ffffff',
        border: `1px solid ${border}`,
        borderRadius: '12px',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.06)',
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
                stroke="#e2e8f0"
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
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
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
                  color: '#475569',
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
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FileCheck2 size={12} /> REVIEWED
                </span>
              )}
            </div>

            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#475569', maxWidth: '600px' }}>
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
              background: '#ffffff',
              border: `1px solid ${level === 'LOW' ? '#cbd5e1' : color}`,
              color: level === 'LOW' ? '#334155' : color,
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
              color: '#64748b',
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
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Invoice Qty</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{analysis.invoice_qty} pcs</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Cust. 90D Avg</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {metrics.historical_avg_qty ? `${metrics.historical_avg_qty} pcs` : 'New Baseline'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Qty Deviation</div>
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

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Scan Window</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: metrics.is_off_hours ? '#dc2626' : '#0f172a' }}>
                {metrics.scan_time || 'Standard Shift'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Failed Scans</div>
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
                color: '#1e293b',
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
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              {reasons.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#16a34a' }}>No anomalous patterns detected.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reasons.map((r, idx) => (
                    <li key={idx} style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.45' }}>
                      <span style={{ fontWeight: 600 }}>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Risk Factors Breakdown Table */}
          <div>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
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
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{f.name}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: f.score > 0 ? getRiskColor(level) : '#64748b',
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
                      <td style={{ color: '#475569' }}>{f.detail}</td>
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
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#166534',
              }}
            >
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCheck2 size={16} /> Supervisor Review Audit Logged:
              </div>
              <div style={{ marginTop: '4px' }}>
                Decision: <strong>{analysis.review_decision?.toUpperCase()}</strong> &bull; Reviewed by:{' '}
                <strong>{analysis.reviewed_by_name}</strong> on{' '}
                {analysis.review_timestamp ? new Date(analysis.review_timestamp).toLocaleString() : 'N/A'}
              </div>
              {analysis.review_note && (
                <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#15803d' }}>
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
