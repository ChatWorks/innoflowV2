-- Fix remaining RLS initplan warnings by replacing auth.uid() with (select auth.uid())
-- Keep existing security semantics intact

-- MONEYBIRD CONNECTIONS
ALTER TABLE public.moneybird_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "moneybird_connections_delete_own" ON public.moneybird_connections;
CREATE POLICY "moneybird_connections_delete_own" ON public.moneybird_connections
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "moneybird_connections_insert_own" ON public.moneybird_connections;
CREATE POLICY "moneybird_connections_insert_own" ON public.moneybird_connections
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "moneybird_connections_select_own" ON public.moneybird_connections;
CREATE POLICY "moneybird_connections_select_own" ON public.moneybird_connections
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "moneybird_connections_update_own" ON public.moneybird_connections;
CREATE POLICY "moneybird_connections_update_own" ON public.moneybird_connections
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- GOALS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;
CREATE POLICY "goals_delete_own" ON public.goals
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
CREATE POLICY "goals_insert_own" ON public.goals
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "goals_select_own" ON public.goals;
CREATE POLICY "goals_select_own" ON public.goals
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
CREATE POLICY "goals_update_own" ON public.goals
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- MONEYBIRD SYNC STATE
ALTER TABLE public.moneybird_sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "moneybird_sync_state_select_own" ON public.moneybird_sync_state;
CREATE POLICY "moneybird_sync_state_select_own" ON public.moneybird_sync_state
FOR SELECT USING (user_id = (select auth.uid()));

-- PORTAL ACCESS LOGS
ALTER TABLE public.portal_access_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_access_logs_select_owner" ON public.portal_access_logs;
CREATE POLICY "portal_access_logs_select_owner" ON public.portal_access_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.client_portals cp
    WHERE cp.id = portal_access_logs.portal_id
      AND cp.user_id = (select auth.uid())
  )
);

-- PROJECT MEETINGS
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_meetings_delete_own" ON public.project_meetings;
CREATE POLICY "project_meetings_delete_own" ON public.project_meetings
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "project_meetings_insert_own" ON public.project_meetings;
CREATE POLICY "project_meetings_insert_own" ON public.project_meetings
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "project_meetings_select_own" ON public.project_meetings;
CREATE POLICY "project_meetings_select_own" ON public.project_meetings
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "project_meetings_update_own" ON public.project_meetings;
CREATE POLICY "project_meetings_update_own" ON public.project_meetings
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- PROJECT MESSAGES (owner via related project)
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_messages_delete_own" ON public.project_messages;
CREATE POLICY "project_messages_delete_own" ON public.project_messages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "project_messages_insert_own" ON public.project_messages;
CREATE POLICY "project_messages_insert_own" ON public.project_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "project_messages_select_own" ON public.project_messages;
CREATE POLICY "project_messages_select_own" ON public.project_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "project_messages_update_own" ON public.project_messages;
CREATE POLICY "project_messages_update_own" ON public.project_messages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = (select auth.uid())
  )
);

-- MONEYBIRD AGGREGATES DAILY
ALTER TABLE public.moneybird_aggregates_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "moneybird_agg_select_own" ON public.moneybird_aggregates_daily;
CREATE POLICY "moneybird_agg_select_own" ON public.moneybird_aggregates_daily
FOR SELECT USING (user_id = (select auth.uid()));
