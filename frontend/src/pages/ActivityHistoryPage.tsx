import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  History,
  Search,
  Filter,
  PlusCircle,
  Edit3,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  Shield,
  User,
  Layers,
  Calendar,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckCircle,
  Copy,
  Check,
  Code,
  Table,
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export interface AuditActivityItem {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  user_email: string | null;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  action_title: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  metadata: string | null;
  ip_address: string | null;
  created_date: string;
  created_time: string;
  created_at: string;
}

export const ActivityHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user?.type || user?.role || 'admin').toLowerCase();
  const isAdmin = userRole === 'admin';

  const [activities, setActivities] = useState<AuditActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number | 'all'>(20);
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<{
    total: number;
    insertCount: number;
    updateCount: number;
    deleteCount: number;
    modules: Array<{ module: string; count: number }>;
  }>({
    total: 0,
    insertCount: 0,
    updateCount: 0,
    deleteCount: 0,
    modules: [],
  });

  // Filters
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState<AuditActivityItem | null>(null);
  const [metadataViewMode, setMetadataViewMode] = useState<'formatted' | 'json'>('formatted');
  const [copiedMetadata, setCopiedMetadata] = useState(false);

  const renderFormattedValue = (key: string, val: any) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    if (typeof val === 'boolean') {
      return (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            background: val ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: val ? '#10b981' : '#ef4444',
          }}
        >
          {val ? 'YES' : 'NO'}
        </span>
      );
    }
    if (typeof val === 'number') {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('qty') || lowerKey.includes('stock') || lowerKey.includes('pcs') || lowerKey.includes('count')) {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
              {val.toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>units / pcs</span>
          </span>
        );
      }
      return (
        <code
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--card-sub-bg)',
            color: 'var(--primary-color, #2563eb)',
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          {val}
        </code>
      );
    }
    if (typeof val === 'object') {
      return (
        <pre
          style={{
            margin: 0,
            padding: '8px',
            borderRadius: '6px',
            background: 'var(--card-sub-bg)',
            fontSize: '11px',
            maxHeight: '120px',
            overflowY: 'auto',
          }}
        >
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    const strVal = String(val);
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('barcode') || lowerKey.includes('number') || lowerKey.includes('invoice') || lowerKey.includes('id')) {
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            color: '#2563eb',
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          {strVal}
        </span>
      );
    }
    return <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '12.5px' }}>{strVal}</span>;
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/activity-log/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching activity stats:', err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: limit === 'all' ? 1000 : limit,
      };
      if (selectedModule && selectedModule !== 'ALL') params.module = selectedModule;
      if (selectedActionType && selectedActionType !== 'ALL') params.action_type = selectedActionType;
      if (search.trim()) params.search = search.trim();
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const res = await api.get('/activity-log', { params });
      setActivities(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching activity history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [page, limit, selectedModule, selectedActionType, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleResetFilters = () => {
    setSelectedModule('ALL');
    setSelectedActionType('ALL');
    setSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleExportExcel = () => {
    if (activities.length === 0) {
      alert('No activity history to export');
      return;
    }
    const exportData = activities.map((item, index) => ({
      'Sr. No.': (page - 1) * (limit === 'all' ? 0 : Number(limit)) + index + 1,
      'Action Type': item.action_type,
      'Action Title': item.action_title,
      'Section / Module': item.module,
      'Entity Identifier': item.entity_id || 'N/A',
      'Details': item.details || 'N/A',
      'Operator Name': item.user_name || 'System',
      'Operator Role': (item.user_role || 'user').toUpperCase(),
      'User ID': item.user_id ? `#${item.user_id}` : 'N/A',
      'Date': item.created_date,
      'Time': item.created_time,
    }));

    exportToExcel(
      exportData,
      `Activity_History_${userRole}_${new Date().toISOString().split('T')[0]}`,
      'Activity_History',
    );
  };

  const getActionBadge = (type: string, entityType?: string | null) => {
    const t = (type || '').toUpperCase();
    if (t === 'INSERT') {
      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              letterSpacing: '0.3px',
            }}
          >
            <PlusCircle size={12} /> INSERT
          </span>
          {entityType && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: '2px', letterSpacing: '0.4px' }}>
              {entityType}
            </span>
          )}
        </div>
      );
    }
    if (t === 'UPDATE') {
      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              letterSpacing: '0.3px',
            }}
          >
            <Edit3 size={12} /> UPDATE
          </span>
          {entityType && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: '2px', letterSpacing: '0.4px' }}>
              {entityType}
            </span>
          )}
        </div>
      );
    }
    if (t === 'DELETE') {
      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2.5px 8px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#dc2626',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              letterSpacing: '0.3px',
            }}
          >
            <Trash2 size={12} /> DELETE
          </span>
          {entityType && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: '2px', letterSpacing: '0.4px' }}>
              {entityType}
            </span>
          )}
        </div>
      );
    }
    return (
      <span
        style={{
          padding: '2.5px 8px',
          borderRadius: '5px',
          fontSize: '11px',
          fontWeight: 700,
          background: 'var(--card-sub-bg)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-color)',
        }}
      >
        {type}
      </span>
    );
  };

  const totalPages = limit === 'all' ? 1 : Math.ceil(total / Number(limit)) || 1;

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <History size={24} style={{ color: 'var(--primary-color, #3b82f6)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
              Activity History & Audit Trail
            </h1>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isAdmin
                ? 'Full system-wide history across all sections (Insert, Update, Delete)'
                : `Activity history log for ${userRole.toUpperCase()} account operations`}
            </div>
          </div>
        </div>

        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span>Audit</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Activity History</span>
        </div>
      </div>

      <div className="content-body">
        {/* Immutable Ledger Notice Banner */}
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 18px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
              <strong>Immutable Audit Log:</strong> Every <strong>Insert</strong>, <strong>Update</strong>, and <strong>Delete</strong> is permanently preserved with operator identity and cannot be edited or altered by anyone.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                background: isAdmin ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: isAdmin ? '#ef4444' : '#3b82f6',
                border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              }}
            >
              Role: {userRole}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {isAdmin ? 'Full System View' : 'User Scoped'}
            </span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            marginBottom: '18px',
          }}
        >
          <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid #3b82f6', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Total Activities
              </span>
              <Database size={16} style={{ color: '#3b82f6', opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {stats.total.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Permanent immutable records
            </div>
          </div>

          <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid #10b981', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                INSERT Operations
              </span>
              <PlusCircle size={16} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {stats.insertCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              e.g. Invoices, Parts Created
            </div>
          </div>

          <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid #f59e0b', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                UPDATE Operations
              </span>
              <Edit3 size={16} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {stats.updateCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              e.g. Locked, Stock Replenished
            </div>
          </div>

          <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid #ef4444', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                DELETE Operations
              </span>
              <Trash2 size={16} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {stats.deleteCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              e.g. Invoices, Parts Removed
            </div>
          </div>
        </div>

        {/* Main Card with Controls & Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ display: 'block', padding: '16px 20px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
            {/* Row 1: Section, Action, Dates, and Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                {isAdmin && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>
                      Section / Module
                    </label>
                    <select
                      className="form-control"
                      value={selectedModule}
                      onChange={(e) => {
                        setSelectedModule(e.target.value);
                        setPage(1);
                      }}
                      style={{ fontSize: '12.5px', height: '36px', minWidth: '170px', fontWeight: 600 }}
                    >
                      <option value="ALL">All Sections (Universal)</option>
                      <option value="Invoices">Invoices</option>
                      <option value="Part Master">Part Master</option>
                      <option value="Gate Verification">Gate Verification</option>
                      <option value="AI Security & Anomaly Detection">AI Security & Anomaly</option>
                      <option value="Packing">Packing</option>
                      <option value="Box Packaging">Box Packaging</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>
                    Action Type
                  </label>
                  <select
                    className="form-control"
                    value={selectedActionType}
                    onChange={(e) => {
                      setSelectedActionType(e.target.value);
                      setPage(1);
                    }}
                    style={{ fontSize: '12.5px', height: '36px', minWidth: '150px', fontWeight: 600 }}
                  >
                    <option value="ALL">All Operations</option>
                    <option value="INSERT">INSERT (Created / Added)</option>
                    <option value="UPDATE">UPDATE (Locked / Resolved)</option>
                    <option value="DELETE">DELETE (Deleted / Removed)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPage(1);
                    }}
                    style={{ fontSize: '12px', height: '36px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPage(1);
                    }}
                    style={{ fontSize: '12px', height: '36px' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="btn btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    height: '36px',
                    padding: '0 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                  }}
                  title="Export Activity History to Excel"
                >
                  <FileSpreadsheet size={15} /> Export to Excel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fetchStats();
                    fetchHistory();
                  }}
                  className="btn btn-sm btn-secondary"
                  style={{ height: '36px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
                  title="Refresh activity logs"
                >
                  <RefreshCw size={14} className={loading ? 'spin-animation' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* Row 2: Search input and pagination options */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by action title, invoice #, part #, operator name, or details..."
                  className="form-control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '34px', height: '36px', fontSize: '12.5px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '12.5px', fontWeight: 600 }}>
                Search
              </button>

              {(search || selectedModule !== 'ALL' || selectedActionType !== 'ALL' || fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-secondary"
                  style={{ height: '36px', fontSize: '12px', fontWeight: 600 }}
                >
                  Reset Filters
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Rows per page:</span>
                <select
                  className="form-control"
                  value={limit}
                  onChange={(e) => {
                    setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value));
                    setPage(1);
                  }}
                  style={{ width: '85px', height: '36px', fontSize: '12px', fontWeight: 600 }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table table-hover table-bordered table-striped" style={{ margin: 0, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--card-sub-bg)', borderBottom: '2px solid var(--border-color)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ width: '50px', textAlign: 'center', padding: '11px 8px' }}>#</th>
                    <th style={{ width: '110px', padding: '11px 12px' }}>Type</th>
                    <th style={{ width: '190px', padding: '11px 12px' }}>Action & Section</th>
                    <th style={{ width: '130px', padding: '11px 12px' }}>Identifier</th>
                    <th style={{ padding: '11px 14px' }}>Activity Description</th>
                    <th style={{ width: '160px', padding: '11px 12px' }}>Operator</th>
                    <th style={{ width: '130px', padding: '11px 12px' }}>Timestamp</th>
                    <th style={{ width: '80px', textAlign: 'center', padding: '11px 8px' }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && activities.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <RefreshCw size={24} className="spin-animation" style={{ marginBottom: '8px' }} />
                        <div>Loading immutable audit history...</div>
                      </td>
                    </tr>
                  ) : activities.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                        <History size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>No Activity Records Found</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          No activity entries matching the current filter criteria.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    activities.map((item, idx) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        style={{
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, verticalAlign: 'middle', padding: '10px 8px' }}>
                          <span style={{ fontSize: '11px', background: 'var(--card-sub-bg)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            {(page - 1) * (limit === 'all' ? 0 : Number(limit)) + idx + 1}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'middle', padding: '10px 12px' }}>
                          {getActionBadge(item.action_type, item.entity_type)}
                        </td>
                        <td style={{ verticalAlign: 'middle', padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px', marginBottom: '3px' }}>
                            {item.action_title}
                          </div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: 'rgba(59, 130, 246, 0.08)',
                              color: '#2563eb',
                              padding: '1.5px 7px',
                              borderRadius: '4px',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                            }}
                          >
                            {item.module}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'middle', padding: '10px 12px' }}>
                          {item.entity_id ? (
                            <span
                              style={{
                                fontFamily: 'Consolas, Monaco, monospace',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: 'var(--card-sub-bg)',
                                color: '#1e40af',
                                padding: '3px 8px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-color)',
                                display: 'inline-block',
                              }}
                            >
                              {item.entity_id}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'middle', padding: '10px 14px' }}>
                          <div style={{ lineHeight: '1.45', color: 'var(--text-main)', fontSize: '12.5px' }}>
                            {item.details || '—'}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle', padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.12)',
                                color: '#2563eb',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {(item.user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.user_name || 'System'}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                {item.user_role || 'operator'} {item.user_id ? `(#${item.user_id})` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle', padding: '10px 12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{item.created_date}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{item.created_time}</div>
                        </td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '10px 8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            className="btn btn-sm btn-secondary"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '5px',
                            }}
                            title="Inspect Full Audit Record"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--card-sub-bg)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Showing <strong>{activities.length}</strong> of <strong>{total}</strong> recorded activities
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage(page - 1)}
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px' }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  <span style={{ fontSize: '12.5px', fontWeight: 600, padding: '0 8px' }}>
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage(page + 1)}
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Item Modal */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--card-sub-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={18} style={{ color: 'var(--primary-color, #3b82f6)' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Audit Activity Record #{selectedItem.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>{getActionBadge(selectedItem.action_type)}</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Recorded on <strong>{selectedItem.created_date}</strong> at <strong>{selectedItem.created_time}</strong>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Action Summary
                </label>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {selectedItem.action_title}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'var(--card-sub-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SECTION / MODULE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>
                    {selectedItem.module}
                  </div>
                </div>

                <div style={{ background: 'var(--card-sub-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ENTITY IDENTIFIER</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
                    {selectedItem.entity_id || 'N/A'} ({selectedItem.entity_type || 'RECORD'})
                  </div>
                </div>

                <div style={{ background: 'var(--card-sub-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>OPERATOR IDENTITY</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                    {selectedItem.user_name || 'System'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {(selectedItem.user_role || 'user').toUpperCase()} {selectedItem.user_id ? `(#${selectedItem.user_id})` : ''}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Detailed Description
                </label>
                <div
                  style={{
                    marginTop: '4px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                  }}
                >
                  {selectedItem.details || 'No additional text recorded.'}
                </div>
              </div>

              {selectedItem.metadata && (() => {
                let parsed: Record<string, any> | null = null;
                try {
                  parsed = typeof selectedItem.metadata === 'string' ? JSON.parse(selectedItem.metadata) : selectedItem.metadata;
                } catch (e) {
                  parsed = null;
                }

                const handleCopy = () => {
                  const text = typeof selectedItem.metadata === 'string' ? selectedItem.metadata : JSON.stringify(selectedItem.metadata, null, 2);
                  navigator.clipboard.writeText(text);
                  setCopiedMetadata(true);
                  setTimeout(() => setCopiedMetadata(false), 2000);
                };

                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
                        Structured Metadata Snapshot
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            background: 'var(--card-sub-bg)',
                            padding: '2px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setMetadataViewMode('formatted')}
                            style={{
                              padding: '3px 10px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: metadataViewMode === 'formatted' ? 'var(--primary-color, #2563eb)' : 'transparent',
                              color: metadataViewMode === 'formatted' ? '#fff' : 'var(--text-muted)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Table size={12} />
                            <span>Structured View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMetadataViewMode('json')}
                            style={{
                              padding: '3px 10px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: metadataViewMode === 'json' ? 'var(--primary-color, #2563eb)' : 'transparent',
                              color: metadataViewMode === 'json' ? '#fff' : 'var(--text-muted)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Code size={12} />
                            <span>Raw JSON</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopy}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '3px 9px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '26px' }}
                          title="Copy Metadata to Clipboard"
                        >
                          {copiedMetadata ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                          <span>{copiedMetadata ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {metadataViewMode === 'formatted' && parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0 ? (
                      <div
                        style={{
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          overflow: 'hidden',
                          background: 'var(--card-bg, #fff)',
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                          <thead>
                            <tr style={{ background: 'var(--card-sub-bg)', borderBottom: '1px solid var(--border-color)' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', width: '40%', fontSize: '11px' }}>
                                AUDIT PROPERTY
                              </th>
                              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px' }}>
                                CAPTURED VALUE AT TIME OF ACTION
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(parsed).map(([key, val], idx) => {
                              const friendlyName = key
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (c) => c.toUpperCase());

                              return (
                                <tr
                                  key={key}
                                  style={{
                                    borderBottom: idx < Object.keys(parsed!).length - 1 ? '1px solid var(--border-color)' : 'none',
                                    background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                                  }}
                                >
                                  <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
                                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{friendlyName}</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '12px', fontFamily: 'monospace' }}>
                                      {key}
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                    {renderFormattedValue(key, val)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <pre
                        style={{
                          margin: 0,
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: '#0f172a',
                          color: '#38bdf8',
                          border: '1px solid #1e293b',
                          fontSize: '12px',
                          fontFamily: 'Consolas, Monaco, monospace',
                          overflowX: 'auto',
                          lineHeight: '1.6',
                        }}
                      >
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(selectedItem.metadata), null, 2);
                          } catch (e) {
                            return selectedItem.metadata;
                          }
                        })()}
                      </pre>
                    )}
                  </div>
                );
              })()}

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '12px',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Immutable Audit Guarantee:</strong> This entry is sealed with primary ledger sequence #{selectedItem.id} and cannot be altered or removed.
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--card-sub-bg)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button type="button" onClick={() => setSelectedItem(null)} className="btn btn-secondary" style={{ fontSize: '13px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
