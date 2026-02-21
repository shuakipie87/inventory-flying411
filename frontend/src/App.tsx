import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout (loaded eagerly - always needed)
import AppLayout from './components/shared/AppLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import InstallPrompt from './components/shared/InstallPrompt';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RootRedirect = lazy(() => import('./components/shared/RootRedirect'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const CreateListingPage = lazy(() => import('./pages/CreateListingPage'));
const EditListingPage = lazy(() => import('./pages/EditListingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="relative w-10 h-10 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Auth routes (no layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected app routes (AppLayout wrapper) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/new" element={<CreateListingPage />} />
              <Route path="/inventory/:id/edit" element={<EditListingPage />} />
              <Route path="/inventory/upload" element={<BulkUploadPage />} />

              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            fontSize: '14px',
            fontFamily: '"DM Sans", system-ui, sans-serif',
            borderRadius: '12px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 10px 30px -8px rgba(0,0,0,0.08)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      <InstallPrompt />
    </ErrorBoundary>
  );
}

export default App;
