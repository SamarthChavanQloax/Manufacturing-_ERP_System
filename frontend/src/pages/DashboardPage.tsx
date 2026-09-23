import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { ShoppingBag, TrendingUp, UserPlus, Eye, Package, Box, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0284c7', '#16a34a', '#d97706', '#dc2626'];

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

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <h1>Dashboard</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Dashboard v1</span>
        </div>
      </div>

      <div className="content-body">
        {/* 4 Stat Boxes matching screenshot 02_admin_dashboard.png */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
            marginBottom: '24px',
          }}
        >
          {/* New Orders */}
          <div className="stat-box bg-info">
            <div>
              <h3>{stats?.newOrders ?? 1501}</h3>
              <p>New Orders</p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                paddingTop: '8px',
                marginTop: '12px',
                fontSize: '12.5px',
              }}
            >
              <span>More info</span>
              <ShoppingBag size={15} />
            </div>
          </div>

          {/* Bounce Rate */}
          <div className="stat-box bg-success">
            <div>
              <h3>{stats?.bounceRate ?? '53%'}</h3>
              <p>Bounce Rate</p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                paddingTop: '8px',
                marginTop: '12px',
                fontSize: '12.5px',
              }}
            >
              <span>More info</span>
              <TrendingUp size={15} />
            </div>
          </div>

          {/* User Registrations */}
          <div className="stat-box bg-warning">
            <div>
              <h3>{stats?.userRegistrations ?? 44}</h3>
              <p>User Registrations</p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                paddingTop: '8px',
                marginTop: '12px',
                fontSize: '12.5px',
              }}
            >
              <span>More info</span>
              <UserPlus size={15} />
            </div>
          </div>

          {/* Unique Visitors */}
          <div className="stat-box bg-danger">
            <div>
              <h3>{stats?.uniqueVisitors ?? 65}</h3>
              <p>Unique Visitors</p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                paddingTop: '8px',
                marginTop: '12px',
                fontSize: '12.5px',
              }}
            >
              <span>More info</span>
              <Eye size={15} />
            </div>
          </div>
        </div>

        {/* Live Manufacturing & ERP Inventory Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Live Barcode ERP Status</h3>
          </div>
          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <Package size={28} color="#0284c7" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                  {stats?.systemCounts?.parts ?? 3051}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  Master Catalog Parts
                </div>
                <Link to="/part_master" className="btn btn-sm btn-primary" style={{ marginTop: '10px' }}>
                  View Parts
                </Link>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <Package size={28} color="#16a34a" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                  {stats?.systemCounts?.packings ?? 209}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  Active Packings
                </div>
                <Link to="/view_packing" className="btn btn-sm btn-success" style={{ marginTop: '10px' }}>
                  View Packing
                </Link>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <Box size={28} color="#d97706" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                  {stats?.systemCounts?.boxes ?? 10}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  Master Boxes
                </div>
                <Link to="/view_box" className="btn btn-sm btn-info" style={{ marginTop: '10px' }}>
                  View Boxes
                </Link>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <FileText size={28} color="#dc2626" style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                  {stats?.systemCounts?.invoices ?? 7}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  Dispatch Invoices
                </div>
                <Link to="/create_invoice" className="btn btn-sm btn-danger" style={{ marginTop: '10px' }}>
                  Invoices
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
          
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <h3 className="card-title">System Data Bar Chart</h3>
            </div>
            <div className="card-body">
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Parts', count: stats?.systemCounts?.parts ?? 3051 },
                      { name: 'Packings', count: stats?.systemCounts?.packings ?? 209 },
                      { name: 'Boxes', count: stats?.systemCounts?.boxes ?? 10 },
                      { name: 'Invoices', count: stats?.systemCounts?.invoices ?? 7 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="count" fill="#3b82f6" name="Total Count" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <h3 className="card-title">System Data Distribution</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Parts', value: stats?.systemCounts?.parts ?? 3051 },
                        { name: 'Packings', value: stats?.systemCounts?.packings ?? 209 },
                        { name: 'Boxes', value: stats?.systemCounts?.boxes ?? 10 },
                        { name: 'Invoices', value: stats?.systemCounts?.invoices ?? 7 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Parts', value: stats?.systemCounts?.parts ?? 3051 },
                        { name: 'Packings', value: stats?.systemCounts?.packings ?? 209 },
                        { name: 'Boxes', value: stats?.systemCounts?.boxes ?? 10 },
                        { name: 'Invoices', value: stats?.systemCounts?.invoices ?? 7 },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
