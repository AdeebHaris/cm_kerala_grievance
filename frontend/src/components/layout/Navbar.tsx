import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, FileText } from 'lucide-react';
import { getUser, clearAuth } from '../../lib/auth';
import toast from 'react-hot-toast';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = getUser();
  const navigate = useNavigate();

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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div className="leading-tight">
              <div className="font-bold text-sm sm:text-base text-[#c9a227]">CM Keralam</div>
              <div className="text-xs text-green-200 hidden sm:block">Grievance Portal</div>
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
            <Link
              to="/citizen/submit"
              className="px-3 py-1.5 text-sm bg-white text-[#1a5c38] rounded hover:bg-gray-100 transition-colors font-semibold"
            >
              Submit Grievance
            </Link>
            <Link
              to="/track"
              className="px-3 py-1.5 text-sm bg-[#c9a227] text-white rounded hover:bg-[#e5c060] transition-colors font-medium"
            >
              Track Grievance
            </Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#2d7a52] rounded hover:bg-[#0f3d25] transition-colors text-sm"
                >
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg py-1 z-50">
                    <Link
                      to={dashboardLink}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    {user.role === 'CITIZEN' && (
                      <Link
                        to="/citizen/submit"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <FileText className="w-4 h-4" /> Submit Grievance
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0f3d25] px-4 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm rounded hover:bg-[#2d7a52]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/citizen/submit"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 text-sm bg-white text-[#1a5c38] rounded font-semibold"
          >
            Submit Grievance
          </Link>
          <Link
            to="/track"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 text-sm bg-[#c9a227] rounded font-medium"
          >
            Track Grievance
          </Link>
          {user ? (
            <>
              <Link to={dashboardLink} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm hover:bg-[#2d7a52] rounded">
                Dashboard
              </Link>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="block px-3 py-2 text-sm text-red-300 w-full text-left">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm hover:bg-[#2d7a52] rounded">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm bg-white text-[#1a5c38] rounded font-medium">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
