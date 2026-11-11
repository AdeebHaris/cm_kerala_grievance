import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Building2, MapPin, Tag, Calendar, Paperclip, Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { API_BASE_URL } from '../../lib/api';
import { formatDate } from '../../lib/constants';
import { getUser } from '../../lib/auth';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import LoadingSpinner from './LoadingSpinner';
import GrievanceTimeline from './GrievanceTimeline';
import type { Grievance } from '../../types';

interface GrievanceTrackerProps {
  initialRefId?: string;
  allowFeedback?: boolean;
  quickRefs?: Array<{ reference_id: string; subject: string }>;
}

export default function GrievanceTracker({
  initialRefId = '',
  allowFeedback = false,
  quickRefs = [],
}: GrievanceTrackerProps) {
  const [inputRef, setInputRef] = useState(initialRefId);
  const [searchRef, setSearchRef] = useState(initialRefId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  const user = getUser();

  const {
    data: grievance,
    isLoading,
    isError,
    error,
  } = useQuery<Grievance>({
    queryKey: ['track-grievance', searchRef],
    queryFn: async () => {
      const res = await api.get(`/api/grievances/track/${encodeURIComponent(searchRef.trim())}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!searchRef.trim(),
    retry: false,
  });

  const feedbackMutation = useMutation({
    mutationFn: async (grievanceId: string) => {
      const res = await api.post(`/api/grievances/${grievanceId}/feedback`, {
        rating,
        comment,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Feedback submitted. Thank you!');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['track-grievance', searchRef] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Could not submit feedback');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.trim()) {
      toast.error('Please enter a Reference ID');
      return;
    }
    setSearchRef(inputRef.trim());
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
              placeholder="Enter Reference ID (e.g. GRV-20261111-XXXXX)"
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold transition-colors shrink-0"
          >
            Track Status
          </button>
        </form>

        {quickRefs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">Your Recent Submissions:</div>
            <div className="flex flex-wrap gap-2">
              {quickRefs.slice(0, 6).map((item) => (
                <button
                  key={item.reference_id}
                  type="button"
                  onClick={() => {
                    setInputRef(item.reference_id);
                    setSearchRef(item.reference_id);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    searchRef === item.reference_id
                      ? 'bg-[#1a5c38] text-white border-[#1a5c38]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {item.reference_id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading && <LoadingSpinner />}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
          <div className="font-semibold">Grievance Not Found</div>
          <p className="text-sm mt-1">
            {(error as any)?.response?.data?.detail ||
              (error as any)?.response?.data?.message ||
              `No grievance found with Reference ID "${searchRef}". Please check the ID and try again.`}
          </p>
        </div>
      )}

      {grievance && !isLoading && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#c9a227]">
                  Reference ID: {grievance.reference_id}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{grievance.subject}</h2>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={grievance.priority} />
                <StatusBadge status={grievance.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 text-sm">
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

            <div className="mt-2 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Description
              </div>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {grievance.description}
              </p>
            </div>

            {grievance.cmo_remarks && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> CMO Remarks
                </div>
                <p className="text-sm text-amber-950 mt-1">{grievance.cmo_remarks}</p>
              </div>
            )}

            {grievance.attachments && grievance.attachments.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Attachments
                </div>
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
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Status Timeline</h3>
            <GrievanceTimeline history={grievance.history} />
          </div>

          {/* Citizen Feedback for Resolved Grievances */}
          {allowFeedback && user?.role === 'CITIZEN' && grievance.status === 'RESOLVED' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Citizen Satisfaction Feedback</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your grievance has been resolved. Please rate your experience with the redressal process.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? 'text-[#c9a227] fill-[#c9a227]'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-gray-600 ml-2">{rating} / 5</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your feedback..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                  />
                </div>

                <button
                  type="button"
                  disabled={feedbackMutation.isPending}
                  onClick={() => feedbackMutation.mutate(grievance.id)}
                  className="px-5 py-2.5 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {feedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
