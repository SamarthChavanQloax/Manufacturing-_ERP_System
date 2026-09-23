import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Module Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PartMasterPage } from './pages/PartMasterPage';
import { PartStockPage } from './pages/PartStockPage';
import { CustomerPage } from './pages/CustomerPage';
import { CreatePackingPage } from './pages/CreatePackingPage';
import { CreatePackingBulkPage } from './pages/CreatePackingBulkPage';
import { ViewPackingPage } from './pages/ViewPackingPage';
import { ViewPackingByIdPage } from './pages/ViewPackingByIdPage';
import { CreateBoxPage } from './pages/CreateBoxPage';
import { ViewBoxPage } from './pages/ViewBoxPage';
import { AddPackingToBoxPage } from './pages/AddPackingToBoxPage';
import { CreateInvoicePage } from './pages/CreateInvoicePage';
import { AddBoxToInvoicePage } from './pages/AddBoxToInvoicePage';
import { VerifyInvoicePage } from './pages/VerifyInvoicePage';
import { InvoiceVerificationDetailPage } from './pages/InvoiceVerificationDetailPage';
import { GateOutReportPage } from './pages/GateOutReportPage';
import { ErpUsersPage } from './pages/ErpUsersPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Loading ERP Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?notice=login_first" replace />;
  }

  const role = (user.type || '').toLowerCase();
  if (allowedRoles && !allowedRoles.includes(role) && role !== 'admin') {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Access Denied</h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Your active role (<strong>{user.type}</strong>) does not have permission to access this module.
        </p>
        <button
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Main Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard (All authenticated roles) */}
            <Route path="/" element={<Navigate to="/index" replace />} />
            <Route path="/index" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Master Module */}
            <Route
              path="/erp_users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ErpUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/part_master"
              element={
                <ProtectedRoute allowedRoles={['admin', 'packing']}>
                  <PartMasterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/part_stock"
              element={
                <ProtectedRoute allowedRoles={['admin', 'packing']}>
                  <PartStockPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CustomerPage />
                </ProtectedRoute>
              }
            />

            {/* Packing Module */}
            <Route
              path="/create_packing"
              element={
                <ProtectedRoute allowedRoles={['admin', 'packing']}>
                  <CreatePackingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create_packing_bulk"
              element={
                <ProtectedRoute allowedRoles={['admin', 'packing']}>
                  <CreatePackingBulkPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view_packing"
              element={
                <ProtectedRoute allowedRoles={['admin', 'packing']}>
                  <ViewPackingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view_packing_by_id/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'packing']}>
                  <ViewPackingByIdPage />
                </ProtectedRoute>
              }
            />

            {/* Box Module */}
            <Route
              path="/create_box"
              element={
                <ProtectedRoute allowedRoles={['admin', 'box']}>
                  <CreateBoxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view_box"
              element={
                <ProtectedRoute allowedRoles={['admin', 'box']}>
                  <ViewBoxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add_packing_to_box/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'box']}>
                  <AddPackingToBoxPage />
                </ProtectedRoute>
              }
            />

            {/* Invoice Module */}
            <Route
              path="/create_invoice"
              element={
                <ProtectedRoute allowedRoles={['admin', 'invoice']}>
                  <CreateInvoicePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add_box_to_invoice/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'invoice']}>
                  <AddBoxToInvoicePage />
                </ProtectedRoute>
              }
            />

            {/* Gate Security Module */}
            <Route
              path="/verify_invoice"
              element={
                <ProtectedRoute allowedRoles={['admin', 'gate']}>
                  <VerifyInvoicePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add_box_to_invoice_verify/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'gate']}>
                  <InvoiceVerificationDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate_out_report"
              element={
                <ProtectedRoute allowedRoles={['admin', 'gate']}>
                  <GateOutReportPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/index" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
export default App;
