export type ProfileRole = 'rh' | 'employee';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Profile {
  user_id: string;
  role: ProfileRole;
  employee_id: string | null;
}

export interface Employee {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: string | null;
  manager_name: string | null;
  hire_date: string | null;
  internal_id: string | null;
  phone_work: string | null;
  phone_personal: string | null;
  is_active: boolean;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string | null;
  status: LeaveStatus;
  comment_rh: string | null;
  handled_by: string | null;
  created_at: string;
}

export function leaveStatusLabel(s: LeaveStatus): string {
  const m: Record<LeaveStatus, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Refusé',
    cancelled: 'Annulé',
  };
  return m[s];
}

export function leaveStatusBadgeClass(s: LeaveStatus): string {
  const m: Record<LeaveStatus, string> = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    cancelled: 'badge-cancelled',
  };
  return `badge ${m[s]}`;
}
