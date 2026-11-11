import { Link } from 'react-router-dom';
import {
  UserPlus,
  Sparkles,
  ClipboardList,
  Building2,
  SearchCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';

const stages = [
  {
    number: 1,
    title: 'Register & Describe Your Grievance',
    desc: 'Create a citizen account with your contact details. Describe your issue clearly, select your Kerala district, and attach any supporting photos or PDF documents.',
    icon: UserPlus,
  },
  {
    number: 2,
    title: 'AI-Assisted Categorization',
    desc: 'Use the built-in AI assistant to analyze your grievance text. It suggests the relevant department, category, urgency priority, and concise CMO summary — which you can accept or customize.',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Instant Reference ID & CMO Review',
    desc: 'Upon submission, you receive a unique Reference ID (e.g., GRV-20261111-XXXXX). The Chief Minister’s Office reviews the petition and adds initial remarks.',
    icon: ClipboardList,
  },
  {
    number: 4,
    title: 'Department Assignment',
    desc: 'CMO administrators assign the grievance to one of Kerala’s 10 state departments (such as Public Works, Health Services, Water Resources, or Electricity Board).',
    icon: Building2,
  },
  {
    number: 5,
    title: 'Officer Investigation & Action Report',
    desc: 'The assigned Department Officer investigates the complaint on the ground, logs status updates, and submits an official action taken report.',
    icon: SearchCheck,
  },
  {
    number: 6,
    title: 'Resolution & Citizen Feedback',
    desc: 'Once resolved, the final resolution details appear on your timeline. You can track progress anytime and submit a satisfaction rating and review.',
    icon: CheckCircle2,
  },
];

export default function HowItWorksPage() {
  return (
    <PageLayout>
      <div className="bg-[#1a5c38] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold">How It Works</h1>
          <p className="mt-3 text-green-100 max-w-2xl">
            A clear, step-by-step overview of how your grievance moves from submission to resolution.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.number}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row gap-5 items-start"
              >
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#1a5c38] text-[#e5c060] font-bold flex items-center justify-center text-lg">
                    {stage.number}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-50 text-[#1a5c38] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{stage.title}</h2>
                  <p className="text-gray-600 mt-1.5 leading-relaxed text-sm sm:text-base">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#1a5c38] to-[#2d7a52] text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">Ready to lodge or check a grievance?</h3>
            <p className="text-green-100 text-sm mt-1">
              Get started in minutes with your mobile number and email address.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a227] hover:bg-[#e5c060] text-[#0f3d25] font-bold text-sm transition-colors"
            >
              Register Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/track"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-sm transition-colors"
            >
              Track Reference ID
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
