import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  FileSpreadsheet,
  CheckCircle,
  Eye,
  UserCheck,
  TrendingUp,
  Clock,
  Layers,
  Activity,
  X,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { exportToExcel } from '../utils/excelExport';
import { AiGateRiskReviewModal } from '../components/AiGateRiskReviewModal';

export const AiGateRiskDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'pending_review' | 'reviewed'>('ALL');
  const [limit, setLimit] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Selected transaction for review / detail modal
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Configuration modal
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/ai/gate-risk/dashboard');
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching gate risk dashboard summary', err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/gate-risk/transactions', {
        params: {
          risk_level: riskFilter,
          review_status: reviewFilter,
          search: search.trim() || undefined,
          limit,
          page,
        },
      });
      setTransactions(res.data.items || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching gate risk transactions', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/ai/gate-risk/config');
      setConfigs(res.data);
    } catch (err) {
      console.error('Error fetching gate risk configs', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchConfigs();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [riskFilter, reviewFilter, search, limit, page]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      for (const [k, v] of Object.entries(configs)) {
        await api.post('/ai/gate-risk/config', { key: k, value: String(v) });
      }
      alert('Risk configuration parameters updated successfully.');
      setConfigModalOpen(false);
      fetchDashboard();
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating configuration');
    } finally {
      setSavingConfig(false);
    }
  };

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

  const handleExportExcel = () => {
    const exportData = transactions.map((t, idx) => ({
      'Sr. No.': idx + 1,
      'Invoice #': t.invoice_number,
      'Barcode': t.invoice_barcode,
      'Customer': t.customer_name,
      'Part': t.part_number,
      'Qty': t.invoice_qty,
      'Risk Score': t.risk_score,
      'Risk Level': t.risk_level,
      'Review Status': t.review_status,
      'Reviewed By': t.reviewed_by_name || 'N/A',
      'Reasons': Array.isArray(t.reasons) ? t.reasons.join('; ') : '',
    }));
    exportToExcel(exportData, 'AI_Gate_Risk_Analysis_Report', 'GateRisk');
  };

  const pieData = summary
    ? [
        { name: 'Low Risk', value: summary.low_risk_count, color: '#16a34a' },
        { name: 'Medium Risk', value: summary.medium_risk_count, color: '#d97706' },
        { name: 'High Risk', value: summary.high_risk_count, color: '#dc2626' },
      ].filter((d) => d.value > 0)
    : [];

  const barData = summary?.factor_frequencies || [];

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              AI Gate Risk Analysis & Security Hub
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Real-time anomaly scoring, dispatch pattern validation, and supervisor review audit trail.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setConfigModalOpen(true)}
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sliders size={14} /> Risk Config
          </button>
          <button
            type="button"
            onClick={() => {
              fetchDashboard();
              fetchTransactions();
            }}
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh AI
          </button>
        </div>
      </div>

      <div className="content-body">
        {/* Top KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Gate Scans
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {summary?.total_analyzed || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Avg Risk Score: <strong>{summary?.average_risk_score || 0} / 100</strong>
            </div>
          </div>

          <div
            style={{
              background: '#f0fdf4',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #bbf7d0',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.05)',
            }}
          >
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
              Low Risk (Normal)
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
              {summary?.low_risk_count || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
              {summary?.total_analyzed
                ? `${Math.round(((summary.low_risk_count || 0) / summary.total_analyzed) * 100)}% of total`
                : '0%'}
            </div>
          </div>

          <div
            style={{
              background: '#fffbeb',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #fde68a',
              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.05)',
            }}
          >
            <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>
              Medium Risk (Review)
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
              {summary?.medium_risk_count || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
              Advisory Signals Flagged
            </div>
          </div>

          <div
            style={{
              background: '#fef2f2',
              borderRadius: '12px',
              padding: '18px 20px',
              border: '1px solid #fecaca',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)',
            }}
          >
            <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>
              High Risk Dispatches
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
              {summary?.high_risk_count || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
              Pending Reviews: <strong>{summary?.pending_reviews_count || 0}</strong>
            </div>
          </div>
        </div>

        {/* Visual Charts Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          {/* Donut Chart: Risk Level Breakdown */}
          <div
            className="card"
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '320px' }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Risk Level Breakdown
            </h3>
            {pieData.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No gate transactions analyzed yet.
              </div>
            ) : (
              <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                        background: '#1e293b',
                        color: '#ffffff',
                        border: 'none',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar Chart: Risk Factor Frequencies */}
          <div
            className="card"
            style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '320px' }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Risk Factor Detection Frequency
            </h3>
            {barData.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No risk signals recorded.
              </div>
            ) : (
              <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={140} style={{ fontSize: '11.5px', fill: '#475569' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '12px',
                        background: '#1e293b',
                        color: '#ffffff',
                        border: 'none',
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Trigger Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="card">
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Risk Filter Tabs */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '4px' }}>
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setRiskFilter(lvl);
                      setPage(1);
                    }}
                    style={{
                      background: riskFilter === lvl ? '#ffffff' : 'transparent',
                      border: 'none',
                      boxShadow: riskFilter === lvl ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      color: riskFilter === lvl ? '#0f172a' : '#64748b',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: riskFilter === lvl ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {lvl === 'ALL' ? 'All Risks' : `${lvl} Risk`}
                  </button>
                ))}
              </div>

              {/* Review Filter */}
              <select
                className="form-control"
                value={reviewFilter}
                onChange={(e) => {
                  setReviewFilter(e.target.value as any);
                  setPage(1);
                }}
                style={{ width: '150px', padding: '5px 10px', fontSize: '13px' }}
              >
                <option value="ALL">All Review Status</option>
                <option value="pending_review">Pending Review</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 10px', width: '260px' }}>
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search Invoice, Customer, Part..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '6px', width: '100%', fontSize: '13px' }}
                />
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm btn-success"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: '#fff', border: 'none' }}
              >
                <FileSpreadsheet size={14} /> Export
              </button>
            </div>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Sr. No.</th>
                    <th>Invoice / Barcode</th>
                    <th>Customer</th>
                    <th>Target Part & Qty</th>
                    <th style={{ width: '110px' }}>Risk Score</th>
                    <th style={{ width: '100px' }}>Level</th>
                    <th>Primary Risk Signal</th>
                    <th style={{ width: '120px' }}>Review Status</th>
                    <th style={{ width: '140px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                        Loading analyzed transactions...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                        No gate risk records match current criteria.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t, idx) => {
                      const color = getRiskColor(t.risk_level);
                      const bg = getRiskBg(t.risk_level);
                      const primaryReason =
                        Array.isArray(t.reasons) && t.reasons.length > 0
                          ? t.reasons[0]
                          : 'Normal parameters';

                      return (
                        <tr key={t.id}>
                          <td>{(page - 1) * limit + idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {t.invoice_number || 'INV'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#0284c7' }}>{t.invoice_barcode}</div>
                          </td>
                          <td style={{ fontWeight: 600, color: '#334155' }}>{t.customer_name || 'Generic'}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.part_number}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{t.invoice_qty} Pcs</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: bg,
                                  color: color,
                                  fontWeight: 800,
                                  fontSize: '13px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: `1px solid ${color}40`,
                                }}
                              >
                                {t.risk_score}
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>/ 100</span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                background: color,
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '12px',
                              }}
                            >
                              {t.risk_level}
                            </span>
                          </td>
                          <td style={{ fontSize: '12.5px', color: '#475569', maxWidth: '300px' }}>
                            {primaryReason}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                t.review_status === 'reviewed'
                                  ? 'badge-verified'
                                  : t.risk_level === 'HIGH'
                                  ? 'badge-danger'
                                  : 'badge-pending'
                              }`}
                              style={{ fontSize: '11px' }}
                            >
                              {t.review_status === 'reviewed' ? 'Reviewed' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTx(t);
                                  setDetailModalOpen(true);
                                }}
                                className="btn btn-sm btn-secondary"
                                title="View Risk Evidence"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <Eye size={13} /> View
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTx(t);
                                  setReviewModalOpen(true);
                                }}
                                className="btn btn-sm btn-primary"
                                title="Review & Log Audit"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <UserCheck size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Showing {transactions.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, totalCount)} of {totalCount} transactions
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn btn-sm btn-secondary"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= totalCount}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn btn-sm btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedTx && (
        <AiGateRiskReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedTx(null);
          }}
          analysis={selectedTx}
          onReviewSubmitted={() => {
            fetchDashboard();
            fetchTransactions();
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedTx && detailModalOpen && (
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
          onClick={() => {
            setDetailModalOpen(false);
            setSelectedTx(null);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '650px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                AI Gate Risk Details & Evidence Chain
              </h3>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedTx(null);
                }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: getRiskBg(selectedTx.risk_level),
                  border: `1px solid ${getRiskColor(selectedTx.risk_level)}40`,
                  borderRadius: '10px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>RISK CLASSIFICATION</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: getRiskColor(selectedTx.risk_level) }}>
                    {selectedTx.risk_level} &bull; Score: {selectedTx.risk_score} / 100
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Status</div>
                  <span className={`badge ${selectedTx.review_status === 'reviewed' ? 'badge-verified' : 'badge-danger'}`}>
                    {selectedTx.review_status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                  </span>
                </div>
              </div>

              {/* Reasons */}
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>AI Identified Anomalies:</h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                {(Array.isArray(selectedTx.reasons) ? selectedTx.reasons : []).map((r: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '13.5px', color: '#334155', marginBottom: '6px' }}>
                    {r}
                  </li>
                ))}
              </ul>

              {/* Risk Factors Table */}
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Risk Factor Weights:</h4>
              <div className="table-responsive" style={{ marginBottom: '20px' }}>
                <table className="data-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Factor</th>
                      <th>Score</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedTx.risk_factors || {}).map(([key, f]: [string, any]) => (
                      <tr key={key}>
                        <td style={{ fontWeight: 600 }}>{f.name}</td>
                        <td style={{ fontWeight: 700, color: f.score > 0 ? '#dc2626' : '#16a34a' }}>
                          +{f.score} / {f.maxScore}
                        </td>
                        <td style={{ color: '#475569' }}>{f.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Review History */}
              {selectedTx.reviewed_by_name && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#166534',
                  }}
                >
                  <strong>Review Decision:</strong> {selectedTx.review_decision?.toUpperCase()} by{' '}
                  {selectedTx.reviewed_by_name} on{' '}
                  {selectedTx.review_timestamp ? new Date(selectedTx.review_timestamp).toLocaleString() : 'N/A'}
                  {selectedTx.review_note && (
                    <div style={{ marginTop: '4px', fontStyle: 'italic' }}>"{selectedTx.review_note}"</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {configModalOpen && (
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
          onClick={() => setConfigModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '560px',
              maxWidth: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Configure AI Risk Scoring Parameters
              </h3>
              <button
                onClick={() => setConfigModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Quantity Anomaly Weight (Max Points)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={configs.WEIGHT_QUANTITY || '28'}
                    onChange={(e) => setConfigs({ ...configs, WEIGHT_QUANTITY: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Off-Hours Dispatch Weight (Max Points)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={configs.WEIGHT_TIME || '20'}
                    onChange={(e) => setConfigs({ ...configs, WEIGHT_TIME: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Workflow Bypass / Rapid Sequence Weight
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={configs.WEIGHT_WORKFLOW_BYPASS || '22'}
                    onChange={(e) => setConfigs({ ...configs, WEIGHT_WORKFLOW_BYPASS: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Failed Barcode Scans Pattern Weight
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={configs.WEIGHT_FAILED_SCANS || '25'}
                    onChange={(e) => setConfigs({ ...configs, WEIGHT_FAILED_SCANS: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Off-Hours Start (Hour 0-23)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={configs.OFF_HOURS_START || '22'}
                      onChange={(e) => setConfigs({ ...configs, OFF_HOURS_START: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Off-Hours End (Hour 0-23)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={configs.OFF_HOURS_END || '6'}
                      onChange={(e) => setConfigs({ ...configs, OFF_HOURS_END: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="btn btn-primary"
                >
                  {savingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
