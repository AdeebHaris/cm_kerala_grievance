import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Tag,
  Calendar,
  Paperclip,
  MessageSquare,
  Star,
  RotateCcw,
  FileCheck2,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import GrievanceTimeline from '../../components/ui/GrievanceTimeline';
import api, { API_BASE_URL } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/constants';
import { citizenSidebarLinks } from '../../lib/sidebarLinks';
import type { Grievance } from '../../types';

export default function CitizenGrievanceDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const { data: grievance, isLoading, isError } = useQuery<Grievance>({
    queryKey: ['citizen-grievance', id],
    queryFn: async () => {
      const res = await api.get(`/api/grievances/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
  });

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/grievances/${id}/feedback`, {
        rating,
        comment,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Feedback submitted!');
      queryClient.invalidateQueries({ queryKey: ['citizen-grievance', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Failed to submit feedback');
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/grievances/${id}/reopen`, {
        reason: reopenReason,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Grievance reopened for further review.');
      setReopenOpen(false);
      setReopenReason('');
      queryClient.invalidateQueries({ queryKey: ['citizen-grievance', id] });
      queryClient.invalidateQueries({ queryKey: ['citizen-grievances'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Failed to reopen grievance');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/api/grievances/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Attachment uploaded');
      queryClient.invalidateQueries({ queryKey: ['citizen-grievance', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Attachment upload failed');
    },
  });

  return (
    <DashboardLayout
      title="Grievance Details"
      subtitle={grievance ? `Reference ID: ${grievance.reference_id}` : 'Inspect full status & reports'}
      links={citizenSidebarLinks}
    >
      <div className="space-y-6">
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a5c38] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError || !grievance ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
            Unable to load grievance details.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-green-50 text-[#1a5c38]">
                      {grievance.reference_id}
                    </span>
                    {grievance.is_escalated && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        <AlertTriangle className="w-3.5 h-3.5" /> Escalated
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">{grievance.subject}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={grievance.priority} />
                  <StatusBadge status={grievance.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-[#1a5c38]" />
                  <span>
                    <strong className="text-gray-800">District:</strong> {grievance.district}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Tag className="w-4 h-4 text-[#1a5c38]" />
                  <span>
                    <strong className="text-gray-800">Category:</strong> {grievance.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4 text-[#1a5c38]" />
                  <span>
                    <strong className="text-gray-800">Department:</strong>{' '}
                    {grievance.assigned_dept?.name || 'Pending Assignment'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-[#1a5c38]" />
                  <span>
                    <strong className="text-gray-800">Submitted:</strong> {formatDate(grievance.created_at)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Description
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                  {grievance.description}
                </p>
              </div>

              {grievance.cmo_remarks && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> CMO Remarks
                  </div>
                  <p className="text-sm text-amber-950 mt-1">{grievance.cmo_remarks}</p>
                </div>
              )}

              {/* Officer Action Reports */}
              {grievance.assignments &&
                grievance.assignments.some((a) => a.action_report || a.resolution_details) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#1a5c38] flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4" /> Department Investigation & Action Report
                    </div>
                    {grievance.assignments.map((assign) =>
                      assign.action_report || assign.resolution_details ? (
                        <div key={assign.id} className="text-sm space-y-1.5">
                          {assign.action_report && (
                            <p className="text-gray-800">
                              <strong>Action Taken:</strong> {assign.action_report}
                            </p>
                          )}
                          {assign.resolution_details && (
                            <p className="text-gray-800">
                              <strong>Resolution Details:</strong> {assign.resolution_details}
                            </p>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>
                )}

              {/* Attachments */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Attachments
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a5c38] cursor-pointer hover:underline">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadMutation.isPending ? 'Uploading...' : 'Add File'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMutation.mutate(file);
                      }}
                    />
                  </label>
                </div>
                {grievance.attachments && grievance.attachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {grievance.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={`${API_BASE_URL}${att.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-800"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {att.filename}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No files attached.</p>
                )}
              </div>

              {/* Reopen button when RESOLVED */}
              {grievance.status === 'RESOLVED' && (
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReopenOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Not Satisfied? Reopen Grievance
                  </button>
                </div>
              )}
            </div>

            {/* Feedback Section when RESOLVED */}
            {grievance.status === 'RESOLVED' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Citizen Feedback</h3>
                {grievance.feedback && (
                  <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                    <div className="font-semibold text-[#1a5c38]">
                      Submitted Rating: {grievance.feedback.rating} / 5 ★ (Updated{' '}
                      {formatDateTime(grievance.feedback.submitted_at)})
                    </div>
                    {grievance.feedback.comment && (
                      <p className="text-gray-700 mt-1">{grievance.feedback.comment}</p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Rate Resolution Quality
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= rating ? 'text-[#c9a227] fill-[#c9a227]' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-sm text-gray-600 ml-2">{rating} / 5</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback Comment (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share how well your grievance was handled..."
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={feedbackMutation.isPending}
                    onClick={() => feedbackMutation.mutate()}
                    className="px-5 py-2.5 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {feedbackMutation.isPending
                      ? 'Submitting...'
                      : grievance.feedback
                      ? 'Update Feedback'
                      : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Status History Timeline</h3>
              <GrievanceTimeline history={grievance.history} />
            </div>
          </div>
        )}
      </div>

      {/* Reopen Modal */}
      {reopenOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Reopen Grievance</h3>
            <p className="text-sm text-gray-600">
              Please provide the reason why this grievance needs further action or review.
            </p>
            <textarea
              rows={4}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Explain what remains unresolved..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReopenOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reopenMutation.isPending || reopenReason.trim().length < 5}
                onClick={() => reopenMutation.mutate()}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {reopenMutation.isPending ? 'Reopening...' : 'Confirm Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
