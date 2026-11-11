export interface Department {
  id: string;
  name: string;
  description: string;
  code: string;
  created_at?: string;
}

export interface GrievanceHistoryItem {
  id: string;
  grievance_id?: string;
  status: string;
  remarks?: string | null;
  changed_by_id?: string;
  changed_by?: {
    name: string;
    role?: string;
  } | null;
  changed_at: string;
}

export interface AttachmentItem {
  id: string;
  grievance_id?: string;
  url: string;
  filename: string;
  file_type: string;
  created_at?: string;
}

export interface DepartmentAssignmentItem {
  id: string;
  department_id: string;
  department?: Department | null;
  assigned_by?: { name: string } | null;
  assigned_at: string;
  action_report?: string | null;
  resolution_details?: string | null;
}

export interface CitizenFeedbackItem {
  id: string;
  grievance_id: string;
  rating: number;
  comment?: string | null;
  submitted_at: string;
}

export interface Grievance {
  id: string;
  reference_id: string;
  citizen_id: string;
  citizen?: {
    name: string;
    email?: string;
    mobile?: string;
  } | null;
  district: string;
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | string;
  assigned_dept_id?: string | null;
  assigned_dept?: {
    id?: string;
    name: string;
    description?: string;
  } | null;
  ai_summary?: string | null;
  ai_category?: string | null;
  ai_priority?: string | null;
  ai_department?: string | null;
  is_duplicate_risk?: boolean;
  is_escalated?: boolean;
  escalated_at?: string | null;
  cmo_remarks?: string | null;
  created_at: string;
  updated_at?: string;
  history?: GrievanceHistoryItem[];
  attachments?: AttachmentItem[];
  assignments?: DepartmentAssignmentItem[];
  feedback?: CitizenFeedbackItem | null;
}

export interface DuplicateCandidate {
  reference_id: string;
  subject: string;
  status: string;
}

export interface AIAnalysisResult {
  department: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  is_duplicate_risk: boolean;
  duplicate_candidates?: DuplicateCandidate[];
  model_used?: string;
  is_fallback?: boolean;
  fallback_reason?: string;
}

export interface PublicStats {
  total: number;
  resolved: number;
  pending: number;
  departments_count: number;
}

export interface CMOStats {
  total: number;
  pending: number;
  resolved: number;
  overdue: number;
  escalated?: number;
  by_status?: Array<{ status: string; count: number }>;
  byStatus?: Array<{ status: string; _count?: { status: number }; count?: number }>;
  by_district?: Array<{ district: string; count: number }>;
  byDistrict?: Array<{ district: string; _count?: { district: number }; count?: number }>;
  by_department?: Array<{
    department?: string;
    department_name?: string;
    name?: string;
    department_id?: string;
    count: number;
  }>;
  byDepartment?: Array<{
    department?: string;
    department_name?: string;
    assigned_dept_id?: string;
    _count?: { assigned_dept_id: number };
    count?: number;
  }>;
}
