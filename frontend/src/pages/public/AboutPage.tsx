import { Target, Eye, CheckCircle, Shield, Sparkles, Clock } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="bg-[#1a5c38] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold">About the Portal</h1>
          <p className="mt-3 text-green-100 max-w-2xl">
            Bridging citizens of Keralam and the Chief Minister’s Office with accountability, speed, and transparency.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Purpose */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[#1a5c38] mb-3">Purpose of the Portal</h2>
          <p className="text-gray-700 leading-relaxed">
            The CM Keralam Chief Minister’s Public Grievance Redressal Portal provides a single-window digital channel for every resident across Keralam’s 14 districts to submit complaints, petitions, and civic issues directly to the Chief Minister’s Office (CMO). Each submission is assigned a unique reference ID, analyzed by AI for rapid routing, reviewed by CMO administrators, and acted upon by designated state departments.
          </p>
        </section>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="w-12 h-12 rounded-lg bg-green-50 text-[#1a5c38] flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To ensure timely, fair, and citizen-centric redressal of public grievances by eliminating bureaucratic delays and empowering state departments with real-time tracking and intelligent triage.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-[#c9a227] flex items-center justify-center mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              A responsive and transparent governance ecosystem in Keralam where every citizen’s concern is heard, documented, and resolved with measurable accountability.
            </p>
          </div>
        </div>

        {/* Objectives */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Core Objectives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'Provide 24/7 online access for citizens across all 14 districts of Keralam.',
              'Standardize grievance tracking with instant Reference ID generation.',
              'Use AI-assisted triage to identify the right department and urgency level.',
              'Enable CMO administrators to monitor overdue and high-priority cases.',
              'Allow department officers to file structured action reports and resolutions.',
              'Collect post-resolution citizen feedback to continuously improve service quality.',
            ].map((obj) => (
              <div key={obj} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <CheckCircle className="w-5 h-5 text-[#1a5c38] shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{obj}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'AI Grievance Triage',
                desc: 'Automatically suggests category, priority, summary, and target department before submission.',
                icon: Sparkles,
              },
              {
                title: 'End-to-End Audit Trail',
                desc: 'Every status change, CMO remark, and officer investigation note is recorded chronologically.',
                icon: Clock,
              },
              {
                title: 'Role-Based Dashboards',
                desc: 'Dedicated interfaces for Citizens, CMO Administrators, and Department Officers.',
                icon: Shield,
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="w-11 h-11 rounded-lg bg-[#1a5c38] text-[#e5c060] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">{feat.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
