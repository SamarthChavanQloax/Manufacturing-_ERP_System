import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, ScanLine } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/index');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email and Password Invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Ambient background glow effects */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
          top: '-100px',
          left: '-100px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          bottom: '-150px',
          right: '-150px',
          pointerEvents: 'none',
        }}
      />

      {/* Main Login Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand / Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 24px -6px rgba(59, 130, 246, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
              marginBottom: '14px',
            }}
          >
            <ScanLine size={34} strokeWidth={2.2} />
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#ffffff',
              margin: '0 0 6px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            SofTech
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: 0,
              fontWeight: 500,
              letterSpacing: '0.2px',
            }}
          >
            Barcode Stock Management & ERP System
          </p>
        </div>

        {/* Elevated Glassmorphic Card */}
        <div
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            padding: '36px 32px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#f1f5f9',
                margin: '0 0 6px 0',
              }}
            >
              Welcome Back
            </h2>
            <p
              style={{
                fontSize: '13.5px',
                color: '#94a3b8',
                margin: 0,
              }}
            >
              Sign in to start your session
            </p>
          </div>

          {/* Error Alert Display */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, color: '#ef4444' }} />
              <span style={{ fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Form matching legacy fields: email, password, and signin submit */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '8px',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 42px 0 14px',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.25)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
                  }}
                />
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '26px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '8px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 42px 0 14px',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.25)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
                  }}
                />
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: loading
                  ? '#475569'
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 14px 20px -3px rgba(37, 99, 235, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 10px 15px -3px rgba(37, 99, 235, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : 'Log In'}</span>
            </button>
          </form>
        </div>

        {/* System Footer Note */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          Secure Enterprise Manufacturing Portal &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
