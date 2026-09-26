import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Menu,
  BrainCircuit,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDesktop = () => window.innerWidth > 992;

  const [sidebarOpen, setSidebarOpen] = useState(() => isDesktop());

  // Keep a ref in sync with state so event listeners can always read the latest value
  const sidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  const sidebarRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const SIDEBAR_WIDTH = 250;

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

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  // Close sidebar on mobile/tablet when route changes
  useEffect(() => {
    if (!isDesktop()) {
      closeSidebar();
    }
  }, [location.pathname, closeSidebar]);

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpenRef.current) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSidebar]);

  // Left-Edge Swipe / Touch gesture — registered once, reads state via ref
  useEffect(() => {
    // Track gesture state in refs to avoid stale closures
    const touchStart = { x: 0, y: 0, time: 0, active: false };
    let swipeDir: 'horizontal' | 'vertical' | null = null;
    let isDragging = false;

    const resetDrag = () => {
      if (sidebarRef.current) sidebarRef.current.style.transform = '';
      if (overlayRef.current) {
        overlayRef.current.style.opacity = '';
        overlayRef.current.style.pointerEvents = '';
      }
      isDragging = false;
    };

    const onStart = (clientX: number, clientY: number) => {
      const open = sidebarOpenRef.current;
      const onEdge = clientX <= 40;

      // Only start gesture if:
      // - sidebar is closed and user starts from left edge, OR
      // - sidebar is open (user can swipe left to close)
      if (!open && !onEdge) return;

      touchStart.x = clientX;
      touchStart.y = clientY;
      touchStart.time = Date.now();
      touchStart.active = true;
      swipeDir = null;
      isDragging = false;
    };

    const onMove = (clientX: number, clientY: number, event?: Event) => {
      if (!touchStart.active) return;

      const deltaX = clientX - touchStart.x;
      const deltaY = clientY - touchStart.y;

      // Determine swipe direction once we have enough movement
      if (!swipeDir) {
        if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return;
        swipeDir = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }

      if (swipeDir === 'vertical') {
        // Let vertical scrolling happen normally
        touchStart.active = false;
        resetDrag();
        return;
      }

      // Horizontal drag — prevent default scroll
      if (event && event.cancelable) event.preventDefault();

      isDragging = true;
      const open = sidebarOpenRef.current;
      const base = open ? 0 : -SIDEBAR_WIDTH;
      const rawTranslate = base + deltaX;
      const clamped = Math.max(-SIDEBAR_WIDTH, Math.min(0, rawTranslate));
      const progress = (clamped + SIDEBAR_WIDTH) / SIDEBAR_WIDTH;

      if (sidebarRef.current) {
        sidebarRef.current.style.transition = 'none';
        sidebarRef.current.style.transform = `translateX(${clamped}px)`;
      }
      if (overlayRef.current && !isDesktop()) {
        overlayRef.current.style.transition = 'none';
        overlayRef.current.style.opacity = `${progress}`;
        overlayRef.current.style.pointerEvents = progress > 0.05 ? 'auto' : 'none';
      }
    };

    const onEnd = (clientX: number) => {
      if (!touchStart.active) return;
      touchStart.active = false;

      // Restore CSS transitions
      if (sidebarRef.current) sidebarRef.current.style.transition = '';
      if (overlayRef.current) {
        overlayRef.current.style.transition = '';
        overlayRef.current.style.pointerEvents = '';
      }

      if (!isDragging) {
        resetDrag();
        return;
      }

      resetDrag();

      const deltaX = clientX - touchStart.x;
      const elapsed = Math.max(1, Date.now() - touchStart.time);
      const velocity = deltaX / elapsed; // px/ms

      const open = sidebarOpenRef.current;

      if (!open) {
        // Open if swiped right enough or fast enough
        if (deltaX > 50 || velocity > 0.3) {
          openSidebar();
        }
        // else stays closed (CSS handles it)
      } else {
        // Close if swiped left enough or fast enough
        if (deltaX < -50 || velocity < -0.3) {
          closeSidebar();
        }
        // else stays open
      }
    };

    // ---- Touch events ----
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      onMove(e.touches[0].clientX, e.touches[0].clientY, e);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      onEnd(e.changedTouches[0].clientX);
    };

    // ---- Pointer events (for touch screens using pointer API) ----
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return; // Skip mouse, only touch/pen
      onStart(e.clientX, e.clientY);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      onMove(e.clientX, e.clientY);
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      onEnd(e.clientX);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
    // Only run once on mount — reads live state via sidebarOpenRef
  }, [openSidebar, closeSidebar]);

  return (
    <div className="app-container">
      {/* Backdrop overlay — click to close sidebar on mobile */}
      <div
        ref={overlayRef}
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
      >
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

          {/* AI Insights Menu (admin only) */}
          {role === 'admin' && (
            <NavLink
              to="/ai_stock_intelligence"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <BrainCircuit size={18} />
              <span>AI Insights</span>
            </NavLink>
          )}

          {/* Master Menu (admin, packing) */}
          {(role === 'admin' || role === 'packing') && (
            <div>
              <div
                className="nav-link nav-dropdown-toggle"
                onClick={() => setMasterOpen(!masterOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Database size={18} />
                  <span>Master</span>
                </div>
                <ChevronDown size={15} className={`chevron-icon ${masterOpen ? 'open' : ''}`} />
              </div>

              <div className={`nav-submenu ${masterOpen ? 'open' : ''}`}>
                <div className="nav-submenu-content">
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
              </div>
            </div>
          )}

          {/* Packing Menu (admin, packing) */}
          {(role === 'admin' || role === 'packing') && (
            <div>
              <div
                className="nav-link nav-dropdown-toggle"
                onClick={() => setPackingOpen(!packingOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={18} />
                  <span>Packing</span>
                </div>
                <ChevronDown size={15} className={`chevron-icon ${packingOpen ? 'open' : ''}`} />
              </div>

              <div className={`nav-submenu ${packingOpen ? 'open' : ''}`}>
                <div className="nav-submenu-content">
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
              </div>
            </div>
          )}

          {/* Box Menu (admin, box) */}
          {(role === 'admin' || role === 'box') && (
            <div>
              <div
                className="nav-link nav-dropdown-toggle"
                onClick={() => setBoxOpen(!boxOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Box size={18} />
                  <span>Box</span>
                </div>
                <ChevronDown size={15} className={`chevron-icon ${boxOpen ? 'open' : ''}`} />
              </div>

              <div className={`nav-submenu ${boxOpen ? 'open' : ''}`}>
                <div className="nav-submenu-content">
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
              </div>
            </div>
          )}

          {/* Invoice Menu (admin, invoice) */}
          {(role === 'admin' || role === 'invoice') && (
            <div>
              <div
                className="nav-link nav-dropdown-toggle"
                onClick={() => setInvoiceOpen(!invoiceOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} />
                  <span>Invoice</span>
                </div>
                <ChevronDown size={15} className={`chevron-icon ${invoiceOpen ? 'open' : ''}`} />
              </div>

              <div className={`nav-submenu ${invoiceOpen ? 'open' : ''}`}>
                <div className="nav-submenu-content">
                  <NavLink
                    to="/create_invoice"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>Create Invoice</span>
                  </NavLink>
                  <NavLink
                    to="/view_invoice"
                    className={({ isActive }) => `nav-link nav-tree-item ${isActive ? 'active' : ''}`}
                  >
                    <span>View Invoice</span>
                  </NavLink>
                </div>
              </div>
            </div>
          )}

          {/* Gate Security Menu (admin, gate) */}
          {(role === 'admin' || role === 'gate') && (
            <div>
              <div
                className="nav-link nav-dropdown-toggle"
                onClick={() => setGateOpen(!gateOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} />
                  <span>Gate-Security</span>
                </div>
                <ChevronDown size={15} className={`chevron-icon ${gateOpen ? 'open' : ''}`} />
              </div>

              <div className={`nav-submenu ${gateOpen ? 'open' : ''}`}>
                <div className="nav-submenu-content">
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
              </div>
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
            {/* Hamburger button — always visible, toggles sidebar */}
            <button
              type="button"
              id="sidebar-toggle-btn"
              className="btn btn-sm btn-secondary"
              onClick={toggleSidebar}
              style={{ padding: '6px 10px' }}
              title="Toggle Sidebar Menu"
              aria-label="Toggle Sidebar Menu"
            >
              <Menu size={16} />
            </button>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '15px' }}>
              Barcode Stock Management &amp; ERP System
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Role Switcher */}
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
