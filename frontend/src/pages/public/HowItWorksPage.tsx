import { Link } from 'react-router-dom';
import { ArrowRight, FilePlus2 } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { getUser } from '../../lib/auth';

const stages = [
  {
    number: 1,
    title: 'Register & Describe Your Grievance',
    desc: 'Create a citizen account with your contact details. Describe your issue clearly, select your Keralam district, and attach any supporting photos or PDF documents.',
  },
  {
    number: 2,
    title: 'AI-Assisted Categorization',
    desc: 'Use the built-in AI assistant to analyze your grievance text. It suggests the relevant department, category, urgency priority, and concise CMO summary — which you can accept or customize.',
  },
  {
    number: 3,
    title: 'Instant Reference ID & CMO Review',
    desc: 'Upon submission, you receive a unique Reference ID (e.g., GRV-20261111-XXXXX). The Chief Minister’s Office reviews the petition and adds initial remarks.',
  },
  {
    number: 4,
    title: 'Department Assignment',
    desc: 'CMO administrators assign the grievance to one of Keralam’s 10 state departments (such as Public Works, Health Services, Water Resources, or Electricity Board).',
  },
  {
    number: 5,
    title: 'Officer Investigation & Action Report',
    desc: 'The assigned Department Officer investigates the complaint on the ground, logs status updates, and submits an official action taken report.',
  },
  {
    number: 6,
    title: 'Resolution & Citizen Feedback',
    desc: 'Once resolved, the final resolution details appear on your timeline. You can track progress anytime and submit a satisfaction rating and review.',
  },
];

export default function HowItWorksPage() {
  const user = getUser();
  const submitTarget = user ? '/citizen/submit' : '/login';

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
          {stages.map((stage) => (
            <div
              key={stage.number}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row gap-5 items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a5c38] text-[#e5c060] font-extrabold flex items-center justify-center text-lg shrink-0 shadow-2xs">
                {stage.number}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{stage.title}</h2>
                <p className="text-gray-600 mt-1.5 leading-relaxed text-sm sm:text-base">
                  {stage.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action card */}
        <div className="mt-12 bg-gradient-to-r from-[#1a5c38] to-[#2d7a52] text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Ready to Submit Your Grievance?</h3>
            <p className="text-green-100 text-sm">
              Lodge your complaint now with AI-assisted categorization and real-time tracking.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              to={submitTarget}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c9a227] hover:bg-[#e5c060] text-emerald-950 font-bold text-sm transition-colors shadow-sm"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Submit a Grievance Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
