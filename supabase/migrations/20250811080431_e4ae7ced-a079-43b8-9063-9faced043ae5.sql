-- CRITICAL SECURITY FIX: Phase 1 - Portal Access Restriction
-- Remove overly permissive public access policies and implement secure portal data access

-- Step 1: Drop existing overly permissive public policies
DROP POLICY IF EXISTS "Public can access active portals" ON public.client_portals;
DROP POLICY IF EXISTS "Anon can access projects via active portal" ON public.projects;
DROP POLICY IF EXISTS "Anon can access phases via active portal" ON public.phases;
DROP POLICY IF EXISTS "Anon can access deliverables via active portal" ON public.deliverables;
DROP POLICY IF EXISTS "Anon can access tasks via active portal" ON public.tasks;
DROP POLICY IF EXISTS "Anon can access meetings via active portal" ON public.project_meetings;

-- Step 2: Create secure portal validation function (does not expose sensitive data)
CREATE OR REPLACE FUNCTION public.validate_portal_access(portal_hash_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only validate if portal exists and is active, don't return sensitive data
  RETURN EXISTS (
    SELECT 1 
    FROM public.client_portals 
    WHERE portal_hash = portal_hash_param 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

-- Step 3: Create secure portal data function with proper filtering
CREATE OR REPLACE FUNCTION public.get_secure_portal_data(portal_hash_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  portal_record RECORD;
  phases_data json;
  deliverables_data json;
  tasks_data json;
  updates_data json;
  result JSON;
BEGIN
  -- First validate portal access
  IF NOT public.validate_portal_access(portal_hash_param) THEN
    RETURN NULL;
  END IF;

  -- Get portal and filtered project data (NO FINANCIAL INFO)
  SELECT cp.id, cp.project_id, cp.show_team_names, 
         p.name as project_name, p.client, p.description, 
         p.start_date, p.end_date, p.status
  INTO portal_record
  FROM public.client_portals cp
  JOIN public.projects p ON cp.project_id = p.id
  WHERE cp.portal_hash = portal_hash_param 
  AND cp.is_active = true 
  AND (cp.expires_at IS NULL OR cp.expires_at > now());
  
  -- Get filtered phases data (client-appropriate only)
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', ph.id,
      'name', ph.name,
      'status', ph.status,
      'target_date', ph.target_date
      -- Removed created_at, updated_at for privacy
    ) ORDER BY ph.target_date
  ), '[]'::json) INTO phases_data
  FROM public.phases ph
  WHERE ph.project_id = portal_record.project_id;
  
  -- Get filtered deliverables data (NO FINANCIAL OR INTERNAL DATA)
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', d.id,
      'title', d.title,
      'status', d.status,
      'due_date', d.due_date,
      'target_date', d.target_date,
      'description', d.description
      -- Removed: declarable_hours, manual_time_seconds, phase_id
    ) ORDER BY d.target_date
  ), '[]'::json) INTO deliverables_data
  FROM public.deliverables d
  WHERE d.project_id = portal_record.project_id;
  
  -- Get filtered tasks data (client-facing only)
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', t.id,
      'title', t.title,
      'completed', t.completed,
      'deliverable_id', t.deliverable_id
      -- Removed: assigned_to, completed_at, manual_time_seconds, description
      -- Only show if team names are enabled
    )
  ), '[]'::json) INTO tasks_data
  FROM public.tasks t
  JOIN public.deliverables d ON t.deliverable_id = d.id
  WHERE d.project_id = portal_record.project_id;
  
  -- Get client updates (already filtered to visible only)
  SELECT COALESCE(json_agg(
    json_build_object(
      'title', cu.title,
      'message', cu.message,
      'created_at', cu.created_at
    ) ORDER BY cu.created_at DESC
  ), '[]'::json) INTO updates_data
  FROM public.client_updates cu
  WHERE cu.project_id = portal_record.project_id 
  AND cu.is_visible_to_client = true
  LIMIT 5;
  
  -- Build secure result JSON (NO SENSITIVE PORTAL DATA)
  SELECT json_build_object(
    'portal', json_build_object(
      'project_id', portal_record.project_id,
      'show_team_names', portal_record.show_team_names,
      'project_name', portal_record.project_name,
      'client', portal_record.client,
      'description', portal_record.description,
      'start_date', portal_record.start_date,
      'end_date', portal_record.end_date,
      'status', portal_record.status
      -- Removed: portal id, hash, access counts, timestamps
    ),
    'phases', phases_data,
    'deliverables', deliverables_data, 
    'tasks', tasks_data,
    'updates', updates_data
  ) INTO result;
  
  -- Log access without exposing portal hash
  UPDATE public.client_portals 
  SET access_count = access_count + 1, last_accessed = now()
  WHERE portal_hash = portal_hash_param AND is_active = true;
  
  RETURN result;
END;
$$;

-- Step 4: Create restrictive policies for authenticated portal management only
CREATE POLICY "Users can manage own client portals only" 
ON public.client_portals 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Remove public read access, only allow authenticated project owners
CREATE POLICY "Users can access own projects only" 
ON public.projects 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can access own phases only" 
ON public.phases 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can access own deliverables only" 
ON public.deliverables 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can access own tasks only" 
ON public.tasks 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can access own meetings only" 
ON public.project_meetings 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Force user_id to be the authenticated user for new records
  IF TG_OP = 'INSERT' THEN
    NEW.user_id = auth.uid();
  END IF;
  
  -- For updates, only allow if user owns the record or if setting user_id for first time
  IF TG_OP = 'UPDATE' THEN
    -- If user_id is being set for the first time (was NULL), allow it
    IF OLD.user_id IS NULL THEN
      NEW.user_id = auth.uid();
    ELSE
      -- Don't allow changing user_id if it's already set
      NEW.user_id = OLD.user_id;
    END IF;
  END IF;
  
  -- Ensure we have a valid user_id
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: user must be logged in';
  END IF;
  
  RETURN NEW;
END;
$$;