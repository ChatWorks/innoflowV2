export interface ProjectMessage {
  id: string;
  project_id: string;
  sender_type: 'client' | 'team';
  sender_name?: string;
  sender_email?: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
}