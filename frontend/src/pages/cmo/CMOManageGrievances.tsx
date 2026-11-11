import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ArrowUpDown,
  AlertOctagon,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import {
  KERALA_DISTRICTS,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_PRIORITIES,
  GRIEVANCE_STATUSES,
  formatDate,
} from '../../lib/constants';
import { cmoSidebarLinks } from '../../lib/sidebarLinks';
import type { Grievance } from '../../types';

function isGrievanceOverdue(g: Grievance): boolean {
  if (g.status === 'RESOLVED') return false;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(g.created_at).getTime() > sevenDaysMs;
}

export default function CMOManageGrievances() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get('overdue') === 'true');
  const [sortField, setSortField] = useState<'created_at' | 'priority' | 'status' | 'district'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const { data: listPayload, isLoading: listLoading } = useQuery<{
    grievances: Grievance[];
    total: number;
  }>({
    queryKey: ['cmo-grievances-manage', district, category, priority, status],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: 1, limit: 100 };
      if (district) params.district = district;
      if (category) params.category = category;
      if (priority) params.priority = priority;
      if (status) params.status = status;
      const res = await api.get('/api/cmo/grievances', { params });
      return res.data?.data ?? res.data;
    },
  });

  const displayedGrievances = useMemo(() => {
    let rows = [...(listPayload?.grievances || [])];

    // Filter by search query (reference id, subject, or citizen name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(
        (g) =>
          g.reference_id.toLowerCase().includes(q) ||
          g.subject.toLowerCase().includes(q) ||
          (g.citizen?.name && g.citizen.name.toLowerCase().includes(q))
      );
    }

    // Filter by overdue
    if (overdueOnly) {
      rows = rows.filter(isGrievanceOverdue);
    }

    const priorityRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'priority') {
        cmp = (priorityRank[a.priority] || 0) - (priorityRank[b.priority] || 0);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === 'district') {
        cmp = a.district.localeCompare(b.district);
      }
      return sortAsc ? cmp : -cmp;
    });

    return rows;
  }, [listPayload, searchQuery, overdueOnly, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDistrict('');
    setCategory('');
    setPriority('');
    setStatus('');
    setOverdueOnly(false);
    setSearchParams({});
  };

  const dynamicCategories = useMemo(() => {
    const fromData = (listPayload?.grievances || []).map((g) => g.category).filter(Boolean);
    return Array.from(new Set([...GRIEVANCE_CATEGORIES, ...fromData]));
  }, [listPayload]);

  return (
    <DashboardLayout
      title="Grievance Management"
      subtitle="Comprehensive triage queue, departmental reassignment, and SLA escalation"
      links={cmoSidebarLinks}
    >
      <div className="space-y-6">
        {/* Filters and Search Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference ID, complaint title, or citizen..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38] focus:border-transparent"
              />
            </div>

            {/* Overdue Only Filter Toggle */}
            <button
              type="button"
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                overdueOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Overdue (&gt;7d) Only</span>
            </button>

            {/* Reset Button */}
            {(district || category || priority || status || overdueOnly || searchQuery) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0 border border-gray-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Dropdown Filters Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                District
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1a5c38] focus:outline-none bg-white"
              >
                <option value="">All Districts ({KERALA_DISTRICTS.length})</option>
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1a5c38] focus:outline-none bg-white"
              >
                <option value="">All Categories</option>
                {dynamicCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1a5c38] focus:outline-none bg-white"
              >
                <option value="">All Priorities</option>
                {GRIEVANCE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1a5c38] focus:outline-none bg-white"
              >
                <option value="">All Statuses</option>
                {GRIEVANCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div>
            Showing <strong className="text-gray-900">{displayedGrievances.length}</strong> of{' '}
            <strong className="text-gray-900">{listPayload?.total ?? 0}</strong> complaints
          </div>
          <div className="flex items-center gap-2">
            <span>Sort:</span>
            <button
              onClick={() => toggleSort('created_at')}
              className={`font-semibold cursor-pointer ${sortField === 'created_at' ? 'text-[#1a5c38] underline' : 'text-gray-500'}`}
            >
              Date {sortField === 'created_at' && (sortAsc ? '↑' : '↓')}
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => toggleSort('priority')}
              className={`font-semibold cursor-pointer ${sortField === 'priority' ? 'text-[#1a5c38] underline' : 'text-gray-500'}`}
            >
              Priority {sortField === 'priority' && (sortAsc ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* Grievances Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {listLoading ? (
            <div className="p-12">
              <LoadingSpinner />
            </div>
          ) : displayedGrievances.length === 0 ? (
            <div className="text-center py-16 px-4">
              <SlidersHorizontal className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No grievances found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                No records match the current filter criteria. Try adjusting or resetting your filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-3 py-1.5 text-xs font-semibold text-[#1a5c38] bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Ref ID</th>
                    <th className="py-3 px-4">Title & Citizen</th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => toggleSort('district')}
                        className="inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        <span>District</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => toggleSort('priority')}
                        className="inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        <span>Priority</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => toggleSort('status')}
                        className="inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => toggleSort('created_at')}
                        className="inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        <span>Created / SLA</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {displayedGrievances.map((g) => {
                    const overdue = isGrievanceOverdue(g);
                    return (
                      <tr
                        key={g.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          overdue ? 'bg-red-50/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                          {g.reference_id}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-gray-900 truncate">{g.subject}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {g.citizen?.name || 'Citizen'} • {g.category}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">{g.district}</td>
                        <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                          {g.assigned_dept?.name || (
                            <span className="text-amber-600 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <PriorityBadge priority={g.priority} />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={g.status} />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-gray-600">{formatDate(g.created_at)}</div>
                          {overdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100/70 px-1.5 py-0.5 rounded mt-0.5">
                              <AlertOctagon className="w-3 h-3" />
                              OVERDUE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                              <Clock className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/cmo/grievances/${g.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1a5c38] hover:text-white bg-green-50 hover:bg-[#1a5c38] border border-green-200 hover:border-transparent rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Triage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
