import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/inventory/new': 'Add New Item',
  '/inventory/upload': 'Bulk Upload',
  '/admin': 'Admin Panel',
};

function getPageTitle(pathname: string): string {
  // Check exact matches first
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Check edit pattern
  if (/^\/inventory\/[^/]+\/edit$/.test(pathname)) return 'Edit Item';
  return 'Flying411';
}

export default function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-200 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-[240px]'
        }`}
      >
        <TopBar
          title={pageTitle}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
