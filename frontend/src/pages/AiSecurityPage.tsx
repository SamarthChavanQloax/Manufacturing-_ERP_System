import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertTriangle, ShieldAlert, Clock, Activity, Search, ShieldCheck, CheckCircle } from 'lucide-react';

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
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [showInvestigatedOnly, setShowInvestigatedOnly] = useState(false);
  
  // Track logged investigations locally for the demo
  const [investigatedIds, setInvestigatedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ai_investigations');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Track completed investigations
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ai_completed_investigations');
    return saved ? JSON.parse(saved) : [];
  });

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

  const filtered = anomalies.filter(a => {
    const matchesSearch = a.description.toLowerCase().includes(search.toLowerCase()) || 
                          a.type.toLowerCase().includes(search.toLowerCase()) ||
                          a.actor_name.toLowerCase().includes(search.toLowerCase());
    
    if (showInvestigatedOnly) {
      return matchesSearch && investigatedIds.includes(a.id);
    }
    return matchesSearch;
  });

  const getRecommendedAction = (type: string) => {
    if (type.includes('Workflow Bypass')) {
      return "Immediate action required. Verify physical stock on the floor against system records. Audit CCTV footage for the user during the specified timeframe. Suspend the user's packing privileges until investigation is complete.";
    }
    if (type.includes('Off-Hours')) {
      return "Review access logs to determine if this was authorized overtime. Check physical gate registers to confirm actual vehicle movement. Contact the shift supervisor for verification.";
    }
    if (type.includes('Quantity')) {
      return "Hold the dispatch. Cross-check the generated invoice quantity against the official Customer Purchase Order (PO). Contact the sales department to verify this volume.";
    }
    return "Review the logs and interview the involved personnel.";
  };

  const handleLogInvestigation = () => {
    if (selectedAnomaly && !investigatedIds.includes(selectedAnomaly.id)) {
      const newIds = [...investigatedIds, selectedAnomaly.id];
      setInvestigatedIds(newIds);
      localStorage.setItem('ai_investigations', JSON.stringify(newIds));
    }
    setSelectedAnomaly(null);
  };

  const handleCompleteInvestigation = () => {
    if (selectedAnomaly && !completedIds.includes(selectedAnomaly.id)) {
      const newIds = [...completedIds, selectedAnomaly.id];
      setCompletedIds(newIds);
      localStorage.setItem('ai_completed_investigations', JSON.stringify(newIds));
    }
    setSelectedAnomaly(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      {/* Detail Modal Overlay */}
      {selectedAnomaly && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedAnomaly(null)}>
          <div style={{ 
            background: '#fff', borderRadius: '16px', padding: '32px', width: '550px', 
            maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: getSeverityBg(selectedAnomaly.severity), color: getSeverityColor(selectedAnomaly.severity) }}>
                {getIcon(selectedAnomaly.type)}
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#111827' }}>{selectedAnomaly.type}</h2>
                <div style={{ color: getSeverityColor(selectedAnomaly.severity), fontWeight: 600, fontSize: '13px' }}>
                  {selectedAnomaly.severity} RISK
                </div>
              </div>
            </div>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>Incident Description</h4>
              <p style={{ margin: 0, color: '#374151', fontSize: '14.5px', lineHeight: '1.6' }}>{selectedAnomaly.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Time of Occurrence</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{selectedAnomaly.timestamp}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Involved Actor (User ID)</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{selectedAnomaly.actor_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Target Entity</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{selectedAnomaly.entity_id}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Anomaly ID</div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{selectedAnomaly.id}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#10b981" />
                AI Recommended Action
              </h4>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: '1.5', padding: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
                {getRecommendedAction(selectedAnomaly.type)}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setSelectedAnomaly(null)}
                className="btn" 
                style={{ background: '#fff', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >
                Close
              </button>
              
              {completedIds.includes(selectedAnomaly.id) ? (
                <button 
                  disabled
                  style={{ background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={16} /> Investigation Complete
                </button>
              ) : investigatedIds.includes(selectedAnomaly.id) ? (
                <button 
                  className="btn" 
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleCompleteInvestigation}
                >
                  <CheckCircle size={16} /> Mark as Resolved
                </button>
              ) : (
                <button 
                  className="btn" 
                  style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                  onClick={handleLogInvestigation}
                >
                  Log Investigation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#374151' }}>Security Log</h2>
            <button
              onClick={() => setShowInvestigatedOnly(!showInvestigatedOnly)}
              style={{
                background: showInvestigatedOnly ? '#fff7ed' : '#fff',
                border: showInvestigatedOnly ? '1px solid #ea580c' : '1px solid #d1d5db',
                color: showInvestigatedOnly ? '#ea580c' : '#4b5563',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Search size={14} />
              {showInvestigatedOnly ? 'Viewing Active Tickets' : 'View Investigated Tickets'}
            </button>
          </div>
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
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedAnomaly(anomaly)}
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
                      {completedIds.includes(anomaly.id) ? (
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: '#059669',
                          background: '#ecfdf5',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: `1px solid #05966940`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle size={12} />
                          RESOLVED
                        </span>
                      ) : investigatedIds.includes(anomaly.id) ? (
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: '#ea580c',
                          background: '#fff7ed',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: `1px solid #ea580c40`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Search size={12} />
                          UNDER INVESTIGATION
                        </span>
                      ) : (
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
                      )}
                      
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
