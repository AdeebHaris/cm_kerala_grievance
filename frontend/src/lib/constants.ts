export const KERALAM_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
] as const;

export const KERALA_DISTRICTS = KERALAM_DISTRICTS;

export const GRIEVANCE_CATEGORIES = [
  'Roads & Infrastructure',
  'Water Supply & Sanitation',
  'Electricity & Power',
  'Healthcare & Hospitals',
  'Education & Schools',
  'Revenue & Land Records',
  'Agriculture & Irrigation',
  'Public Transport',
  'Forest & Environment',
  'Social Welfare & Pensions',
  'General',
] as const;

export const GRIEVANCE_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
  'REOPENED',
] as const;

export const GRIEVANCE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

function parseAsUTC(dateStr: string): Date {
  const trimmed = dateStr.trim();
  if (trimmed.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(trimmed)) {
    return new Date(trimmed);
  }
  if (trimmed.includes('T')) {
    return new Date(`${trimmed}Z`);
  }
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmed)) {
    return new Date(`${trimmed.replace(' ', 'T')}Z`);
  }
  return new Date(trimmed);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = parseAsUTC(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = parseAsUTC(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
