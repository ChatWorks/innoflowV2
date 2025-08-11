-- Optimize RLS policies to avoid per-row re-evaluation of auth.uid()
-- Replace auth.uid() with (select auth.uid()) across flagged policies

-- PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
CREATE POLICY "projects_delete_own" ON public.projects
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own" ON public.projects
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
CREATE POLICY "projects_select_own" ON public.projects
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
CREATE POLICY "projects_update_own" ON public.projects
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- TIME ENTRIES
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "time_entries_delete_own" ON public.time_entries;
CREATE POLICY "time_entries_delete_own" ON public.time_entries
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "time_entries_insert_own" ON public.time_entries;
CREATE POLICY "time_entries_insert_own" ON public.time_entries
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "time_entries_select_own" ON public.time_entries;
CREATE POLICY "time_entries_select_own" ON public.time_entries
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "time_entries_update_own" ON public.time_entries;
CREATE POLICY "time_entries_update_own" ON public.time_entries
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- DELIVERABLES
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deliverables_delete_own" ON public.deliverables;
CREATE POLICY "deliverables_delete_own" ON public.deliverables
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "deliverables_insert_own" ON public.deliverables;
CREATE POLICY "deliverables_insert_own" ON public.deliverables
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "deliverables_select_own" ON public.deliverables;
CREATE POLICY "deliverables_select_own" ON public.deliverables
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "deliverables_update_own" ON public.deliverables;
CREATE POLICY "deliverables_update_own" ON public.deliverables
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- TASKS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;
CREATE POLICY "tasks_delete_own" ON public.tasks
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;
CREATE POLICY "tasks_insert_own" ON public.tasks
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
CREATE POLICY "tasks_update_own" ON public.tasks
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- PHASES
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "phases_delete_own" ON public.phases;
CREATE POLICY "phases_delete_own" ON public.phases
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "phases_insert_own" ON public.phases;
CREATE POLICY "phases_insert_own" ON public.phases
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "phases_select_own" ON public.phases;
CREATE POLICY "phases_select_own" ON public.phases
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "phases_update_own" ON public.phases;
CREATE POLICY "phases_update_own" ON public.phases
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- PROFILES (uses id = auth.uid())
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

-- LEADS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_delete_own" ON public.leads;
CREATE POLICY "leads_delete_own" ON public.leads
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "leads_insert_own" ON public.leads;
CREATE POLICY "leads_insert_own" ON public.leads
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
CREATE POLICY "leads_select_own" ON public.leads
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "leads_update_own" ON public.leads;
CREATE POLICY "leads_update_own" ON public.leads
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- LEAD ACTIVITIES
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_activities_delete_own" ON public.lead_activities;
CREATE POLICY "lead_activities_delete_own" ON public.lead_activities
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "lead_activities_insert_own" ON public.lead_activities;
CREATE POLICY "lead_activities_insert_own" ON public.lead_activities
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "lead_activities_select_own" ON public.lead_activities;
CREATE POLICY "lead_activities_select_own" ON public.lead_activities
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "lead_activities_update_own" ON public.lead_activities;
CREATE POLICY "lead_activities_update_own" ON public.lead_activities
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- LEAD SETTINGS
ALTER TABLE public.lead_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_settings_delete_own" ON public.lead_settings;
CREATE POLICY "lead_settings_delete_own" ON public.lead_settings
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "lead_settings_insert_own" ON public.lead_settings;
CREATE POLICY "lead_settings_insert_own" ON public.lead_settings
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "lead_settings_select_own" ON public.lead_settings;
CREATE POLICY "lead_settings_select_own" ON public.lead_settings
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "lead_settings_update_own" ON public.lead_settings;
CREATE POLICY "lead_settings_update_own" ON public.lead_settings
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- MANUAL TIME ENTRIES
ALTER TABLE public.manual_time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manual_time_entries_delete_own" ON public.manual_time_entries;
CREATE POLICY "manual_time_entries_delete_own" ON public.manual_time_entries
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "manual_time_entries_insert_own" ON public.manual_time_entries;
CREATE POLICY "manual_time_entries_insert_own" ON public.manual_time_entries
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "manual_time_entries_select_own" ON public.manual_time_entries;
CREATE POLICY "manual_time_entries_select_own" ON public.manual_time_entries
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "manual_time_entries_update_own" ON public.manual_time_entries;
CREATE POLICY "manual_time_entries_update_own" ON public.manual_time_entries
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- CLIENT PORTALS
ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_portals_delete_own" ON public.client_portals;
CREATE POLICY "client_portals_delete_own" ON public.client_portals
FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "client_portals_insert_own" ON public.client_portals;
CREATE POLICY "client_portals_insert_own" ON public.client_portals
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "client_portals_select_own" ON public.client_portals;
CREATE POLICY "client_portals_select_own" ON public.client_portals
FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "client_portals_update_own" ON public.client_portals;
CREATE POLICY "client_portals_update_own" ON public.client_portals
FOR UPDATE USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));