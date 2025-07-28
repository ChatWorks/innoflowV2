export interface Project {
  id: string;
  name: string;
  client: string;
  description?: string;
  status: 'Nieuw' | 'In Progress' | 'Review' | 'Voltooid';
  progress: number;
  budget?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  description?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  created_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  deliverable_id: string;
  title: string;
  description?: string;
  billable_hours: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}