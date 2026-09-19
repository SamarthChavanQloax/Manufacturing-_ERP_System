import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Users, Plus, Search, Shield, Key, Mail, User, X } from 'lucide-react';

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
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.user_role || '').toLowerCase().includes(search.toLowerCase())
  );

  const badgeStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', fontSize: '11.5px', fontWeight: 600,
    borderRadius: 20, background: bg, color, border: `1px solid ${border}`,
    whiteSpace: 'nowrap',
  });

  const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return <span style={badgeStyle('#fee2e2', '#991b1b', '#fca5a5')}><Shield size={11} /> Admin</span>;
    if (r.includes('pack')) return <span style={badgeStyle('#fef9c3', '#854d0e', '#fde047')}>Packing</span>;
    if (r.includes('box')) return <span style={badgeStyle('#dbeafe', '#1e40af', '#93c5fd')}>Box</span>;
    if (r.includes('inv')) return <span style={badgeStyle('#ede9fe', '#5b21b6', '#c4b5fd')}>Invoice</span>;
    if (r.includes('gate') || r.includes('sec')) return <span style={badgeStyle('#dcfce7', '#166534', '#86efac')}>Gate Security</span>;
    return <span style={badgeStyle('#f1f5f9', '#475569', '#cbd5e1')}>{role}</span>;
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>System User & Access Management</h2>
          <div className="breadcrumb">Home / ERP Users</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
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
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading ERP users...</div>
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
                    {['Sr No', 'Full Name', 'Email Address', 'Password', 'Assigned Role'].map((h) => (
                      <th key={h} style={{
                        padding: '11px 16px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#6b7280',
                        textAlign: 'left',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: 14 }}>
                        No ERP users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => (
                      <tr
                        key={u.id}
                        style={{ borderBottom: '1px solid #e9ecef', background: idx % 2 !== 0 ? '#f9fafb' : '#fff' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? '#f9fafb' : '#fff')}
                      >
                        {/* Sr No */}
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* Full Name with avatar */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: '#dbeafe', color: '#1d4ed8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: 11, flexShrink: 0,
                            }}>
                              {(u.user_name || '?')[0].toUpperCase()}
                            </span>
                            <span style={{ fontWeight: 600, color: '#111827', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.user_name}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 13.5, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.user_email}
                            </span>
                          </div>
                        </td>

                        {/* Password */}
                        <td style={{ padding: '12px 16px' }}>
                          {showPassword ? (
                            <span style={{
                              fontFamily: 'monospace', fontSize: 12.5,
                              background: '#fef9c3', color: '#92400e',
                              padding: '2px 8px', borderRadius: 4,
                              border: '1px solid #fde68a',
                            }}>
                              {u.user_password}
                            </span>
                          ) : (
                            <span style={{ letterSpacing: 4, color: '#9ca3af', fontSize: 13 }}>••••••••</span>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>
                <Users size={20} color="#0284c7" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Add ERP User
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">User Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Ramesh Sharma"
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">User Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="e.g. ramesh@talbros.com"
                    value={formData.user_email}
                    onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">User Password *</label>
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder="Enter account password"
                    value={formData.user_password}
                    onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Role *</label>
                  <select
                    className="form-select"
                    value={formData.user_role}
                    onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Packing">Packing</option>
                    <option value="Box">Box</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Gate Security">Gate Security</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
