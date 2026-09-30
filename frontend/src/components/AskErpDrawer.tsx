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
  Loader2,
  ArrowUp,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Structured Renderer for Ask ERP Answers
 * Eliminates all raw asterisk symbols (*) and formats output into clean, executive UI sections.
 */
const StructuredErpAnswer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // 1. Strip raw symbols, convert $le / $\le to ≤, and format any currency to Indian Rupees (₹)
  const clean = text
    .replace(/\*/g, '')
    .replace(/\$\\le\s*/gi, '≤ ')
    .replace(/\$le\s*/gi, '≤ ')
    .replace(/\$(\d[\d,]*(\.\d+)?)/g, '₹$1')
    .replace(/\$/g, '')
    .trim();

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
                <span style={{ color: '#818cf8', fontSize: '15px', lineHeight: '20px', userSelect: 'none' }}>•</span>
                <div style={{ fontSize: '13px', color: 'var(--text-main, #e2e8f0)', lineHeight: 1.5 }}>
                  {colonIdx !== -1 ? (
                    <>
                      <strong style={{ fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>{itemText.slice(0, colonIdx + 1)}</strong>
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
                  background: 'var(--card-sub-bg, #1f2937)',
                  border: '1px solid var(--border-color, #374151)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  color: 'var(--text-muted, #94a3b8)',
                  marginTop: '4px',
                  lineHeight: 1.45,
                }}
              >
                <Info size={14} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
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
                color: isTitle ? 'var(--text-main, #f8fafc)' : 'var(--text-main, #e2e8f0)',
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
        <div style={{ background: 'transparent', borderRadius: '8px' }}>
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
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '3px 9px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#34d399',
          }}
        >
          <Calendar size={13} style={{ color: '#10b981' }} />
          <span>Period: {sections.timePeriod}</span>
        </div>
      )}

      {/* 3. Analysis Method Block */}
      {sections.analysis && (
        <div
          style={{
            background: 'var(--card-sub-bg, #1f2937)',
            border: '1px solid var(--border-color, #374151)',
            borderRadius: '8px',
            padding: '9px 11px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-main, #f8fafc)', marginBottom: '3px' }}>
            <Search size={12} style={{ color: '#818cf8' }} />
            <span>Analysis Scope</span>
          </div>
          <div style={{ lineHeight: 1.45, color: 'var(--text-main, #e2e8f0)' }}>{sections.analysis}</div>
        </div>
      )}

      {/* 4. Audit Evidence Block */}
      {sections.evidence && (
        <div
          style={{
            background: 'var(--card-sub-bg, #1f2937)',
            border: '1px solid var(--border-color, #374151)',
            borderRadius: '8px',
            padding: '9px 11px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-main, #f8fafc)', marginBottom: '5px' }}>
            <ClipboardCheck size={12} style={{ color: '#38bdf8' }} />
            <span>Audit Evidence</span>
          </div>
          {renderItemLines(sections.evidence)}
        </div>
      )}

      {/* 5. Any other sections */}
      {sections.others.map((other, oIdx) => (
        <div key={oIdx} style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', background: 'var(--card-sub-bg, #1f2937)', padding: '7px 9px', borderRadius: '6px' }}>
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
  const [aiStatus, setAiStatus] = useState<{ gemini_connected: boolean; model: string } | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch role-specific suggestions and AI status on mount or role change
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

    const fetchStatus = async () => {
      try {
        const res = await api.get('/ai/status');
        if (res.data) {
          setAiStatus(res.data);
        }
      } catch {
        setAiStatus(null);
      }
    };

    if (isOpen) {
      fetchSuggestions();
      fetchStatus();
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
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 130)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
          backgroundColor: 'var(--card-bg, #111827)',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderLeft: '1px solid var(--border-color, #374151)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
                {aiStatus && (
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      background: aiStatus.gemini_connected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                      color: aiStatus.gemini_connected ? '#bbf7d0' : '#e0e7ff',
                      padding: '1px 7px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title={aiStatus.gemini_connected ? `Google Gemini (${aiStatus.model}) connected` : 'Operating in offline rule-based mode'}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: aiStatus.gemini_connected ? '#4ade80' : '#cbd5e1',
                      }}
                    />
                    {aiStatus.gemini_connected ? 'Gemini Flash' : 'Rule Engine'}
                  </span>
                )}
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
            backgroundColor: 'var(--bg-main, #0b0f19)',
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
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <Sparkles size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                How can I assist your ERP workflow?
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
                Ask questions in natural English. The assistant queries real-time ERP tables respecting your{' '}
                <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{role.toUpperCase()}</strong> permissions.
              </p>

              {/* Suggestions Chips */}
              <div style={{ textAlign: 'left', marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', marginBottom: '8px' }}>
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
                        background: 'var(--card-bg, #111827)',
                        border: '1px solid var(--border-color, #374151)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: 'var(--text-main, #e2e8f0)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#818cf8';
                        e.currentTarget.style.backgroundColor = 'var(--card-sub-bg, #1f2937)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color, #374151)';
                        e.currentTarget.style.backgroundColor = 'var(--card-bg, #111827)';
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
                    backgroundColor: 'var(--card-bg, #111827)',
                    border: `1px solid ${isAccessDenied ? '#ef4444' : 'var(--border-color, #374151)'}`,
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
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
                        <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                      ) : (
                        <ShieldCheck size={16} style={{ color: '#10b981' }} />
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: isAccessDenied ? '#ef4444' : '#10b981',
                        }}
                      >
                        {isAccessDenied ? 'Permission Restricted' : 'ERP Intelligence Result'}
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)' }}>{msg.timestamp}</span>
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
                        background: 'var(--card-sub-bg, #1f2937)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #374151)',
                      }}
                    >
                      {data.data_summary.metrics.map((m: any, mIdx: number) => (
                        <div key={mIdx}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>{m.label}</div>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: m.color || 'var(--text-main, #f8fafc)',
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
                        border: '1px solid var(--border-color, #374151)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--card-sub-bg, #1f2937)', color: 'var(--text-muted, #94a3b8)', textAlign: 'left' }}>
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
                                borderTop: '1px solid var(--border-color, #374151)',
                                background: rIdx % 2 === 0 ? 'var(--card-bg, #111827)' : 'var(--card-sub-bg, #1a2234)',
                              }}
                            >
                              {(data.data_summary.columns || []).map((col: any) => (
                                <td key={col.key} style={{ padding: '7px 10px', color: 'var(--text-main, #e2e8f0)' }}>
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
                            background: 'var(--card-sub-bg, #1f2937)',
                            color: 'var(--text-main, #f8fafc)',
                            border: '1px solid var(--border-color, #374151)',
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
                      borderTop: '1px solid var(--border-color, #374151)',
                      fontSize: '10.5px',
                      color: 'var(--text-muted, #94a3b8)',
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
                backgroundColor: 'var(--card-bg, #111827)',
                border: '1px solid var(--border-color, #374151)',
                borderRadius: '14px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#818cf8',
              }}
            >
              <Sparkles size={16} className="animate-spin" />
              <span>Analyzing ERP tables and role permissions...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '8px 20px 4px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--card-bg)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {[
            { label: '⚠️ High Risk Parts', q: 'tell me the details of high risk parts' },
            { label: '📦 Parts With No Demand', q: 'how many parts have no demand' },
            { label: '🔥 Top Demand Parts', q: 'which parts have high demand' },
            { label: '⏳ Pending Invoices', q: 'which invoices are waiting for box mapping' },
            { label: '⚡ SJOINT Demand', q: 'demand for SJOINT' },
          ].map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(pill.q)}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 500,
                background: 'var(--card-sub-bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Gemini-Style Pill Capsule Input Area */}
        <div
          style={{
            padding: '10px 20px 18px 20px',
            backgroundColor: 'var(--card-bg)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Pill Capsule Container */}
          <div
            className={`ask-erp-pill ${isFocused ? 'focused' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              borderRadius: isFocused || query.length > 40 ? '24px' : '9999px',
              padding: '6px 8px 6px 20px',
              minHeight: '52px',
              boxSizing: 'border-box',
            }}
          >
            {/* Input area */}
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask anything..."
              value={query}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={loading}
              className="ask-erp-textarea"
              style={{
                flex: 1,
                minHeight: '26px',
                maxHeight: '120px',
                fontSize: '15px',
                lineHeight: '24px',
                resize: 'none',
                fontFamily: 'inherit',
                padding: '2px 8px 2px 0',
                boxSizing: 'border-box',
              }}
            />

            {/* Clear Button (if text entered) */}
            {query.trim().length > 0 && !loading && (
              <button
                onClick={() => {
                  setQuery('');
                  if (inputRef.current) inputRef.current.style.height = 'auto';
                }}
                title="Clear query"
                className="ask-erp-clear-btn"
                style={{
                  marginRight: '6px',
                }}
              >
                <X size={16} />
              </button>
            )}

            {/* Circular Blue Action Button (Reference Gemini Style) */}
            <button
              onClick={() => handleAsk(query)}
              disabled={loading || !query.trim()}
              title="Send question (Enter)"
              style={{
                width: '40px',
                height: '40px',
                minWidth: '40px',
                borderRadius: '50%',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: query.trim() && !loading ? 'pointer' : 'default',
                background: query.trim()
                  ? 'linear-gradient(135deg, #1a73e8 0%, #2563eb 100%)'
                  : 'var(--border-color)',
                color: query.trim() ? '#ffffff' : 'var(--text-muted)',
                boxShadow: query.trim()
                  ? '0 4px 12px rgba(37, 99, 235, 0.4)'
                  : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: query.trim() && !loading ? 'scale(1)' : 'scale(0.94)',
              }}
              onMouseEnter={(e) => {
                if (query.trim() && !loading) {
                  e.currentTarget.style.transform = 'scale(1.06)';
                  e.currentTarget.style.background = '#1d4ed8';
                }
              }}
              onMouseLeave={(e) => {
                if (query.trim() && !loading) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #1a73e8 0%, #2563eb 100%)';
                }
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={20} strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* Micro Helper Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              opacity: 0.85,
            }}
          >
            <span>
              Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--card-sub-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '10px' }}>Enter</kbd> to send · <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--card-sub-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '10px' }}>Shift+Enter</kbd> for newline
            </span>
            <span>
              Shortcut: <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--card-sub-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '10px' }}>Ctrl + K</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
