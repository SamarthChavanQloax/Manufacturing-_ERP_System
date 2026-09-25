import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Package,
  Box,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  RefreshCw,
  Truck,
  PlusCircle,
  Lock,
  CheckCircle2,
  ScanLine,
  ChevronRight,
  Archive,
  Users,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const userRole = (user?.type || 'admin').toLowerCase();

  const roleMeta: Record<string, { title: string; color: string; bg: string; desc: string }> = {
    admin: { title: 'System Administrator', color: '#0284c7', bg: '#e0f2fe', desc: 'Full Factory Overview & Control Across All Stages' },
    packing: { title: 'Packing Station', color: '#16a34a', bg: '#dcfce7', desc: 'Scan finished parts and generate 100k+ barcode labels' },
    box: { title: 'Master Carton Packing Station', color: '#d97706', bg: '#fef3c7', desc: 'Scan packing barcodes into master carton boxes (200k+) and seal containers' },
    invoice: { title: 'Dispatch & Billing Station', color: '#dc2626', bg: '#fee2e2', desc: 'Create commercial dispatch orders (300k+) and map sealed master boxes' },
    gate: { title: 'Security Exit Gate', color: '#7c3aed', bg: '#ede9fe', desc: 'Scan physical master boxes and issue official vehicle exit passes' },
  };

  const currentRole = roleMeta[userRole] || roleMeta.admin;

  const alerts = data?.alerts || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div className="content-body" style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 28px 48px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── HEADER: WELCOME & ROLE STATUS ── */}

      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                background: currentRole.color,
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {currentRole.title}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Welcome, {user?.user_name || 'Operator'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#cbd5e1' }}>
            {currentRole.desc}
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      {/* ── SECTION 2: WHAT NEEDS ATTENTION? (ACTIONABLE ALERTS) ── */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} color="#f59e0b" /> What Needs Attention Now?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {alerts.map((alert: any) => {
              const isDanger = alert.type === 'danger';
              const isWarning = alert.type === 'warning';
              const bg = isDanger ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0f9ff';
              const border = isDanger ? '#fecaca' : isWarning ? '#fde68a' : '#bae6fd';
              const textColor = isDanger ? '#991b1b' : isWarning ? '#92400e' : '#075985';
              const btnBg = isDanger ? '#dc2626' : isWarning ? '#d97706' : '#0284c7';

              return (
                <div
                  key={alert.id}
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <AlertTriangle size={18} color={btnBg} />
                      <strong style={{ fontSize: '15px', color: textColor }}>{alert.title}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{alert.message}</p>
                  </div>
                  <Link
                    to={alert.actionUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: btnBg,
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      width: 'fit-content',
                    }}
                  >
                    <span>{alert.actionText}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ── ROLE: PACKING DASHBOARD ── */}
      {/* ========================================================================= */}
      {userRole === 'packing' && (
        <>
          {/* Quick Actions for Packing */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="#16a34a" /> Packing Station Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              
              <Link
                to="/create_packing"
                style={{
                  background: '#16a34a',
                  color: '#fff',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '12px' }}>
                  <PlusCircle size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Start Single Packing</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', opacity: 0.9 }}>Print 100k+ Barcode Card</p>
                </div>
              </Link>

              <Link
                to="/create_packing_bulk"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  border: '2px solid #16a34a',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '12px' }}>
                  <Package size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Bulk Batch Packing</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Generate multiple barcodes</p>
                </div>
              </Link>

              <Link
                to="/view_packing"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ background: '#f1f5f9', color: 'var(--text-muted)', padding: '12px', borderRadius: '12px' }}>
                  <Layers size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>View Shelf Packings</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Check active 100k+ items</p>
                </div>
              </Link>

              <Link
                to="/part_master"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '12px', borderRadius: '12px' }}>
                  <TrendingUp size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Check Part Catalog</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Part numbers & descriptions</p>
                </div>
              </Link>

            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Today's Packing Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Packed Today</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>
                  {loading ? '...' : (data?.summary?.todayPackedUnits ?? 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>pcs</span>
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{data?.summary?.todayPackingBatches ?? 0} batches processed</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ready on FG Shelf</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#0284c7' }}>
                  {loading ? '...' : (data?.summary?.pendingPackingsCount ?? 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>batches</span>
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{(data?.summary?.pendingPackingsQty ?? 0).toLocaleString()} units waiting for box</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Packed into Master Boxes</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#d97706' }}>
                  {loading ? '...' : (data?.summary?.usedPackingsCount ?? 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>batches</span>
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{(data?.summary?.usedPackingsQty ?? 0).toLocaleString()} units boxed</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Packing Records</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? '...' : (data?.summary?.totalPackingsCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Lifetime FG barcodes</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', marginBottom: '28px' }}>
            {/* Chart 1: Daily Trend */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#16a34a" /> Packing Output (Last 7 Days)
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="units" fill="#16a34a" radius={[6, 6, 0, 0]} name="Units Packed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Status */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon size={18} color="#0284c7" /> Packing Shelf Status
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.charts?.statusDistribution || [{ name: 'No Data', value: 1, color: '#cbd5e1' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(data?.charts?.statusDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12.5px', marginTop: '10px' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>● Ready on Shelf</span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>● In Boxes</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* ── ROLE: BOX DASHBOARD ── */}
      {/* ========================================================================= */}
      {userRole === 'box' && (
        <>
          {/* Quick Actions for Box */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="#d97706" /> Master Box Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              
              <Link
                to="/create_box"
                style={{
                  background: '#d97706',
                  color: '#fff',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '12px' }}>
                  <PlusCircle size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Create Master Box</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', opacity: 0.9 }}>Generate 200k+ Box Container</p>
                </div>
              </Link>

              <Link
                to="/view_box"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  border: '2px solid #d97706',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '12px' }}>
                  <ScanLine size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Scan Items into Box</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Add packings & lock box</p>
                </div>
              </Link>

              <Link
                to="/view_box"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ background: '#f1f5f9', color: 'var(--text-muted)', padding: '12px', borderRadius: '12px' }}>
                  <Box size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>View All Boxes</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Inspect box manifests & seals</p>
                </div>
              </Link>

            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Master Box Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Boxes Created Today</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#d97706' }}>
                  {loading ? '...' : (data?.summary?.todayBoxesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Containers initialized</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sealed & Locked Boxes</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>
                  {loading ? '...' : (data?.summary?.lockedBoxesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: 600 }}>Ready for Invoicing</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open / Unlocked Boxes</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#dc2626' }}>
                  {loading ? '...' : (data?.summary?.unlockedBoxesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: 600 }}>Needs packing & locking</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items Inside Boxes</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? '...' : (data?.summary?.totalItemsInBoxes ?? 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600 }}>pcs</span>
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Total packed inventory</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#d97706" /> Boxes Created (Last 7 Days)
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="boxesCreated" fill="#d97706" radius={[6, 6, 0, 0]} name="Boxes Created" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon size={18} color="#d97706" /> Box Seal Status
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.charts?.statusDistribution || [{ name: 'No Data', value: 1, color: '#cbd5e1' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(data?.charts?.statusDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12.5px', marginTop: '10px' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>● Sealed & Locked</span>
                <span style={{ color: '#d97706', fontWeight: 700 }}>● Open / Unlocked</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* ── ROLE: INVOICE DASHBOARD ── */}
      {/* ========================================================================= */}
      {userRole === 'invoice' && (
        <>
          {/* Quick Actions for Invoice */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="#dc2626" /> Dispatch & Invoice Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              
              <Link
                to="/create_invoice"
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '12px' }}>
                  <PlusCircle size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Create Dispatch Invoice</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', opacity: 0.9 }}>Generate 300k+ Commercial Order</p>
                </div>
              </Link>

              <Link
                to="/create_invoice"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  border: '2px solid #dc2626',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '12px' }}>
                  <Box size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Map Master Boxes</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>Assign sealed boxes to orders</p>
                </div>
              </Link>

            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Dispatch & Invoicing Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoices Created Today</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#dc2626' }}>
                  {loading ? '...' : (data?.summary?.todayInvoicesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Orders generated</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Box Mapping</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#d97706' }}>
                  {loading ? '...' : (data?.summary?.pendingInvoicesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#d97706', fontWeight: 600 }}>Needs boxes assigned</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Sealed Boxes</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>
                  {loading ? '...' : (data?.summary?.availableLockedBoxesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: 600 }}>Ready to assign</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Invoices</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? '...' : (data?.summary?.totalInvoicesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Lifetime orders</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#dc2626" /> Daily Invoices Created (Last 7 Days)
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="invoicesCreated" fill="#dc2626" radius={[6, 6, 0, 0]} name="Invoices Created" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon size={18} color="#dc2626" /> Invoice Allocation Status
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.charts?.statusDistribution || [{ name: 'No Data', value: 1, color: '#cbd5e1' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(data?.charts?.statusDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12.5px', marginTop: '10px' }}>
                <span style={{ color: '#d97706', fontWeight: 700 }}>● Pending Boxes</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>● Sent to Gate</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* ── ROLE: GATE DASHBOARD ── */}
      {/* ========================================================================= */}
      {userRole === 'gate' && (
        <>
          {/* Main Prominent Action for Gate */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="#7c3aed" /> Primary Exit Gate Operation
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
              
              {/* Giant Scan Button */}
              <Link
                to="/verify_invoice"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                  color: '#fff',
                  borderRadius: '16px',
                  padding: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={38} />
                </div>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>Main Action</span>
                  <h2 style={{ margin: '2px 0 0', fontSize: '24px', fontWeight: 900 }}>🚪 SCAN & VERIFY INVOICE</h2>
                  <p style={{ margin: '6px 0 0', fontSize: '13.5px', opacity: 0.9 }}>
                    Scan invoice barcode and physical box stickers to issue clearance pass
                  </p>
                </div>
              </Link>

              {/* Secondary Audit Link */}
              <Link
                to="/gate_out_report"
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  border: '2px solid #7c3aed',
                  borderRadius: '16px',
                  padding: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ background: '#ede9fe', color: '#7c3aed', padding: '14px', borderRadius: '14px' }}>
                  <Truck size={32} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Gate-Out Audit Log</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    View verified vehicles & reprint clearance passes
                  </p>
                </div>
              </Link>

            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Gate Clearance Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cleared Passes Today</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>
                  {loading ? '...' : (data?.summary?.todayGatePassesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: 600 }}>Vehicles exited</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>In Verification Queue</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#0284c7' }}>
                  {loading ? '...' : (data?.summary?.pendingGateVerificationsCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 600 }}>Awaiting physical box scans</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Cleared Dispatches</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: '#7c3aed' }}>
                  {loading ? '...' : (data?.summary?.verifiedGatePassesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Passed inspection</span>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Gate Records</span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? '...' : (data?.summary?.totalGatePassesCount ?? 0).toLocaleString()}
                </h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Lifetime gate logs</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#7c3aed" /> Daily Cleared Vehicles (Last 7 Days)
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="gatePasses" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Vehicles Cleared" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon size={18} color="#7c3aed" /> Gate Verification Status
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.charts?.statusDistribution || [{ name: 'No Data', value: 1, color: '#cbd5e1' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(data?.charts?.statusDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12.5px', marginTop: '10px' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>● Cleared & Pass Issued</span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>● In Progress</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* ── ROLE: ADMIN DASHBOARD (FULL OVERVIEW) ── */}
      {/* ========================================================================= */}
      {userRole === 'admin' && (
        <>
          {/* 5 Classic Color Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            
            {/* Total Parts */}
            <div style={{ background: '#0284c7', borderRadius: '12px', padding: '20px', color: '#fff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>
                    {loading ? '...' : (data?.systemCounts?.parts ?? 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13.5px', opacity: 0.9 }}>Total Parts</p>
                </div>
                <Package size={34} style={{ opacity: 0.7 }} />
              </div>
              <Link to="/part_master" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '16px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                <span>View Parts</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Active Packings */}
            <div style={{ background: '#16a34a', borderRadius: '12px', padding: '20px', color: '#fff', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>
                    {loading ? '...' : (data?.systemCounts?.packings ?? 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13.5px', opacity: 0.9 }}>Active Packings</p>
                </div>
                <Archive size={34} style={{ opacity: 0.7 }} />
              </div>
              <Link to="/view_packing" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '16px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                <span>View Packings</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Master Boxes */}
            <div style={{ background: '#d97706', borderRadius: '12px', padding: '20px', color: '#fff', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>
                    {loading ? '...' : (data?.systemCounts?.boxes ?? 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13.5px', opacity: 0.9 }}>Master Boxes</p>
                </div>
                <Box size={34} style={{ opacity: 0.7 }} />
              </div>
              <Link to="/view_box" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '16px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                <span>View Boxes</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Dispatch Invoices */}
            <div style={{ background: '#dc2626', borderRadius: '12px', padding: '20px', color: '#fff', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>
                    {loading ? '...' : (data?.systemCounts?.invoices ?? 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13.5px', opacity: 0.9 }}>Dispatch Invoices</p>
                </div>
                <FileText size={34} style={{ opacity: 0.7 }} />
              </div>
              <Link to="/create_invoice" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '16px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                <span>View Invoices</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* System Users */}
            <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '12px', padding: '20px', color: '#fff', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>
                    {loading ? '...' : (data?.systemCounts?.users ?? 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13.5px', opacity: 0.9 }}>System Users</p>
                </div>
                <Users size={34} style={{ opacity: 0.7 }} />
              </div>
              <Link to="/erp_users" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '16px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                <span>View Users</span>
                <ChevronRight size={14} />
              </Link>
            </div>

          </div>





          {/* Admin Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#16a34a" /> 7-Day Factory Packing Output
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.productionTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="unitsPacked" fill="#16a34a" radius={[6, 6, 0, 0]} name="Units Packed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieIcon size={18} color="#0284c7" /> 4-Stage Warehouse Stock
              </h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.stockDistribution?.chartData || [{ name: 'No Data', value: 1, color: '#cbd5e1' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(data?.stockDistribution?.chartData || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#0284c7', fontWeight: 600 }}>● Raw Master Stock</span>
                  <strong>{(data?.stockDistribution?.rawStock || 0).toLocaleString()} pcs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>● FG Shelf Rack</span>
                  <strong>{(data?.stockDistribution?.fgStock || 0).toLocaleString()} pcs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#d97706', fontWeight: 600 }}>● Master Box Pack</span>
                  <strong>{(data?.stockDistribution?.boxStock || 0).toLocaleString()} pcs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>● Invoiced / Ready</span>
                  <strong>{(data?.stockDistribution?.invStock || 0).toLocaleString()} pcs</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* ── SECTION 5: RECENT ACTIVITY STREAM (ROLE-FILTERED) & FAST REPORTS ── */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* Recent Activity Feed */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color={currentRole.color} /> Recent {currentRole.title} Activity
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Latest events</span>
          </div>

          {recentActivities.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              No recent records found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentActivities.map((act: any) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--card-sub-bg)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: `${act.badgeColor}15`,
                        color: act.badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {act.type === 'gate' || userRole === 'gate' ? (
                        <ShieldCheck size={18} />
                      ) : act.type === 'invoice' || userRole === 'invoice' ? (
                        <FileText size={18} />
                      ) : act.type === 'box' || userRole === 'box' ? (
                        <Box size={18} />
                      ) : (
                        <Package size={18} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>{act.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{act.description}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        background: `${act.badgeColor}15`,
                        color: act.badgeColor,
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {act.badge}
                    </span>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{act.timeStr}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Reports */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#0284c7" /> Fast Module Navigation
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(userRole === 'admin' || userRole === 'gate') && (
              <Link
                to="/gate_out_report"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-border)',
                  textDecoration: 'none',
                }}
              >
                <Truck size={16} color="#7c3aed" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Gate-Out Clearance Report</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Printable vehicle exit passes</div>
                </div>
                <ArrowRight size={13} color="#94a3b8" />
              </Link>
            )}

            {(userRole === 'admin' || userRole === 'packing') && (
              <Link
                to="/part_stock"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-border)',
                  textDecoration: 'none',
                }}
              >
                <Layers size={16} color="#0284c7" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Part Stock Balances</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Check warehouse stage inventory</div>
                </div>
                <ArrowRight size={13} color="#94a3b8" />
              </Link>
            )}

            {(userRole === 'admin' || userRole === 'packing') && (
              <Link
                to="/view_packing"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-border)',
                  textDecoration: 'none',
                }}
              >
                <Package size={16} color="#16a34a" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Finished Goods History</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>View thermal 100k+ barcode cards</div>
                </div>
                <ArrowRight size={13} color="#94a3b8" />
              </Link>
            )}

            {(userRole === 'admin' || userRole === 'box') && (
              <Link
                to="/view_box"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-border)',
                  textDecoration: 'none',
                }}
              >
                <Box size={16} color="#d97706" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Master Box Inventory</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>View box manifests & seal status</div>
                </div>
                <ArrowRight size={13} color="#94a3b8" />
              </Link>
            )}

            {(userRole === 'admin' || userRole === 'invoice') && (
              <Link
                to="/create_invoice"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--card-sub-bg)',
                  border: '1px solid var(--card-border)',
                  textDecoration: 'none',
                }}
              >
                <FileText size={16} color="#dc2626" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Active Dispatch Invoices</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>View 300k+ commercial orders</div>
                </div>
                <ArrowRight size={13} color="#94a3b8" />
              </Link>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
export default DashboardPage;
