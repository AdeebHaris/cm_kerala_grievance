import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Landmark, LayoutDashboard, LogOut, User, Home, ChevronDown } from 'lucide-react';
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Close dropdown on navigation
  useEffect(() => {
    setUserDropdownOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

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
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white hover:bg-[#2d7a52] transition-colors cursor-pointer select-none"
                  aria-expanded={userDropdownOpen}
                >
                  <User className="w-4 h-4 text-[#f4d068] shrink-0" />
                  <span className="text-sm font-medium text-white max-w-[150px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-emerald-200 transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Profile Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-xl ring-1 ring-black/10 py-1.5 z-50 text-gray-800">
                    <div className="px-3.5 py-2 border-b border-gray-100">
                      <div className="text-xs font-semibold text-gray-900 truncate">{user.name}</div>
                      <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={dashboardLink}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                      >
                        <Home className="w-4 h-4 text-emerald-700" />
                        <span>Home</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
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
            <div className="pt-2 border-t border-white/10 space-y-1 mt-2">
              <div className="flex items-center gap-2.5 px-3 py-2 text-white">
                <User className="w-4 h-4 text-[#f4d068] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-[11px] text-emerald-200">{user.email}</span>
                </div>
              </div>
              <div className="space-y-1 px-1 pt-1">
                <Link
                  to={dashboardLink}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-[#2d7a52] rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#f4d068]" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-[#2d7a52] rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4 text-[#f4d068]" />
                  <span>Home</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout</span>
                </button>
              </div>
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
