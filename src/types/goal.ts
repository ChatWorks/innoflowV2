export type GoalType = 'numeric' | 'percentage' | 'boolean' | 'milestone';
export type GoalCategory = 'sales' | 'projects' | 'personal' | 'team' | 'financial';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'paused';

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string; // HH:MM format
  customMessage?: string;
  deadlineWarnings?: boolean;
  progressReminders?: boolean;
  motivationalBoosts?: boolean;
  [key: string]: any; // Allow for additional properties to match Json type
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal_type: GoalType;
  category: GoalCategory;
  status: GoalStatus;
  target_value?: number;
  current_value: number;
  target_unit?: string;
  deadline?: string; // ISO date string
  is_completed: boolean;
  completed_at?: string; // ISO date string
  notification_settings: NotificationSettings | any; // Can be Json from database
  created_at: string;
  updated_at: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  goal_type: GoalType;
  category: GoalCategory;
  target_value?: number;
  target_unit?: string;
  deadline?: string;
  notification_settings?: NotificationSettings;
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  current_value?: number;
  status?: GoalStatus;
  deadline?: string;
  notification_settings?: NotificationSettings;
}