import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Tag,
  Calendar,
  User,
  Paperclip,
  MessageSquare,
  Upload,
  Save,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import GrievanceTimeline from '../../components/ui/GrievanceTimeline';
import api, { API_BASE_URL } from '../../lib/api';
import { formatDate } from '../../lib/constants';
import { officerSidebarLinks } from '../../lib/sidebarLinks';
import type { Grievance } from '../../types';

const OFFICER_STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'UNDER_REVIEW', label: 'Under Review (Submit to CMO)' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REOPENED', label: 'Reopened' },
];

export default function OfficerGrievanceDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionReport, setActionReport] = useState<string | null>(null);
  const [resolutionDetails, setResolutionDetails] = useState<string | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);

  const { data: grievance, isLoading, isError } = useQuery<Grievance>({
    queryKey: ['officer-grievance', id],
    queryFn: async () => {
      const res = await api.get(`/api/officer/grievances/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
  });

  const latestAssign = grievance?.assignments?.[grievance.assignments.length - 1];
  const effectiveStatus = status ?? grievance?.status ?? 'IN_PROGRESS';
  const effectiveActionReport = actionReport ?? latestAssign?.action_report ?? '';
  const effectiveResolutionDetails = resolutionDetails ?? latestAssign?.resolution_details ?? '';

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/officer/grievances/${id}/update`, {
        status: effectiveStatus,
        remarks: remarks || undefined,
        action_report: effectiveActionReport || undefined,
        resolution_details: effectiveResolutionDetails || undefined,
      });

      if (reportFile && id) {
        const formData = new FormData();
        formData.append('file', reportFile);
        await api.post(`/api/grievances/${id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      return res.data;
    },
    onSuccess: () => {
      toast.success('Grievance investigation updated successfully!');
      setRemarks('');
      setReportFile(null);
      queryClient.invalidateQueries({ queryKey: ['officer-grievance', id] });
      queryClient.invalidateQueries({ queryKey: ['officer-grievances'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Update failed');
    },
  });

  return (
    <DashboardLayout
      title="Officer Investigation"
      subtitle={grievance ? `Reference: ${grievance.reference_id}` : 'Review & file report'}
      links={officerSidebarLinks}
    >
      <div className="space-y-6">
        <Link
          to="/officer/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a5c38] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assigned Grievances
        </Link>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError || !grievance ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
            Grievance not found or not assigned to your department.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Complaint Info & Timeline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-green-50 text-[#1a5c38]">
                        {grievance.reference_id}
                      </span>
                      {grievance.is_escalated && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4 text-[#1a5c38]" />
                    <span>
                      <strong>Citizen:</strong> {grievance.citizen?.name || 'Citizen'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-[#1a5c38]" />
                    <span>
                      <strong>District:</strong> {grievance.district}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="w-4 h-4 text-[#1a5c38]" />
                    <span>
                      <strong>Category:</strong> {grievance.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-[#1a5c38]" />
                    <span>
                      <strong>Submitted:</strong> {formatDate(grievance.created_at)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500 mb-1">
                    Complaint Description
                  </div>
                  <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line">
                    {grievance.description}
                  </p>
                </div>

                {grievance.cmo_remarks && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-xs font-semibold uppercase text-amber-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> CMO Remarks
                    </div>
                    <p className="text-sm text-amber-950 mt-1">{grievance.cmo_remarks}</p>
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500 mb-2">
                    Attachments
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
                    <p className="text-xs text-gray-500">No attachments available.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Status Timeline</h3>
                <GrievanceTimeline history={grievance.history} />
              </div>
            </div>

            {/* Officer Action Form */}
            <div className="lg:col-span-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMutation.mutate();
                }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4"
              >
                <h3 className="text-lg font-bold text-gray-900">Officer Action & Report</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Status
                  </label>
                  <select
                    value={effectiveStatus}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                  >
                    {OFFICER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investigation Remarks
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Brief update note for timeline..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Taken Report
                  </label>
                  <textarea
                    rows={4}
                    value={effectiveActionReport}
                    onChange={(e) => setActionReport(e.target.value)}
                    placeholder="Detail site inspection, steps carried out, and field findings..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution Details
                  </label>
                  <textarea
                    rows={3}
                    value={effectiveResolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                    placeholder="Summary of final resolution or completion note..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Report Attachment (Optional)
                  </label>
                  <label className="flex items-center gap-2.5 px-3.5 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-4 h-4 text-[#1a5c38]" />
                    <span className="text-xs text-gray-600 truncate">
                      {reportFile ? reportFile.name : 'Attach photo or PDF report (max 5MB)'}
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
                        setReportFile(file);
                      }}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold text-sm disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {updateMutation.isPending ? 'Saving Update...' : 'Save Investigation Update'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
