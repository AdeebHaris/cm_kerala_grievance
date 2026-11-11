import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FilePlus2, FileText, Clock, CheckCircle2, Eye, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import { getUser } from '../../lib/auth';
import { formatDate } from '../../lib/constants';
import { citizenSidebarLinks } from '../../lib/sidebarLinks';
import type { Grievance } from '../../types';

export default function CitizenDashboard() {
  const user = getUser();

  const { data: grievances = [], isLoading, isError } = useQuery<Grievance[]>({
    queryKey: ['citizen-grievances'],
    queryFn: async () => {
      const res = await api.get('/api/grievances/my');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const total = grievances.length;
  const resolved = grievances.filter((g) => g.status === 'RESOLVED').length;
  const pending = grievances.filter((g) => g.status !== 'RESOLVED').length;

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || 'Citizen'}`}
      subtitle="Manage your submitted grievances and track redressal progress"
      links={citizenSidebarLinks}
    >
      <div className="space-y-6">
        {/* Top Action + Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Grievance Summary</h2>
            <p className="text-sm text-gray-500">
              Submit a new complaint or click any case below to inspect full timeline & remarks.
            </p>
          </div>
          <Link
            to="/citizen/submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold text-sm transition-colors shrink-0"
          >
            <FilePlus2 className="w-4 h-4" />
            Submit New Grievance
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase">Total Submitted</div>
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{total}</div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-[#1a5c38]">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase">Pending / Active</div>
              <div className="text-3xl font-extrabold text-[#b38b16] mt-1">{pending}</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 text-[#c9a227]">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase">Resolved</div>
              <div className="text-3xl font-extrabold text-emerald-700 mt-1">{resolved}</div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Grievances Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">My Grievances</h3>
            <Link to="/citizen/track" className="text-xs font-semibold text-[#1a5c38] hover:underline">
              Track by Reference ID →
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <div className="p-8 text-center text-red-600 text-sm">
              Failed to load your grievances. Please try again.
            </div>
          ) : grievances.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-gray-500">You have not submitted any grievances yet.</p>
              <Link
                to="/citizen/submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a5c38] text-white text-sm font-semibold"
              >
                <FilePlus2 className="w-4 h-4" /> Submit Your First Grievance
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Reference ID</th>
                    <th className="px-5 py-3 text-left font-semibold">Subject</th>
                    <th className="px-5 py-3 text-left font-semibold">District</th>
                    <th className="px-5 py-3 text-left font-semibold">Priority</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grievances.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#1a5c38] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {g.reference_id}
                          {g.is_escalated && (
                            <span
                              title="Escalated"
                              className="inline-flex items-center text-red-600"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-900 font-medium max-w-xs truncate">
                        {g.subject}
                        {g.assigned_dept?.name && (
                          <div className="text-xs text-gray-500 font-normal">
                            Dept: {g.assigned_dept.name}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{g.district}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={g.priority} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                        {formatDate(g.created_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/citizen/grievances/${g.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-[#1a5c38] text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
