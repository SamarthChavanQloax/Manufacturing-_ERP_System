import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle, Download, Minus } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        <h1>AI Stock Intelligence</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Operations Intelligence</span>
        </div>
      </div>

      <div className="content-body">
        {/* KPI Summary Cards */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#fee2e2', padding: '20px', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> High Risk Parts
            </h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#7f1d1d' }}>{loading ? '-' : highRiskCount}</p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#991b1b' }}>Requires immediate production</p>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#b45309', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Medium Risk Parts
            </h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#92400e' }}>{loading ? '-' : mediumRiskCount}</p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#b45309' }}>Depleting within 45 days</p>
          </div>

          <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <button 
              onClick={handleExportPdf}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}
            >
              <Download size={18} />
              Download Production Plan
            </button>
            <p style={{ fontSize: '12px', margin: '8px 0 0 0', color: '#6b7280', textAlign: 'center' }}>
              Exports only parts with projected shortages
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Demand Forecast & Stock Out Risk</h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Part Number</th>
                    <th>Current Stock</th>
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
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>Loading AI Insights...</td>
                    </tr>
                  ) : insights.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>No data available</td>
                    </tr>
                  ) : (
                    insights.map((item) => (
                      <tr key={item.part_id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{item.part_number}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.part_description}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.current_stock}</td>
                        <td style={{ fontWeight: 600, color: '#3b82f6' }}>{item.forecasted_demand_30d}</td>
                        <td>
                          {item.projected_shortage > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>+{item.projected_shortage} units</span>
                          ) : (
                            <span style={{ color: '#16a34a' }}><CheckCircle size={14} style={{ verticalAlign: 'text-bottom' }}/> Sufficient</span>
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
