import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Users,
  Plus,
  Search,
  Shield,
  Key,
  Mail,
  User,
  X,
  Eye,
  EyeOff,
  Check,
  Package,
  Box,
  FileText,
  Truck,
  UserPlus,
} from 'lucide-react';

interface ErpUser {
  id: number;
  user_name: string;
  user_email: string;
  user_password: string;
  user_role: string;
  type: string;
}

export const ErpUsersPage: React.FC = () => {
  const [users, setUsers] = useState<ErpUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalShowPassword, setModalShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_password: '',
    user_role: 'Packing',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch ERP users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', formData);
      setShowModal(false);
      setFormData({
        user_name: '',
        user_email: '',
        user_password: '',
        user_role: 'Packing',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.user_role || '').toLowerCase().includes(search.toLowerCase())
  );

  const badgeStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    fontSize: '11.5px',
    fontWeight: 600,
    borderRadius: 20,
    background: bg,
    color,
    border: `1px solid ${border}`,
    whiteSpace: 'nowrap',
  });

  const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin'))
      return (
        <span style={badgeStyle('#fee2e2', '#991b1b', '#fca5a5')}>
          <Shield size={11} /> Admin
        </span>
      );
    if (r.includes('pack'))
      return <span style={badgeStyle('#fef9c3', '#854d0e', '#fde047')}>Packing</span>;
    if (r.includes('box'))
      return <span style={badgeStyle('#dbeafe', '#1e40af', '#93c5fd')}>Box</span>;
    if (r.includes('inv'))
      return <span style={badgeStyle('#ede9fe', '#5b21b6', '#c4b5fd')}>Invoice</span>;
    if (r.includes('gate') || r.includes('sec'))
      return (
        <span style={badgeStyle('#dcfce7', '#166534', '#86efac')}>Gate Security</span>
      );
    return <span style={badgeStyle('#f1f5f9', '#475569', '#cbd5e1')}>{role}</span>;
  };

  const roleOptions = [
    {
      id: 'Packing',
      name: 'Packing (DPR)',
      desc: 'Barcode scanning & box packing entries',
      icon: Package,
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
    },
    {
      id: 'Box',
      name: 'Box (FGS)',
      desc: 'Outer box packing & group creation',
      icon: Box,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
    },
    {
      id: 'Invoice',
      name: 'Invoice',
      desc: 'Invoice creation & item verification',
      icon: FileText,
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
    },
    {
      id: 'Gate Security',
      name: 'Gate Security',
      desc: 'Vehicle entry, exit & gate pass audits',
      icon: Truck,
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
    },
    {
      id: 'Admin',
      name: 'Administrator',
      desc: 'Full ERP system access & user management',
      icon: Shield,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
    },
  ];

  return (
    <div>
      {/* Content Header matching ERP standard layout */}
      <div className="content-header">
        <h1>System User & Access Management</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>ERP Users</span>
        </div>
      </div>

      <div className="content-body">
        {/* Top Action Button with clean spacing */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '13.5px',
            }}
          >
            <Plus size={16} /> Add ERP User
          </button>
        </div>

        <div className="card">
          <div className="card-header flex-between">
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#0284c7" /> ERP Users List ({filteredUsers.length})
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                <Key size={14} /> {showPassword ? 'Hide Passwords' : 'Show Passwords'}
              </button>
              <div style={{ position: 'relative', width: 260 }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Search name, email, role..."
                  className="form-control"
                  style={{ paddingLeft: '2rem' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {error && <div className="alert alert-danger" style={{ margin: '1rem' }}>{error}</div>}

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Loading ERP users...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '72px' }} />
                    <col style={{ width: '180px' }} />
                    <col style={{ width: '230px' }} />
                    <col style={{ width: '170px' }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      {['Sr No', 'Full Name', 'Email Address', 'Password', 'Assigned Role'].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: '11px 16px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: '#6b7280',
                              textAlign: 'left',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: 'center',
                            padding: '2.5rem',
                            color: '#94a3b8',
                            fontSize: 14,
                          }}
                        >
                          No ERP users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: '1px solid #e9ecef',
                            background: idx % 2 !== 0 ? '#f9fafb' : '#fff',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = idx % 2 !== 0 ? '#f9fafb' : '#fff')
                          }
                        >
                          {/* Sr No */}
                          <td
                            style={{
                              padding: '12px 16px',
                              fontSize: '13px',
                              color: '#9ca3af',
                              fontWeight: 600,
                            }}
                          >
                            {idx + 1}
                          </td>

                          {/* Full Name with avatar */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <span
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: '#dbeafe',
                                  color: '#1d4ed8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: 11,
                                  flexShrink: 0,
                                }}
                              >
                                {(u.user_name || '?')[0].toUpperCase()}
                              </span>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: '#111827',
                                  fontSize: 13.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {u.user_name}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Mail size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                              <span
                                style={{
                                  fontSize: 13.5,
                                  color: '#374151',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {u.user_email}
                              </span>
                            </div>
                          </td>

                          {/* Password */}
                          <td style={{ padding: '12px 16px' }}>
                            {showPassword ? (
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: 12.5,
                                  background: '#fef9c3',
                                  color: '#92400e',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #fde68a',
                                }}
                              >
                                {u.user_password}
                              </span>
                            ) : (
                              <span style={{ letterSpacing: 4, color: '#9ca3af', fontSize: 13 }}>
                                ••••••••
                              </span>
                            )}
                          </td>

                          {/* Assigned Role */}
                          <td style={{ padding: '12px 16px' }}>
                            {getRoleBadge(u.user_role || u.type)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern, Clean & Attractive Add ERP User Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="modal-container"
            style={{
              maxWidth: '580px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 18px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 700,
                      color: '#0f172a',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Add ERP User
                  </h3>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '12.5px',
                      color: '#64748b',
                    }}
                  >
                    Set up credentials and assign system access permissions
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ margin: 0 }}>
              <div
                style={{
                  padding: '22px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  maxHeight: 'calc(85vh - 130px)',
                  overflowY: 'auto',
                }}
              >
                {/* Full Name & Email row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* User Full Name */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '6px',
                      }}
                    >
                      User Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="text"
                        required
                        className="form-control"
                        style={{
                          paddingLeft: '36px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          height: '38px',
                        }}
                        placeholder="e.g. Ramesh Sharma"
                        value={formData.user_name}
                        onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* User Email Address */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '6px',
                      }}
                    >
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={16}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="email"
                        required
                        className="form-control"
                        style={{
                          paddingLeft: '36px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          height: '38px',
                        }}
                        placeholder="e.g. ramesh@talbros.com"
                        value={formData.user_email}
                        onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    User Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type={modalShowPassword ? 'text' : 'password'}
                      required
                      className="form-control"
                      style={{
                        paddingLeft: '36px',
                        paddingRight: '38px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        height: '38px',
                      }}
                      placeholder="Enter account password"
                      value={formData.user_password}
                      onChange={(e) =>
                        setFormData({ ...formData, user_password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setModalShowPassword(!modalShowPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={modalShowPassword ? 'Hide password' : 'Show password'}
                    >
                      {modalShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '8px',
                    }}
                  >
                    Select System Role <span style={{ color: '#ef4444' }}>*</span>
                  </label>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {roleOptions.map((role) => {
                      const Icon = role.icon;
                      const isSelected = formData.user_role === role.id;
                      return (
                        <div
                          key={role.id}
                          onClick={() => setFormData({ ...formData, user_role: role.id })}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: `1.5px solid ${isSelected ? role.color : '#e2e8f0'}`,
                            background: isSelected ? role.bg : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                            boxShadow: isSelected
                              ? `0 2px 8px ${role.color}25`
                              : '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: isSelected ? role.color : '#1e293b',
                                fontWeight: 700,
                                fontSize: '12.5px',
                              }}
                            >
                              <Icon size={14} color={isSelected ? role.color : '#64748b'} />
                              <span>{role.name}</span>
                            </div>
                            {isSelected && (
                              <div
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: role.color,
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              color: isSelected ? '#475569' : '#94a3b8',
                              lineHeight: 1.25,
                            }}
                          >
                            {role.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid #f1f5f9',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '8px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(0, 123, 255, 0.25)',
                  }}
                >
                  <Plus size={15} />
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
