export type UserRole = 'supervisor' | 'engineer' | 'technician';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  updated_at: string;
}

export interface Deadline {
  id: string;
  report_id: string;
  due_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  created_at: string;
  updated_at: string;
  comments?: string[];
  tags?: string[];
  deadline?: Deadline;
  profiles?: Profile;
}