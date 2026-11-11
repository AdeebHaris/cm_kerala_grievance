import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronRight, ShieldCheck, Landmark } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0f3d25] border-t-4 border-[#c9a227] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Brand & Identity (span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 select-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
            >
              <Landmark className="w-6 h-6 text-[#f4d068] shrink-0" />
              <div>
                <div className="font-semibold text-lg text-white">
                  CM Keralam
                </div>
                <div className="text-xs text-emerald-200/80">
                  Public Grievance Portal
                </div>
              </div>
            </Link>

            <p className="text-green-100/90 text-sm leading-relaxed pr-2">
              A unified digital governance channel enabling citizens across all 14 districts of Keralam to submit, track, and resolve civic grievances directly with the Chief Minister's Office.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-[#e5c060]">
              <ShieldCheck className="w-4 h-4 text-[#c9a227]" />
              <span>Government of Keralam • Citizen Redressal</span>
            </div>
          </div>

          {/* Column 2: Portal Navigation (span 2) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-[#c9a227] uppercase tracking-wider mb-4 pb-1 border-b border-white/10">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Home', to: '/' },
                { label: 'About the Portal', to: '/about' },
                { label: 'How It Works', to: '/how-it-works' },
                { label: 'Departments', to: '/departments' },
                { label: 'Frequently Asked', to: '/faq' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-green-100 hover:text-[#e5c060] flex items-center gap-1.5 transition-colors group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#c9a227] group-hover:translate-x-0.5 transition-transform" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Citizen Services (span 3) */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold text-[#c9a227] uppercase tracking-wider mb-4 pb-1 border-b border-white/10">
              Citizen Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Submit Grievance', to: '/citizen/submit' },
                { label: 'Track Grievance Status', to: '/track' },
                { label: 'Citizen Dashboard', to: '/citizen/dashboard' },
                { label: 'Citizen Registration', to: '/register' },
                { label: 'Portal Support Desk', to: '/contact' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-green-100 hover:text-[#e5c060] flex items-center gap-1.5 transition-colors group"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#c9a227] group-hover:translate-x-0.5 transition-transform" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Secretariat (span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-[#c9a227] uppercase tracking-wider mb-4 pb-1 border-b border-white/10">
              Chief Minister's Office
            </h3>
            <ul className="space-y-3 text-sm text-green-100">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#c9a227] shrink-0 mt-1" />
                <span className="leading-snug">
                  Government Secretariat, Thiruvananthapuram, Keralam - 695001
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#c9a227] shrink-0 mt-1" />
                <div>
                  <div>0471-2333812 / 2333717</div>
                  <div className="text-xs text-green-300">Mon–Sat, 9:30 AM – 5:30 PM</div>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#c9a227] shrink-0" />
                <a
                  href="mailto:grievance.cmo@keralam.gov.in"
                  className="hover:text-[#e5c060] transition-colors truncate"
                >
                  grievance.cmo@keralam.gov.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-green-200">
          <div>
            © 2026 Chief Minister's Public Grievance Redressal Portal, Government of Keralam.
          </div>
          <div className="flex items-center gap-4 text-green-300">
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <span>•</span>
            <Link to="/how-it-works" className="hover:text-white transition-colors">
              Workflow
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
