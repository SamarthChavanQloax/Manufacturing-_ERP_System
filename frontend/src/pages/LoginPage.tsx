import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Package,
  Box as BoxIcon,
  FileText,
  Truck,
  Sun,
  Moon,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, logout, user } = useAuth();
  const { theme, setTheme } = usePreferences();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noticeParam = searchParams.get('notice');
  const redirectParam = searchParams.get('redirect') || searchParams.get('returnUrl');
  const targetDestination = redirectParam ? decodeURIComponent(redirectParam) : '/index';
  const isTestLogin = searchParams.get('test_login') === 'true' || searchParams.has('relogin');

  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  // If user explicitly visits for testing login, clear any stale session so login form is fully interactive
  React.useEffect(() => {
    if (isTestLogin && user) {
      logout();
    }
  }, [isTestLogin, user, logout]);

  // If already authenticated and not explicitly testing login, redirect straight to destination!
  React.useEffect(() => {
    if (user && !isTestLogin) {
      navigate(targetDestination, { replace: true });
    }
  }, [user, isTestLogin, targetDestination, navigate]);

  // If auto_auth parameter is present in URL, auto-authenticate and navigate straight to destination
  React.useEffect(() => {
    const autoAuthRole = searchParams.get('auto_auth') || searchParams.get('demo_auth');
    if (autoAuthRole && !user) {
      const roleCredentials: Record<string, [string, string]> = {
        admin: ['admin@admin.com', 'admin'],
        packing: ['dpr@talbros.com', 'dpr'],
        box: ['fgs@talbros.com', 'fgs'],
        invoice: ['invoice@talbros.com', 'invoice'],
        gate: ['gate@talbros.com', 'gate'],
      };
      const creds = roleCredentials[autoAuthRole.toLowerCase()] || roleCredentials.admin;
      login(creds[0], creds[1])
        .then(() => navigate(targetDestination, { replace: true }))
        .catch(() => {});
    }
  }, [searchParams, user, targetDestination, login, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(targetDestination, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email address or password.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  const presets = [
    { label: 'Admin', email: 'admin@admin.com', pass: 'admin', icon: Shield, color: '#dc2626', bg: '#fef2f2', darkColor: '#f87171', darkBg: 'rgba(239, 68, 68, 0.2)' },
    { label: 'Packing', email: 'dpr@talbros.com', pass: 'dpr', icon: Package, color: '#d97706', bg: '#fffbeb', darkColor: '#fbbf24', darkBg: 'rgba(245, 158, 11, 0.2)' },
    { label: 'Box', email: 'fgs@talbros.com', pass: 'fgs', icon: BoxIcon, color: '#2563eb', bg: '#eff6ff', darkColor: '#60a5fa', darkBg: 'rgba(59, 130, 246, 0.2)' },
    { label: 'Invoice', email: 'invoice@talbros.com', pass: 'invoice', icon: FileText, color: '#7c3aed', bg: '#f5f3ff', darkColor: '#c084fc', darkBg: 'rgba(168, 85, 247, 0.2)' },
    { label: 'Gate', email: 'gate@talbros.com', pass: 'gate', icon: Truck, color: '#059669', bg: '#ecfdf5', darkColor: '#34d399', darkBg: 'rgba(16, 185, 129, 0.2)' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark
          ? 'radial-gradient(circle at 50% 0%, #0f172a 0%, #0b0f19 50%, #030712 100%)'
          : '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Top Floating Theme Toggle */}
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label="Toggle dark/light mode"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '9999px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          color: isDark ? '#f9fafb' : '#334155',
          fontSize: '12.5px',
          fontWeight: 600,
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.4)'
            : '0 4px 12px rgba(15, 23, 42, 0.06)',
          transition: 'all 0.2s ease',
        }}
      >
        {isDark ? (
          <>
            <Sun size={15} color="#fbbf24" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon size={15} color="#6366f1" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
      {/* Background glow effects */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(2, 132, 199, 0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(2, 132, 199, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Clean Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: isDark ? '#111827' : '#ffffff',
          borderRadius: '20px',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 20px 40px -10px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          animation: 'loginCardAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Top accent border line */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
          }}
        />

        <div style={{ padding: '36px 32px 32px' }}>
          {/* Brand & Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                marginBottom: '12px',
                boxShadow: isDark
                  ? '0 8px 24px rgba(2, 132, 199, 0.45)'
                  : '0 8px 18px rgba(2, 132, 199, 0.3)',
              }}
            >
              ERP
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: isDark ? '#f9fafb' : '#0f172a',
                margin: '0 0 4px',
                letterSpacing: '-0.02em',
              }}
            >
              SofTech ERP
            </h1>
            <p
              style={{
                fontSize: '12.5px',
                color: isDark ? '#9ca3af' : '#64748b',
                margin: 0,
                fontWeight: 500,
              }}
            >
              Talbros Automotive Components Ltd.
            </p>
          </div>

          {/* Form Welcome Header */}
          <div style={{ marginBottom: '18px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: isDark ? '#f3f4f6' : '#1e293b',
                margin: '0 0 4px',
              }}
            >
              Sign In
            </h2>
            <p style={{ fontSize: '13px', color: isDark ? '#9ca3af' : '#64748b', margin: 0 }}>
              Please enter your credentials to login
            </p>
          </div>

          {/* Login First Notice Banner */}
          {!error && (
            <div
              style={{
                background: isDark ? 'rgba(2, 132, 199, 0.15)' : '#f0f9ff',
                color: isDark ? '#38bdf8' : '#0369a1',
                border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd',
                borderRadius: '10px',
                padding: '11px 14px',
                marginBottom: '18px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontWeight: 600,
              }}
            >
              <Lock size={16} style={{ flexShrink: 0, color: isDark ? '#38bdf8' : '#0284c7' }} />
              <span>
                {noticeParam === 'session_expired'
                  ? 'Session expired. Please log in first to continue.'
                  : 'Please log in first to access the ERP dashboard.'}
              </span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                color: isDark ? '#fca5a5' : '#dc2626',
                border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca',
                borderRadius: '10px',
                padding: '11px 13px',
                marginBottom: '18px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 500,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Address */}
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: isDark ? '#e2e8f0' : '#334155',
                  marginBottom: '6px',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: focused === 'email'
                      ? (isDark ? '#38bdf8' : '#0284c7')
                      : (isDark ? '#64748b' : '#94a3b8'),
                    transition: 'color 0.15s ease',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="name@talbros.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    fontSize: '13.5px',
                    border: `1.5px solid ${
                      focused === 'email'
                        ? (isDark ? '#38bdf8' : '#0284c7')
                        : (isDark ? '#374151' : '#e2e8f0')
                    }`,
                    borderRadius: '10px',
                    background: isDark
                      ? (focused === 'email' ? '#1f2937' : '#161e2e')
                      : (focused === 'email' ? '#ffffff' : '#f8fafc'),
                    color: isDark ? '#f9fafb' : '#0f172a',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                    boxShadow: focused === 'email'
                      ? (isDark ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : '0 0 0 3px rgba(2, 132, 199, 0.12)')
                      : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: isDark ? '#e2e8f0' : '#334155',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: focused === 'password'
                      ? (isDark ? '#38bdf8' : '#0284c7')
                      : (isDark ? '#64748b' : '#94a3b8'),
                    transition: 'color 0.15s ease',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 40px',
                    fontSize: '13.5px',
                    border: `1.5px solid ${
                      focused === 'password'
                        ? (isDark ? '#38bdf8' : '#0284c7')
                        : (isDark ? '#374151' : '#e2e8f0')
                    }`,
                    borderRadius: '10px',
                    background: isDark
                      ? (focused === 'password' ? '#1f2937' : '#161e2e')
                      : (focused === 'password' ? '#ffffff' : '#f8fafc'),
                    color: isDark ? '#f9fafb' : '#0f172a',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                    boxShadow: focused === 'password'
                      ? (isDark ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : '0 0 0 3px rgba(2, 132, 199, 0.12)')
                      : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#9ca3af' : '#94a3b8',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Session Security Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                fontSize: '12.5px',
                color: isDark ? '#9ca3af' : '#64748b',
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                padding: '8px 12px',
                borderRadius: '8px',
                border: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9',
              }}
            >
              <Shield size={14} style={{ color: isDark ? '#38bdf8' : '#0284c7', flexShrink: 0 }} />
              <span>Session active until window/project is closed</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: loading
                  ? '#93c5fd'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                letterSpacing: '0.01em',
                boxShadow: loading
                  ? 'none'
                  : (isDark ? '0 4px 18px rgba(2, 132, 199, 0.4)' : '0 4px 14px rgba(2, 132, 199, 0.35)'),
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick Access Roles */}
          <div style={{ marginTop: '26px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: isDark ? '#1f2937' : '#f1f5f9' }} />
              <span
                style={{
                  fontSize: '11px',
                  color: isDark ? '#6b7280' : '#94a3b8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Quick Role Login
              </span>
              <div style={{ flex: 1, height: '1px', background: isDark ? '#1f2937' : '#f1f5f9' }} />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isActive = email === preset.email;
                const activeBg = isDark ? preset.darkBg : preset.bg;
                const activeColor = isDark ? preset.darkColor : preset.color;
                const inactiveBg = isDark ? '#1e293b' : '#ffffff';
                const inactiveBorder = isDark ? '#334155' : '#e2e8f0';
                const inactiveColor = isDark ? '#94a3b8' : '#475569';

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPreset(preset.email, preset.pass)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 10px',
                      background: isActive ? activeBg : inactiveBg,
                      border: `1.5px solid ${isActive ? activeColor : inactiveBorder}`,
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: isActive ? activeColor : inactiveColor,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flex: '1 1 auto',
                      justifyContent: 'center',
                      minWidth: '0',
                    }}
                  >
                    <Icon size={12} color={isActive ? activeColor : (isDark ? '#64748b' : preset.color)} />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div
          style={{
            padding: '12px 32px',
            background: isDark ? '#0b0f19' : '#f8fafc',
            borderTop: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '11.5px', color: isDark ? '#64748b' : '#94a3b8', margin: 0 }}>
            © 2026 SofTech ERP · Talbros Automotive Components Ltd.
          </p>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loginCardAppear {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
