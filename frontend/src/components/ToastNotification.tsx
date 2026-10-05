import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

import { getNotificationUrl } from '../utils/notificationNavigation';

export const ToastNotification: React.FC = () => {
  const navigate = useNavigate();
  const { activeToast, dismissToast, markAsRead } = useNotifications();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 7000); // Auto dismiss after 7s
      return () => clearTimeout(timer);
    }
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const isCritical = activeToast.priority === 'CRITICAL';

  const handleAction = () => {
    markAsRead(activeToast.id);
    dismissToast();
    navigate(`/notifications?id=${activeToast.id}`);
  };

  return (
    <div
      onClick={handleAction}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
        background: isCritical ? '#1e1114' : '#1e1b12',
        border: `1px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
        borderLeft: `5px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
        padding: '14px 16px',
        zIndex: 10000,
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>
        {isCritical ? (
          <ShieldAlert size={20} style={{ color: '#ef4444' }} />
        ) : (
          <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: '13px',
              color: isCritical ? '#fca5a5' : '#fde68a',
            }}
          >
            {activeToast.title}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Feature 1 Context Tag in Toast */}
        {(() => {
          let meta: any = activeToast.metadata;
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
          }
          const mod = activeToast.module || meta?.module || 'System';
          const rsn = activeToast.reason || meta?.reason || activeToast.message.match(/Reason:\s*([^\n]+)/i)?.[1];
          const act = activeToast.actor_name || meta?.user_details?.name || meta?.operator?.name || activeToast.message.match(/Active User:\s*([^\s(]+)/i)?.[1];

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px', fontSize: '11px' }}>
              <span style={{ padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700 }}>
                {mod}
              </span>
              {rsn && (
                <span style={{ color: isCritical ? '#fca5a5' : '#fde68a', fontWeight: 600 }}>
                  • {rsn}
                </span>
              )}
              {act && (
                <span style={{ color: '#93c5fd', fontSize: '10.5px' }}>
                  (User: {act})
                </span>
              )}
            </div>
          );
        })()}

        <p
          style={{
            fontSize: '12px',
            color: '#e2e8f0',
            margin: '0 0 10px 0',
            lineHeight: '1.4',
          }}
        >
          {activeToast.message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleAction}
            style={{
              background: isCritical ? '#ef4444' : '#f59e0b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Review Now
            <ArrowRight size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
