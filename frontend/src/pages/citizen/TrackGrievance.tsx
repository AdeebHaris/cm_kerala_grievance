import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GrievanceTracker from '../../components/ui/GrievanceTracker';
import api from '../../lib/api';
import { citizenSidebarLinks } from '../../lib/sidebarLinks';
import type { Grievance } from '../../types';

export default function TrackGrievance() {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const { data: myGrievances = [] } = useQuery<Grievance[]>({
    queryKey: ['citizen-grievances'],
    queryFn: async () => {
      const res = await api.get('/api/grievances/my');
      return res.data?.data ?? res.data ?? [];
    },
  });

  return (
    <DashboardLayout
      title="Track Grievance"
      subtitle="Search any Reference ID or pick one of your recent submissions"
      links={citizenSidebarLinks}
    >
      <GrievanceTracker
        key={initialRef}
        initialRefId={initialRef}
        allowFeedback={true}
        quickRefs={myGrievances.map((g) => ({
          reference_id: g.reference_id,
          subject: g.subject,
        }))}
      />
    </DashboardLayout>
  );
}
