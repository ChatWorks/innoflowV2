-- Consolidate RLS and fix linter warnings

-- 1) Optimize client_updates policies and set roles
ALTER POLICY "Users can create own client updates" ON public.client_updates
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete own client updates" ON public.client_updates
  TO authenticated
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own client updates" ON public.client_updates
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own client updates" ON public.client_updates
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 2) Remove generic ALL policies that duplicate per-action policies
DROP POLICY IF EXISTS "Users can manage own client portals only" ON public.client_portals;
DROP POLICY IF EXISTS "Users can access own deliverables only" ON public.deliverables;
DROP POLICY IF EXISTS "Users can access own phases only" ON public.phases;
DROP POLICY IF EXISTS "Users can access own tasks only" ON public.tasks;
DROP POLICY IF EXISTS "Users can access own meetings only" ON public.project_meetings;
DROP POLICY IF EXISTS "Users can access own projects only" ON public.projects;

-- 3) Project messages: restrict owner policies to authenticated to avoid PUBLIC duplicates
ALTER POLICY "Users can create messages for their projects" ON public.project_messages
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  ));
ALTER POLICY "Users can update messages for their projects" ON public.project_messages
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  ));
ALTER POLICY "Users can view messages for their projects" ON public.project_messages
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  ));

-- 4) Drop duplicate index (keep one of the identical pair)
DROP INDEX IF EXISTS public.idx_time_entries_task_id;