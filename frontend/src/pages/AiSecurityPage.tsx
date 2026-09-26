import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertTriangle, ShieldAlert, Clock, Activity, Search, ShieldCheck } from 'lucide-react';

interface Anomaly {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  timestamp: string;
  entity_id: string;
  actor_name: string;
}

export const AiSecurityPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/security-anomalies');
      setAnomalies(res.data);
    } catch (err) {
      console.error('Error fetching AI security anomalies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626'; // Red
      case 'HIGH': return '#ea580c'; // Orange
      case 'MEDIUM': return '#eab308'; // Yellow
      default: return '#3b82f6'; // Blue
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#fef2f2';
      case 'HIGH': return '#fff7ed';
      case 'MEDIUM': return '#fefce8';
      default: return '#eff6ff';
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('Workflow')) return <Activity size={20} />;
    if (type.includes('Hours')) return <Clock size={20} />;
    return <AlertTriangle size={20} />;
  };

  const filtered = anomalies.filter(a => 
    a.description.toLowerCase().includes(search.toLowerCase()) || 
    a.type.toLowerCase().includes(search.toLowerCase()) ||
    a.actor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={32} color="#dc2626" />
            AI Security & Anomaly Detection
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '15px', maxWidth: '600px' }}>
            Active Watcher AI is monitoring your ERP workflow for bypassed operations, off-hours activity, and fraudulent quantities.
          </p>
        </div>
        <button 
          onClick={fetchAnomalies}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2563eb', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, color: 'white', cursor: 'pointer' }}
        >
          <Activity size={18} />
          Run Security Scan
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total Anomalies (7D)</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>{anomalies.length}</div>
        </div>
        <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '20px', border: '1px solid #fecaca', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)' }}>
          <div style={{ color: '#991b1b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Critical Threats</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#dc2626' }}>
            {anomalies.filter(a => a.severity === 'CRITICAL').length}
          </div>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '20px', border: '1px solid #fed7aa', boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.1)' }}>
          <div style={{ color: '#9a3412', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>High Risk Flags</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#ea580c' }}>
            {anomalies.filter(a => a.severity === 'HIGH').length}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#374151' }}>Security Log</h2>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 12px', width: '300px' }}>
            <Search size={16} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Search anomalies, users, IDs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '8px', width: '100%', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Running deep scan algorithms...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px' }}>No Anomalies Detected</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>Your ERP workflow operations are running smoothly without suspicious patterns.</p>
            </div>
          ) : (
            <div>
              {filtered.map(anomaly => (
                <div key={anomaly.id} style={{ 
                  padding: '20px 24px', 
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  transition: 'background 0.2s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '12px', 
                    background: getSeverityBg(anomaly.severity), 
                    color: getSeverityColor(anomaly.severity),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getIcon(anomaly.type)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>{anomaly.type}</h4>
                      <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {anomaly.timestamp}
                      </span>
                    </div>
                    
                    <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14.5px', lineHeight: '1.5' }}>
                      {anomaly.description}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: getSeverityColor(anomaly.severity),
                        background: getSeverityBg(anomaly.severity),
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: `1px solid ${getSeverityColor(anomaly.severity)}40`
                      }}>
                        {anomaly.severity} RISK
                      </span>
                      <span style={{ fontSize: '13px', color: '#4b5563', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontWeight: 500 }}>
                        Actor: {anomaly.actor_name}
                      </span>
                      <span style={{ fontSize: '13px', color: '#4b5563', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontWeight: 500 }}>
                        Entity: {anomaly.entity_id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
