export interface Notification {
  id: string;
  user_id: string;
  type: 'follow_up_reminder' | 'stale_lead' | 'general';
  title: string;
  message: string;
  lead_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}