-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Nieuw' CHECK (status IN ('Nieuw', 'Gekwalificeerd', 'Voorstel', 'Onderhandeling', 'Gewonnen', 'Verloren')),
  estimated_budget NUMERIC,
  estimated_value NUMERIC,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  source TEXT,
  notes TEXT,
  converted_to_project_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to ensure user_id is set correctly
CREATE TRIGGER ensure_leads_user_id
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id();

-- Create activities table for lead activities
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('Telefoongesprek', 'Email', 'Meeting', 'Notitie', 'Status Update')),
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for activities
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities
CREATE POLICY "Users can view their own lead activities" 
ON public.lead_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lead activities" 
ON public.lead_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead activities" 
ON public.lead_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead activities" 
ON public.lead_activities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger to ensure user_id is set correctly for activities
CREATE TRIGGER ensure_lead_activities_user_id
BEFORE INSERT OR UPDATE ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id();