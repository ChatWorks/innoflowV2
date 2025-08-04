-- Client Portal Links
CREATE TABLE public.client_portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  portal_hash VARCHAR(64) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  password_hash VARCHAR(255) NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  show_team_names BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE NULL,
  access_count INTEGER NOT NULL DEFAULT 0,
  user_id UUID NULL
);

-- Portal Access Logs
CREATE TABLE public.portal_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID NOT NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client Updates (Manual messages for clients)
CREATE TABLE public.client_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_visible_to_client BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NULL
);

-- Enable Row Level Security
ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_portals
CREATE POLICY "Users can view own client portals" 
ON public.client_portals 
FOR SELECT 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

CREATE POLICY "Users can create own client portals" 
ON public.client_portals 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND (user_id IS NOT NULL));

CREATE POLICY "Users can update own client portals" 
ON public.client_portals 
FOR UPDATE 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

CREATE POLICY "Users can delete own client portals" 
ON public.client_portals 
FOR DELETE 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- RLS Policies for portal_access_logs
CREATE POLICY "Users can view logs for own portals" 
ON public.portal_access_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.client_portals 
  WHERE client_portals.id = portal_access_logs.portal_id 
  AND client_portals.user_id = auth.uid()
));

CREATE POLICY "System can insert access logs" 
ON public.portal_access_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for client_updates
CREATE POLICY "Users can view own client updates" 
ON public.client_updates 
FOR SELECT 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

CREATE POLICY "Users can create own client updates" 
ON public.client_updates 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND (user_id IS NOT NULL));

CREATE POLICY "Users can update own client updates" 
ON public.client_updates 
FOR UPDATE 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

CREATE POLICY "Users can delete own client updates" 
ON public.client_updates 
FOR DELETE 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Public access policy for portals (no auth required)
CREATE POLICY "Public can access active portals" 
ON public.client_portals 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Public access policy for client updates via portal
CREATE POLICY "Public can view client updates via portal" 
ON public.client_updates 
FOR SELECT 
USING (is_visible_to_client = true);

-- Triggers for updated_at
CREATE TRIGGER update_client_portals_updated_at
BEFORE UPDATE ON public.client_portals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_updates_updated_at
BEFORE UPDATE ON public.client_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers for user_id
CREATE TRIGGER ensure_client_portals_user_id
BEFORE INSERT OR UPDATE ON public.client_portals
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id();

CREATE TRIGGER ensure_client_updates_user_id
BEFORE INSERT OR UPDATE ON public.client_updates
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id();

-- Function to generate secure portal hash
CREATE OR REPLACE FUNCTION public.generate_portal_hash()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(gen_random_uuid()::text || extract(epoch from now())::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to get portal data for public access
CREATE OR REPLACE FUNCTION public.get_portal_data(portal_hash_param TEXT)
RETURNS JSON AS $$
DECLARE
  portal_record RECORD;
  project_record RECORD;
  result JSON;
BEGIN
  -- Get portal and project data
  SELECT cp.*, p.name as project_name, p.client, p.description, p.start_date, p.end_date, p.status
  INTO portal_record
  FROM public.client_portals cp
  JOIN public.projects p ON cp.project_id = p.id
  WHERE cp.portal_hash = portal_hash_param 
  AND cp.is_active = true 
  AND (cp.expires_at IS NULL OR cp.expires_at > now());
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Update access count and last accessed
  UPDATE public.client_portals 
  SET access_count = access_count + 1, last_accessed = now()
  WHERE portal_hash = portal_hash_param;
  
  -- Build result JSON
  SELECT json_build_object(
    'portal', json_build_object(
      'id', portal_record.id,
      'project_id', portal_record.project_id,
      'show_team_names', portal_record.show_team_names,
      'project_name', portal_record.project_name,
      'client', portal_record.client,
      'description', portal_record.description,
      'start_date', portal_record.start_date,
      'end_date', portal_record.end_date,
      'status', portal_record.status
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;