import React, { useEffect, useState, useRef } from 'react';
import api from '../api/client';
import { Plus, Edit, X, Building2, Search, FileSpreadsheet, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { usePreferences } from '../context/PreferencesContext';

interface Customer {
  id: number;
  customer_name: string;
  customer_image?: string;
}

export const CustomerPage: React.FC = () => {
  const { t } = usePreferences();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerImage, setCustomerImage] = useState<string>('');
  const [addLoading, setAddLoading] = useState(false);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isEdit) {
        setEditImage(result);
      } else {
        setCustomerImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post('/customers', {
        customerName,
        customer_image: customerImage || null,
      });
      setAddModalOpen(false);
      setCustomerName('');
      setCustomerImage('');
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
    setEditImage(c.customer_image || '');
    setEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    setEditLoading(true);
    try {
      await api.put(`/customers/${editCustomer.id}`, {
        customerName: editName,
        customer_image: editImage || null,
      });
      setEditModalOpen(false);
      setEditCustomer(null);
      setEditName('');
      setEditImage('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating customer');
    } finally {
      setEditLoading(false);
    }
  };

  const [limit, setLimit] = useState<number | 'all'>(10);

  const filtered = customers.filter((c) =>
    c.customer_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const displayedRows =
    limit === 'all' ? filtered : filtered.slice(0, Number(limit));

  const handleExportExcel = () => {
    const exportData = filtered.map((c, idx) => ({
      'Sr. No.': idx + 1,
      'Customer Name': c.customer_name,
    }));
    exportToExcel(exportData, 'Customer_Master', 'Customers');
  };

  return (
    <div>
      {/* Content Header */}
      <div className="content-header">
        <h1>{t('customer')}</h1>
        <div className="breadcrumbs">
          <span>{t('home')}</span>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{t('customer')}</span>
        </div>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-main)' }}>
              <Building2 size={18} color="#0284c7" />
              {t('customerMaster')}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm btn-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
              >
                <FileSpreadsheet size={14} /> {t('exportExcel')}
              </button>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus size={15} /> {t('addCustomer')}
              </button>
            </div>
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
                <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>{t('show')}</span>
                <select
                  className="form-control"
                  style={{ width: '84px', padding: '4px 8px' }}
                  value={limit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLimit(val === 'all' ? 'all' : Number(val));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value="all">All</option>
                </select>
                <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>{t('entries')}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
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
                    <th style={{ width: '80px' }}>{t('srNo')}</th>
                    <th>{t('customerName')}</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        {t('loadingData')}
                      </td>
                    </tr>
                  ) : displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        {t('noData')}
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((c, idx) => (
                      <tr key={c.id}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {c.customer_image ? (
                              <img
                                src={c.customer_image}
                                alt={c.customer_name}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border-color)',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <span style={{
                                width: 32, height: 32, borderRadius: '8px',
                                background: '#e0f2fe', color: '#0369a1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 12, flexShrink: 0,
                              }}>
                                {(c.customer_name || '?')[0].toUpperCase()}
                              </span>
                            )}
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.customer_name}</span>
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
                            <Edit size={13} /> {t('edit')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('showing')} {displayedRows.length} {t('of')} {customers.length} {t('entries')}
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
                onClick={() => { setAddModalOpen(false); setCustomerName(''); setCustomerImage(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '16px' }}>
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

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={14} color="#0284c7" /> Customer Logo / Image
                  </label>

                  <input
                    type="file"
                    ref={addFileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageFileChange(e, false)}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    {customerImage ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={customerImage}
                          alt="Preview"
                          style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setCustomerImage('')}
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="Remove Image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Upload size={14} /> Upload Logo / Photo
                      </button>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      PNG, JPG, or SVG up to 2MB
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setAddModalOpen(false); setCustomerName(''); setCustomerImage(''); }}
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
                onClick={() => { setEditModalOpen(false); setEditCustomer(null); setEditImage(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '16px' }}>
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

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={14} color="#0284c7" /> Customer Logo / Image
                  </label>

                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageFileChange(e, true)}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    {editImage ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={editImage}
                          alt="Preview"
                          style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setEditImage('')}
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="Remove Image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Upload size={14} /> Upload Logo / Photo
                      </button>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      PNG, JPG, or SVG up to 2MB
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                  Editing: <strong style={{ color: 'var(--text-main)' }}>{editCustomer.customer_name}</strong>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditCustomer(null); setEditImage(''); }}
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
