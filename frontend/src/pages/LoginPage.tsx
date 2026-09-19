import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/index');
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
    { label: 'Admin', email: 'admin@admin.com', pass: 'admin', icon: Shield, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Packing', email: 'dpr@talbros.com', pass: 'dpr', icon: Package, color: '#d97706', bg: '#fffbeb' },
    { label: 'Box', email: 'fgs@talbros.com', pass: 'fgs', icon: BoxIcon, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Invoice', email: 'invoice@talbros.com', pass: 'invoice', icon: FileText, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Gate', email: 'gate@talbros.com', pass: 'gate', icon: Truck, color: '#059669', bg: '#ecfdf5' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.07) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Pure White Clean Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          animation: 'loginCardAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
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
                boxShadow: '0 8px 18px rgba(2, 132, 199, 0.3)',
              }}
            >
              ERP
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 4px',
                letterSpacing: '-0.02em',
              }}
            >
              SofTech ERP
            </h1>
            <p
              style={{
                fontSize: '12.5px',
                color: '#64748b',
                margin: 0,
                fontWeight: 500,
              }}
            >
              Talbros Automotive Components Ltd.
            </p>
          </div>

          {/* Form Welcome Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#1e293b',
                margin: '0 0 4px',
              }}
            >
              Sign In
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Enter your email and password to log in
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
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
                  color: '#334155',
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
                    color: focused === 'email' ? '#0284c7' : '#94a3b8',
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
                    border: `1.5px solid ${focused === 'email' ? '#0284c7' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    background: focused === 'email' ? '#ffffff' : '#f8fafc',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                    boxShadow: focused === 'email' ? '0 0 0 3px rgba(2, 132, 199, 0.12)' : 'none',
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
                  color: '#334155',
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
                    color: focused === 'password' ? '#0284c7' : '#94a3b8',
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
                    border: `1.5px solid ${focused === 'password' ? '#0284c7' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    background: focused === 'password' ? '#ffffff' : '#f8fafc',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                    boxShadow: focused === 'password' ? '0 0 0 3px rgba(2, 132, 199, 0.12)' : 'none',
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
                    color: '#94a3b8',
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

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#475569',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    accentColor: '#0284c7',
                    cursor: 'pointer',
                  }}
                />
                Remember session
              </label>
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
                boxShadow: loading ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
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
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
              <span
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Quick Role Login
              </span>
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isActive = email === preset.email;
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
                      background: isActive ? preset.bg : '#ffffff',
                      border: `1.5px solid ${isActive ? preset.color : '#e2e8f0'}`,
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: isActive ? preset.color : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flex: '1 1 auto',
                      justifyContent: 'center',
                      minWidth: '0',
                    }}
                  >
                    <Icon size={12} color={preset.color} />
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
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0 }}>
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
