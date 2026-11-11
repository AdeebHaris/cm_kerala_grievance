import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  ClipboardCheck,
  UserCheck,
  ShieldCheck,
  Wrench,
  HeartPulse,
  GraduationCap,
  Droplets,
  Zap,
  Sprout,
  ArrowRight,
  Info,
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../lib/api';
import type { PublicStats, Department } from '../../types';

const howItWorksSteps = [
  {
    step: '01',
    title: 'Submit',
    desc: 'Register and lodge your grievance with AI-assisted categorization.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'CMO Review',
    desc: 'Chief Minister’s Office verifies urgency and priority.',
    icon: ClipboardCheck,
  },
  {
    step: '03',
    title: 'Department Assigned',
    desc: 'Forwarded directly to the concerned Kerala state department.',
    icon: Building2,
  },
  {
    step: '04',
    title: 'Investigation',
    desc: 'Department officer inspects the issue and records findings.',
    icon: UserCheck,
  },
  {
    step: '05',
    title: 'Resolution',
    desc: 'Official action taken and citizen feedback collected.',
    icon: CheckCircle2,
  },
];

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

const deptIcons = [Wrench, HeartPulse, GraduationCap, Droplets, Zap, Sprout];

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
              Government of Kerala • Citizen Redressal System
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              CM Kerala{' '}
              <span className="text-[#c9a227]">Grievance Portal</span>
            </h1>

            <p className="text-lg sm:text-xl text-green-100 max-w-2xl leading-relaxed">
              Your voice matters to the Chief Minister. Submit public grievances seamlessly with AI-powered routing, track real-time progress across all 14 districts, and receive transparent resolutions.
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

          {/* Kerala State Grid Visual Card */}
          <div className="lg:col-span-5 flex justify-center z-10">
            <div className="relative w-full max-w-sm bg-white/10 backdrop-blur-sm border border-[#c9a227]/40 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/15">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#e5c060] font-semibold">
                    Government Secretariat
                  </span>
                  <h2 className="text-lg font-bold text-white">Public Redressal Cell</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-[#c9a227]/50 text-xl shadow-inner">
                  🏛️
                </div>
              </div>

              {/* Stylized Kerala Map Visual & Key Highlights */}
              <div className="bg-[#0f3d25]/80 rounded-xl p-5 border border-green-400/20 flex items-center gap-5">
                <svg
                  viewBox="0 0 120 260"
                  className="w-24 h-52 shrink-0 drop-shadow-md"
                  aria-label="Map of Kerala"
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
                      Unified redressal across all revenue districts and departments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Grievances',
              value: totalGrievances.toLocaleString(),
              icon: FileText,
              accent: 'border-[#1a5c38] text-[#1a5c38]',
            },
            {
              label: 'Resolved Cases',
              value: resolvedGrievances.toLocaleString(),
              icon: CheckCircle2,
              accent: 'border-emerald-600 text-emerald-700',
            },
            {
              label: 'Pending / Active',
              value: pendingGrievances.toLocaleString(),
              icon: Clock,
              accent: 'border-[#c9a227] text-[#b38b16]',
            },
            {
              label: 'Departments',
              value: deptCount.toLocaleString(),
              icon: Building2,
              accent: 'border-teal-600 text-teal-700',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`bg-white rounded-xl shadow-md p-5 border-t-4 ${stat.accent} flex items-center justify-between`}
              >
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {stat.label}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                    {stat.value}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c9a227]">
            Transparent Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            How Grievance Redressal Works
          </h2>
          <p className="text-gray-600 mt-2">
            From submission to final resolution, every step is logged and traceable with your unique reference ID.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {howItWorksSteps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-lg bg-green-50 text-[#1a5c38] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#c9a227]/15 text-[#9a7813]">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a5c38] hover:text-[#2d7a52]"
          >
            View detailed process <ArrowRight className="w-4 h-4" />
          </Link>
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
            {featuredDepts.map((dept, index) => {
              const Icon = deptIcons[index % deptIcons.length];
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
                You can track ongoing redressal status anytime using your Reference ID or reach out to our dedicated support desk.
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
