import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Package, Box, FileText, Users, Activity, TrendingUp, Archive, ChevronRight, BarChart2, PieChart as PieIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0284c7', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', padding: '10px 14px', borderRadius: '8px', color: '#fff', fontSize: '13px' }}>
        <strong>{label}</strong>
        <div style={{ color: '#93c5fd', marginTop: '4px' }}>{payload[0].value.toLocaleString()} records</div>
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const sc = stats?.systemCounts;
  const total = (sc?.parts ?? 0) + (sc?.packings ?? 0) + (sc?.boxes ?? 0) + (sc?.invoices ?? 0);
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const chartData = [
    { name: 'Parts', count: sc?.parts ?? 0, color: '#0284c7' },
    { name: 'Packings', count: sc?.packings ?? 0, color: '#16a34a' },
    { name: 'Boxes', count: sc?.boxes ?? 0, color: '#d97706' },
    { name: 'Invoices', count: sc?.invoices ?? 0, color: '#dc2626' },
  ];

  const pieData = [
    { name: 'Parts', value: sc?.parts ?? 0, color: '#0284c7' },
    { name: 'Packings', value: sc?.packings ?? 0, color: '#16a34a' },
    { name: 'Boxes', value: sc?.boxes ?? 0, color: '#d97706' },
    { name: 'Invoices', value: sc?.invoices ?? 0, color: '#dc2626' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="content-header">
        <h1>Dashboard</h1>
        <div className="breadcrumbs">
          <span>Home</span><span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Overview</span>
        </div>
      </div>

      <div className="content-body">

        {/* ── Original colored stat-box cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '26px' }}>

          <div className="stat-box bg-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{loading ? '...' : (sc?.parts ?? 0).toLocaleString()}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>Total Parts</p>
              </div>
              <Package size={32} style={{ opacity: 0.7 }} />
            </div>
            <Link to="/part_master" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#fff', textDecoration: 'none' }}>
              <span>View Parts</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="stat-box bg-success">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{loading ? '...' : (sc?.packings ?? 0).toLocaleString()}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>Active Packings</p>
              </div>
              <Archive size={32} style={{ opacity: 0.7 }} />
            </div>
            <Link to="/view_packing" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#fff', textDecoration: 'none' }}>
              <span>View Packings</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="stat-box bg-warning">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{loading ? '...' : (sc?.boxes ?? 0).toLocaleString()}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>Master Boxes</p>
              </div>
              <Box size={32} style={{ opacity: 0.7 }} />
            </div>
            <Link to="/view_box" style={{ borderTop: '1px solid rgba(0,0,0,0.15)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#000', textDecoration: 'none', opacity: 0.75 }}>
              <span>View Boxes</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="stat-box bg-danger">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{loading ? '...' : (sc?.invoices ?? 0).toLocaleString()}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>Dispatch Invoices</p>
              </div>
              <FileText size={32} style={{ opacity: 0.7 }} />
            </div>
            <Link to="/create_invoice" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#fff', textDecoration: 'none' }}>
              <span>View Invoices</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{loading ? '...' : (sc?.users ?? 0).toLocaleString()}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>System Users</p>
              </div>
              <Users size={32} style={{ opacity: 0.7 }} />
            </div>
            <Link to="/erp_users" style={{ borderTop: '1px solid rgba(255,255,255,0.25)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#fff', textDecoration: 'none' }}>
              <span>View Users</span>
              <ChevronRight size={14} />
            </Link>
          </div>

        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px', marginBottom: '26px' }}>

          {/* Bar Chart */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={18} color="#0284c7" /> ERP System Overview
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Live count of all records by category</div>
              </div>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px' }}>
                Live Data
              </span>
            </div>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 13, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Records">
                    {chartData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <PieIcon size={18} color="#0284c7" />
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Distribution</div>
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '8px' }}>Records by category</div>

            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length ? pieData : [{ name: 'No Data', value: 1, color: '#e2e8f0' }]}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={pieData.length ? 3 : 0}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(pieData.length ? pieData : [{ name: 'No Data', value: 1, color: '#e2e8f0' }]).map((entry: any, index: number) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [val.toLocaleString(), 'Records']} />
                  <Legend iconType="circle" iconSize={10} verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{total.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Total Records</div>
            </div>
          </div>
        </div>

        {/* ── Category Breakdown + Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>

          {/* Category Progress Table */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Activity size={18} color="#0284c7" />
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Category Breakdown</div>
            </div>
            {[
              { label: 'Master Parts', count: sc?.parts ?? 0, color: '#0284c7', bg: '#dbeafe', to: '/part_master' },
              { label: 'Active Packings', count: sc?.packings ?? 0, color: '#16a34a', bg: '#dcfce7', to: '/view_packing' },
              { label: 'Master Boxes', count: sc?.boxes ?? 0, color: '#d97706', bg: '#fef3c7', to: '/view_box' },
              { label: 'Dispatch Invoices', count: sc?.invoices ?? 0, color: '#dc2626', bg: '#fee2e2', to: '/create_invoice' },
              { label: 'System Users', count: sc?.users ?? 0, color: '#7c3aed', bg: '#ede9fe', to: '/erp_users' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ background: item.bg, borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: item.color, fontWeight: 800, fontSize: '13px' }}>{item.count}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{pct(item.count)}%</span>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '7px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct(item.count), 100)}%`, height: '100%', background: item.color, borderRadius: '99px', transition: 'width 1s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <TrendingUp size={18} color="#0284c7" />
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Quick Actions</div>
            </div>
            {[
              { label: 'Add New Part', color: '#0284c7', bg: '#dbeafe', icon: <Package size={16} />, to: '/part_master' },
              { label: 'Create Packing', color: '#16a34a', bg: '#dcfce7', icon: <Archive size={16} />, to: '/create_packing' },
              { label: 'Create Bulk Packing', color: '#d97706', bg: '#fef3c7', icon: <Archive size={16} />, to: '/create_packing_bulk' },
              { label: 'View Boxes', color: '#7c3aed', bg: '#ede9fe', icon: <Box size={16} />, to: '/view_box' },
              { label: 'View Invoices', color: '#dc2626', bg: '#fee2e2', icon: <FileText size={16} />, to: '/create_invoice' },
              { label: 'Gate Out Report', color: '#0f172a', bg: '#f1f5f9', icon: <BarChart2 size={16} />, to: '/gate_out_report' },
            ].map((action, i) => (
              <Link
                key={i}
                to={action.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  background: action.bg,
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseOut={e => (e.currentTarget.style.opacity = '1')}
              >
                <span style={{ color: action.color }}>{action.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: action.color }}>{action.label}</span>
                <ChevronRight size={13} color={action.color} style={{ marginLeft: 'auto' }} />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
