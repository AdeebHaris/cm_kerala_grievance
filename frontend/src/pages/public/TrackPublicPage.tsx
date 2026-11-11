import { useSearchParams } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import GrievanceTracker from '../../components/ui/GrievanceTracker';

export default function TrackPublicPage() {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  return (
    <PageLayout>
      <div className="bg-[#1a5c38] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Track Your Grievance</h1>
          <p className="mt-3 text-green-100 max-w-2xl">
            Enter your grievance Reference ID below to view real-time status, assigned department, and full update history.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <GrievanceTracker key={initialRef} initialRefId={initialRef} />
      </div>
    </PageLayout>
  );
}
