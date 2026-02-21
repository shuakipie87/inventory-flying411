import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Upload,
  Shield,
  LogOut,
  ChevronLeft,
  Plane,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/inventory/new', label: 'Add Item', icon: PlusCircle },
  { to: '/inventory/upload', label: 'Bulk Upload', icon: Upload },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile) onMobileClose();
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/inventory/new') return location.pathname === '/inventory/new';
    if (path === '/inventory/upload') return location.pathname === '/inventory/upload';
    if (path === '/inventory') return location.pathname === '/inventory';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0">
          <Plane className="text-sky-400" size={16} />
        </div>
        {!collapsed && (
          <span className="text-lg font-serif text-white whitespace-nowrap">Flying411</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-sky-500/15 text-sky-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} strokeWidth={1.5} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {user?.role === 'ADMIN' && (
          <Link
            to="/admin"
            aria-current={isActive('/admin') ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive('/admin')
                ? 'bg-sky-500/15 text-sky-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={collapsed ? 'Admin' : undefined}
          >
            <Shield size={18} strokeWidth={1.5} className="shrink-0" />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="px-3 py-2 border-t border-white/10">
          <button
            onClick={onToggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <ChevronLeft
              size={18}
              strokeWidth={1.5}
              className={`shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center text-white font-serif text-sm shrink-0">
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile: slide-out drawer with backdrop
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
        {/* Drawer */}
        <aside
          className={`fixed top-0 left-0 z-50 h-screen w-[260px] bg-navy-950/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-200 lg:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-navy-950/95 backdrop-blur-xl border-r border-white/10 transition-all duration-200 hidden lg:block ${
        collapsed ? 'w-16' : 'w-[240px]'
      }`}
    >
      {sidebarContent}
    </aside>
  );
}
