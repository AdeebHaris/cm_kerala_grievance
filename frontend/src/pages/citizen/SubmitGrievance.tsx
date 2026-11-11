import { useState, useEffect } from 'react';
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
  Building2,
  Tag,
  FileText,
  Trash2,
  Clock,
  Bot,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PriorityBadge from '../../components/ui/PriorityBadge';
import api from '../../lib/api';
import { KERALA_DISTRICTS, GRIEVANCE_CATEGORIES } from '../../lib/constants';
import { citizenSidebarLinks } from '../../lib/sidebarLinks';
import type { AIAnalysisResult, DuplicateCandidate, Grievance } from '../../types';

interface GrievanceFormValues {
  district: string;
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | '';
}

function parseCandidateDate(candidate: DuplicateCandidate): Date | null {
  if (candidate.created_at) {
    const d = new Date(candidate.created_at);
    if (!isNaN(d.getTime())) return d;
  }
  // Fallback: extract date from reference ID format GRV-YYYYMMDD-XXXX
  const match = candidate.reference_id?.match(/GRV-(\d{4})(\d{2})(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function evaluateDuplicateRisk(candidates?: DuplicateCandidate[]) {
  if (!candidates || candidates.length === 0) {
    return {
      hasDuplicate: false,
      isStaleAndUnresolved: false,
      blockSubmission: false,
      candidate: null as DuplicateCandidate | null,
      daysAgo: 0,
      formattedDate: '',
    };
  }

  const now = new Date();
  const evaluated = candidates.map((cand) => {
    const date = parseCandidateDate(cand);
    const diffDays = date
      ? Math.max(0, Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const isUnresolved = cand.status !== 'RESOLVED';
    const isStale = diffDays >= 7; // Older than 7 days threshold
    return {
      cand,
      date,
      diffDays,
      isUnresolved,
      isStale,
      formattedDate: date
        ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'an earlier date',
    };
  });

  // Recent unresolved duplicate -> strictly block submission (< 7 days old)
  const recentCandidate = evaluated.find((e) => !e.isStale && e.isUnresolved);
  if (recentCandidate) {
    return {
      hasDuplicate: true,
      isStaleAndUnresolved: false,
      blockSubmission: true,
      candidate: recentCandidate.cand,
      daysAgo: recentCandidate.diffDays,
      formattedDate: recentCandidate.formattedDate,
    };
  }

  // Stale unresolved duplicate -> allow submission with escalated priority (>= 7 days old)
  const staleUnresolved = evaluated.find((e) => e.isStale && e.isUnresolved);
  if (staleUnresolved) {
    return {
      hasDuplicate: true,
      isStaleAndUnresolved: true,
      blockSubmission: false,
      candidate: staleUnresolved.cand,
      daysAgo: staleUnresolved.diffDays,
      formattedDate: staleUnresolved.formattedDate,
    };
  }

  // Any other recent duplicate -> block submission
  const anyRecent = evaluated.find((e) => !e.isStale);
  if (anyRecent) {
    return {
      hasDuplicate: true,
      isStaleAndUnresolved: false,
      blockSubmission: true,
      candidate: anyRecent.cand,
      daysAgo: anyRecent.diffDays,
      formattedDate: anyRecent.formattedDate,
    };
  }

  const first = evaluated[0];
  return {
    hasDuplicate: true,
    isStaleAndUnresolved: false,
    blockSubmission: false,
    candidate: first.cand,
    daysAgo: first.diffDays,
    formattedDate: first.formattedDate,
  };
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
      category: '',
      subject: '',
      description: '',
      priority: '',
    },
  });

  const descriptionValue = useWatch({ control, name: 'description' });
  const districtValue = useWatch({ control, name: 'district' });
  const subjectValue = useWatch({ control, name: 'subject' });
  const categoryValue = useWatch({ control, name: 'category' });
  const priorityValue = useWatch({ control, name: 'priority' });

  const [customSummary, setCustomSummary] = useState<string>('');
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);

  const DRAFT_STORAGE_KEY = 'cm_kerala_grievance_draft';
  const [unrestoredDraft, setUnrestoredDraft] = useState<{
    district?: string;
    description?: string;
    subject?: string;
    category?: string;
    priority?: string;
    customSummary?: string;
    savedAt?: string;
  } | null>(null);

  // Check for saved draft in localStorage ONLY on mount (coming back from somewhere)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.description || parsed.subject || parsed.district) {
          setUnrestoredDraft(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Quietly auto-save draft in the background as the user types (no annoying popup while typing)
  useEffect(() => {
    if (descriptionValue?.trim() || subjectValue?.trim() || districtValue) {
      try {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const payload = {
          district: districtValue || '',
          description: descriptionValue || '',
          subject: subjectValue || '',
          category: categoryValue || '',
          priority: priorityValue || '',
          customSummary,
          savedAt: now,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore storage quota
      }
    }
  }, [descriptionValue, districtValue, subjectValue, categoryValue, priorityValue, customSummary]);

  const handleRestoreDraft = () => {
    if (!unrestoredDraft) return;
    if (unrestoredDraft.district) setValue('district', unrestoredDraft.district, { shouldValidate: true });
    if (unrestoredDraft.description) setValue('description', unrestoredDraft.description, { shouldValidate: true });
    if (unrestoredDraft.subject) setValue('subject', unrestoredDraft.subject, { shouldValidate: true });
    if (unrestoredDraft.category) setValue('category', unrestoredDraft.category, { shouldValidate: true });
    if (unrestoredDraft.priority) setValue('priority', unrestoredDraft.priority as 'LOW' | 'MEDIUM' | 'HIGH', { shouldValidate: true });
    if (unrestoredDraft.customSummary) setCustomSummary(unrestoredDraft.customSummary);
    setUnrestoredDraft(null);
    toast.success('Draft restored to form');
  };

  const handleDeleteDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    reset({
      district: '',
      category: '',
      subject: '',
      description: '',
      priority: '',
    });
    setUnrestoredDraft(null);
    setAiResult(null);
    setCustomSummary('');
    setSelectedFile(null);
    toast.success('Draft deleted');
  };

  const aiMutation = useMutation({
    mutationFn: async (payload: { description: string; district?: string; subject?: string }) => {
      const res = await api.post('/api/ai/analyze', payload);
      return (res.data?.data ?? res.data) as AIAnalysisResult;
    },
    onSuccess: (data) => {
      setAiResult(data);
      setCustomSummary(data.summary || '');
      setIsEditingSummary(false);
      if (data.subject) {
        setValue('subject', data.subject, { shouldValidate: true });
      }
      if (data.category) {
        setValue('category', data.category, { shouldValidate: true });
      }
      const evalResult = evaluateDuplicateRisk(data.duplicate_candidates);
      if (evalResult.isStaleAndUnresolved) {
        setValue('priority', 'HIGH', { shouldValidate: true });
        toast.success(
          'Older duplicate is >7 days old & unresolved. Resubmission allowed with HIGH priority!'
        );
      } else if (evalResult.blockSubmission) {
        if (data.priority) {
          setValue('priority', data.priority, { shouldValidate: true });
        }
        toast.error(
          'Active duplicate found. Submission locked — please verify the existing grievance date.'
        );
      } else if (data.priority) {
        setValue('priority', data.priority, { shouldValidate: true });
      }
      toast.success(
        data.is_fallback
          ? 'Classification generated! Please review your form below.'
          : 'Form auto-filled by AI! Review and edit any field below before submitting.'
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
        ai_summary: (customSummary.trim() || aiResult?.summary) || null,
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
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
      setUnrestoredDraft(null);
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
    aiMutation.mutate({
      description: descriptionValue.trim(),
      district: districtValue || undefined,
      subject: subjectValue || undefined,
    });
  };

  const dupEval = evaluateDuplicateRisk(aiResult?.duplicate_candidates);

  const applyAISuggestions = () => {
    if (!aiResult) return;
    if (aiResult.category) {
      setValue('category', aiResult.category, { shouldValidate: true });
    }
    if (dupEval.isStaleAndUnresolved) {
      setValue('priority', 'HIGH', { shouldValidate: true });
    } else if (aiResult.priority) {
      setValue('priority', aiResult.priority, { shouldValidate: true });
    }
    if (aiResult.subject) {
      setValue('subject', aiResult.subject, { shouldValidate: true });
    }
    toast.success('AI suggestions (Subject, Category, Priority) applied to form!');
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
      ...(unrestoredDraft?.category ? [unrestoredDraft.category] : []),
      ...(categoryValue ? [categoryValue] : []),
    ])
  );

  return (
    <DashboardLayout
      title="Submit a Grievance"
      subtitle="Tell us your issue in plain words — our AI Assistant will auto-route and pre-fill your form"
      links={citizenSidebarLinks}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Draft Pill Banner (Only shown if returning with a saved draft) */}
        {unrestoredDraft && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1a5c38]" />
              <span>
                You have a saved draft {unrestoredDraft.savedAt ? `from ${unrestoredDraft.savedAt}` : ''}.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1a5c38] hover:bg-[#25784c] text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={handleDeleteDraft}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Delete Draft
              </button>
            </div>
          </div>
        )}

        {/* AI Grievance Assistant & Natural Language Intake */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a5c38] to-[#2d7a52] text-[#e5c060] flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-[#e5c060]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AI Grievance Assistant</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Describe your problem in everyday words. The assistant will detect the responsible department, evaluate urgency, draft a title, and auto-fill your form.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  District *
                </label>
                <select
                  {...register('district', { required: 'Please select a district' })}
                  value={districtValue || ''}
                  onChange={(e) => setValue('district', e.target.value, { shouldValidate: true })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38] text-sm"
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

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Describe your problem in plain words *
                </label>
                <textarea
                  rows={4}
                  value={descriptionValue || ''}
                  onChange={(e) => setValue('description', e.target.value, { shouldValidate: true })}
                  placeholder="Tell us what happened (e.g., Deep potholes on Aluva-Perumbavoor road causing two-wheeler accidents and traffic delays for 2 months)..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38] text-sm leading-relaxed"
                />
                {errors.description && (
                  <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={aiMutation.isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center py-2.5 px-5 rounded-xl bg-[#1a5c38] hover:bg-[#25784c] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 cursor-pointer"
              >
                {aiMutation.isPending ? 'Analyzing & Pre-filling Form...' : 'Analyze & Pre-fill Form with AI'}
              </button>
            </div>
          </div>

          {/* AI Recommendation Card (Rendered directly here once analyzed) */}
          {aiResult && (
            <div className="mt-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 via-white to-emerald-50/30 shadow-sm p-5 space-y-4">
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1a5c38]/10 text-[#1a5c38] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#1a5c38]" />
                  </div>
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-800">
                      AI Recommendation
                    </span>
                    <p className="text-[10px] text-gray-400">Values have been auto-filled in the form below</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                    aiResult.is_fallback
                      ? 'bg-amber-100/80 text-amber-900 border border-amber-200'
                      : 'bg-emerald-100/70 text-[#0f3d25] border border-emerald-200/80'
                  }`}
                >
                  {aiResult.is_fallback ? 'Rule Fallback' : 'Groq AI'}
                </span>
              </div>

              {/* Suggested Title / Subject */}
              {aiResult.subject && (
                <div className="rounded-xl border border-slate-200/90 bg-white p-3 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#1a5c38]" /> Suggested Subject (Applied Below)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('subject', aiResult.subject || '', { shouldValidate: true });
                        toast.success('Suggested subject applied!');
                      }}
                      className="text-[11px] font-semibold text-[#1a5c38] hover:text-[#2d7a52] hover:underline"
                    >
                      Re-apply Title
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 leading-snug">
                    {aiResult.subject}
                  </p>
                </div>
              )}

              {/* Metrics 2-column tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Department */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-[#1a5c38]" /> Suggested Department
                  </span>
                  <p className="text-xs font-bold text-gray-900 leading-snug">
                    {aiResult.department}
                  </p>
                </div>

                {/* Priority */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assessed Urgency / Priority
                  </span>
                  <div className="pt-0.5">
                    <PriorityBadge priority={aiResult.priority} showFullLabel />
                  </div>
                </div>
              </div>

              {/* Category Row */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100/70 text-xs">
                <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                  <Tag className="w-3.5 h-3.5 text-gray-400" /> Category:
                </span>
                <span className="font-semibold text-gray-800">{aiResult.category}</span>
              </div>

              {/* AI Summary of your issue */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    AI Summary of your issue:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSummary(!isEditingSummary)}
                    className="text-[11px] font-semibold text-[#1a5c38] hover:text-[#2d7a52] hover:underline"
                  >
                    {isEditingSummary ? '✓ Done' : '✎ Edit summary'}
                  </button>
                </div>

                {isEditingSummary ? (
                  <div className="space-y-1">
                    <textarea
                      rows={2}
                      value={customSummary}
                      onChange={(e) => setCustomSummary(e.target.value)}
                      placeholder="Type your own summary..."
                      maxLength={120}
                      className="w-full text-xs p-2.5 border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                    />
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>Brief note for reviewing officers</span>
                      <span>{customSummary.length}/120</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-l-2 border-[#1a5c38] pl-2.5 py-0.5">
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      "{customSummary || aiResult.summary}"
                    </p>
                  </div>
                )}
                <p className="text-[10px] text-gray-400">
                  Officers review this summary first. You can edit it if you want to emphasize specific details.
                </p>
              </div>

              {/* Duplicate analysis card */}
              {(aiResult.is_duplicate_risk || dupEval.hasDuplicate) && (
                <div>
                  {dupEval.isStaleAndUnresolved ? (
                    <div className="bg-amber-50/95 border border-amber-300 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                            Prolonged Grievance Resubmission Allowed (Priority Escalated)
                          </h4>
                          <p className="text-xs text-amber-900 leading-relaxed">
                            An existing grievance (<span className="font-mono font-semibold">{dupEval.candidate?.reference_id}</span>: &ldquo;{dupEval.candidate?.subject}&rdquo;) was filed on <strong>{dupEval.formattedDate}</strong> ({dupEval.daysAgo} days ago) and is still <strong>{dupEval.candidate?.status}</strong>.
                          </p>
                          <p className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 inline-block px-2.5 py-1 rounded-md border border-emerald-200 mt-1">
                            ⚡ Since this issue has remained unresolved beyond normal service timelines, you may resubmit your grievance with <strong>HIGH priority</strong> for expedited CMO review.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : dupEval.blockSubmission ? (
                    <div className="bg-rose-50/95 border border-rose-300 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                            Active Grievance Already Filed — Submission Restricted
                          </h4>
                          <p className="text-xs text-rose-800 leading-relaxed">
                            A matching grievance (<span className="font-mono font-semibold">{dupEval.candidate?.reference_id}</span>: &ldquo;{dupEval.candidate?.subject}&rdquo;) was already submitted on <strong>{dupEval.formattedDate}</strong> ({dupEval.daysAgo === 0 ? 'today' : `${dupEval.daysAgo} days ago`}) and is currently <strong>{dupEval.candidate?.status}</strong>.
                          </p>
                          <p className="text-xs text-rose-700">
                            Please verify the date and status of the already submitted grievance. To prevent duplicate administrative queues, re-submissions are restricted while the recent grievance is actively being processed.
                          </p>
                          <div className="pt-1.5 flex items-center gap-2">
                            <Link
                              to={`/track?ref=${dupEval.candidate?.reference_id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                            >
                              Verify & Track Grievance {dupEval.candidate?.reference_id}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Potential Duplicate Grievance Alert
                      </div>
                      <p className="text-xs text-rose-700">
                        A similar grievance may already exist in this district.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Re-apply action */}
              <button
                type="button"
                onClick={applyAISuggestions}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1a5c38]" />
                Re-apply AI Suggestions to Form Below
              </button>
            </div>
          )}
        </div>

        {/* Verification, Editing & Final Submission */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900">
                  Verify & Submit Grievance
                </h3>
                {districtValue && (
                  <span className="text-xs font-semibold text-[#1a5c38] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    District: {districtValue}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review the columns below. You can edit any value before sending to CMO.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit((data) => {
              if (dupEval.blockSubmission) {
                toast.error(
                  `Submission locked: Active duplicate was already filed on ${dupEval.formattedDate}. Please verify the existing grievance.`
                );
                return;
              }
              if (!priorityValue) {
                toast.error(
                  'Please click "Analyze with AI" above to automatically assess and set the grievance priority.'
                );
                return;
              }
              submitMutation.mutate({
                ...data,
                priority: priorityValue,
              });
            })}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  value={categoryValue || ''}
                  onChange={(e) => setValue('category', e.target.value, { shouldValidate: true })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38] text-sm"
                >
                  <option value="">Select Category</option>
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
                  Priority *
                </label>

                {/* Priority Field (Set solely by AI) */}
                <input
                  type="hidden"
                  {...register('priority', {
                    required: 'Priority must be evaluated by the AI assistant before submission',
                  })}
                  value={priorityValue || ''}
                />
                <input
                  type="text"
                  readOnly
                  disabled
                  value={
                    priorityValue
                      ? `${priorityValue} Priority`
                      : 'Pending AI Analysis...'
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 text-sm font-semibold cursor-not-allowed select-none"
                />

                {/* Clear Explanatory Notice Near the Field */}
                <div className="mt-2 rounded-lg border border-emerald-200/90 bg-emerald-50/70 p-2.5 text-xs text-emerald-950 space-y-1 shadow-2xs">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 text-[#1a5c38] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1a5c38]">
                        Priority is set only by AI:
                      </span>
                      <p className="text-[11px] text-emerald-900 mt-0.5 leading-relaxed">
                        {priorityValue ? (
                          <>
                            Objectively evaluated as <strong className="font-bold">{priorityValue}</strong> by the AI Assistant based on public safety impact and urgency. Manual alteration is disabled to prevent priority abuse and guarantee fair triage.
                          </>
                        ) : (
                          <>
                            Manual priority selection is disabled. Please click <strong className="text-[#1a5c38] font-bold">&quot;Analyze with AI&quot;</strong> in Step 1 to automatically evaluate and set the priority.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {errors.priority && (
                  <p className="text-xs text-red-600 mt-1 font-medium">{errors.priority.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject / Title *
              </label>
              <input
                type="text"
                {...register('subject', {
                  required: 'Subject is required',
                  minLength: { value: 5, message: 'Subject should be at least 5 characters' },
                })}
                placeholder="Brief title of your grievance (auto-filled by AI)"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38] text-sm"
              />
              {errors.subject && (
                <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p>
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
              disabled={submitMutation.isPending || dupEval.blockSubmission}
              className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-base transition-colors shadow-sm ${
                dupEval.blockSubmission
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                  : dupEval.isStaleAndUnresolved
                  ? 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer'
                  : 'bg-[#1a5c38] hover:bg-[#2d7a52] text-white cursor-pointer'
              }`}
            >
              {dupEval.blockSubmission ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <span>Submission Locked — Recent Duplicate Exists</span>
                </>
              ) : dupEval.isStaleAndUnresolved ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>{submitMutation.isPending ? 'Submitting...' : 'Resubmit Grievance with High Priority'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{submitMutation.isPending ? 'Submitting Grievance...' : 'Submit Grievance to CMO'}</span>
                </>
              )}
            </button>
          </form>
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
