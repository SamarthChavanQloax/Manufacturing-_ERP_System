import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'INVESTIGATING' | 'RESOLVED'>('ALL');

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearch(query);
    }
  }, [searchParams]);
  
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
      case 'CRITICAL': return 'rgba(239, 68, 68, 0.15)';
      case 'HIGH': return 'rgba(249, 115, 22, 0.15)';
      case 'MEDIUM': return 'rgba(234, 179, 8, 0.15)';
      default: return 'rgba(59, 130, 246, 0.15)';
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
    
    if (!matchesSearch) return false;

    const isCompleted = completedIds.includes(a.id);
    const isInvestigating = investigatedIds.includes(a.id) && !isCompleted;
    const isPending = !investigatedIds.includes(a.id) && !isCompleted;

    if (activeFilter === 'PENDING') return isPending;
    if (activeFilter === 'INVESTIGATING') return isInvestigating;
    if (activeFilter === 'RESOLVED') return isCompleted;
    
    return true; // 'ALL'
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
    if (selectedAnomaly) {
      if (!completedIds.includes(selectedAnomaly.id)) {
        const newCompleted = [...completedIds, selectedAnomaly.id];
        setCompletedIds(newCompleted);
        localStorage.setItem('ai_completed_investigations', JSON.stringify(newCompleted));
      }
      if (!investigatedIds.includes(selectedAnomaly.id)) {
        const newInvestigated = [...investigatedIds, selectedAnomaly.id];
        setInvestigatedIds(newInvestigated);
        localStorage.setItem('ai_investigations', JSON.stringify(newInvestigated));
      }
    }
    setSelectedAnomaly(null);
  };

  const handleReopenInvestigation = () => {
    if (selectedAnomaly) {
      const newCompleted = completedIds.filter(id => id !== selectedAnomaly.id);
      setCompletedIds(newCompleted);
      localStorage.setItem('ai_completed_investigations', JSON.stringify(newCompleted));

      if (!investigatedIds.includes(selectedAnomaly.id)) {
        const newInvestigated = [...investigatedIds, selectedAnomaly.id];
        setInvestigatedIds(newInvestigated);
        localStorage.setItem('ai_investigations', JSON.stringify(newInvestigated));
      }
    }
    setSelectedAnomaly(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
      {/* Detail Modal Overlay */}
      {selectedAnomaly && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.65)', zIndex: 1000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedAnomaly(null)}>
          <div style={{ 
            background: 'var(--card-bg, #111827)', borderRadius: '16px', padding: '32px', width: '550px', 
            maxWidth: '90%', border: '1px solid var(--border-color, #374151)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: getSeverityBg(selectedAnomaly.severity), color: getSeverityColor(selectedAnomaly.severity) }}>
                {getIcon(selectedAnomaly.type)}
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: 'var(--text-main, #f9fafb)' }}>{selectedAnomaly.type}</h2>
                <div style={{ color: getSeverityColor(selectedAnomaly.severity), fontWeight: 600, fontSize: '13px' }}>
                  {selectedAnomaly.severity} RISK
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card-sub-bg, #1f2937)', border: '1px solid var(--border-color, #374151)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted, #9ca3af)', letterSpacing: '0.05em' }}>Incident Description</h4>
              <p style={{ margin: 0, color: 'var(--text-main, #f9fafb)', fontSize: '14.5px', lineHeight: '1.6' }}>{selectedAnomaly.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Time of Occurrence</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{selectedAnomaly.timestamp}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Involved Actor (User ID)</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{selectedAnomaly.actor_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Entity</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{selectedAnomaly.entity_id}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Anomaly ID</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{selectedAnomaly.id}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color, #374151)', paddingTop: '20px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#10b981" />
                AI Recommended Action
              </h4>
              <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.5', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>
                {getRecommendedAction(selectedAnomaly.type)}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setSelectedAnomaly(null)}
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >
                Close
              </button>
              
              {completedIds.includes(selectedAnomaly.id) ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    disabled
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle size={16} /> Investigation Complete
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}
                    onClick={handleReopenInvestigation}
                  >
                    Reopen Incident
                  </button>
                </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'var(--text-main, #f9fafb)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={32} color="#dc2626" />
            AI Security & Anomaly Detection
          </h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted, #9ca3af)', fontSize: '15px', maxWidth: '600px' }}>
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

      {/* Plain English AI Security Status Banner */}
      {!loading && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '10px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: anomalies.filter(a => a.severity === 'CRITICAL' && !completedIds.includes(a.id)).length > 0
              ? 'rgba(239, 68, 68, 0.12)'
              : anomalies.filter(a => (a.severity === 'HIGH' || a.severity === 'MEDIUM') && !completedIds.includes(a.id)).length > 0
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${
              anomalies.filter(a => a.severity === 'CRITICAL' && !completedIds.includes(a.id)).length > 0
                ? 'rgba(239, 68, 68, 0.35)'
                : anomalies.filter(a => (a.severity === 'HIGH' || a.severity === 'MEDIUM') && !completedIds.includes(a.id)).length > 0
                ? 'rgba(245, 158, 11, 0.35)'
                : 'rgba(16, 185, 129, 0.35)'
            }`,
            color: 'var(--text-main)',
          }}
        >
          {anomalies.filter(a => (a.severity === 'CRITICAL' || a.severity === 'HIGH') && !completedIds.includes(a.id)).length > 0 ? (
            <AlertTriangle size={28} color="#ef4444" style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle size={28} color="#10b981" style={{ flexShrink: 0 }} />
          )}
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: anomalies.filter(a => a.severity === 'CRITICAL' && !completedIds.includes(a.id)).length > 0 ? '#ef4444' : anomalies.filter(a => (a.severity === 'HIGH' || a.severity === 'MEDIUM') && !completedIds.includes(a.id)).length > 0 ? '#f59e0b' : '#10b981' }}>
              {anomalies.filter(a => a.severity === 'CRITICAL' && !completedIds.includes(a.id)).length > 0
                ? '🚨 High Security Alert: Critical ERP Anomalies Detected'
                : anomalies.filter(a => (a.severity === 'HIGH' || a.severity === 'MEDIUM') && !completedIds.includes(a.id)).length > 0
                ? '⚠️ Security Attention Needed: Unresolved Anomalies Found'
                : '✅ Security Status Safe: No Unauthorized Actions or Bypasses'}
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-main)', opacity: 0.9 }}>
              {anomalies.filter(a => !completedIds.includes(a.id)).length > 0
                ? `${anomalies.filter(a => !completedIds.includes(a.id)).length} event(s) require supervisor review (workflow bypass, off-hours activity, or unusual quantity).`
                : 'All ERP actions, box packaging sequences, and operator dispatches are authorized and within standard factory compliance.'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--card-sub-bg, #1f2937)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color, #374151)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
          <div style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total Anomalies (7D)</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-main, #f9fafb)' }}>{anomalies.length}</div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)' }}>
          <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Critical Threats</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#ef4444' }}>
            {anomalies.filter(a => a.severity === 'CRITICAL').length}
          </div>
        </div>
        <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(245, 158, 11, 0.25)', boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.1)' }}>
          <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>High Risk Flags</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
            {anomalies.filter(a => a.severity === 'HIGH').length}
          </div>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
          <div style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Resolved Incidents</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
            {anomalies.filter(a => completedIds.includes(a.id)).length}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ background: 'var(--card-bg, #111827)', borderRadius: '16px', border: '1px solid var(--border-color, #374151)', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color, #374151)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-sub-bg, #1f2937)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-main, #f9fafb)' }}>Security Log</h2>
            
            <div style={{ display: 'flex', background: 'var(--input-bg, #111827)', padding: '4px', borderRadius: '8px', gap: '4px', border: '1px solid var(--border-color, #374151)' }}>
              {(['ALL', 'PENDING', 'INVESTIGATING', 'RESOLVED'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    background: activeFilter === filter ? 'var(--card-sub-bg, #374151)' : 'transparent',
                    border: 'none',
                    boxShadow: activeFilter === filter ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                    color: activeFilter === filter ? 'var(--text-main, #f9fafb)' : 'var(--text-muted, #9ca3af)',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: activeFilter === filter ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {filter === 'ALL' ? 'All' : filter === 'PENDING' ? 'Pending Action' : filter === 'INVESTIGATING' ? 'Under Investigation' : 'Resolved'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg, #111827)', border: '1px solid var(--input-border, #4b5563)', borderRadius: '8px', padding: '6px 12px', width: '260px' }}>
            <Search size={16} color="var(--text-muted, #9ca3af)" />
            <input 
              type="text" 
              placeholder="Search anomalies, users, IDs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '8px', width: '100%', fontSize: '14px', color: 'var(--text-main, #f9fafb)' }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted, #9ca3af)' }}>Running deep scan algorithms...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main, #f9fafb)', fontSize: '18px' }}>No Anomalies Detected</h3>
              <p style={{ margin: 0, color: 'var(--text-muted, #9ca3af)' }}>Your ERP workflow operations are running smoothly without suspicious patterns.</p>
            </div>
          ) : (
            <div>
              {filtered.map(anomaly => (
                <div key={anomaly.id} style={{ 
                  padding: '20px 24px', 
                  borderBottom: '1px solid var(--border-color, #374151)',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedAnomaly(anomaly)}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-sub-bg, rgba(255,255,255,0.03))')}
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
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-main, #f9fafb)' }}>{anomaly.type}</h4>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted, #9ca3af)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {anomaly.timestamp}
                      </span>
                    </div>
                    
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-main, #e5e7eb)', fontSize: '14.5px', lineHeight: '1.5' }}>
                      {anomaly.description}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {completedIds.includes(anomaly.id) ? (
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.12)',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
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
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
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
                      
                      <span style={{ fontSize: '13px', color: 'var(--text-muted, #9ca3af)', background: 'var(--card-sub-bg, rgba(255, 255, 255, 0.06))', padding: '4px 10px', borderRadius: '6px', fontWeight: 500, border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
                        Actor: {anomaly.actor_name}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted, #9ca3af)', background: 'var(--card-sub-bg, rgba(255, 255, 255, 0.06))', padding: '4px 10px', borderRadius: '6px', fontWeight: 500, border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
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
