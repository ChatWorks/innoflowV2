export interface Project {
  id: string;
  name: string;
  client: string;
  description?: string;
  status: 'Nieuw' | 'In Progress' | 'Review' | 'Voltooid';
  progress: number;
  budget?: number;
  project_value?: number;
  total_hours?: number;
  hourly_rate?: number; // Added for contract value calculation
  sort_order?: number;
  is_highlighted?: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}


export interface TimeEntry {
  id: string;
  project_id: string;
  task_id?: string;
  deliverable_id?: string;
  description?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  duration_seconds?: number;
  is_active?: boolean;
  created_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date?: string;
  target_date?: string;
  declarable_hours?: number; // Declarable hours for client billing
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  project_id: string;
  name: string;
  target_date?: string;
  declarable_hours?: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  deliverable_id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  project_id: string;
  meeting_date: string; // ISO date string (YYYY-MM-DD)
  meeting_time?: string; // HH:MM:SS
  subject: string;
  description?: string;
  attendees?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}
