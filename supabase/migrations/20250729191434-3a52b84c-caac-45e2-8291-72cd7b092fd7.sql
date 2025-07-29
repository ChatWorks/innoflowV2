-- Critical Security Fixes - Phase 1: Handle existing NULL values

-- First, check if there are any records with NULL user_id and update them
-- We'll need to identify the user who created these records

-- Update projects with NULL user_id (if any exist, they need to be assigned to their creator)
-- Since we can't determine the original creator, we'll need to handle this carefully
-- Let's first see what we're dealing with by creating a temporary solution

-- For now, let's create a safety mechanism and then proceed step by step

-- 1. Add trigger to ensure user_id is always set to current authenticated user
CREATE OR REPLACE FUNCTION public.ensure_user_id()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to all relevant tables
CREATE TRIGGER ensure_projects_user_id
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();

CREATE TRIGGER ensure_deliverables_user_id
  BEFORE INSERT OR UPDATE ON public.deliverables  
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();

CREATE TRIGGER ensure_phases_user_id
  BEFORE INSERT OR UPDATE ON public.phases
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();

CREATE TRIGGER ensure_tasks_user_id
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();

CREATE TRIGGER ensure_time_entries_user_id
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();

-- 2. Strengthen RLS policies to be more explicit
-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Deliverables policies
DROP POLICY IF EXISTS "Users can view own deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Users can create own deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Users can update own deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Users can delete own deliverables" ON public.deliverables;

CREATE POLICY "Users can view own deliverables" ON public.deliverables
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can create own deliverables" ON public.deliverables
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can update own deliverables" ON public.deliverables
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete own deliverables" ON public.deliverables
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Phases policies
DROP POLICY IF EXISTS "Users can view own phases" ON public.phases;
DROP POLICY IF EXISTS "Users can create own phases" ON public.phases;
DROP POLICY IF EXISTS "Users can update own phases" ON public.phases;
DROP POLICY IF EXISTS "Users can delete own phases" ON public.phases;

CREATE POLICY "Users can view own phases" ON public.phases
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can create own phases" ON public.phases
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can update own phases" ON public.phases
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete own phases" ON public.phases
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Tasks policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can create own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Time entries policies
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can create own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON public.time_entries;

CREATE POLICY "Users can view own time entries" ON public.time_entries
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can create own time entries" ON public.time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can update own time entries" ON public.time_entries
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete own time entries" ON public.time_entries
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- 3. Harden existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;