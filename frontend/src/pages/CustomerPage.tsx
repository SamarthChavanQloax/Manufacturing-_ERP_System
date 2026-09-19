import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Edit, X, Building2, Search } from 'lucide-react';

interface Customer {
  id: number;
  customer_name: string;
}

export const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post('/customers', { customerName });
      setAddModalOpen(false);
      setCustomerName('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding customer');
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditName(c.customer_name);
    setEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    setEditLoading(true);
    try {
      await api.put(`/customers/${editCustomer.id}`, { customerName: editName });
      setEditModalOpen(false);
      setEditCustomer(null);
      setEditName('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating customer');
    } finally {
      setEditLoading(false);
    }
  };

  const filtered = customers.filter((c) =>
    c.customer_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <h1>Customer</h1>
        <div className="breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span style={{ color: '#212529', fontWeight: 600 }}>Customer</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#374151' }}>
              <Building2 size={18} color="#0284c7" />
              Customer Master
            </div>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={15} /> Add Customer
            </button>
          </div>

          <div className="card-body">
            {/* Search & entries row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>Show</span>
                <select
                  className="form-control"
                  style={{ width: '70px', padding: '4px 8px' }}
                  defaultValue={10}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <span style={{ fontSize: '13.5px', color: '#4b5563' }}>entries</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={15} color="#9ca3af" />
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ width: '220px', padding: '6px 10px' }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Sr. No.</th>
                    <th>Customer Name</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                        Loading customer records...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => (
                      <tr key={c.id}>
                        <td style={{ color: '#9ca3af', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: '#e0f2fe', color: '#0369a1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: 11, flexShrink: 0,
                            }}>
                              {(c.customer_name || '?')[0].toUpperCase()}
                            </span>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{c.customer_name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ padding: '5px 12px', gap: 5 }}
                            onClick={() => openEdit(c)}
                            title="Edit Customer"
                          >
                            <Edit size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
              Showing {filtered.length} of {customers.length} entries
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Customer Modal ── */}
      {addModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">
                <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Add Customer
              </h5>
              <button
                type="button"
                onClick={() => { setAddModalOpen(false); setCustomerName(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahindra & Mahindra"
                    className="form-control"
                    value={customerName}
                    autoFocus
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setAddModalOpen(false); setCustomerName(''); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Customer Modal ── */}
      {editModalOpen && editCustomer && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h5 className="modal-title">
                <Edit size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Edit Customer
              </h5>
              <button
                type="button"
                onClick={() => { setEditModalOpen(false); setEditCustomer(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Motors"
                    className="form-control"
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  Editing: <strong style={{ color: '#374151' }}>{editCustomer.customer_name}</strong>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditCustomer(null); }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Updating...' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
