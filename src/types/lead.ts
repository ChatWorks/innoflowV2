export interface Lead {
  id: string;
  user_id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status: 'Nieuw' | 'Gekwalificeerd' | 'Voorstel' | 'Onderhandeling' | 'Gewonnen' | 'Verloren';
  estimated_budget?: number;
  estimated_value?: number;
  probability: number;
  expected_close_date?: string;
  source?: string;
  notes?: string;
  converted_to_project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  user_id: string;
  lead_id: string;
  activity_type: 'Telefoongesprek' | 'Email' | 'Meeting' | 'Notitie' | 'Status Update';
  title: string;
  description?: string;
  activity_date: string;
  created_at: string;
}

export const LEAD_STATUSES = [
  'Nieuw',
  'Gekwalificeerd', 
  'Voorstel',
  'Onderhandeling',
  'Gewonnen',
  'Verloren'
] as const;

export const ACTIVITY_TYPES = [
  'Telefoongesprek',
  'Email',
  'Meeting',
  'Notitie',
  'Status Update'
] as const;