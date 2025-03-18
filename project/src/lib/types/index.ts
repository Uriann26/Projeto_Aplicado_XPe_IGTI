import { LatLng } from 'leaflet';

export type UserRole = 'supervisor' | 'engineer' | 'technician';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  updated_at: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
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

export interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  updated_at: string;
  activities: DailyReportActivity[];
  profiles?: Profile;
}

export interface DailyReportActivity {
  id: string;
  daily_report_id: string;
  road_id: string;
  activity_description: string;
  created_at: string;
  updated_at: string;
  road?: Road;
}

export interface ServiceOrder {
  id: string;
  number: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  roads: Road[];
}

export interface Road {
  id: string;
  service_order_id: string;
  name: string;
  length: number;
  width: number;
  paved_length: number;
  sidewalk_length: number;
  curb_length: number;
  coordinates: Coordinates[];
  pathologies: Pathology[];
  created_at: string;
  updated_at: string;
}

export interface Pathology {
  id: string;
  road_id: string;
  description: string;
  coordinates: Coordinates;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id?: string;
  user_id?: string;
  email_notifications: boolean;
  deadline_reminders: boolean;
  reminder_days_before: number;
  daily_digest: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationSchedule {
  id: string;
  notification_id: string;
  scheduled_for: string;
  sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  message: string;
  status?: number;
}