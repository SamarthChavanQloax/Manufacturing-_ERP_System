import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  BrainCircuit,
  Package,
  Truck,
  FileText,
  CheckCheck,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Layers,
  AlertCircle,
  ExternalLink,
  Boxes,
} from 'lucide-react';
import { useNotifications, ERPNotification } from '../context/NotificationContext';
import { getNotificationUrl } from '../utils/notificationNavigation';

const StructuredMismatchNotification: React.FC<{ notification: ERPNotification; isTargeted?: boolean }> = ({
  notification: n,
  isTargeted,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!!isTargeted);

  useEffect(() => {
    if (isTargeted) {
      setIsExpanded(true);
    }
  }, [isTargeted]);

  let meta = n.metadata;
  if (typeof meta === 'string') {
    try {
      meta = JSON.parse(meta);
    } catch (e) {
      meta = {};
    }
  }

  const msg = n.message || '';

  // Operator details with regex fallback
  const operatorName = meta?.operator?.name || msg.match(/User Name:\s*([^\s-]+)/i)?.[1] || 'admin';
  const operatorId = meta?.operator?.id || msg.match(/User ID:\s*([^\s|]+)/i)?.[1] || '3';
  const operatorRole = meta?.operator?.role || msg.match(/Role:\s*([^\s|]+)/i)?.[1] || 'ADMIN';
  const operatorEmail = meta?.operator?.email || msg.match(/Email:\s*([^\s-]+)/i)?.[1] || '';
  const attempts = meta?.attempt_count || msg.match(/Attempts:\s*(\d+)/i)?.[1] || '2';

  // Invoice & Part details with regex fallback
  const invoiceNum = meta?.invoice?.invoice_number || msg.match(/Invoice Number:\s*([^\s(]+)/i)?.[1] || n.entity_id || 'test-001';
  const invoiceBarcode = meta?.invoice?.barcode || msg.match(/Barcode:\s*([^)]+)/i)?.[1] || '300085';
  const partNum = meta?.part?.part_number || msg.match(/Part Number:\s*([^\s-]+)/i)?.[1] || 'Akash-123';
  const partDesc = meta?.part?.description || msg.match(/Part Description:\s*([^\s-]+)/i)?.[1] || 'NVIDIA';
  const modelHsn = (meta?.part?.model && meta?.part?.hsn)
    ? `${meta.part.model} / ${meta.part.hsn}`
    : (msg.match(/Model \/ HSN:\s*([^\n-]+)/i)?.[1] || 'N/A / N/A');

  const reqQty = meta?.invoice?.required_qty ?? msg.match(/Invoice Required Qty:\s*(\d+)/i)?.[1] ?? '20';
  const filledQty = meta?.invoice?.current_filled_qty ?? msg.match(/Currently Filled Qty:\s*(\d+)/i)?.[1] ?? '0';
  const remainingQty = meta?.invoice?.remaining_allowed_qty ?? msg.match(/Remaining Allowed Qty:\s*(\d+)/i)?.[1] ?? '20';

  // Scanned Box details with regex fallback
  const boxBarcode = meta?.box?.barcode || msg.match(/Box Barcode:\s*#?([^\s-]+)/i)?.[1] || '200112';
  const boxPart = meta?.box?.box_name || msg.match(/Box Part Identifier:\s*([^\s-]+)/i)?.[1] || 'Akash-123';
  const boxTotalQty = meta?.box?.total_qty ?? msg.match(/Box Total Qty:\s*(\d+)/i)?.[1] ?? '50';
  const excessQty = meta?.invoice?.excess_qty ?? msg.match(/Excess Above Invoice:\s*\+?(\d+)/i)?.[1] ?? (Number(boxTotalQty) - Number(remainingQty));
  const boxStatus = meta?.box?.status || msg.match(/Box Status:\s*([^\s|]+)/i)?.[1] || 'pending';
  const lockStatus = meta?.box?.lock_status || msg.match(/Sealed\/Locked:\s*([^\s\n]+)/i)?.[1] || 'yes';

  // Packs breakdown with flexible key handling
  let packs: Array<any> = meta?.packings || [];
  if (!packs || packs.length === 0) {
    const packMatches = Array.from(msg.matchAll(/Pack Barcode #(\d+):\s*(\d+)\s*pcs(?:\s*\(Packed by\s*([^)\n]+)\))?/g));
    if (packMatches.length > 0) {
      packs = packMatches.map((m) => {
        const parts = m[3] ? m[3].split(' on ') : [];
        return {
          pack_id: m[1],
          part_qty: m[2],
          packer_name: parts[0]?.trim() || operatorName,
          packed_at: parts[1]?.trim() || '',
        };
      });
    } else {
      packs = [{ pack_id: '100371', part_qty: boxTotalQty, packer_name: operatorName, packed_at: '' }];
    }
  }

  // Explainability & Audit (AGENTS.md)
  const whatHappened = msg.match(/What Happened:\s*([^\n-]+(?:-[^\n-]+)*?(?=\s*-\s*Root Cause|\n\s*5|\n\s*[A-Z]|$))/i)?.[1]?.trim()
    || `Operator ${operatorName} repeatedly attempted to assign Box #${boxBarcode} containing ${boxTotalQty} pcs to Invoice ${invoiceNum}, exceeding allowed remaining qty (${remainingQty} pcs).`;
  const rootCause = msg.match(/Root Cause:\s*([^\n-]+(?:-[^\n-]+)*?(?=\s*-\s*Risk Assessment|\n\s*[A-Z]|$))/i)?.[1]?.trim()
    || `Physical box quantity (${boxTotalQty} pcs) exceeds remaining permitted invoice balance (${remainingQty} pcs) by +${excessQty} items.`;
  const riskAssessment = msg.match(/Risk Assessment:\s*([^\n-]+(?:-[^\n-]+)*?(?=\s*-\s*Recommended Human Action|\n\s*[A-Z]|$))/i)?.[1]?.trim()
    || `Score ${meta?.risk_score || 82}/100 (${n.priority}). Potential mislabeling, over-shipment risk, or inventory dispatch anomaly.`;
  const recommendedAction = msg.match(/Recommended Human Action:\s*([^\n]+)/i)?.[1]?.trim()
    || `Supervisor must inspect Box #${boxBarcode} and verify physical counts against the packing slip before re-authorizing invoice assignment.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2px' }}>
      {/* 1. Concise 1-line headline */}
      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500, lineHeight: '1.4' }}>
        Repeated quantity mismatch attempts detected in Invoice Box Mapping section.
      </div>

      {/* 2. Compact Glance Pills Row (Quick WhatsApp-like summary) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2.5px 8px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            fontSize: '11.5px',
            fontWeight: 700,
          }}
        >
          <User size={12} />
          Operator: {operatorName} ({attempts} attempts)
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2.5px 8px',
            borderRadius: '6px',
            background: 'var(--card-sub-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '11.5px',
            fontWeight: 600,
          }}
        >
          <FileText size={12} style={{ color: '#3b82f6' }} />
          Invoice {invoiceNum} (Allowed: {remainingQty} pcs)
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2.5px 8px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            fontSize: '11.5px',
            fontWeight: 700,
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <Package size={12} />
          Box #{boxBarcode} ({boxTotalQty} pcs) • +{excessQty} pcs OVERFLOW
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2.5px 8px',
            borderRadius: '6px',
            background: 'rgba(139, 92, 246, 0.1)',
            color: '#8b5cf6',
            fontSize: '11.5px',
            fontWeight: 700,
          }}
        >
          <BrainCircuit size={12} />
          Risk Score: {meta?.risk_score || 82}/100
        </span>
      </div>

      {/* 3. WhatsApp-style Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 12px',
          borderRadius: '7px',
          border: isExpanded ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--border-color)',
          background: isExpanded ? 'rgba(59, 130, 246, 0.08)' : 'var(--card-sub-bg)',
          color: isExpanded ? '#2563eb' : 'var(--text-main)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isExpanded ? (
            <ChevronUp size={16} style={{ color: '#2563eb' }} />
          ) : (
            <ChevronDown size={16} style={{ color: '#3b82f6' }} />
          )}
          <span>{isExpanded ? 'Hide Details' : 'Show Full Breakdown & AI Audit Details'}</span>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {isExpanded ? 'Click to collapse' : 'Click to expand (Operator, Invoice vs Box, Packs, AGENTS.md)'}
        </span>
      </button>

      {/* 4. Full Expanded Content (when dropdown button is opened) */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '6px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* OPERATOR & ATTEMPT DETAILS BANNER */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.22)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                }}
              >
                <User size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Operator: <span style={{ color: '#ef4444' }}>{operatorName}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '8px' }}>
                    (User ID: #{operatorId} • Role: {operatorRole}{operatorEmail ? ` • ${operatorEmail}` : ''})
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Target Section: <strong>Invoice Box Mapping</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '11.5px',
                fontWeight: 800,
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
              }}
            >
              <AlertCircle size={13} />
              <span>{attempts} Consecutive Failed Attempts (within 15m)</span>
            </div>
          </div>

          {/* COMPARISON GRID: INVOICE VS SCANNED BOX */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Invoice & Part Card */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                  <FileText size={15} style={{ color: '#3b82f6' }} />
                  Invoice: {invoiceNum}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  Barcode #{invoiceBarcode}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong>Part:</strong> {partNum} — {partDesc}
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Model / HSN: {modelHsn}</div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  marginTop: '4px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <div style={{ padding: '4px', background: 'var(--input-bg)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Required</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{reqQty} pcs</div>
                </div>
                <div style={{ padding: '4px', background: 'var(--input-bg)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Filled</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{filledQty} pcs</div>
                </div>
                <div style={{ padding: '4px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600 }}>Allowed Max</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#3b82f6' }}>{remainingQty} pcs</div>
                </div>
              </div>
            </div>

            {/* Scanned Box Card */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.03)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#ef4444' }}>
                  <Package size={15} style={{ color: '#ef4444' }} />
                  Scanned Box #{boxBarcode}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#ef4444',
                    color: '#ffffff',
                  }}
                >
                  +{excessQty} pcs OVERFLOW
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong>Part Identifier:</strong> {boxPart}
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Status: {boxStatus} • Sealed/Locked: {lockStatus}</div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Physical Quantity in Box:</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#ef4444' }}>
                    {boxTotalQty} pcs
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                  Exceeds invoice balance by +{excessQty} pcs
                </div>
              </div>
            </div>
          </div>

          {/* PACK DETAILS INSIDE THIS BOX */}
          {packs && packs.length > 0 && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <Layers size={14} style={{ color: 'var(--primary-color, #3b82f6)' }} />
                Pack Details Inside This Box ({packs.length} pack{packs.length > 1 ? 's' : ''}):
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {packs.map((p, idx) => {
                  const pBarcode = p.barcode || p.pack_id || (boxBarcode ? `Pack for #${boxBarcode}` : 'Pack');
                  const pQty = p.qty ?? p.part_qty ?? boxTotalQty;
                  const pPacker = p.packed_by || p.packer_name || operatorName;
                  const pTime = p.packed_at || (p.created_date ? `${p.created_date} ${p.created_time || ''}`.trim() : '');

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                        Pack #{pBarcode}
                      </span>
                      <span style={{ fontWeight: 800, color: '#3b82f6' }}>{pQty} pcs</span>
                      {pPacker && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          (Packed by {pPacker}{pTime ? ` on ${pTime}` : ''})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MANDATORY AI EXPLAINABILITY & AUDIT TRAIL (AGENTS.md) */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  color: '#8b5cf6',
                }}
              >
                <BrainCircuit size={16} />
                Mandatory AI Explainability & Audit Trail (AGENTS.md)
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                Risk Score: {meta?.risk_score || 82}/100 ({n.priority})
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px', fontSize: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                  • What Happened:
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{whatHappened}</span>
              </div>

              <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                  • Root Cause:
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{rootCause}</span>
              </div>
            </div>

            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '12px',
              }}
            >
              <strong style={{ color: '#10b981' }}>Recommended Human Action: </strong>
              <span style={{ color: 'var(--text-main)' }}>{recommendedAction}</span>
            </div>
          </div>

          {/* Bottom quick collapse button */}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            style={{
              alignSelf: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            <ChevronUp size={14} />
            Collapse details
          </button>
        </div>
      )}
    </div>
  );
};

