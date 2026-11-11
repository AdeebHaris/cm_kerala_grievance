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
  RotateCcw,
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
  const districtValue = useWatch({ control, name: 'district' });
  const subjectValue = useWatch({ control, name: 'subject' });
  const categoryValue = useWatch({ control, name: 'category' });
  const priorityValue = useWatch({ control, name: 'priority' });

  const [customSummary, setCustomSummary] = useState<string>('');
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);

  const DRAFT_STORAGE_KEY = 'cm_kerala_grievance_draft';
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Restore draft from localStorage on mount (preserves input if user clicked back or refreshed)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.description || draft.subject || draft.district) {
          if (draft.district) setValue('district', draft.district, { shouldValidate: true });
          if (draft.description) setValue('description', draft.description, { shouldValidate: true });
          if (draft.subject) setValue('subject', draft.subject, { shouldValidate: true });
          if (draft.category) setValue('category', draft.category);
          if (draft.priority) setValue('priority', draft.priority);
          if (draft.customSummary) setCustomSummary(draft.customSummary);
          setHasDraft(true);
          setDraftSavedAt(draft.savedAt || 'recently');
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [setValue]);

  // Auto-save draft whenever fields change
  useEffect(() => {
    if (descriptionValue || subjectValue || districtValue) {
      try {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const payload = {
          district: districtValue || '',
          description: descriptionValue || '',
          subject: subjectValue || '',
          category: categoryValue || 'General',
          priority: priorityValue || 'MEDIUM',
          customSummary,
          savedAt: now,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        setHasDraft(true);
        setDraftSavedAt(now);
      } catch {
        // Ignore storage quota
      }
    }
  }, [descriptionValue, districtValue, subjectValue, categoryValue, priorityValue, customSummary]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    reset({
      district: '',
      category: 'General',
      subject: '',
      description: '',
      priority: 'MEDIUM',
    });
    setAiResult(null);
    setCustomSummary('');
    setSelectedFile(null);
    setHasDraft(false);
    setDraftSavedAt(null);
    toast.success('Form cleared');
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
      if (data.priority) {
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
      setHasDraft(false);
      setDraftSavedAt(null);
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

  const applyAISuggestions = () => {
    if (!aiResult) return;
    if (aiResult.category) {
      setValue('category', aiResult.category, { shouldValidate: true });
    }
    if (aiResult.priority) {
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
    ])
  );

  return (
    <DashboardLayout
      title="Submit a Grievance"
      subtitle="Tell us your issue in plain words — our AI Assistant will auto-route and pre-fill your form"
      links={citizenSidebarLinks}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Auto-save Draft Pill Banner */}
        {hasDraft && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 shadow-2xs">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Your grievance is drafted in this browser {draftSavedAt ? `(${draftSavedAt})` : ''} — safe if you navigate back or refresh.
            </span>
            <button
              type="button"
              onClick={handleClearDraft}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 cursor-pointer shadow-2xs transition-colors shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Clear fields
            </button>
          </div>
        )}

        {/* Step 1: AI Assistant & Natural Language Intake (Comes First) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1a5c38] to-[#2d7a52] text-[#e5c060] flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-[#e5c060]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">AI Grievance Assistant</h2>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-[#0f3d25] border border-emerald-200">
                    Step 1 · Smart Intake
                  </span>
                </div>
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-500">
                Provide as much detail as possible (location, landmark, severity).
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={aiMutation.isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#1a5c38] to-[#25784c] hover:from-[#14472c] hover:to-[#1a5c38] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#e5c060]" />
                {aiMutation.isPending ? 'Analyzing & Pre-filling Form...' : '✨ Analyze & Pre-fill Form with AI'}
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
                      AI Triage Recommendation
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
                  {aiResult.is_fallback ? 'Rule Fallback' : 'Groq AI · Auto-Triage'}
                </span>
              </div>

              {aiResult.is_fallback && aiResult.fallback_reason && (
                <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2.5 border border-amber-200/60">
                  Note: {aiResult.fallback_reason}
                </p>
              )}

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

              {/* Duplicate alert if present */}
              {(aiResult.is_duplicate_risk ||
                (aiResult.duplicate_candidates && aiResult.duplicate_candidates.length > 0)) && (
                <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Potential Duplicate Grievance Alert
                  </div>
                  {aiResult.duplicate_candidates && aiResult.duplicate_candidates.length > 0 ? (
                    <ul className="space-y-1 text-xs text-rose-700">
                      {aiResult.duplicate_candidates.map((dup) => (
                        <li key={dup.reference_id}>
                          <span className="font-mono font-semibold">{dup.reference_id}</span>:{' '}
                          {dup.subject} ({dup.status})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-rose-700">
                      A similar grievance may already exist in this district.
                    </p>
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

        {/* Step 2: Verification, Editing & Final Submission */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900">
                  Step 2 · Verify & Submit Grievance
                </h3>
                {districtValue && (
                  <span className="text-xs font-semibold text-[#1a5c38] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    District: {districtValue}
                  </span>
                )}
                {aiResult && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ✓ Pre-filled by AI
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review the columns below. You can edit any value before sending to CMO.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit((data) => submitMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38] text-sm"
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
                  Priority *
                </label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38] text-sm"
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
              disabled={submitMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-bold text-base transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? 'Submitting Grievance...' : 'Submit Grievance to CMO'}
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
