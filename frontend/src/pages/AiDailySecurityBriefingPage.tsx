import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Clock,
  ExternalLink,
  Eye,
  CheckCircle2,
  HelpCircle,
  History,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel } from '../utils/excelExport';
import { AiSecurityEventDetailModal } from '../components/AiSecurityEventDetailModal';

export const AiDailySecurityBriefingPage: React.FC = () => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [currentDate, setCurrentDate] = useState<string>(getTodayStr());
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // History Drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Event Evidence Modal
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const fetchBriefing = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/ai/security-briefing/${dateStr}`);
      setBriefing(res.data);
    } catch (err) {
      console.error('Error fetching daily security briefing', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/security-briefing/history');
      setHistoryList(res.data || []);
    } catch (err) {
      console.error('Error fetching briefing history', err);
    }
  };

  useEffect(() => {
    fetchBriefing(currentDate);
    fetchHistory();
  }, [currentDate]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/ai/security-briefing/generate', { date: currentDate });
      setBriefing(res.data);
      fetchHistory();
      alert(`Daily Security Briefing for ${currentDate} generated successfully.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error generating daily security briefing');
    } finally {
      setGenerating(false);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'CRITICAL':
      case 'HIGH':
        return '#dc2626';
      case 'MEDIUM':
        return '#d97706';
      default:
        return '#2563eb';
    }
  };

  const getPriorityBg = (p: string) => {
    switch (p) {
      case 'CRITICAL':
      case 'HIGH':
        return '#fef2f2';
      case 'MEDIUM':
        return '#fffbeb';
      default:
        return '#eff6ff';
    }
  };

  const getPriorityBorder = (p: string) => {
    switch (p) {
      case 'CRITICAL':
      case 'HIGH':
        return '#fecaca';
      case 'MEDIUM':
        return '#fde68a';
      default:
        return '#bfdbfe';
    }
  };

  const events: any[] = Array.isArray(briefing?.events) ? briefing.events : [];

  const handleExportPDF = () => {
    if (!briefing) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('AI DAILY SECURITY BRIEFING', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Date: ${currentDate}  |  Generated: ${new Date().toLocaleString()}`, 14, 28);

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Summary:', 14, 38);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitSummary = doc.splitTextToSize(briefing.executive_summary || 'No summary available.', 180);
    doc.text(splitSummary, 14, 45);

    const tableData = events.map((e, idx) => [
      idx + 1,
      e.priority,
      e.title,
      e.what_happened,
      e.evidence?.invoice_number || e.evidence?.invoice_barcode || 'N/A',
      e.evidence?.risk_score ? `${e.evidence.risk_score}/100` : 'N/A',
      e.review_status,
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['#', 'Priority', 'Incident Title', 'What Happened', 'Invoice', 'Risk Score', 'Status']],
      body: tableData.length > 0 ? tableData : [['-', '-', 'No security incidents recorded.', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.save(`AI_Daily_Security_Briefing_${currentDate}.pdf`);
  };

  const handleExportExcel = () => {
    if (!briefing) return;
    const exportData = events.map((e, idx) => ({
      'Sr. No.': idx + 1,
      'Priority': e.priority,
      'Category': e.category,
      'Title': e.title,
      'What Happened': e.what_happened,
      'Why It Matters': e.why_it_matters,
      'Invoice': e.evidence?.invoice_number || e.evidence?.invoice_barcode || 'N/A',
      'Customer': e.evidence?.customer_name || 'N/A',
      'Part': e.evidence?.part_number || 'N/A',
      'Quantity': e.evidence?.quantity || 0,
      'Risk Score': e.evidence?.risk_score || 0,
      'Failed Scans': e.evidence?.failed_scans_count || 0,
      'Review Status': e.review_status,
      'Supervisor Note': e.evidence?.review_note || '',
    }));
    exportToExcel(
      exportData.length > 0 ? exportData : [{ Message: 'No anomalous events recorded on this date.' }],
      `AI_Security_Briefing_${currentDate}`,
      'SecurityBriefing'
    );
  };

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)',
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                AI Daily Security Briefing
              </h1>
              <span
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} /> Executive Intelligence
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Synthesizing daily gate transactions, scan logs, and risk patterns into executive security insights.
            </p>
          </div>
        </div>

        {/* Date Controls & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Date Selector Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              style={{ background: 'transparent', border: 'none', padding: '6px 8px', cursor: 'pointer', color: '#475569' }}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 700,
                color: '#0f172a',
                padding: '4px 6px',
                outline: 'none',
                cursor: 'pointer',
              }}
            />

            <button
              type="button"
              onClick={() => shiftDate(1)}
              style={{ background: 'transparent', border: 'none', padding: '6px 8px', cursor: 'pointer', color: '#475569' }}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCurrentDate(getTodayStr())}
            className="btn btn-sm btn-secondary"
            style={{ fontWeight: 600, fontSize: '12.5px' }}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}
          >
            <History size={14} /> Briefing History
          </button>

          <button
            type="button"
            disabled={generating}
            onClick={handleGenerate}
            className="btn btn-sm btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}
          >
            <RefreshCw size={14} className={generating ? 'spin-animation' : ''} />
            {generating ? 'Synthesizing...' : 'Regenerate Briefing'}
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleExportPDF}
              className="btn btn-sm btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              title="Export Briefing as PDF"
            >
              <FileText size={13} /> PDF
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="btn btn-sm btn-success"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: '#16a34a', border: 'none', color: '#fff' }}
              title="Export Briefing as Excel"
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="content-body">
        {/* KPI Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px 18px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Monitored Gate Operations
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {briefing?.total_events || 0}
            </div>
            <div style={{ fontSize: '11.5px', color: '#16a34a', marginTop: '2px', fontWeight: 600 }}>
              {briefing?.normal_count || 0} Normal Operations
            </div>
          </div>

          <div
            style={{
              background: '#fef2f2',
              borderRadius: '12px',
              padding: '16px 18px',
              border: '1px solid #fecaca',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)',
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>
              High Priority Alerts
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
              {briefing?.high_priority_count || 0}
            </div>
            <div style={{ fontSize: '11.5px', color: '#991b1b', marginTop: '2px' }}>
              Critical Risk Signals
            </div>
          </div>

          <div
            style={{
              background: '#fffbeb',
              borderRadius: '12px',
              padding: '16px 18px',
              border: '1px solid #fde68a',
              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.05)',
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>
              Medium Priority Alerts
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
              {briefing?.medium_priority_count || 0}
            </div>
            <div style={{ fontSize: '11.5px', color: '#92400e', marginTop: '2px' }}>
              Advisory Deviations
            </div>
          </div>

          <div
            style={{
              background: '#eff6ff',
              borderRadius: '12px',
              padding: '16px 18px',
              border: '1px solid #bfdbfe',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.05)',
            }}
          >
            <div style={{ fontSize: '11.5px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>
              Pending Supervisor Reviews
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
              {briefing?.pending_reviews_count || 0}
            </div>
            <div style={{ fontSize: '11.5px', color: '#1e40af', marginTop: '2px' }}>
              Awaiting Audit Sign-off
            </div>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '18px 22px',
            marginBottom: '24px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.3px' }}>
              EXECUTIVE SECURITY BRIEFING SUMMARY &bull;{' '}
              {new Date(`${currentDate}T12:00:00`).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#334155',
              fontWeight: 500,
            }}
          >
            {briefing?.executive_summary || 'Loading daily activity synthesis...'}
          </p>
        </div>

        {/* Main Briefing Stream (Priority Ordered List) */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Daily Incident Digest & Evidence Trace ({events.length} Flagged Events)
            </h2>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Prioritized by risk severity: 🔴 High &bull; 🟠 Medium &bull; 🟡 Low
            </div>
          </div>

          {loading ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              Synthesizing daily ERP gate logs and risk patterns...
            </div>
          ) : events.length === 0 ? (
            /* 100% Clean / Zero Anomalies Card */
            <div
              className="card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
              }}
            >
              <ShieldCheck size={52} color="#16a34a" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800, color: '#166534' }}>
                🟢 100% Operational Integrity
              </h3>
              <p style={{ margin: '0 auto', maxWidth: '580px', fontSize: '14.5px', color: '#15803d', lineHeight: '1.5' }}>
                All gate verification scans and dispatch quantities on{' '}
                <strong>
                  {new Date(`${currentDate}T12:00:00`).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </strong>{' '}
                matched historical baselines and scheduled operating shifts with zero anomalous signals detected.
              </p>
            </div>
          ) : (
            /* List of Structured Incident Cards */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.map((event) => {
                const color = getPriorityColor(event.priority);
                const bg = getPriorityBg(event.priority);
                const border = getPriorityBorder(event.priority);
                const evidence = event.evidence || {};

                return (
                  <div
                    key={event.id}
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${border}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Header Strip */}
                    <div
                      style={{
                        background: bg,
                        borderBottom: `1px solid ${border}`,
                        padding: '14px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            background: color,
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {event.priority} PRIORITY
                        </span>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          {event.title}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className={`badge ${
                            event.review_status === 'reviewed' ? 'badge-verified' : 'badge-danger'
                          }`}
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          {event.review_status === 'reviewed' ? 'Reviewed' : 'Review Pending'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className="btn btn-sm btn-secondary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: '#ffffff',
                          }}
                        >
                          <Eye size={13} /> View Evidence
                        </button>
                      </div>
                    </div>

                    {/* 3-Question Structured Format: What Happened -> Why It Matters -> Evidence */}
                    <div style={{ padding: '20px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '16px',
                          marginBottom: '16px',
                        }}
                      >
                        {/* What Happened */}
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '14px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#64748b',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '4px',
                            }}
                          >
                            WHAT HAPPENED?
                          </div>
                          <p style={{ margin: 0, fontSize: '13.5px', color: '#1e293b', lineHeight: '1.5', fontWeight: 600 }}>
                            {event.what_happened}
                          </p>
                        </div>

                        {/* Why It Matters */}
                        <div
                          style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            padding: '14px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#b45309',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '4px',
                            }}
                          >
                            WHY DOES IT MATTER?
                          </div>
                          <p style={{ margin: 0, fontSize: '13.5px', color: '#92400e', lineHeight: '1.5' }}>
                            {event.why_it_matters}
                          </p>
                        </div>
                      </div>

                      {/* Evidence Summary Strip */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Invoice:</span>
                            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                              {evidence.invoice_number || evidence.invoice_barcode || 'N/A'}
                            </strong>
                          </div>

                          {evidence.customer_name && (
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Customer:</span>
                              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                                {evidence.customer_name}
                              </strong>
                            </div>
                          )}

                          {evidence.risk_score !== undefined && (
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Risk Score:</span>
                              <strong style={{ fontSize: '13.5px', color: color }}>
                                {evidence.risk_score} / 100 ({evidence.risk_level})
                              </strong>
                            </div>
                          )}

                          {evidence.failed_scans_count > 0 && (
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Failed Scans:</span>
                              <strong style={{ fontSize: '13.5px', color: '#dc2626' }}>
                                {evidence.failed_scans_count} attempts
                              </strong>
                            </div>
                          )}

                          {evidence.scan_time && (
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Scan Time:</span>
                              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                                {evidence.scan_time}
                              </strong>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '12px', fontWeight: 600, padding: '5px 12px' }}
                        >
                          View Full Evidence Chain &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Evidence Drill-Down Modal */}
      {selectedEvent && (
        <AiSecurityEventDetailModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
          dateStr={currentDate}
        />
      )}

      {/* Historical Briefings Drawer / Modal */}
      {historyOpen && (
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
          onClick={() => setHistoryOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '680px',
              maxWidth: '100%',
              maxHeight: '85vh',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Historical Security Briefings Archive
                </h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Briefing Date</th>
                      <th>Total Gate Operations</th>
                      <th>High Alerts</th>
                      <th>Medium Alerts</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                          No historical briefings recorded yet.
                        </td>
                      </tr>
                    ) : (
                      historyList.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            {new Date(`${h.briefing_date}T12:00:00`).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td>{h.total_events} operations</td>
                          <td>
                            <span style={{ fontWeight: 700, color: h.high_priority_count > 0 ? '#dc2626' : '#64748b' }}>
                              {h.high_priority_count} High
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: h.medium_priority_count > 0 ? '#d97706' : '#64748b' }}>
                              {h.medium_priority_count} Medium
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${h.status === 'reviewed' ? 'badge-verified' : 'badge-pending'}`}>
                              {h.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentDate(h.briefing_date);
                                setHistoryOpen(false);
                              }}
                              className="btn btn-sm btn-primary"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                            >
                              Load Report
                            </button>
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
      )}
    </div>
  );
};
