import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useNotifications, ERPNotification } from '../context/NotificationContext';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
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

            return (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${badge.color}`,
                  background: n.is_read ? 'var(--card-bg)' : 'rgba(59, 130, 246, 0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
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

                    <span style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-main)' }}>
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

                {/* Message Body */}
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  {n.message}
                </p>

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

                  {n.action_url && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        navigate(n.action_url!);
                      }}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '11.5px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Review Incident
                      <ArrowRight size={12} />
                    </button>
                  )}
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
