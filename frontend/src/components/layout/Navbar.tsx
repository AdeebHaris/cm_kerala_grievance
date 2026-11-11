import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Landmark } from 'lucide-react';
import { getUser } from '../../lib/auth';

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
  const user = getUser();

  return (
    <nav className="bg-[#1a5c38] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group select-none py-1">
            <div className="w-9 h-9 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/15 transition-colors">
              <Landmark className="w-5 h-5 text-[#f4d068]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight text-white group-hover:text-amber-100 transition-colors">
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
              <span className="text-sm font-semibold text-[#e5c060] px-3 py-1.5">
                {user.name}
              </span>
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
            <span className="block px-3 py-2 text-sm text-[#e5c060] font-semibold border-t border-white/10 mt-2 pt-2">
              {user.name}
            </span>
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
