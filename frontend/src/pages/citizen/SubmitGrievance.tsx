import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  Send,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Bot,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PriorityBadge from '../../components/ui/PriorityBadge';
import api from '../../lib/api';
import { KERALA_DISTRICTS, GRIEVANCE_CATEGORIES, GRIEVANCE_PRIORITIES } from '../../lib/constants';
import { citizenSidebarLinks } from '../../lib/sidebarLinks';
import type { AIAnalysisResult, Grievance } from '../../types';

interface GrievanceFormValues {
  district: string;
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function SubmitGrievance() {
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createdGrievance, setCreatedGrievance] = useState<Grievance | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GrievanceFormValues>({
    defaultValues: {
      district: '',
      category: 'General',
      subject: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  const descriptionValue = useWatch({ control, name: 'description' });

  const aiMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await api.post('/api/ai/analyze', { description });
      return (res.data?.data ?? res.data) as AIAnalysisResult;
    },
    onSuccess: (data) => {
      setAiResult(data);
      toast.success(
        data.is_fallback
          ? 'Fallback classification generated'
          : 'AI analysis complete! Review suggestions on the right.'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'AI analysis failed');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: GrievanceFormValues) => {
      const payload = {
        ...values,
        ai_summary: aiResult?.summary || null,
        ai_category: aiResult?.category || null,
        ai_priority: aiResult?.priority || null,
        ai_department: aiResult?.department || null,
        is_duplicate_risk: aiResult?.is_duplicate_risk || false,
      };
      const res = await api.post('/api/grievances', payload);
      const grievance = (res.data?.data ?? res.data) as Grievance;

      if (selectedFile && grievance?.id) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          await api.post(`/api/grievances/${grievance.id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {
          toast.error('Grievance created, but attachment upload failed.');
        }
      }

      return grievance;
    },
    onSuccess: (grievance) => {
      setCreatedGrievance(grievance);
      toast.success(`Grievance submitted! Ref: ${grievance.reference_id}`);
      reset();
      setSelectedFile(null);
      setAiResult(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Submission failed');
    },
  });

  const handleAnalyze = () => {
    if (!descriptionValue || descriptionValue.trim().length < 10) {
      toast.error('Please enter at least 10 characters in the description first');
      return;
    }
    aiMutation.mutate(descriptionValue.trim());
  };

  const applyAISuggestions = () => {
    if (!aiResult) return;
    if (aiResult.category) {
      setValue('category', aiResult.category, { shouldValidate: true });
    }
    if (aiResult.priority) {
      setValue('priority', aiResult.priority, { shouldValidate: true });
    }
    toast.success('AI suggestions applied! You can still edit any field.');
  };

  const copyRefId = () => {
    if (!createdGrievance?.reference_id) return;
    navigator.clipboard.writeText(createdGrievance.reference_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryOptions = Array.from(
    new Set([
      ...GRIEVANCE_CATEGORIES,
      ...(aiResult?.category ? [aiResult.category] : []),
    ])
  );

  return (
    <DashboardLayout
      title="Submit a Grievance"
      subtitle="Fill out your complaint details and use our AI Assistant for faster routing"
      links={citizenSidebarLinks}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Grievance Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Grievance Details</h2>

          <form
            onSubmit={handleSubmit((data) => submitMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District *
                </label>
                <select
                  {...register('district', { required: 'Please select a district' })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                >
                  <option value="">Select Keralam District</option>
                  {KERALA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="text-xs text-red-600 mt-1">{errors.district.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                >
                  {GRIEVANCE_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                {...register('subject', {
                  required: 'Subject is required',
                  minLength: { value: 5, message: 'Subject should be at least 5 characters' },
                })}
                placeholder="Brief title of your grievance"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
              {errors.subject && (
                <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={aiMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a5c38] hover:text-[#2d7a52] disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c9a227]" />
                  {aiMutation.isPending ? 'Analyzing...' : 'Analyze with AI'}
                </button>
              </div>
              <textarea
                rows={5}
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Please provide at least 10 characters' },
                })}
                placeholder="Describe the issue in detail, including location, landmark, and impact..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supporting Document / Photo (Optional, max 5MB)
              </label>
              <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-5 h-5 text-[#1a5c38]" />
                <span className="text-sm text-gray-600 truncate">
                  {selectedFile
                    ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`
                    : 'Click to upload JPG, PNG, PDF, DOC, DOCX, or TXT'}
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      toast.error('File must be 5MB or smaller');
                      return;
                    }
                    setSelectedFile(file);
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? 'Submitting Grievance...' : 'Submit Grievance'}
            </button>
          </form>
        </div>

        {/* AI Assistant Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#1a5c38] text-[#e5c060] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">AI Grievance Assistant</h2>
                <p className="text-xs text-gray-500">
                  Powered by Groq LLM for automatic triage & duplicate checks
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Draft or edit grievance description for AI analysis:
              </label>
              <textarea
                rows={4}
                value={descriptionValue || ''}
                onChange={(e) => setValue('description', e.target.value, { shouldValidate: true })}
                placeholder="Type your grievance here (e.g., Broken water main flooding street in Kakkanad for 3 days)..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={aiMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#c9a227] hover:bg-[#e5c060] text-[#0f3d25] font-bold text-sm transition-colors disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {aiMutation.isPending ? 'Analyzing with AI...' : 'Analyze with AI'}
            </button>

            {aiResult && (
              <div className="rounded-xl border-2 border-[#c9a227] bg-amber-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-900">
                    🤖 AI Suggestion (Review before submitting)
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      aiResult.is_fallback
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {aiResult.is_fallback
                      ? 'Fallback Classifier'
                      : `AI (${aiResult.model_used || 'openai/gpt-oss-120b'})`}
                  </span>
                </div>

                {aiResult.is_fallback && aiResult.fallback_reason && (
                  <p className="text-xs text-orange-700 bg-orange-50 rounded p-2">
                    Note: {aiResult.fallback_reason}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Suggested Department:</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {aiResult.department}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {aiResult.category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600">Priority:</span>
                    <PriorityBadge priority={aiResult.priority} />
                  </div>
                  <div className="pt-1 border-t border-amber-200/70">
                    <span className="text-xs font-semibold text-gray-600 block">
                      CMO Summary:
                    </span>
                    <p className="text-xs text-gray-800 mt-0.5">{aiResult.summary}</p>
                  </div>
                </div>

                {(aiResult.is_duplicate_risk ||
                  (aiResult.duplicate_candidates && aiResult.duplicate_candidates.length > 0)) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                      <AlertTriangle className="w-4 h-4" />
                      Potential Duplicate Grievance Alert
                    </div>
                    {aiResult.duplicate_candidates && aiResult.duplicate_candidates.length > 0 ? (
                      <ul className="space-y-1 text-xs text-red-700">
                        {aiResult.duplicate_candidates.map((dup) => (
                          <li key={dup.reference_id}>
                            <span className="font-mono font-semibold">{dup.reference_id}</span>:{' '}
                            {dup.subject} ({dup.status})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-red-700">
                        A similar grievance may already exist in the system.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={applyAISuggestions}
                  className="w-full py-2 px-3 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white text-xs font-semibold transition-colors"
                >
                  Apply AI Suggestions to Form
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {createdGrievance && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 text-[#1a5c38] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Grievance Submitted!</h3>
            <p className="text-sm text-gray-600">
              Your grievance has been recorded and forwarded for CMO review. Save your Reference ID for tracking:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-lg text-[#1a5c38]">
                {createdGrievance.reference_id}
              </span>
              <button
                type="button"
                onClick={copyRefId}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold hover:bg-gray-100"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link
                to={`/citizen/grievances/${createdGrievance.id}`}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white text-sm font-semibold"
              >
                View Details
              </Link>
              <Link
                to="/citizen/dashboard"
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
