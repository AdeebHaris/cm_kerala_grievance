import { CheckCircle2, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDateTime } from '../../lib/constants';
import type { GrievanceHistoryItem } from '../../types';

interface GrievanceTimelineProps {
  history?: GrievanceHistoryItem[];
}

export default function GrievanceTimeline({ history = [] }: GrievanceTimelineProps) {
  if (!history.length) {
    return (
      <p className="text-sm text-gray-500 italic">No status history recorded yet.</p>
    );
  }

  return (
    <ol className="relative border-l-2 border-[#1a5c38]/30 ml-3 space-y-6">
      {history.map((item, idx) => {
        const isLast = idx === history.length - 1;
        return (
          <li key={item.id || idx} className="ml-6">
            <span
              className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${
                isLast
                  ? 'bg-[#1a5c38] text-white'
                  : 'bg-green-100 text-[#1a5c38]'
              }`}
            >
              {isLast ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
            </span>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={item.status} />
                <span className="text-xs text-gray-500">
                  {formatDateTime(item.changed_at)}
                </span>
              </div>
              {item.remarks && (
                <p className="text-sm text-gray-700 mt-2">{item.remarks}</p>
              )}
              {item.changed_by?.name && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Updated by: <span className="font-medium text-gray-700">{item.changed_by.name}</span>
                  {item.changed_by.role ? ` (${item.changed_by.role.replace('_', ' ')})` : ''}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
