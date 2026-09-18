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

  const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return <span className="badge badge-danger"><Shield size={12} style={{ display: 'inline', marginRight: 4 }} /> Admin</span>;
    if (r.includes('pack')) return <span className="badge badge-warning">Packing</span>;
    if (r.includes('box')) return <span className="badge badge-info">Box</span>;
    if (r.includes('inv')) return <span className="badge badge-primary">Invoice</span>;
    if (r.includes('gate') || r.includes('sec')) return <span className="badge badge-success">Gate Security</span>;
    return <span className="badge badge-secondary">{role}</span>;
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
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Sr No</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Password</th>
                    <th>Assigned Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No ERP users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => (
                      <tr key={u.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} color="#64748b" /> {u.user_name}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={14} color="#94a3b8" /> {u.user_email}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {showPassword ? u.user_password : '••••••••'}
                        </td>
                        <td>{getRoleBadge(u.user_role || u.type)}</td>
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
