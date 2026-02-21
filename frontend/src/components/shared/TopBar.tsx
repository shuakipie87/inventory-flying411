import { useAuthStore } from '../../stores/authStore';
import { Menu, LogOut, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopBarProps {
  title: string;
  onMenuToggle: () => void;
}

export default function TopBar({ title, onMenuToggle }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-5 lg:px-8 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-400 hover:text-navy-900 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-serif text-navy-900">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications placeholder */}
        <button className="relative text-slate-400 hover:text-navy-900 transition-colors p-2 rounded-lg hover:bg-slate-50">
          <Bell size={18} />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-navy-900 flex items-center justify-center text-white font-serif text-xs">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.username}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-elevated py-1.5 z-50 animate-slide-down">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-medium text-navy-900">{user?.username}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
