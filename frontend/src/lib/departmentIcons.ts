import {
  Wrench,
  HeartPulse,
  GraduationCap,
  Droplets,
  Zap,
  Sprout,
  Bus,
  Landmark,
  Trees,
  HandHeart,
  Building2,
  type LucideIcon,
} from 'lucide-react';

export function getDepartmentIcon(code?: string, name?: string): LucideIcon {
  const c = (code || '').toUpperCase().trim();
  const n = (name || '').toLowerCase().trim();

  // Public Works / Roads / Infrastructure
  if (c === 'PWD' || n.includes('public works') || n.includes('road') || n.includes('bridge')) {
    return Wrench;
  }
  // Health Services / Medical / Hospitals
  if (c === 'HEALTH' || c === 'HLT' || n.includes('health') || n.includes('hospital') || n.includes('medical')) {
    return HeartPulse;
  }
  // Education / Schools / Colleges
  if (c === 'EDU' || n.includes('education') || n.includes('school') || n.includes('college')) {
    return GraduationCap;
  }
  // Water Resources / Irrigation / Water Supply
  if (c === 'WATER' || c === 'WRD' || n.includes('water') || n.includes('irrigation')) {
    return Droplets;
  }
  // Electricity / KSEB / Power
  if (c === 'KSEB' || n.includes('electric') || n.includes('power')) {
    return Zap;
  }
  // Agriculture / Farming / Crop
  if (c === 'AGRI' || c === 'AGR' || n.includes('agriculture') || n.includes('farm') || n.includes('crop')) {
    return Sprout;
  }
  // Transport / Motor Vehicles / Buses
  if (c === 'TRANS' || n.includes('transport') || n.includes('vehicle') || n.includes('bus')) {
    return Bus;
  }
  // Revenue / Land Records / Survey
  if (c === 'REV' || n.includes('revenue') || n.includes('land')) {
    return Landmark;
  }
  // Forest / Wildlife
  if (c === 'FOREST' || n.includes('forest') || n.includes('wildlife')) {
    return Trees;
  }
  // Social Welfare / Pensions
  if (c === 'WELFARE' || n.includes('social welfare') || n.includes('pension')) {
    return HandHeart;
  }

  return Building2;
}

