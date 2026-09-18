import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Database,
  Users,
  Layers,
  Box,
  FileText,
  ShieldCheck,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  FileCheck,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Menu collapse state
  const [masterOpen, setMasterOpen] = useState(true);
  const [packingOpen, setPackingOpen] = useState(true);
  const [boxOpen, setBoxOpen] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(true);
  const [gateOpen, setGateOpen] = useState(true);

  const role = (user?.type || '').toLowerCase();

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    await switchRole(selected);
    navigate('/index');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar" style={{ display: sidebarOpen ? 'flex' : 'none' }}>
        <div className="brand-header">
          <div className="brand-logo">ERP</div>
          <div className="brand-text">SofTech ERP</div>
        </div>

        <div className="user-panel">
          <div className="user-avatar">
            {user?.user_name ? user.user_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">Name: {user?.user_name || 'Admin'}</div>
            <span className="user-role-badge">Role: {user?.type || 'admin'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard */}
          <NavLink
            to="/index"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          {/* Master Menu (admin, packing) */}
          {(role === 'admin' || role === 'packing') && (
            <div>
              <div
                className="nav-link"
                onClick={() => setMasterOpen(!masterOpen)}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Database size={18} />
                  <span>Master</span>
                </div>
                {masterOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>

              {masterOpen && (
                <div>
                  {role === 'admin' && (
                    <NavLink
                      to="/erp_users"
                      className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                    >
                      <Users size={15} />
                      <span>Users</span>
                    </NavLink>
                  )}
                  <NavLink
                    to="/part_master"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <Layers size={15} />
                    <span>Part Master</span>
                  </NavLink>
                  <NavLink
                    to="/part_stock"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <Layers size={15} />
                    <span>Part Stock</span>
                  </NavLink>
                  {role === 'admin' && (
                    <NavLink
                      to="/customer"
                      className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                    >
                      <Users size={15} />
                      <span>Customer</span>
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Packing Menu (admin, packing) */}
          {(role === 'admin' || role === 'packing') && (
            <div>
              <div
                className="nav-link"
                onClick={() => setPackingOpen(!packingOpen)}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={18} />
                  <span>Packing</span>
                </div>
                {packingOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>

              {packingOpen && (
                <div>
                  <NavLink
                    to="/create_packing"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>Create Packing</span>
                  </NavLink>
                  <NavLink
                    to="/create_packing_bulk"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>Create Bulk Packing</span>
                  </NavLink>
                  <NavLink
                    to="/view_packing"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>View Packing</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Box Menu (admin, box) */}
          {(role === 'admin' || role === 'box') && (
            <div>
              <div
                className="nav-link"
                onClick={() => setBoxOpen(!boxOpen)}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Box size={18} />
                  <span>Box</span>
                </div>
                {boxOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>

              {boxOpen && (
                <div>
                  <NavLink
                    to="/create_box"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>Create Box</span>
                  </NavLink>
                  <NavLink
                    to="/view_box"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>View Box</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Invoice Menu (admin, invoice) */}
          {(role === 'admin' || role === 'invoice') && (
            <div>
              <div
                className="nav-link"
                onClick={() => setInvoiceOpen(!invoiceOpen)}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} />
                  <span>Invoice</span>
                </div>
                {invoiceOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>

              {invoiceOpen && (
                <div>
                  <NavLink
                    to="/create_invoice"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>Create Invoice</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Gate Security Menu (admin, gate) */}
          {(role === 'admin' || role === 'gate') && (
            <div>
              <div
                className="nav-link"
                onClick={() => setGateOpen(!gateOpen)}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} />
                  <span>Gate-Security</span>
                </div>
                {gateOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>

              {gateOpen && (
                <div>
                  <NavLink
                    to="/verify_invoice"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>Verify Invoice</span>
                  </NavLink>
                  <NavLink
                    to="/gate_out_report"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>Gate Out Report</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <div className="nav-link" onClick={logout} style={{ marginTop: '20px' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ padding: '6px 10px' }}
            >
              <Menu size={16} />
            </button>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '15px' }}>
              Barcode Stock Management & ERP System
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Persona Switcher for convenient testing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Active Role:</span>
              <select
                value={role}
                onChange={handleRoleChange}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  background: '#f9fafb',
                  color: '#1f2937',
                  cursor: 'pointer',
                }}
              >
                <option value="admin">1. Super Admin (admin)</option>
                <option value="packing">2. Packing/DPR (packing)</option>
                <option value="box">3. Box/FGS (box)</option>
                <option value="invoice">4. Invoice/Billing (invoice)</option>
                <option value="gate">5. Gate Security (gate)</option>
              </select>
            </div>

            <button
              onClick={logout}
              className="btn btn-sm btn-danger"
              style={{ fontSize: '12px' }}
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
