-- Fix RLS policies voor client portal data toegang via portal hash
-- Phases moeten toegankelijk zijn via actieve portals
CREATE POLICY "Public can access phases via active portal" 
ON public.phases 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.client_portals cp 
    WHERE cp.project_id = phases.project_id 
    AND cp.is_active = true 
    AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Deliverables moeten toegankelijk zijn via actieve portals  
CREATE POLICY "Public can access deliverables via active portal" 
ON public.deliverables 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.client_portals cp 
    WHERE cp.project_id = deliverables.project_id 
    AND cp.is_active = true 
    AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Tasks moeten toegankelijk zijn via actieve portals
CREATE POLICY "Public can access tasks via active portal" 
ON public.tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.client_portals cp 
    JOIN public.deliverables d ON cp.project_id = d.project_id
    WHERE d.id = tasks.deliverable_id 
    AND cp.is_active = true 
    AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Projects moeten toegankelijk zijn via actieve portals
CREATE POLICY "Public can access projects via active portal" 
ON public.projects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.client_portals cp 
    WHERE cp.project_id = projects.id 
    AND cp.is_active = true 
    AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Verbeter de get_portal_data functie om ook project progress data op te halen
CREATE OR REPLACE FUNCTION public.get_portal_data(portal_hash_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  portal_record RECORD;
  project_record RECORD;
  phases_data json;
  deliverables_data json;
  tasks_data json;
  updates_data json;
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
  
  -- Get phases data
  SELECT json_agg(
    json_build_object(
      'id', ph.id,
      'name', ph.name,
      'status', ph.status,
      'target_date', ph.target_date,
      'created_at', ph.created_at,
      'updated_at', ph.updated_at
    )
  ) INTO phases_data
  FROM public.phases ph
  WHERE ph.project_id = portal_record.project_id
  ORDER BY ph.target_date;
  
  -- Get deliverables data
  SELECT json_agg(
    json_build_object(
      'id', d.id,
      'title', d.title,
      'status', d.status,
      'due_date', d.due_date,
      'target_date', d.target_date,
      'phase_id', d.phase_id,
      'description', d.description
    )
  ) INTO deliverables_data
  FROM public.deliverables d
  WHERE d.project_id = portal_record.project_id
  ORDER BY d.target_date;
  
  -- Get tasks data (for all deliverables in this project)
  SELECT json_agg(
    json_build_object(
      'id', t.id,
      'title', t.title,
      'completed', t.completed,
      'deliverable_id', t.deliverable_id,
      'assigned_to', t.assigned_to,
      'completed_at', t.completed_at
    )
  ) INTO tasks_data
  FROM public.tasks t
  JOIN public.deliverables d ON t.deliverable_id = d.id
  WHERE d.project_id = portal_record.project_id;
  
  -- Get client updates
  SELECT json_agg(
    json_build_object(
      'title', cu.title,
      'message', cu.message,
      'created_at', cu.created_at
    )
  ) INTO updates_data
  FROM public.client_updates cu
  WHERE cu.project_id = portal_record.project_id 
  AND cu.is_visible_to_client = true
  ORDER BY cu.created_at DESC
  LIMIT 5;
  
  -- Build result JSON with all data
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
    ),
    'phases', COALESCE(phases_data, '[]'::json),
    'deliverables', COALESCE(deliverables_data, '[]'::json), 
    'tasks', COALESCE(tasks_data, '[]'::json),
    'updates', COALESCE(updates_data, '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;