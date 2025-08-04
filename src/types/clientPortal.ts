export interface ClientPortal {
  id: string;
  project_id: string;
  portal_hash: string;
  is_active: boolean;
  password_hash?: string;
  expires_at?: string;
  show_team_names: boolean;
  created_at: string;
  updated_at: string;
  last_accessed?: string;
  access_count: number;
  user_id: string;
}

export interface ClientUpdate {
  id: string;
  project_id: string;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_visible_to_client: boolean;
  user_id: string;
}

export interface PortalAccessLog {
  id: string;
  portal_id: string;
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}

export interface PortalData {
  portal: {
    id: string;
    project_id: string;
    show_team_names: boolean;
    project_name: string;
    client: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status: string;
  };
}

export interface PortalProgress {
  overall_progress: number;
  phases: Array<{
    id: string;
    name: string;
    progress: number;
    status: 'Completed' | 'In Progress' | 'Pending';
    target_date?: string;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    progress: number;
    due_date?: string;
  }>;
  recent_updates: Array<{
    title: string;
    message: string;
    date: string;
  }>;
}