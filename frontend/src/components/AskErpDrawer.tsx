import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  CornerDownLeft,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Layers,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Info,
  ClipboardCheck,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Structured Renderer for Ask ERP Answers
 * Eliminates all raw asterisk symbols (*) and formats output into clean, executive UI sections.
 */
const StructuredErpAnswer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // 1. Strip all asterisks (*) completely to eliminate raw symbols
  const clean = text.replace(/\*/g, '').trim();

  // Helper to render bullet lists or key-value items with highlighted labels
  const renderItemLines = (content: string) => {
    const lines = content.split('\n');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Bullet item
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const itemText = trimmed.replace(/^[-•]\s*/, '');
            const colonIdx = itemText.indexOf(':');
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingLeft: '2px' }}>
                <span style={{ color: '#4f46e5', fontSize: '15px', lineHeight: '20px', userSelect: 'none' }}>•</span>
                <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.5 }}>
                  {colonIdx !== -1 ? (
                    <>
                      <strong style={{ fontWeight: 600, color: '#0f172a' }}>{itemText.slice(0, colonIdx + 1)}</strong>
                      <span>{itemText.slice(colonIdx + 1)}</span>
                    </>
                  ) : (
                    <span>{itemText}</span>
                  )}
                </div>
              </div>
            );
          }

          // Note callout
          if (trimmed.startsWith('(Note:') || trimmed.startsWith('Note:')) {
            const noteContent = trimmed.replace(/^\((.*)\)$/, '$1');
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  color: '#475569',
                  marginTop: '4px',
                  lineHeight: 1.45,
                }}
              >
                <Info size={14} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
                <span>{noteContent}</span>
              </div>
            );
          }

          // Header title line (e.g. ERP Manufacturing & Operations Report for 27 September 2026:)
          const isTitle = trimmed.endsWith(':') || idx === 0;
          return (
            <div
              key={idx}
              style={{
                fontSize: isTitle ? '13.5px' : '13px',
                fontWeight: isTitle ? 600 : 400,
                color: isTitle ? '#0f172a' : '#1e293b',
                marginTop: idx > 0 && isTitle ? '6px' : '0',
                marginBottom: isTitle ? '4px' : '0',
                lineHeight: 1.5,
              }}
            >
              {trimmed}
            </div>
          );
        })}
      </div>
    );
  };

  // If text doesn't contain ### headers, render as clean structured lines
  if (!clean.includes('###')) {
    return (
      <div style={{ marginBottom: '8px' }}>
        {renderItemLines(clean)}
      </div>
    );
  }

  // 2. Parse sections by ### Header
  const sections: {
    answer: string;
    timePeriod?: string;
    analysis?: string;
    evidence?: string;
    others: string[];
  } = {
    answer: '',
    others: [],
  };

  const chunks = clean.split(/(?=###\s+)/g);
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (trimmed.startsWith('### Answer')) {
      sections.answer = trimmed.replace(/^###\s+Answer\s*/i, '').trim();
    } else if (trimmed.startsWith('### Time Period')) {
      sections.timePeriod = trimmed.replace(/^###\s+Time Period\s*/i, '').trim();
    } else if (trimmed.startsWith('### Analysis')) {
      sections.analysis = trimmed.replace(/^###\s+Analysis\s*/i, '').trim();
    } else if (trimmed.startsWith('### Evidence')) {
      sections.evidence = trimmed.replace(/^###\s+Evidence\s*/i, '').trim();
    } else if (!sections.answer) {
      sections.answer = trimmed;
    } else {
      sections.others.push(trimmed.replace(/^###\s+/, ''));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
      {/* 1. Main Answer Block */}
      {sections.answer && (
        <div style={{ background: '#ffffff', borderRadius: '8px' }}>
          {renderItemLines(sections.answer)}
        </div>
      )}

      {/* 2. Time Period Badge */}
      {sections.timePeriod && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            alignSelf: 'flex-start',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '3px 9px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#166534',
          }}
        >
          <Calendar size={13} style={{ color: '#16a34a' }} />
          <span>Period: {sections.timePeriod}</span>
        </div>
      )}

      {/* 3. Analysis Method Block */}
      {sections.analysis && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '9px 11px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
            <Search size={12} style={{ color: '#6366f1' }} />
            <span>Analysis Scope</span>
          </div>
          <div style={{ lineHeight: 1.45, color: '#475569' }}>{sections.analysis}</div>
        </div>
      )}

      {/* 4. Audit Evidence Block */}
      {sections.evidence && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '9px 11px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
            <ClipboardCheck size={12} style={{ color: '#0ea5e9' }} />
            <span>Audit Evidence</span>
          </div>
          {renderItemLines(sections.evidence)}
        </div>
      )}

      {/* 5. Any other sections */}
      {sections.others.map((other, oIdx) => (
        <div key={oIdx} style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '7px 9px', borderRadius: '6px' }}>
          {other}
        </div>
      ))}
    </div>
  );
};

