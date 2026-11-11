import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  ArrowRight,
  Info,
  Landmark,
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../lib/api';
import type { PublicStats, Department } from '../../types';
import { getDepartmentIcon } from '../../lib/departmentIcons';


const fallbackDepartments: Department[] = [
  {
    id: 'pwd',
    name: 'Public Works Department',
    code: 'PWD',
    description: 'Roads, bridges, state highways, and public building maintenance.',
  },
  {
    id: 'health',
    name: 'Health Services',
    code: 'HLT',
    description: 'Government hospitals, primary health centers, and medical aid.',
  },
  {
    id: 'edu',
    name: 'Education Department',
    code: 'EDU',
    description: 'Public schools, higher education, scholarships, and infrastructure.',
  },
  {
    id: 'water',
    name: 'Water Resources',
    code: 'WRD',
    description: 'Drinking water supply, irrigation canals, and conservation.',
  },
  {
    id: 'kseb',
    name: 'Kerala State Electricity Board',
    code: 'KSEB',
    description: 'Power distribution, outages, street lighting, and KSEB services.',
  },
  {
    id: 'agri',
    name: 'Agriculture Department',
    code: 'AGR',
    description: 'Farmer welfare, crop relief, subsidies, and agricultural support.',
  },
];

export default function HomePage() {

  const { data: statsData } = useQuery<PublicStats>({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const res = await api.get('/api/stats/public');
      return res.data?.data ?? res.data;
    },
    retry: false,
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['home-departments'],
    queryFn: async () => {
      const res = await api.get('/api/departments');
      return res.data?.data ?? res.data ?? [];
    },
    retry: false,
  });

  const totalGrievances = statsData?.total ?? 1247;
  const resolvedGrievances = statsData?.resolved ?? 892;
  const pendingGrievances = statsData?.pending ?? 355;
  const deptCount =
    statsData?.departments_count ?? (departments?.length ? departments.length : 10);

  const featuredDepts =
    departments && departments.length > 0
      ? departments.slice(0, 6)
      : fallbackDepartments;

  const submitTarget = '/citizen/submit';

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f3d25] via-[#1a5c38] to-[#2d7a52] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-[#c9a227]/40 text-[#e5c060] text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4" />
              Government of Keralam • Citizen Grievance Resolution
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              CM Keralam{' '}
              <span className="text-[#c9a227]">Grievance Portal</span>
            </h1>

            <p className="text-lg sm:text-xl text-green-100 max-w-2xl leading-relaxed">
              Your voice matters to the Chief Minister. Submit public grievances seamlessly with AI-powered routing, track real-time progress across all 14 districts of Keralam, and receive transparent resolutions.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to={submitTarget}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#c9a227] hover:bg-[#e5c060] text-[#0f3d25] font-bold shadow-lg transition-all"
              >
                <FileText className="w-5 h-5" />
                Submit a Grievance
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold transition-all"
              >
                <Search className="w-5 h-5" />
                Track Your Grievance
              </Link>
            </div>
          </div>

          {/* Keralam State Grid Visual Card */}
          <div className="lg:col-span-5 flex justify-center z-10">
            <div className="relative w-full max-w-sm bg-white/10 backdrop-blur-sm border border-[#c9a227]/40 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/15">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#e5c060] font-semibold">
                    Government Secretariat
                  </span>
                  <h2 className="text-lg font-bold text-white">Public Grievance Cell</h2>
                </div>
                <Landmark className="w-7 h-7 text-[#f4d068] shrink-0" />
              </div>

              {/* Stylized Keralam Map Visual & Key Highlights */}
              <div className="bg-[#0f3d25]/80 rounded-xl p-5 border border-green-400/20 flex items-center gap-5">
                <svg
                  viewBox="0 0 120 260"
                  className="w-24 h-52 shrink-0 drop-shadow-md"
                  aria-label="Map of Keralam"
                >
                  <path
                    d="M35,10 C48,8 62,18 68,35 C74,52 66,68 78,86 C90,104 96,120 88,142 C82,158 92,175 84,195 C78,212 85,232 72,248 C62,256 50,245 45,228 C38,208 32,186 28,162 C24,138 18,112 22,86 C26,60 20,30 35,10 Z"
                    fill="#2d7a52"
                    stroke="#c9a227"
                    strokeWidth="3"
                  />
                  <circle cx="48" cy="36" r="4" fill="#e5c060" />
                  <circle cx="56" cy="78" r="4" fill="#e5c060" />
                  <circle cx="62" cy="126" r="5" fill="#ffffff" />
                  <circle cx="56" cy="176" r="4" fill="#e5c060" />
                  <circle cx="66" cy="226" r="5" fill="#c9a227" />
                </svg>

                <div className="space-y-3 text-xs">
                  <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                    <div className="text-[#e5c060] font-semibold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> CMO Direct Review
                    </div>
                    <p className="text-green-100 mt-1">
                      Direct supervision & tracking from the Chief Minister's Office.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                    <div className="text-[#e5c060] font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> 14 Districts Connected
                    </div>
                    <p className="text-green-100 mt-1">
                      Unified issue resolution across all revenue districts and departments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* State-Wide Redressal Metrics Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-4 sm:p-5 space-y-3.5">
          {/* Header pill clearly clarifying this is State-Wide Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                State-Wide Grievance Resolution Metrics
              </span>
              <span className="text-[11px] text-slate-500 hidden md:inline">
                • Cumulative public statistics across all 14 Keralam districts
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 border border-slate-200 self-start sm:self-auto">
              <span>Overall Public Tally</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                label: 'Total State Submissions',
                description: 'Across all 14 districts',
                value: totalGrievances.toLocaleString(),
                icon: FileText,
                accent: 'border-emerald-600 text-[#1a5c38]',
                iconBg: 'bg-emerald-50 text-[#1a5c38]',
              },
              {
                label: 'State-Wide Resolved',
                description: 'Successfully resolved',
                value: resolvedGrievances.toLocaleString(),
                icon: CheckCircle2,
                accent: 'border-teal-600 text-teal-700',
                iconBg: 'bg-teal-50 text-teal-700',
              },
              {
                label: 'Active In Resolution',
                description: 'Under departmental action',
                value: pendingGrievances.toLocaleString(),
                icon: Clock,
                accent: 'border-amber-500 text-amber-700',
                iconBg: 'bg-amber-50 text-amber-700',
              },
              {
                label: 'Connected Departments',
                description: 'State ministries & boards',
                value: deptCount.toLocaleString(),
                icon: Building2,
                accent: 'border-blue-600 text-blue-700',
                iconBg: 'bg-blue-50 text-blue-700',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`bg-slate-50/70 hover:bg-white rounded-xl p-4 border border-slate-200/80 border-t-4 ${stat.accent} transition-all shadow-2xs flex items-center justify-between`}
                >
                  <div>
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                      {stat.label}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {stat.description}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.iconBg} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clean & Minimal Workflow Teaser Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1a5c38] bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 inline-block">
            Transparent Governance
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            How Your Grievance Gets Solved
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            From instant AI intake and direct Chief Minister's Office review to departmental field action, every step is logged and traceable in real-time.
          </p>

          <div className="pt-2">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md group"
            >
              <span>Explore Complete 6-Step Workflow</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Departments Section */}
      <section className="bg-white border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#c9a227]">
                State Departments
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                Featured Departments
              </h2>
            </div>
            <Link
              to="/departments"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a5c38] hover:underline"
            >
              Explore all departments <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDepts.map((dept) => {
              const Icon = getDepartmentIcon(dept.code, dept.name);
              return (
                <div
                  key={dept.id}
                  className="p-6 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white hover:border-[#1a5c38]/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1a5c38] text-[#e5c060] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#c9a227]/15 text-[#9a7813]">
                      {dept.code}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{dept.name}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{dept.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Citizen Feedback & Support */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <blockquote className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-700 italic text-sm leading-relaxed">
              “I reported a damaged rural road in Thrissur and received a tracking ID immediately. The Public Works officer updated the inspection status within days.”
            </p>
            <footer className="mt-4 text-xs font-semibold text-[#1a5c38]">
              — Sample Citizen Story • Thrissur District
            </footer>
          </blockquote>
          <blockquote className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-700 italic text-sm leading-relaxed">
              “The AI assistant helped classify my drinking water pipeline issue right away, ensuring it reached the Water Resources department without delay.”
            </p>
            <footer className="mt-4 text-xs font-semibold text-[#1a5c38]">
              — Sample Citizen Story • Ernakulam District
            </footer>
          </blockquote>
        </div>

        <div className="bg-[#0f3d25] text-white rounded-xl p-6 sm:p-8 border-l-4 border-[#c9a227] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-[#c9a227] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#e5c060]">Need Assistance with Your Grievance?</h3>
              <p className="text-sm text-green-100 mt-1">
                You can track ongoing grievance status anytime using your Reference ID or reach out to our dedicated support desk.
              </p>
            </div>
          </div>
          <Link
            to="/track"
            className="shrink-0 px-4 py-2 rounded-lg bg-[#c9a227] hover:bg-[#e5c060] text-[#0f3d25] font-semibold text-sm transition-colors"
          >
            Track Grievance
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
