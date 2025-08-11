-- Optimize RLS policies by replacing auth.uid() with (select auth.uid()) to avoid per-row initplan re-evaluation
-- This migration preserves behavior and only updates policy expressions

-- PROFILES
ALTER POLICY "Users can view own profile" ON public.profiles
  USING ((select auth.uid()) = id);
ALTER POLICY "Users can insert own profile" ON public.profiles
  WITH CHECK ((select auth.uid()) = id);
ALTER POLICY "Users can update own profile" ON public.profiles
  USING ((select auth.uid()) = id);

-- PROJECTS
ALTER POLICY "Users can access own projects only" ON public.projects
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can create own projects" ON public.projects
  WITH CHECK (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can delete own projects" ON public.projects
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can update own projects" ON public.projects
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can view own projects" ON public.projects
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));

-- DELIVERABLES
ALTER POLICY "Users can access own deliverables only" ON public.deliverables
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can create own deliverables" ON public.deliverables
  WITH CHECK (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can delete own deliverables" ON public.deliverables
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can update own deliverables" ON public.deliverables
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can view own deliverables" ON public.deliverables
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));

-- PHASES
ALTER POLICY "Users can access own phases only" ON public.phases
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can create own phases" ON public.phases
  WITH CHECK (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can delete own phases" ON public.phases
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can update own phases" ON public.phases
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can view own phases" ON public.phases
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));

-- TASKS
ALTER POLICY "Users can access own tasks only" ON public.tasks
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can create own tasks" ON public.tasks
  WITH CHECK (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can delete own tasks" ON public.tasks
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can update own tasks" ON public.tasks
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can view own tasks" ON public.tasks
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));

-- TIME ENTRIES
ALTER POLICY "Users can create own time entries" ON public.time_entries
  WITH CHECK (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can delete own time entries" ON public.time_entries
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can update own time entries" ON public.time_entries
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can view own time entries" ON public.time_entries
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));

-- MANUAL TIME ENTRIES
ALTER POLICY "Users can create own manual time entries" ON public.manual_time_entries
  WITH CHECK (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can delete own manual time entries" ON public.manual_time_entries
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can update own manual time entries" ON public.manual_time_entries
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can view own manual time entries" ON public.manual_time_entries
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));

-- PROJECT MEETINGS
ALTER POLICY "Users can access own meetings only" ON public.project_meetings
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can create own meetings" ON public.project_meetings
  WITH CHECK (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can delete own meetings" ON public.project_meetings
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own meetings" ON public.project_meetings
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own meetings" ON public.project_meetings
  USING ((select auth.uid()) = user_id);

-- NOTIFICATIONS
ALTER POLICY "Users can create their own notifications" ON public.notifications
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own notifications" ON public.notifications
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own notifications" ON public.notifications
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own notifications" ON public.notifications
  USING ((select auth.uid()) = user_id);

-- LEADS (recent hardened policies)
ALTER POLICY "leads_insert_own_authenticated" ON public.leads
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "leads_select_own_authenticated" ON public.leads
  USING ((select auth.uid()) = user_id);
ALTER POLICY "leads_update_own_authenticated" ON public.leads
  USING ((select auth.uid()) = user_id);
ALTER POLICY "leads_delete_own_authenticated" ON public.leads
  USING ((select auth.uid()) = user_id);

-- LEAD SETTINGS
ALTER POLICY "Users can create their own lead settings" ON public.lead_settings
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own lead settings" ON public.lead_settings
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own lead settings" ON public.lead_settings
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own lead settings" ON public.lead_settings
  USING ((select auth.uid()) = user_id);

-- LEAD ACTIVITIES
ALTER POLICY "Users can create their own lead activities" ON public.lead_activities
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own lead activities" ON public.lead_activities
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own lead activities" ON public.lead_activities
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own lead activities" ON public.lead_activities
  USING ((select auth.uid()) = user_id);

-- GOALS
ALTER POLICY "Users can create their own goals" ON public.goals
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own goals" ON public.goals
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own goals" ON public.goals
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own goals" ON public.goals
  USING ((select auth.uid()) = user_id);

-- CLIENT PORTALS
ALTER POLICY "Users can manage own client portals only" ON public.client_portals
  USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can create own client portals" ON public.client_portals
  WITH CHECK (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can delete own client portals" ON public.client_portals
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can update own client portals" ON public.client_portals
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));
ALTER POLICY "Users can view own client portals" ON public.client_portals
  USING (((select auth.uid()) = user_id) AND (user_id IS NOT NULL));

-- PROJECT MESSAGES (ownership via projects)
ALTER POLICY "Users can create messages for their projects" ON public.project_messages
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  ));
ALTER POLICY "Users can update messages for their projects" ON public.project_messages
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  ));
ALTER POLICY "Users can view messages for their projects" ON public.project_messages
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  ));

-- PORTAL ACCESS LOGS
ALTER POLICY "Users can view logs for own portals" ON public.portal_access_logs
  USING (EXISTS (
    SELECT 1 FROM public.client_portals cp
    WHERE cp.id = portal_access_logs.portal_id
      AND cp.user_id = (select auth.uid())
  ));

-- MONEYBIRD SYNC STATE
ALTER POLICY "moneybird_sync_state_insert_own" ON public.moneybird_sync_state
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_sync_state_update_own" ON public.moneybird_sync_state
  USING ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_sync_state_delete_own" ON public.moneybird_sync_state
  USING ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_sync_state_select_own" ON public.moneybird_sync_state
  USING ((select auth.uid()) = user_id);

-- MONEYBIRD CONNECTIONS
ALTER POLICY "moneybird_connections_insert_own" ON public.moneybird_connections
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_connections_update_own" ON public.moneybird_connections
  USING ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_connections_delete_own" ON public.moneybird_connections
  USING ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_connections_select_own" ON public.moneybird_connections
  USING ((select auth.uid()) = user_id);

-- MONEYBIRD AGGREGATES DAILY
ALTER POLICY "moneybird_agg_insert_own" ON public.moneybird_aggregates_daily
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_agg_update_own" ON public.moneybird_aggregates_daily
  USING ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_agg_delete_own" ON public.moneybird_aggregates_daily
  USING ((select auth.uid()) = user_id);
ALTER POLICY "moneybird_agg_select_own" ON public.moneybird_aggregates_daily
  USING ((select auth.uid()) = user_id);
