import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building2,
  MapPin,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import { cmoSidebarLinks } from '../../lib/sidebarLinks';
import type { CMOStats, Grievance } from '../../types';

// Register Chart.js modules
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const STATUS_PALETTE: Record<string, { bg: string; border: string; label: string }> = {
  SUBMITTED: { bg: '#3b82f6', border: '#2563eb', label: 'Submitted' },
  UNDER_REVIEW: { bg: '#f59e0b', border: '#d97706', label: 'Under Review' },
  IN_PROGRESS: { bg: '#8b5cf6', border: '#7c3aed', label: 'In Progress' },
  RESOLVED: { bg: '#10b981', border: '#059669', label: 'Resolved' },
  REOPENED: { bg: '#ef4444', border: '#dc2626', label: 'Reopened' },
};

export default function CMODashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<CMOStats>({
    queryKey: ['cmo-stats'],
    queryFn: async () => {
      const res = await api.get('/api/cmo/stats');
      return res.data?.data ?? res.data;
    },
  });

  const { data: recentEscalated } = useQuery<{ grievances: Grievance[] }>({
    queryKey: ['cmo-recent-escalated'],
    queryFn: async () => {
      const res = await api.get('/api/cmo/grievances', {
        params: { priority: 'HIGH', limit: 5 },
      });
      return res.data?.data ?? res.data;
    },
  });

  // 1. Doughnut Chart Data (Grievances by Status)
  const doughnutData = useMemo(() => {
    const raw = stats?.by_status || [];
    const labels = raw.map(
      (item) => STATUS_PALETTE[item.status]?.label || item.status.replace(/_/g, ' ')
    );
    const data = raw.map((item) => item.count);
    const backgroundColor = raw.map(
      (item) => STATUS_PALETTE[item.status]?.bg || '#6b7280'
    );
    const borderColor = raw.map(
      (item) => STATUS_PALETTE[item.status]?.border || '#4b5563'
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor,
          borderWidth: 2,
          hoverOffset: 8,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [stats]);

  // 2. Bar Chart Data (Top 10 Districts)
  const districtBarData = useMemo(() => {
    const raw = (stats?.by_district || []).slice(0, 10);
    const labels = raw.map((d) => d.district);
    const data = raw.map((d) => d.count);

    return {
      labels,
      datasets: [
        {
          label: 'Grievance Volume',
          data,
          backgroundColor: 'rgba(26, 92, 56, 0.85)',
          borderColor: '#1a5c38',
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: '#c9a227',
          hoverBorderColor: '#967615',
        },
      ],
    };
  }, [stats]);

  // 3. Horizontal Bar Chart Data (Top Departments Workload)
  const departmentBarData = useMemo(() => {
    const raw = (stats?.by_department || []).slice(0, 8);
    const labels = raw.map(
      (d) => d.department || d.department_name || d.name || 'Department'
    );
    const data = raw.map((d) => d.count);

    return {
      labels,
      datasets: [
        {
          label: 'Assigned Cases',
          data,
          backgroundColor: 'rgba(201, 162, 39, 0.85)',
          borderColor: '#967615',
          borderWidth: 1.5,
          borderRadius: 6,
          hoverBackgroundColor: '#1a5c38',
          hoverBorderColor: '#0f3d25',
        },
      ],
    };
  }, [stats]);

  return (
    <DashboardLayout
      title="Executive Overview"
      subtitle="Statewide grievance analytics, department workload, and SLA performance"
      links={cmoSidebarLinks}
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        {statsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: 'Total Grievances',
                value: stats?.total ?? 0,
                icon: FileText,
                color: 'text-[#1a5c38] bg-green-50 border-green-200',
                detail: 'State-wide cumulative',
              },
              {
                label: 'Pending Resolution',
                value: stats?.pending ?? 0,
                icon: Clock,
                color: 'text-amber-700 bg-amber-50 border-amber-200',
                detail: 'Active in workflow',
              },
              {
                label: 'Successfully Resolved',
                value: stats?.resolved ?? 0,
                icon: CheckCircle2,
                color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                detail: `${stats?.total ? Math.round(((stats?.resolved ?? 0) / stats.total) * 100) : 0}% resolution rate`,
              },
              {
                label: 'Overdue (>7 Days)',
                value: stats?.overdue ?? 0,
                icon: AlertOctagon,
                color: 'text-orange-700 bg-orange-50 border-orange-200',
                detail: 'Requires expedited ATR',
              },
              {
                label: 'Escalated Cases',
                value: stats?.escalated ?? 0,
                icon: AlertTriangle,
                color: 'text-rose-700 bg-rose-50 border-rose-200',
                detail: 'Flagged by CMO for urgent action',
              },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {kpi.label}
                    </span>
                    <div className={`p-2 rounded-lg border ${kpi.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
                    {kpi.value}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 font-medium">{kpi.detail}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Nav Banner to Grievance Management */}
        <div className="bg-gradient-to-r from-[#1a5c38] to-[#0f3d25] rounded-xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#f4d068]" />
              <span>Grievance Management & Assignment Queue</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-2xl">
              Inspect citizen complaints, filter by district or category, reassign departments, and escalate stalled resolutions.
            </p>
          </div>
          <Link
            to="/cmo/manage"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#c9a227] hover:bg-[#e5c060] text-emerald-950 transition-colors shrink-0 shadow-sm"
          >
            <span>Open Grievance Management</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interactive Charts Row 1: Status Distribution & Top Districts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Status Doughnut Chart */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-[#1a5c38]" />
                <h3 className="font-bold text-gray-900 text-base">Status Breakdown</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Live Data
              </span>
            </div>

            <div className="relative flex-1 min-h-[260px] flex items-center justify-center">
              {stats?.by_status && stats.by_status.length > 0 ? (
                <>
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 14,
                            font: { size: 11, weight: 'bold' },
                          },
                        },
                        tooltip: {
                          backgroundColor: '#0f3d25',
                          titleColor: '#ffffff',
                          bodyColor: '#e5e7eb',
                          padding: 10,
                          cornerRadius: 8,
                        },
                      },
                      cutout: '68%',
                    }}
                  />
                  {/* Center Metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-2xl font-black text-gray-900 leading-none">
                      {stats.total ?? 0}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">
                      Cases
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-400">No status metrics available</div>
              )}
            </div>
          </div>

          {/* Top Districts Bar Chart */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1a5c38]" />
                <h3 className="font-bold text-gray-900 text-base">
                  Top Districts by Grievance Volume
                </h3>
              </div>
              <span className="text-xs font-medium text-gray-500">Top 10</span>
            </div>

            <div className="flex-1 min-h-[260px]">
              {stats?.by_district && stats.by_district.length > 0 ? (
                <Bar
                  data={districtBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#0f3d25',
                        titleColor: '#ffffff',
                        bodyColor: '#f4d068',
                        padding: 10,
                        cornerRadius: 8,
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          font: { size: 10, weight: 'bold' },
                          color: '#4b5563',
                        },
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(229, 231, 235, 0.6)' },
                        ticks: {
                          stepSize: 1,
                          font: { size: 11 },
                          color: '#6b7280',
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No district metrics available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Charts Row 2: Department Workload & Urgent Escalations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Department Workload Horizontal Bar Chart */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#c9a227]" />
                <h3 className="font-bold text-gray-900 text-base">
                  Department Workload Distribution
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-medium">Assigned Cases</span>
            </div>

            <div className="min-h-[280px]">
              {stats?.by_department && stats.by_department.length > 0 ? (
                <Bar
                  data={departmentBarData}
                  options={{
                    indexAxis: 'y' as const,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#1a5c38',
                        padding: 10,
                        cornerRadius: 8,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(229, 231, 235, 0.6)' },
                        ticks: { stepSize: 1, font: { size: 10 } },
                      },
                      y: {
                        grid: { display: false },
                        ticks: { font: { size: 11, weight: 'bold' }, color: '#374151' },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400 py-12">
                  No department distribution data available
                </div>
              )}
            </div>
          </div>

          {/* Urgent CMO Attention Queue */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-gray-900 text-base">High Priority Queue</h3>
              </div>
              <Link
                to="/cmo/manage?priority=HIGH"
                className="text-xs text-[#1a5c38] font-semibold hover:underline"
              >
                View all
              </Link>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Complaints requiring high-level CMO monitoring or departmental intervention.
            </p>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {(recentEscalated?.grievances || []).length > 0 ? (
                (recentEscalated?.grievances || []).slice(0, 4).map((g) => (
                  <Link
                    key={g.id}
                    to={`/cmo/grievances/${g.id}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-900 group-hover:text-emerald-700">
                        {g.reference_id}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        HIGH
                      </span>
                    </div>
                    <div className="text-xs font-medium text-gray-800 line-clamp-1 mt-1">
                      {g.subject}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
                      <span>{g.district}</span>
                      <span>{g.assigned_dept?.name || 'Unassigned'}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  No critical complaints currently pending
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 mt-3">
              <Link
                to="/cmo/manage"
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#1a5c38] bg-green-50 hover:bg-green-100 py-2 rounded-lg transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Go to Full Management Table</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
