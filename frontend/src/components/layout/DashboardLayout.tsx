import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from './Navbar';
import { clearAuth, getUser } from '../../lib/auth';

export interface SidebarLink {
  label: string;
  to: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  links: SidebarLink[];
  children: ReactNode;
}

export default function DashboardLayout({ title, subtitle, links, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const roleLabel =
    user?.role === 'CMO_ADMIN'
      ? 'CMO Administrator'
      : user?.role === 'OFFICER'
      ? 'Department Officer'
      : null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-green-800/40 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/50 text-[#f4d068] flex items-center justify-center font-bold text-sm shrink-0">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          {roleLabel && (
            <div className="text-[11px] uppercase tracking-wider text-[#e5c060] font-semibold truncate leading-tight">
              {roleLabel}
            </div>
          )}
          <div className="font-bold text-white text-sm truncate leading-tight mt-0.5">{user?.name || 'User'}</div>
          <div className="text-xs text-green-200/80 truncate mt-0.5">{user?.email}</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#c9a227] text-white shadow-sm'
                  : 'text-green-100 hover:bg-[#2d7a52] hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-green-800/40 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4 text-emerald-300" />
          <span>Home</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-600/20 border border-transparent hover:border-rose-500/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-300" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-[#0f3d25] text-white shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">{sidebarContent}</div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative w-64 max-w-full bg-[#0f3d25] text-white z-50 h-full">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-3 right-3 p-1 text-green-200 hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
