import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Eye, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import { getUser, type User } from '../../lib/auth';
import { formatDate } from '../../lib/constants';
import { officerSidebarLinks } from '../../lib/sidebarLinks';
import type { Grievance } from '../../types';

const filterTabs = [
  { label: 'All Assigned', value: '' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Reopened', value: 'REOPENED' },
  { label: 'Resolved', value: 'RESOLVED' },
];

export default function OfficerDashboard() {
  const [statusFilter, setStatusFilter] = useState('');
  const storedUser = getUser();

  const { data: me } = useQuery<User>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await api.get('/api/auth/me');
      return res.data?.data ?? res.data;
    },
  });

  const { data: grievances = [], isLoading, isError } = useQuery<Grievance[]>({
    queryKey: ['officer-grievances', statusFilter],
    queryFn: async () => {
      const res = await api.get('/api/officer/grievances', {
        params: statusFilter ? { status: statusFilter } : undefined,
      });
      return res.data?.data ?? res.data ?? [];
    },
  });

  const deptName = me?.department?.name || 'Assigned Department';

  return (
    <DashboardLayout
      title={`Officer Portal — ${me?.name || storedUser?.name || 'Officer'}`}
      subtitle={`Department: ${deptName}`}
      links={officerSidebarLinks}
    >
      <div className="space-y-6">
        {/* Department Banner */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#1a5c38] text-[#e5c060] flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-[#c9a227]">
                Department Queue
              </div>
              <div className="text-lg font-bold text-gray-900">{deptName}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing <strong className="text-gray-900">{grievances.length}</strong> grievance(s)
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === tab.value
                  ? 'bg-[#1a5c38] text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <div className="p-8 text-center text-red-600 text-sm">
              Failed to load assigned grievances.
            </div>
          ) : grievances.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">
              No grievances found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Ref ID</th>
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
                              title="Escalated to High Priority by Chief Minister's Office"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Escalated
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-900 font-medium max-w-xs truncate">
                        {g.subject}
                        {g.citizen?.name && (
                          <div className="text-xs text-gray-500 font-normal">
                            By: {g.citizen.name}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{g.district}</td>
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
                          to={`/officer/grievances/${g.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-[#1a5c38] text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> Investigate
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
