import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

import { notificationSound } from '../utils/notificationSound';

export interface ERPNotification {
  id: number;
  recipient_user_id?: number;
  recipient_role: string;
  type: string;
  priority: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  dedup_key?: string;
  is_read: boolean;
  read_at?: string;
  lifecycle_status: 'OPEN' | 'REVIEWED' | 'RESOLVED';
  resolved_by_name?: string;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  critical: number;
  high: number;
  warning: number;
  info: number;
  pending_actions: number;
  frequent_types: { type: string; count: number }[];
}

interface NotificationContextType {
  notifications: ERPNotification[];
  unreadCount: number;
  criticalCount: number;
  pendingCount: number;
  hasPending: boolean;
  summary: NotificationSummary | null;
  loading: boolean;
  fetchNotifications: (filters?: any) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  resolveNotification: (id: number, note?: string) => Promise<void>;
  activeToast: ERPNotification | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ERPNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<ERPNotification | null>(null);

  const prevCountRef = useRef<number>(0);
  const initialFetchDone = useRef<boolean>(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      const count = res.data?.unread_count || 0;
      const crit = res.data?.critical_count || 0;
      const pend = res.data?.pending_count || 0;

      // Play mild notification sound when a new notification arrives
      if (initialFetchDone.current && count > prevCountRef.current) {
        notificationSound.playMildAlert(crit > 0);
      }
      initialFetchDone.current = true;

      // Detect if new critical notification came in to trigger Toast
      if (count > prevCountRef.current && crit > 0) {
        // Fetch latest top notification
        const latestRes = await api.get('/notifications', { params: { limit: 1 } });
        const latest = latestRes.data?.items?.[0];
        if (latest && (latest.priority === 'CRITICAL' || latest.priority === 'HIGH') && !latest.is_read) {
          setActiveToast(latest);
        }
      }
      prevCountRef.current = count;
      setUnreadCount(count);
      setCriticalCount(crit);
      setPendingCount(pend);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  }, [user]);

  const fetchNotifications = useCallback(
    async (filters: any = {}) => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await api.get('/notifications', { params: filters });
        setNotifications(res.data?.items || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const fetchSummary = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching notification summary:', err);
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
      );
      setUnreadCount(0);
      setCriticalCount(0);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const resolveNotification = async (id: number, note?: string) => {
    try {
      const res = await api.post(`/notifications/${id}/resolve`, { note });
      if (res.data?.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  lifecycle_status: 'RESOLVED',
                  is_read: true,
                  resolved_by_name: user?.user_name || 'Admin',
                  resolved_at: new Date().toISOString(),
                  resolution_note: note || 'Resolved',
                }
              : n,
          ),
        );
        fetchSummary();
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('Error resolving notification:', err);
      throw err;
    }
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  // Live polling for notifications every 8 seconds
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 8000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        criticalCount,
        pendingCount,
        hasPending: unreadCount > 0 || pendingCount > 0,
        summary,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        fetchSummary,
        markAsRead,
        markAllAsRead,
        resolveNotification,
        activeToast,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
