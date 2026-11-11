import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import type { Department } from '../../types';

export default function DepartmentsPage() {
  const [search, setSearch] = useState('');

  const { data: departments = [], isLoading, isError } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/api/departments');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout>
      <div className="bg-[#1a5c38] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Government Departments of Keralam</h1>
          <p className="mt-3 text-green-100 max-w-2xl">
            Browse participating government departments responsible for investigating and resolving citizen grievances.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 max-w-md relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments by name or code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
          />
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
            Unable to load departments right now. Please ensure the backend API is running.
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            No departments matched "{search}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-[#1a5c38]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-11 h-11 rounded-lg bg-green-50 text-[#1a5c38] flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c9a227]/15 text-[#9a7813]">
                      {dept.code}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{dept.name}</h2>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{dept.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
