-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.generate_portal_hash()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(gen_random_uuid()::text || extract(epoch from now())::text, 'sha256'), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_portal_data(portal_hash_param TEXT)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  portal_record RECORD;
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
$$;