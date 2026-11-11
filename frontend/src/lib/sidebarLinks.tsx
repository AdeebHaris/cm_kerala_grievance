import { LayoutDashboard, FilePlus2, Search } from 'lucide-react';
import type { SidebarLink } from '../components/layout/DashboardLayout';

export const citizenSidebarLinks: SidebarLink[] = [
  {
    label: 'Dashboard',
    to: '/citizen/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: 'Submit Grievance',
    to: '/citizen/submit',
    icon: <FilePlus2 className="w-4 h-4" />,
  },
  {
    label: 'Track Grievance',
    to: '/citizen/track',
    icon: <Search className="w-4 h-4" />,
  },
];

export const cmoSidebarLinks: SidebarLink[] = [
  {
    label: 'CMO Overview',
    to: '/cmo/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
];

export const officerSidebarLinks: SidebarLink[] = [
  {
    label: 'Assigned Grievances',
    to: '/officer/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
];
