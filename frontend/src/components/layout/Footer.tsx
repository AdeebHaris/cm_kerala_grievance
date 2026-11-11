import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1a5c38] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏛️</span>
              <div>
                <div className="font-bold text-[#c9a227] text-lg">CM Kerala</div>
                <div className="text-green-200 text-sm">Grievance Redressal Portal</div>
              </div>
            </div>
            <p className="text-green-200 text-sm leading-relaxed">
              A demonstration digital platform enabling citizens to submit and track civic grievances across Kerala districts with AI-assisted triage.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-[#c9a227] mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                ['Home', '/'],
                ['About', '/about'],
                ['How It Works', '/how-it-works'],
                ['Departments', '/departments'],
                ['Track Grievance', '/track'],
                ['Submit Grievance', '/citizen/submit'],
                ['FAQ', '/faq'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-green-200 hover:text-[#c9a227] text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[#c9a227] mb-4">Contact Us</h3>
            <ul className="space-y-3 text-green-200 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Chief Minister's Office, Government Secretariat, Thiruvananthapuram, Kerala - 695001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>0471-2333812 / 2333717</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>grievance.cmo@kerala.gov.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-green-700 text-center text-green-200 text-xs">
          <div>© 2026 Chief Minister's Public Grievance Redressal Portal, Government of Kerala.</div>
        </div>
      </div>
    </footer>
  );
}
