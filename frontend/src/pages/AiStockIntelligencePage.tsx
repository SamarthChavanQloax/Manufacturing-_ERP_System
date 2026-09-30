import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle, Download, Minus, BarChart2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StockInsight {
  part_id: number;
  part_number: string;
  part_description: string;
  current_stock: number;
  historical_demand_90d: number;
  forecasted_demand_30d: number;
  projected_shortage: number;
  depletion_days: number;
  trend_reason: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
}

export const AiStockIntelligencePage: React.FC = () => {
  const [insights, setInsights] = useState<StockInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.get('/ai/stock-intelligence');
      setInsights(res.data);
    } catch (err) {
      console.error('Error fetching AI stock intelligence', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text('AI Production Plan & Stock Forecast', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = insights
      .filter(i => i.projected_shortage > 0)
      .map((i, idx) => [
        idx + 1,
        i.part_number,
        i.part_description,
        i.current_stock,
        i.forecasted_demand_30d,
        i.projected_shortage,
        `${i.depletion_days} days`
      ]);

    autoTable(doc, {
      startY: 28,
      head: [['#', 'Part No', 'Description', 'Current Stock', '30d Forecast', 'Suggested Production', 'Depletes In']],
      body: tableData,
    });

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Production_Plan_Forecast.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const highRiskCount = insights.filter(i => i.risk_level === 'HIGH').length;
  const mediumRiskCount = insights.filter(i => i.risk_level === 'MEDIUM').length;

  return (
    <div>
      <div className="content-header">
        <h1 style={{ color: 'var(--text-main)' }}>AI Stock Intelligence</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Operations Intelligence</span>
        </div>
      </div>

      <div className="content-body">
        {/* Plain English AI Health Banner */}
        {!loading && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              backgroundColor: highRiskCount > 0 ? 'rgba(239, 68, 68, 0.12)' : mediumRiskCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${highRiskCount > 0 ? 'rgba(239, 68, 68, 0.35)' : mediumRiskCount > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              color: 'var(--text-main)',
            }}
          >
            {highRiskCount > 0 ? (
              <AlertCircle size={28} color="#ef4444" style={{ flexShrink: 0 }} />
            ) : mediumRiskCount > 0 ? (
              <AlertCircle size={28} color="#f59e0b" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle size={28} color="#10b981" style={{ flexShrink: 0 }} />
            )}
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: highRiskCount > 0 ? '#ef4444' : mediumRiskCount > 0 ? '#f59e0b' : '#10b981' }}>
                {highRiskCount > 0
                  ? '🚨 Urgent Action Needed: Stock Shortage Detected!'
                  : mediumRiskCount > 0
                  ? '⚠️ Attention: Some parts are depleting soon'
                  : '✅ All Stock is Safe & Available (No Shortage)'}
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-main)', opacity: 0.9 }}>
                {highRiskCount > 0
                  ? `${highRiskCount} part(s) have higher demand than current stock. Immediate production is recommended.`
                  : mediumRiskCount > 0
                  ? `${mediumRiskCount} part(s) will run out of stock in less than 45 days.`
                  : 'Your factory has sufficient stock for all parts with zero projected shortage. You do not need to produce anything right now.'}
              </p>
            </div>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> High Risk Parts
            </h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>{loading ? '-' : highRiskCount}</p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Requires immediate production</p>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Medium Risk Parts
            </h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>{loading ? '-' : mediumRiskCount}</p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Depleting within 45 days</p>
          </div>

          <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#10b981', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} /> Safe & In-Stock Parts
            </h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
              {loading ? '-' : insights.filter(i => i.risk_level === 'LOW').length}
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Plenty of stock in factory</p>
          </div>

          <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'var(--card-sub-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <button 
              onClick={handleExportPdf}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}
            >
              <Download size={18} />
              Download Production Plan
            </button>
            <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: 'var(--text-muted)', textAlign: 'center' }}>
              Exports only parts with projected shortages
            </p>
          </div>
        </div>

        {/* Trend Graph */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={20} color="#3b82f6" />
              <h3 className="card-title" style={{ margin: 0 }}>Top 5 High-Risk Parts: Stock vs Demand Trend</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-main)', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
              🟢 Green = What is currently in stock | 🟠 Orange = What customers will need
            </span>
          </div>
          <div className="card-body" style={{ height: '350px', padding: '20px' }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading AI Insights...</div>
            ) : insights.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insights.slice(0, 5)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="part_number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted, #94a3b8)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted, #94a3b8)', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color, #374151)', background: 'var(--card-bg, #111827)', color: 'var(--text-main, #f9fafb)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="current_stock" name="Current Stock" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  <Bar dataKey="forecasted_demand_30d" name="30-Day Forecast" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Stock Availability & Demand Forecast</h3>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Shows real-time stock levels and AI production suggestions
            </span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Current Stock</th>
                    <th>Stock Status</th>
                    <th>30-Day Forecast</th>
                    <th>Suggested Production</th>
                    <th>Depletes In</th>
                    <th>Trend Reason</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>Loading AI Insights...</td>
                    </tr>
                  ) : insights.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>No data available</td>
                    </tr>
                  ) : (
                    insights.map((item) => (
                      <tr key={item.part_id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.part_number}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.part_description}</div>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{item.current_stock} pcs</td>
                        <td>
                          {item.current_stock > 0 ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                border: '1px solid #86efac',
                              }}
                            >
                              <CheckCircle size={13} color="#16a34a" /> In Stock ({item.current_stock} Available)
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                              }}
                            >
                              <AlertCircle size={13} color="#dc2626" /> No Stock (0 Available)
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: '#3b82f6' }}>{item.forecasted_demand_30d} pcs</td>
                        <td>
                          {item.projected_shortage > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>+{item.projected_shortage} units needed</span>
                          ) : (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}><CheckCircle size={14} style={{ verticalAlign: 'text-bottom' }}/> Stock Sufficient</span>
                          )}
                        </td>
                        <td>
                          {item.depletion_days === -1 ? (
                            <span style={{ color: '#9ca3af' }}>No demand</span>
                          ) : item.depletion_days <= 15 ? (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>{item.depletion_days} days</span>
                          ) : (
                            <span>{item.depletion_days} days</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            {item.trend_reason.includes('increased') ? <TrendingUp size={14} color="#dc2626" /> : 
                             item.trend_reason.includes('decreased') ? <TrendingDown size={14} color="#16a34a" /> : 
                             <Minus size={14} color="#9ca3af" />}
                            {item.trend_reason}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Confidence: {item.confidence_score}%</div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              item.risk_level === 'HIGH' ? 'badge-used' : 
                              item.risk_level === 'MEDIUM' ? 'badge-pending' : 'badge-verified'
                            }`}
                            style={item.risk_level === 'HIGH' ? { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' } : 
                                   item.risk_level === 'MEDIUM' ? { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } : {}}
                          >
                            {item.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
