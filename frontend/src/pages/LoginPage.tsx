import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
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

  const setPreset = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#e9ecef',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Brand / Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#007bff',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 700,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '10px',
            }}
          >
            ERP
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#333' }}>SofTech</h2>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '-2px' }}>
            We Digitize, Engineers Need
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#444', marginTop: '14px' }}>
            Login
          </h3>
        </div>

        {/* Login Box */}
        <div className="card" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div className="card-body" style={{ padding: '28px' }}>
            <p
              style={{
                fontSize: '13.5px',
                color: '#6c757d',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              Sign in to start your session
            </p>

            {error && (
              <div
                style={{
                  background: '#f8d7da',
                  color: '#721c24',
                  border: '1px solid #f5c6cb',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingRight: '36px' }}
                />
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                />
              </div>

              <div className="form-group" style={{ position: 'relative', marginTop: '16px' }}>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '36px' }}
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '18px', padding: '10px' }}
              >
                <LogIn size={16} />
                {loading ? 'Signing in...' : 'Log In'}
              </button>
            </form>

            {/* Quick Presets for all 5 roles */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#9ca3af',
                  marginBottom: '8px',
                  textAlign: 'center',
                }}
              >
                Quick Role Credentials
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPreset('admin@admin.com', 'admin')}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '11px' }}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('dpr@talbros.com', 'dpr')}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '11px' }}
                >
                  Packing (DPR)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('fgs@talbros.com', 'fgs')}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '11px' }}
                >
                  Box (FGS)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('invoice@talbros.com', 'invoice')}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '11px' }}
                >
                  Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('gate@talbros.com', 'gate')}
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: '11px', gridColumn: 'span 2' }}
                >
                  Gate Security
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