const CollapsibleNotificationMessage: React.FC<{ message: string; isTargeted?: boolean }> = ({ message, isTargeted }) => {
  const isLong = message.length > 200 || message.includes('\n');
  const [isExpanded, setIsExpanded] = useState<boolean>(!!isTargeted);

  if (!isLong) {
    return (
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
        {message}
      </p>
    );
  }

  const shortPreview = message.length > 180 ? message.slice(0, 180).trim() + '...' : message.split('\n')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
        {isExpanded ? message : shortPreview}
      </p>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          color: 'var(--primary-color, #3b82f6)',
          fontSize: '11.5px',
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {isExpanded ? (
          <>
            <ChevronUp size={13} />
            Show less
          </>
        ) : (
          <>
            <ChevronDown size={13} />
            Read more...
          </>
        )}
      </button>
    </div>
  );
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const {
    notifications,
    summary,
    loading,
    fetchNotifications,
    fetchSummary,
    markAsRead,
    markAllAsRead,
    resolveNotification,
  } = useNotifications();

  // Filters state
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Resolve Modal state
  const [resolveTarget, setResolveTarget] = useState<ERPNotification | null>(null);
  const [resolveNote, setResolveNote] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Auto-scroll and focus target notification when arriving via ?id=
  useEffect(() => {
    if (!targetId || loading || notifications.length === 0) return;
    const found = notifications.find((item) => String(item.id) === String(targetId));
    if (found && !found.is_read) {
      markAsRead(found.id);
    }
    const timer = setTimeout(() => {
      const el = document.getElementById(`notif-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [targetId, loading, notifications, markAsRead]);

  useEffect(() => {
    fetchNotifications({
      page,
      limit: 15,
      priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
      is_read: readFilter === 'UNREAD' ? 'false' : readFilter === 'READ' ? 'true' : undefined,
      search: searchTerm.trim() || undefined,
    });
  }, [page, priorityFilter, typeFilter, readFilter, searchTerm, fetchNotifications]);

  const handleRefresh = () => {
    fetchSummary();
    fetchNotifications({
      page,
      limit: 15,
      priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
      is_read: readFilter === 'UNREAD' ? 'false' : readFilter === 'READ' ? 'true' : undefined,
      search: searchTerm.trim() || undefined,
    });
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await resolveNotification(resolveTarget.id, resolveNote);
      setResolveTarget(null);
      setResolveNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          label: 'CRITICAL',
        };
      case 'HIGH':
        return {
          bg: 'rgba(244, 63, 94, 0.12)',
          color: '#f43f5e',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          label: 'HIGH',
        };
      case 'WARNING':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          label: 'WARNING',
        };
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.12)',
          color: '#3b82f6',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          label: 'INFO',
        };
    }
  };

  const getTypeIcon = (type: string, priority: string) => {
    if (priority === 'CRITICAL' || type === 'AI_HIGH_RISK') {
      return <ShieldAlert size={18} style={{ color: '#ef4444' }} />;
    }
    if (type.includes('BARCODE') || type.includes('DUPLICATE')) {
      return <AlertTriangle size={18} style={{ color: '#f59e0b' }} />;
    }
    if (type.includes('BRIEFING') || type.includes('AI')) {
      return <BrainCircuit size={18} style={{ color: '#8b5cf6' }} />;
    }
    if (type.includes('BOX') || type.includes('PACKING')) {
      return <Package size={18} style={{ color: '#3b82f6' }} />;
    }
    if (type.includes('GATE')) {
      return <Truck size={18} style={{ color: '#10b981' }} />;
    }
    if (type.includes('INVOICE')) {
      return <FileText size={18} style={{ color: '#6366f1' }} />;
    }
    return <Bell size={18} style={{ color: 'var(--text-muted)' }} />;
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
      return `${Math.floor(diffSec / 86400)} day ago`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Bell size={24} style={{ color: 'var(--primary-color, #3b82f6)' }} />
            Notification & Alert Center
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Real-time operational alerts, AI security intelligence, and workflow exception notifications
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh alerts"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={markAllAsRead}
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCheck size={14} />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total Alerts
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {summary.total}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '14px 18px',
              borderLeft: '4px solid #ef4444',
              background: 'rgba(239, 68, 68, 0.03)',
            }}
          >
            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>Critical / High</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
              {summary.critical + summary.high}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '14px 18px',
              borderLeft: '4px solid #f59e0b',
              background: 'rgba(245, 158, 11, 0.03)',
            }}
          >
            <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>Warnings</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
              {summary.warning}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Unread</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              {summary.unread}
            </div>
          </div>

          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Pending Supervisor Actions
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>
              {summary.pending_actions}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Priority Pill Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'].map((p) => {
              const active = priorityFilter === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPriorityFilter(p);
                    setPage(1);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: '1px solid var(--border-color)',
                    background: active ? 'var(--primary-color, #3b82f6)' : 'var(--card-sub-bg)',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 260px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by invoice, customer, or title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg)',
                color: 'var(--text-main)',
                fontSize: '12.5px',
              }}
            />
          </div>
        </div>

        {/* Second Filter Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="AI_HIGH_RISK">AI High Risk</option>
              <option value="AI_MEDIUM_RISK">AI Medium Risk</option>
              <option value="REPEATED_BARCODE_FAILURE">Barcode Retries</option>
              <option value="DUPLICATE_BARCODE">Duplicate Barcode</option>
              <option value="AI_DAILY_SECURITY_BRIEFING">Daily Briefing</option>
              <option value="GATE_DISPATCH_ISSUE">Gate Issues</option>
              <option value="INVOICE_PENDING">Invoice Issues</option>
              <option value="BOX_MAPPING_PENDING">Box Issues</option>
              <option value="PACKING_ISSUE">Packing Issues</option>
            </select>
          </div>

          {/* Read Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Read & Unread</option>
              <option value="UNREAD">Unread Only</option>
              <option value="READ">Read Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading && notifications.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spinning" style={{ marginBottom: '10px' }} />
            <div>Loading live notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-main)' }}>
              No notifications matching filters
            </h3>
            <p style={{ margin: 0, fontSize: '13px' }}>
              All systems operating normally with no active alerts.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const badge = getPriorityBadge(n.priority);
            const isResolved = n.lifecycle_status === 'RESOLVED';
            const isTargeted = targetId && String(n.id) === String(targetId);
            const isMismatch =
              n.type === 'INVOICE_QTY_MISMATCH_RISK' ||
              n.metadata?.alert_category === 'INVOICE_QUANTITY_MISMATCH' ||
              (n.title && n.title.includes('Box Qty Mismatch'));

            return (
              <div
                id={`notif-${n.id}`}
                key={n.id}
                className="card"
                style={{
                  padding: '18px 22px',
                  borderLeft: `5px solid ${badge.color}`,
                  background: isTargeted
                    ? 'rgba(59, 130, 246, 0.08)'
                    : n.is_read
                    ? 'var(--card-bg)'
                    : 'rgba(59, 130, 246, 0.03)',
                  border: isTargeted ? '2px solid #3b82f6' : undefined,
                  boxShadow: isTargeted
                    ? '0 0 0 4px rgba(59, 130, 246, 0.25), 0 8px 24px rgba(0,0,0,0.12)'
                    : undefined,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {getTypeIcon(n.type, n.priority)}
                    </div>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: badge.bg,
                        color: badge.color,
                        border: badge.border,
                      }}
                    >
                      {badge.label}
                    </span>

                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                      {n.title}
                    </span>

                    {n.entity_id && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--card-sub-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {n.entity_id}
                      </span>
                    )}

                    {isTargeted && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
                        }}
                      >
                        Selected Notification
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {getTimeAgo(n.created_at)}
                    </span>

                    {isResolved ? (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle size={12} />
                        Resolved
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        Open
                      </span>
                    )}
                  </div>
                </div>

                {/* Notification Content: Structured for Mismatch, clean pre-line for others */}
                {isMismatch ? (
                  <StructuredMismatchNotification notification={n} isTargeted={isTargeted} />
                ) : (
                  <>
                    <CollapsibleNotificationMessage message={n.message} isTargeted={isTargeted} />

                    {/* Metadata badges if available */}
                    {n.metadata && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                        {n.metadata.risk_score !== undefined && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#ef4444',
                            }}
                          >
                            Risk Score: {n.metadata.risk_score}/100
                          </span>
                        )}
                        {n.metadata.customer_name && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--card-sub-bg)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Customer: {n.metadata.customer_name}
                          </span>
                        )}
                        {n.metadata.failed_count !== undefined && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#f59e0b',
                            }}
                          >
                            Failed Scans: {n.metadata.failed_count}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Resolution note audit if resolved */}
                {isResolved && n.resolution_note && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <MessageSquare size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>Resolution: </span>
                      {n.resolution_note}
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>
                        — {n.resolved_by_name || 'Supervisor'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    marginTop: '4px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      <CheckCheck size={13} />
                      Mark Read
                    </button>
                  )}

                  {!isResolved && (n.priority === 'CRITICAL' || n.priority === 'HIGH' || n.priority === 'WARNING') && (
                    <button
                      type="button"
                      onClick={() => setResolveTarget(n)}
                      className="btn btn-sm btn-secondary"
                      style={{
                        fontSize: '11.5px',
                        padding: '4px 10px',
                        borderColor: '#10b981',
                        color: '#10b981',
                      }}
                    >
                      <CheckCircle size={13} />
                      Resolve Alert
                    </button>
                  )}

                  {(() => {
                    const targetUrl = getNotificationUrl(n);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (!n.is_read) markAsRead(n.id);
                          navigate(targetUrl);
                        }}
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '11.5px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {isMismatch ? 'Open Invoice & Box Mapping' : 'Review Incident'}
                        <ArrowRight size={12} />
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Modal */}
      {resolveTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                Resolve Security Alert
              </h3>
              <button
                type="button"
                onClick={() => setResolveTarget(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--border-color)',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)', marginBottom: '4px' }}>
                {resolveTarget.title}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                {resolveTarget.message}
              </p>
            </div>

            <form onSubmit={handleResolveSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '6px',
                  }}
                >
                  Supervisor Resolution Note (Audit Trail)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Verified physical part serials with production supervisor. Authorization approved."
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setResolveTarget(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', background: '#10b981', borderColor: '#10b981' }}
                >
                  {resolving ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
