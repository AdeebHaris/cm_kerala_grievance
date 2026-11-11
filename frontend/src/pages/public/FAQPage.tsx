import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';

const faqs = [
  {
    q: 'Who can submit a grievance on the CM Keralam Grievance Portal?',
    a: 'Any resident or citizen of Keralam across all 14 districts can register for free and submit a public or civic grievance to the Chief Minister’s Office.',
  },
  {
    q: 'How do I submit a grievance?',
    a: 'Register or log in as a Citizen, click "Submit Grievance" from your dashboard, select your district, enter your issue details (optionally using the AI Assistant for smart categorization), and click Submit.',
  },
  {
    q: 'What is the Reference ID and how do I use it?',
    a: 'Every submitted grievance generates a unique Reference ID (e.g., GRV-20261111-A1B2C). You can enter this ID on the Track Grievance page—even without logging in—to view live status and updates.',
  },
  {
    q: 'How does the AI Grievance Assistant work?',
    a: 'When you describe your complaint and click "Analyze with AI", our AI analyzes the text and suggests the most appropriate state department, category, priority level, and summary. You can review and accept or override these suggestions before submitting.',
  },
  {
    q: 'What do the different grievance statuses mean?',
    a: 'SUBMITTED means logged in the portal; UNDER REVIEW means the CMO team is examining it; IN PROGRESS means it has been forwarded to a state department for action; RESOLVED means official action has been completed; REOPENED means further review is required.',
  },
  {
    q: 'How long does it take to resolve a grievance?',
    a: 'Standard grievances are typically reviewed by the CMO within 2–3 working days and resolved by the concerned department within 7–15 days, depending on field inspection requirements. Cases open beyond 7 days are flagged as overdue in CMO monitoring.',
  },
  {
    q: 'Can I upload supporting documents or photos?',
    a: 'Yes, you can attach relevant images (JPG, PNG) or documents (PDF, DOC, DOCX) up to 5 MB while submitting your grievance so officers have clear evidence.',
  },
  {
    q: 'Can I provide feedback after my grievance is resolved?',
    a: 'Yes! Once your grievance status becomes RESOLVED, you can rate the resolution experience (1 to 5 stars) and share comments from your Citizen Dashboard or Track Grievance view.',
  },
  {
    q: 'Is my personal contact information kept secure?',
    a: 'Yes. Public tracking only shows non-sensitive grievance progress, assigned department, and status timeline. Personal contact details are restricted to authorized CMO and department officials.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PageLayout>
      <div className="bg-[#1a5c38] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h1>
          <p className="mt-3 text-green-100 max-w-2xl">
            Find quick answers about submitting, tracking, and resolving grievances on the CM Keralam Portal.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3 font-semibold text-gray-900">
                    <HelpCircle className="w-5 h-5 text-[#1a5c38] shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