export interface AskErpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskErpDrawer: React.FC<AskErpDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user?.type || 'gate').toLowerCase();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversation, setConversation] = useState<any[]>([]);
  const [conversationContext, setConversationContext] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch role-specific suggestions on mount or role change
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get('/ai/ask/suggestions');
        if (res.data?.suggestions) {
          setSuggestions(res.data.suggestions);
        }
      } catch (err) {
        // Fallback default suggestions
        setSuggestions([
          'Which invoices are waiting for box mapping?',
          'How many boxes of SJOINT were dispatched yesterday?',
          'Which parts are low in stock?',
          'Are there any high risk gate alerts today?',
        ]);
      }
    };

    if (isOpen) {
      fetchSuggestions();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, role]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, loading]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAsk = async (questionText: string) => {
    const q = (questionText || query).trim();
    if (!q || loading) return;

    // Append user message immediately
    const userMsg = { sender: 'user', text: q, timestamp: new Date().toLocaleTimeString() };
    setConversation((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/ask', { query: q, context: conversationContext });
      if (res.data?.context) {
        setConversationContext(res.data.context);
      }
      const aiMsg = {
        sender: 'ai',
        data: res.data,
        timestamp: new Date().toLocaleTimeString(),
      };
      setConversation((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg = {
        sender: 'ai',
        data: {
          status: 'error',
          direct_answer: err.response?.data?.message || 'Error processing your query. Please verify connection and retry.',
          security_audit: { role_checked: role, authorized: false, timestamp: new Date().toISOString() },
        },
        timestamp: new Date().toLocaleTimeString(),
      };
      setConversation((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAsk(query);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '560px',
          maxWidth: '92vw',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a5b4fc',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.3px' }}>
                Ask ERP Assistant
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '1px 7px',
                    borderRadius: '4px',
                    color: '#e0e7ff',
                  }}
                >
                  Role: {role}
                </span>
                <span style={{ fontSize: '11.5px', color: '#c7d2fe' }}>Role-Aware Security Active</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setConversation([])}
              title="Clear chat history"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#c7d2fe',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Conversation Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {conversation.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto 0', padding: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#ede9fe',
                  color: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <Sparkles size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>
                How can I assist your ERP workflow?
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Ask questions in natural English. The assistant queries real-time ERP tables respecting your{' '}
                <strong>{role.toUpperCase()}</strong> permissions.
              </p>

              {/* Suggestions Chips */}
              <div style={{ textAlign: 'left', marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  SUGGESTED QUERIES FOR YOUR ROLE:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suggestions.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(prompt)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.backgroundColor = '#f5f3ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <span>{prompt}</span>
                      <ArrowRight size={14} style={{ color: '#818cf8', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            conversation.map((msg, index) => {
              if (msg.sender === 'user') {
                return (
                  <div
                    key={index}
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '82%',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      borderRadius: '14px 14px 2px 14px',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      lineHeight: 1.45,
                      boxShadow: '0 2px 5px rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <div>{msg.text}</div>
                    <div style={{ fontSize: '10px', color: '#dbeafe', textAlign: 'right', marginTop: '4px' }}>
                      {msg.timestamp}
                    </div>
                  </div>
                );
              }

              // AI Response Card
              const data = msg.data || {};
              const isAccessDenied = data.status === 'access_denied';
              const isSuccess = data.status === 'success';

              return (
                <div
                  key={index}
                  style={{
                    alignSelf: 'flex-start',
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: `1px solid ${isAccessDenied ? '#fca5a5' : '#e2e8f0'}`,
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* Status header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAccessDenied ? (
                        <ShieldAlert size={16} style={{ color: '#dc2626' }} />
                      ) : (
                        <ShieldCheck size={16} style={{ color: '#16a34a' }} />
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: isAccessDenied ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {isAccessDenied ? 'Permission Restricted' : 'ERP Intelligence Result'}
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{msg.timestamp}</span>
                  </div>

                  {/* Direct Answer Structured Render */}
                  <StructuredErpAnswer text={data.direct_answer} />

                  {/* Metrics bar if available */}
                  {data.data_summary?.metrics && data.data_summary.metrics.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))',
                        gap: '8px',
                        marginBottom: '12px',
                        background: '#f8fafc',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #edf2f7',
                      }}
                    >
                      {data.data_summary.metrics.map((m: any, mIdx: number) => (
                        <div key={mIdx}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{m.label}</div>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: m.color || '#0f172a',
                              marginTop: '2px',
                            }}
                          >
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data Table if available */}
                  {data.data_summary?.items && data.data_summary.items.length > 0 && (
                    <div
                      style={{
                        overflowX: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                            {(data.data_summary.columns || []).map((col: any) => (
                              <th key={col.key} style={{ padding: '7px 10px', fontWeight: 600 }}>
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.data_summary.items.map((row: any, rIdx: number) => (
                            <tr
                              key={rIdx}
                              style={{
                                borderTop: '1px solid #f1f5f9',
                                background: rIdx % 2 === 0 ? '#ffffff' : '#fcfcfc',
                              }}
                            >
                              {(data.data_summary.columns || []).map((col: any) => (
                                <td key={col.key} style={{ padding: '7px 10px', color: '#334155' }}>
                                  {row[col.key] !== undefined ? String(row[col.key]) : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Quick Action Navigation Buttons */}
                  {data.suggested_actions && data.suggested_actions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {data.suggested_actions.map((act: any, aIdx: number) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            if (act.action_type === 'navigate' && act.url) {
                              onClose();
                              navigate(act.url);
                            } else if (act.follow_up_query) {
                              handleAsk(act.follow_up_query);
                            }
                          }}
                          className="btn btn-sm btn-secondary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {act.action_type === 'navigate' ? <ExternalLink size={12} /> : <Search size={12} />}
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Security Audit Footer */}
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '10.5px',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Role Checked: {data.security_audit?.role_checked}</span>
                    <span>Audit Status: {data.security_audit?.authorized ? 'Authorized' : 'Restricted'}</span>
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div
              style={{
                alignSelf: 'flex-start',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#6366f1',
              }}
            >
              <Sparkles size={16} className="animate-spin" />
              <span>Analyzing ERP tables and role permissions...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '6px 12px',
              backgroundColor: '#f8fafc',
            }}
          >
            <Sparkles size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Ask anything about ERP (e.g. Invoices waiting for box mapping)...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13.5px',
                color: '#0f172a',
              }}
            />
            <button
              onClick={() => handleAsk(query)}
              disabled={loading || !query.trim()}
              style={{
                background: query.trim() ? '#4f46e5' : '#e2e8f0',
                color: query.trim() ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: query.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={14} />
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '11px',
              color: '#94a3b8',
            }}
          >
            <span>Press Enter to send</span>
            <span>Shortcut: Ctrl + K</span>
          </div>
        </div>
      </div>
    </div>
  );
};
