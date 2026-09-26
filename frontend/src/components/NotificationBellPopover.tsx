import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  AlertTriangle,
  BrainCircuit,
  Package,
  Truck,
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useNotifications, ERPNotification } from '../context/NotificationContext';

export const NotificationBellPopover: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    criticalCount,
    pendingCount,
    hasPending,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications({ limit: 6 });
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = (n: ERPNotification) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    setIsOpen(false);
    if (n.action_url) {
      navigate(n.action_url);
    } else {
      navigate('/notifications');
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === 'CRITICAL' || type === 'AI_HIGH_RISK') {
      return <ShieldAlert size={15} style={{ color: '#ef4444' }} />;
    }
    if (type.includes('BARCODE') || type.includes('DUPLICATE')) {
      return <AlertTriangle size={15} style={{ color: '#f59e0b' }} />;
    }
    if (type.includes('BRIEFING') || type.includes('AI')) {
      return <BrainCircuit size={15} style={{ color: '#8b5cf6' }} />;
    }
    if (type.includes('BOX') || type.includes('PACKING')) {
      return <Package size={15} style={{ color: '#3b82f6' }} />;
    }
    if (type.includes('GATE')) {
      return <Truck size={15} style={{ color: '#10b981' }} />;
    }
    if (type.includes('INVOICE')) {
      return <FileText size={15} style={{ color: '#6366f1' }} />;
    }
    return <Info size={15} style={{ color: 'var(--text-muted)' }} />;
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch (e) {
      return '';
    }
  };

  const isPending = hasPending || unreadCount > 0 || pendingCount > 0;

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="btn btn-sm btn-secondary"
        style={{
          position: 'relative',
          padding: '6px 9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          background: isOpen ? 'var(--input-bg)' : 'var(--card-sub-bg)',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
        }}
        title={isPending ? `Notification Alert (${unreadCount || pendingCount} pending)` : 'Notification & Alert Center'}
        aria-label="Notification Center"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={18} style={{ color: isPending ? '#2563eb' : 'var(--text-muted)' }} />

          {/* Prominent Blinking Blue Dot Indicator for Pending Notifications */}
          {isPending && (
            <div
              title="Pending notification alert"
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '12px',
                height: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* Outer expanding pulsing halo */}
              <span
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  animation: 'blueDotBlink 1.4s infinite ease-in-out',
                }}
              />
              {/* Core solid bright glowing blue LED dot */}
              <span
                style={{
                  position: 'relative',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#1d4ed8',
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 0 8px 2px #3b82f6',
                }}
              />
            </div>
          )}
        </div>

        {/* Unread count badge if unread > 0 */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              padding: '0 4px',
              background: criticalCount > 0 ? '#ef4444' : '#2563eb',
              color: '#ffffff',
              fontSize: '10.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: criticalCount > 0 ? '0 0 8px rgba(239, 68, 68, 0.6)' : '0 0 6px rgba(37, 99, 235, 0.6)',
              animation: criticalCount > 0 ? 'pulse 2s infinite' : 'none',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Global CSS animation for the blinking blue dot */}
      <style>{`
        @keyframes blueDotBlink {
          0% {
            transform: scale(0.85);
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.8);
          }
          50% {
            transform: scale(1.6);
            opacity: 0.3;
            box-shadow: 0 0 10px 4px rgba(59, 130, 246, 0.4);
          }
          100% {
            transform: scale(0.85);
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--card-sub-bg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3b82f6',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--primary-color, #3b82f6)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                <Bell size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <div>No notifications yet</div>
                <div style={{ fontSize: '11.5px', opacity: 0.7 }}>You are all caught up!</div>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    background: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg, rgba(255,255,255,0.04))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.is_read
                      ? 'transparent'
                      : 'rgba(59, 130, 246, 0.04)';
                  }}
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {getIcon(n.type, n.priority)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginBottom: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: n.is_read ? 600 : 700,
                          fontSize: '12.5px',
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        {getTimeAgo(n.created_at)}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {n.message}
                    </p>
                  </div>

                  {!n.is_read && (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        marginTop: '6px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--card-sub-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--primary-color, #3b82f6)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              View All Notifications
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
