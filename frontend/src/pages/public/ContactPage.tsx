import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../lib/api';

interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>();

  const mutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const res = await api.post('/api/contact', data);
      return res.data;
    },
    onSuccess: () => {
      setSubmitted(true);
      reset();
      toast.success('Your message has been sent!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Failed to send message');
    },
  });

  return (
    <PageLayout>
      <div className="bg-[#1a5c38] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Contact Us</h1>
          <p className="mt-3 text-green-100 max-w-2xl">
            Have questions about the grievance portal or need technical assistance? Reach out to the CM Kerala Portal Support Desk.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">Portal Support Desk</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              For general enquiries regarding portal accessibility, department coordination, or public grievances, contact us using the details below or submit the enquiry form.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-green-50 text-[#1a5c38]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Secretariat Office</div>
                  <div className="text-sm text-gray-600">
                    Chief Minister's Office, Government Secretariat, Thiruvananthapuram, Kerala - 695001
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-green-50 text-[#1a5c38]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Helpline</div>
                  <div className="text-sm text-gray-600">0471-2333812 / 2333717 (Mon–Sat, 9:30 AM – 5:30 PM)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-green-50 text-[#1a5c38]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">grievance.cmo@kerala.gov.in</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Send an Enquiry</h2>

            {submitted && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Message sent successfully!</div>
                  <p className="text-xs mt-1">
                    Thank you for contacting the CM Kerala Grievance Portal. Our team will review your message shortly.
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit((data) => {
                setSubmitted(false);
                mutation.mutate(data);
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  {...register('subject', { required: 'Subject is required' })}
                  placeholder="How can we help?"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                />
                {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={5}
                  {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'Please enter at least 10 characters' } })}
                  placeholder="Write your enquiry here..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                />
                {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold disabled:opacity-60 transition-colors"
              >
                <Send className="w-4 h-4" />
                {mutation.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
