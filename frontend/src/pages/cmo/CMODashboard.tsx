import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
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
import type { CMOStats, Grievance } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: '#2563eb',
  UNDER_REVIEW: '#ca8a04',
  IN_PROGRESS: '#ea580c',
  RESOLVED: '#1a5c38',
  REOPENED: '#dc2626',
};

function isGrievanceOverdue(g: Grievance): boolean {
  if (g.status === 'RESOLVED') return false;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(g.created_at).getTime() > sevenDaysMs;
}

export default function CMODashboard() {
  const navigate = useNavigate();
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortField, setSortField] = useState<'created_at' | 'priority' | 'status' | 'district'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<CMOStats>({
    queryKey: ['cmo-stats'],
    queryFn: async () => {
      const res = await api.get('/api/cmo/stats');
      return res.data?.data ?? res.data;
    },
  });

  const { data: listPayload, isLoading: listLoading } = useQuery<{
    grievances: Grievance[];
    total: number;
  }>({
    queryKey: ['cmo-grievances', district, category, priority, status],
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

  const statusChartData = useMemo(() => {
    const raw = stats?.by_status || [];
    return raw.map((item) => ({
      name: item.status.replace(/_/g, ' '),
      rawStatus: item.status,
      value: item.count,
    }));
  }, [stats]);

  const districtChartData = useMemo(() => {
    return (stats?.by_district || []).slice(0, 10);
  }, [stats]);

  const departmentChartData = useMemo(() => {
    return (stats?.by_department || []).map((d) => ({
      department: d.department || d.department_name || d.name || 'Assigned',
      count: d.count,
    }));
  }, [stats]);

  const displayedGrievances = useMemo(() => {
    let rows = [...(listPayload?.grievances || [])];
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
  }, [listPayload, overdueOnly, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const dynamicCategories = useMemo(() => {
    const fromData = (listPayload?.grievances || []).map((g) => g.category).filter(Boolean);
    return Array.from(new Set([...GRIEVANCE_CATEGORIES, ...fromData]));
  }, [listPayload]);

  return (
    <DashboardLayout
      title="CMO Admin Dashboard"
      subtitle="Statewide grievance analytics, assignment control, and overdue escalation"
      links={cmoSidebarLinks}
    >
      <div className="space-y-6">
        {/* Stats Row */}
        {statsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: 'Total',
                value: stats?.total ?? 0,
                icon: FileText,
                color: 'text-[#1a5c38] bg-green-50',
              },
              {
                label: 'Pending',
                value: stats?.pending ?? 0,
                icon: Clock,
                color: 'text-[#b38b16] bg-amber-50',
              },
              {
                label: 'Resolved',
                value: stats?.resolved ?? 0,
                icon: CheckCircle2,
                color: 'text-emerald-700 bg-emerald-50',
              },
              {
                label: 'Overdue (>7d)',
                value: stats?.overdue ?? 0,
                icon: AlertOctagon,
                color: 'text-orange-700 bg-orange-50',
              },
              {
                label: 'Escalated',
                value: stats?.escalated ?? 0,
                icon: AlertTriangle,
                color: 'text-red-700 bg-red-50',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">{card.label}</div>
                    <div className="text-2xl font-extrabold text-gray-900 mt-1">{card.value}</div>
                  </div>
                  <div className={`p-2.5 rounded-lg ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Pie */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Status Distribution</h2>
            <div className="h-64">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={82}
                      label
                    >
                      {statusChartData.map((entry) => (
                        <Cell
                          key={entry.rawStatus}
                          fill={STATUS_COLORS[entry.rawStatus] || '#6b7280'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No status chart data available
                </div>
              )}
            </div>
          </div>

          {/* Top Districts Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Grievances by District (Top 10)</h2>
            <div className="h-64">
              {districtChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtChartData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="district"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1a5c38" radius={[4, 4, 0, 0]} name="Grievances" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No district chart data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Department Distribution Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Assigned Grievances by Department</h2>
          {departmentChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData} margin={{ bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#c9a227" radius={[4, 4, 0, 0]} name="Assigned Cases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No grievances assigned to departments yet.</p>
          )}
        </div>

        {/* Filter Bar + Grievances Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#1a5c38]" />
                All Grievances ({displayedGrievances.length})
              </h2>
              {(district || category || priority || status || overdueOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    setDistrict('');
                    setCategory('');
                    setPriority('');
                    setStatus('');
                    setOverdueOnly(false);
                  }}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="">All Districts</option>
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="">All Categories</option>
                {dynamicCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="">All Priorities</option>
                {GRIEVANCE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="">All Statuses</option>
                {GRIEVANCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer bg-gray-50">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  className="rounded text-[#1a5c38] focus:ring-[#1a5c38]"
                />
                <span className="font-medium text-gray-700">Overdue Only (&gt;7d)</span>
              </label>
            </div>
          </div>

          {listLoading ? (
            <LoadingSpinner />
          ) : displayedGrievances.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">
              No grievances match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Ref ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Citizen</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort('district')}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        District <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Category</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort('priority')}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        Priority <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort('status')}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        Status <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort('created_at')}
                        className="inline-flex items-center gap-1 hover:text-gray-900"
                      >
                        Date <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedGrievances.map((g) => {
                    const overdue = isGrievanceOverdue(g);
                    return (
                      <tr
                        key={g.id}
                        onClick={() => navigate(`/cmo/grievances/${g.id}`)}
                        className="hover:bg-green-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#1a5c38] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {g.reference_id}
                            {g.is_escalated && (
                              <span
                                title="Escalated"
                                className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-sans font-bold"
                              >
                                ESC
                              </span>
                            )}
                            {overdue && (
                              <span
                                title="Overdue (>7 days)"
                                className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-sans font-bold"
                              >
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{g.citizen?.name || 'Citizen'}</div>
                          <div className="text-xs text-gray-500 max-w-[180px] truncate">
                            {g.subject}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{g.district}</td>
                        <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{g.category}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <PriorityBadge priority={g.priority} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={g.status} />
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                          {formatDate(g.created_at)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="text-xs font-semibold text-[#1a5c38] hover:underline">
                            Manage →
                          </span>
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
