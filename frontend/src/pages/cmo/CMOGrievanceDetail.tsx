import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Tag,
  Calendar,
  Bot,
  Paperclip,
  AlertTriangle,
  FileCheck2,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import GrievanceTimeline from '../../components/ui/GrievanceTimeline';
import api, { API_BASE_URL } from '../../lib/api';
import { formatDate, GRIEVANCE_STATUSES } from '../../lib/constants';
import { cmoSidebarLinks } from '../../lib/sidebarLinks';
import type { Department, Grievance } from '../../types';

export default function CMOGrievanceDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [assignRemarks, setAssignRemarks] = useState('');
  const [cmoRemarks, setCmoRemarks] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<string | null>(null);
  const [statusRemarks, setStatusRemarks] = useState('');
  const [escalateRemarks, setEscalateRemarks] = useState('');

  const { data: grievance, isLoading, isError } = useQuery<Grievance>({
    queryKey: ['cmo-grievance', id],
    queryFn: async () => {
      const res = await api.get(`/api/cmo/grievances/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/api/departments');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const effectiveDeptId = selectedDeptId ?? grievance?.assigned_dept_id ?? '';
  const effectiveCmoRemarks = cmoRemarks ?? grievance?.cmo_remarks ?? '';
  const effectiveStatus = nextStatus ?? grievance?.status ?? 'UNDER_REVIEW';

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['cmo-grievance', id] });
    queryClient.invalidateQueries({ queryKey: ['cmo-grievances'] });
    queryClient.invalidateQueries({ queryKey: ['cmo-stats'] });
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/cmo/grievances/${id}/assign`, {
        department_id: effectiveDeptId,
        remarks: assignRemarks || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Assigned to department');
      setAssignRemarks('');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Assignment failed');
    },
  });

  const remarksMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/cmo/grievances/${id}/remarks`, {
        remarks: effectiveCmoRemarks,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('CMO remarks saved');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to save remarks');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/cmo/grievances/${id}/status`, {
        status: effectiveStatus,
        remarks: statusRemarks || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Status updated to ${effectiveStatus}`);
      setStatusRemarks('');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/cmo/grievances/${id}/escalate`, {
        remarks: escalateRemarks || 'Escalated by CMO due to delay',
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Grievance escalated to HIGH priority!');
      setEscalateRemarks('');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Escalation failed');
    },
  });

  return (
    <DashboardLayout
      title="CMO Grievance Review"
      subtitle={grievance ? `Reference: ${grievance.reference_id}` : 'Inspect & assign'}
      links={cmoSidebarLinks}
    >
      <div className="space-y-6">
        <Link
          to="/cmo/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a5c38] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to CMO Dashboard
        </Link>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError || !grievance ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
            Grievance not found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Info + Timeline Column */}
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

                {/* Citizen Info */}
                {grievance.citizen && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4 text-[#1a5c38]" />
                      <span className="font-semibold">{grievance.citizen.name}</span>
                    </div>
                    {grievance.citizen.email && (
                      <div className="flex items-center gap-2 text-gray-600 truncate">
                        <Mail className="w-4 h-4 text-[#1a5c38] shrink-0" />
                        <span className="truncate">{grievance.citizen.email}</span>
                      </div>
                    )}
                    {grievance.citizen.mobile && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-[#1a5c38]" />
                        <span>{grievance.citizen.mobile}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
                    <Building2 className="w-4 h-4 text-[#1a5c38]" />
                    <span>
                      <strong>Assigned Dept:</strong>{' '}
                      {grievance.assigned_dept?.name || 'Not Assigned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-[#1a5c38]" />
                    <span>
                      <strong>Created:</strong> {formatDate(grievance.created_at)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500 mb-1">
                    Full Description
                  </div>
                  <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line">
                    {grievance.description}
                  </p>
                </div>

                {/* AI Analysis Metadata */}
                {(grievance.ai_summary || grievance.ai_department || grievance.ai_category) && (
                  <div className="rounded-xl border border-[#c9a227] bg-amber-50/70 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-[#9a7813] flex items-center gap-1.5">
                        <Bot className="w-4 h-4" /> AI Triage Assessment
                      </span>
                      {grievance.is_duplicate_risk && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                          Duplicate Risk Flagged
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-700">
                      <div>
                        <strong>Suggested Dept:</strong> {grievance.ai_department || '—'}
                      </div>
                      <div>
                        <strong>Suggested Category:</strong> {grievance.ai_category || '—'}
                      </div>
                      <div>
                        <strong>Suggested Priority:</strong> {grievance.ai_priority || '—'}
                      </div>
                    </div>
                    {grievance.ai_summary && (
                      <p className="text-xs text-gray-800 pt-1 border-t border-amber-200/60">
                        <strong>Summary:</strong> {grievance.ai_summary}
                      </p>
                    )}
                  </div>
                )}

                {/* Officer Reports */}
                {grievance.assignments &&
                  grievance.assignments.some((a) => a.action_report || a.resolution_details) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                      <div className="text-xs font-bold uppercase text-[#1a5c38] flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4" /> Department Officer Reports
                      </div>
                      {grievance.assignments.map((a) =>
                        a.action_report || a.resolution_details ? (
                          <div key={a.id} className="text-sm space-y-1">
                            {a.action_report && (
                              <p>
                                <strong>Action Report:</strong> {a.action_report}
                              </p>
                            )}
                            {a.resolution_details && (
                              <p>
                                <strong>Resolution Details:</strong> {a.resolution_details}
                              </p>
                            )}
                          </div>
                        ) : null
                      )}
                    </div>
                  )}

                {/* Attachments */}
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
                    <p className="text-xs text-gray-500">No attachments uploaded.</p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Status Timeline</h3>
                <GrievanceTimeline history={grievance.history} />
              </div>
            </div>

            {/* Right CMO Actions Panel */}
            <div className="lg:col-span-5 space-y-5">
              {/* Assign to Department */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-gray-900">Assign / Forward to Department</h3>
                <select
                  value={effectiveDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={assignRemarks}
                  onChange={(e) => setAssignRemarks(e.target.value)}
                  placeholder="Forwarding remarks (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  disabled={!effectiveDeptId || assignMutation.isPending}
                  onClick={() => assignMutation.mutate()}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign Department'}
                </button>
              </div>

              {/* Add CMO Remarks */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-gray-900">CMO Remarks</h3>
                <textarea
                  rows={3}
                  value={effectiveCmoRemarks}
                  onChange={(e) => setCmoRemarks(e.target.value)}
                  placeholder="Enter official CMO instructions or remarks..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  disabled={!effectiveCmoRemarks.trim() || remarksMutation.isPending}
                  onClick={() => remarksMutation.mutate()}
                  className="w-full py-2 px-4 rounded-lg bg-[#c9a227] hover:bg-[#e5c060] text-[#0f3d25] text-sm font-bold disabled:opacity-60"
                >
                  {remarksMutation.isPending ? 'Saving...' : 'Save CMO Remarks'}
                </button>
              </div>

              {/* Update Status */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-gray-900">Update Status</h3>
                <select
                  value={effectiveStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  {GRIEVANCE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Status change remarks (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate()}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {statusMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
              </div>

              {/* Escalate Delayed Grievance */}
              <div className="bg-red-50 rounded-xl border border-red-200 p-5 space-y-3">
                <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Escalate Delayed Grievance
                </div>
                <p className="text-xs text-red-700">
                  Escalating sets priority to HIGH, marks the case as escalated, and adds an escalation entry to the history timeline.
                </p>
                <input
                  type="text"
                  value={escalateRemarks}
                  onChange={(e) => setEscalateRemarks(e.target.value)}
                  placeholder="Reason for escalation..."
                  className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg bg-white"
                />
                <button
                  type="button"
                  disabled={escalateMutation.isPending}
                  onClick={() => escalateMutation.mutate()}
                  className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {escalateMutation.isPending
                    ? 'Escalating...'
                    : grievance.is_escalated
                    ? 'Re-log Escalation'
                    : 'Escalate to HIGH Priority'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
