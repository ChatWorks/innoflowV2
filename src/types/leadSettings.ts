export interface LeadSettings {
  id: string;
  user_id: string;
  enable_stale_detector: boolean;
  stale_lead_days: number;
  enable_follow_up_reminders: boolean;
  notify_in_app: boolean;
  notify_by_email: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadSettingsUpdate {
  enable_stale_detector?: boolean;
  stale_lead_days?: number;
  enable_follow_up_reminders?: boolean;
  notify_in_app?: boolean;
  notify_by_email?: boolean;
}