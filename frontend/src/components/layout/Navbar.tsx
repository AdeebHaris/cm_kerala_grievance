import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Landmark, LayoutDashboard, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { clearAuth, getUser } from '../../lib/auth';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Departments', to: '/departments' },
  { label: 'Contact', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  const path = location.pathname;
  // Hide duplicate Dashboard & Logout buttons when inside dashboard/portal routes or tracking pages
  const hideDashboardActions =
    path.startsWith('/citizen') ||
    path.startsWith('/cmo') ||
    path.startsWith('/officer') ||
    path.includes('/dashboard') ||
    path.includes('/submit') ||
    path.includes('/track');

  const dashboardLink =
    user?.role === 'CMO_ADMIN'
      ? '/cmo/dashboard'
      : user?.role === 'OFFICER'
      ? '/officer/dashboard'
      : '/citizen/dashboard';

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-[#1a5c38] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-2.5 select-none py-1 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
          >
            <Landmark className="w-6 h-6 text-[#f4d068] shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight text-white">
                CM Keralam
              </span>
              <span className="text-[11px] font-normal tracking-wide text-emerald-200/80 -mt-0.5">
                Public Grievance Portal
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-sm rounded hover:bg-[#2d7a52] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Distinguished Profile Capsule */}
                <div className="inline-flex items-center gap-2 py-1 pl-1.5 pr-3 rounded-full bg-emerald-950/40 border border-emerald-400/20 text-white select-none">
                  <div className="w-6 h-6 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/60 text-[#f4d068] flex items-center justify-center text-xs font-bold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-xs font-semibold text-white max-w-[130px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-medium">
                      {user.role === 'CMO_ADMIN'
                        ? 'CMO Admin'
                        : user.role === 'OFFICER'
                        ? 'Officer'
                        : 'Citizen'}
                    </span>
                  </div>
                </div>
                {!hideDashboardActions && (
                  <>
                    <Link
                      to={dashboardLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#c9a227] hover:bg-[#e5c060] text-emerald-950 rounded-lg transition-colors shadow-2xs"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border border-white/20"
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/track"
                  className="px-3 py-1.5 text-sm bg-[#c9a227] text-white rounded hover:bg-[#e5c060] transition-colors font-medium"
                >
                  Track Grievance
                </Link>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm border border-white/40 rounded hover:bg-white/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm bg-white text-[#1a5c38] rounded hover:bg-gray-100 transition-colors font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger with smooth icon rotation transition */}
          <button
            className="md:hidden p-2 rounded-lg text-white hover:bg-[#2d7a52] transition-colors focus:outline-none relative w-10 h-10 flex items-center justify-center cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <Menu
              className={`w-6 h-6 absolute transition-all duration-300 ease-in-out ${
                menuOpen ? 'opacity-0 rotate-90 scale-75 pointer-events-none' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <X
              className={`w-6 h-6 absolute transition-all duration-300 ease-in-out ${
                menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75 pointer-events-none'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu with smooth slide & fade animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#0f3d25] px-4 pt-2 pb-4 space-y-1 border-t border-[#1a5c38]/50 shadow-inner">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm rounded-lg hover:bg-[#2d7a52] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="pt-2 border-t border-white/10 space-y-2 mt-2">
              <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-950/40 rounded-lg border border-emerald-400/20">
                <div className="w-7 h-7 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/60 text-[#f4d068] flex items-center justify-center text-xs font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] text-emerald-300 font-medium">
                    {user.role === 'CMO_ADMIN'
                      ? 'CMO Administrator'
                      : user.role === 'OFFICER'
                      ? 'Department Officer'
                      : 'Verified Citizen'}
                  </span>
                </div>
              </div>
              {!hideDashboardActions && (
                <div className="grid grid-cols-2 gap-2 px-1">
                  <Link
                    to={dashboardLink}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#c9a227] hover:bg-[#e5c060] text-emerald-950 rounded-lg transition-colors shadow-2xs"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-200 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <Link
                to="/track"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm bg-[#c9a227] hover:bg-[#e5c060] rounded-lg font-medium text-white transition-colors"
              >
                Track Grievance
              </Link>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center px-3 py-2 text-sm border border-white/40 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center px-3 py-2 text-sm bg-white text-[#1a5c38] hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
