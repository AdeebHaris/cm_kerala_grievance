interface PriorityBadgeProps {
  priority: string;
  showFullLabel?: boolean;
  className?: string;
}

export default function PriorityBadge({
  priority,
  showFullLabel = false,
  className = '',
}: PriorityBadgeProps) {
  const p = (priority || 'MEDIUM').toUpperCase();

  if (p === 'HIGH') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-rose-50/90 text-rose-700 border border-rose-200 shadow-xs ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
        </span>
        {showFullLabel ? 'High Priority' : 'HIGH'}
      </span>
    );
  }

  if (p === 'MEDIUM') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-amber-50/90 text-amber-800 border border-amber-200/90 shadow-xs ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200/70" />
        {showFullLabel ? 'Medium Priority' : 'MEDIUM'}
      </span>
    );
  }

  if (p === 'LOW') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-emerald-50/90 text-emerald-800 border border-emerald-200/90 shadow-xs ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200/70" />
        {showFullLabel ? 'Low Priority' : 'LOW'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-gray-400" />
      {priority}
    </span>
  );
}

