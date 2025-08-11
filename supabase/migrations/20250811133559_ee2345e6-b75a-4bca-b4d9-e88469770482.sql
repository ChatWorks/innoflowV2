-- Security hardening for specified tables
-- - Enable & FORCE RLS
-- - Revoke anon/public privileges
-- - Drop ALL existing policies (idempotent)
-- - Create owner-based policies for role authenticated using user_id

-- Helper note: all tables use user_id as owner column per current schema

-- =====================
-- Table: deliverables
-- =====================
REVOKE ALL ON TABLE public.deliverables FROM PUBLIC;
REVOKE ALL ON TABLE public.deliverables FROM anon;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='deliverables' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.deliverables;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY deliverables_select_own ON public.deliverables FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY deliverables_insert_own ON public.deliverables FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY deliverables_update_own ON public.deliverables FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY deliverables_delete_own ON public.deliverables FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: goals
-- =====================
REVOKE ALL ON TABLE public.goals FROM PUBLIC;
REVOKE ALL ON TABLE public.goals FROM anon;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='goals' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.goals;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY goals_select_own ON public.goals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY goals_insert_own ON public.goals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY goals_update_own ON public.goals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY goals_delete_own ON public.goals FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: lead_activities
-- =====================
REVOKE ALL ON TABLE public.lead_activities FROM PUBLIC;
REVOKE ALL ON TABLE public.lead_activities FROM anon;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='lead_activities' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lead_activities;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY lead_activities_select_own ON public.lead_activities FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY lead_activities_insert_own ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY lead_activities_update_own ON public.lead_activities FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY lead_activities_delete_own ON public.lead_activities FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: lead_settings
-- =====================
REVOKE ALL ON TABLE public.lead_settings FROM PUBLIC;
REVOKE ALL ON TABLE public.lead_settings FROM anon;
ALTER TABLE public.lead_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_settings FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='lead_settings' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lead_settings;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY lead_settings_select_own ON public.lead_settings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY lead_settings_insert_own ON public.lead_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY lead_settings_update_own ON public.lead_settings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY lead_settings_delete_own ON public.lead_settings FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: manual_time_entries
-- =====================
REVOKE ALL ON TABLE public.manual_time_entries FROM PUBLIC;
REVOKE ALL ON TABLE public.manual_time_entries FROM anon;
ALTER TABLE public.manual_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_time_entries FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='manual_time_entries' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.manual_time_entries;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY manual_time_entries_select_own ON public.manual_time_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY manual_time_entries_insert_own ON public.manual_time_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY manual_time_entries_update_own ON public.manual_time_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY manual_time_entries_delete_own ON public.manual_time_entries FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: notifications
-- =====================
REVOKE ALL ON TABLE public.notifications FROM PUBLIC;
REVOKE ALL ON TABLE public.notifications FROM anon;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='notifications' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notifications_insert_own ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: phases
-- =====================
REVOKE ALL ON TABLE public.phases FROM PUBLIC;
REVOKE ALL ON TABLE public.phases FROM anon;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='phases' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.phases;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY phases_select_own ON public.phases FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY phases_insert_own ON public.phases FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY phases_update_own ON public.phases FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY phases_delete_own ON public.phases FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: project_meetings
-- =====================
REVOKE ALL ON TABLE public.project_meetings FROM PUBLIC;
REVOKE ALL ON TABLE public.project_meetings FROM anon;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meetings FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='project_meetings' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_meetings;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY project_meetings_select_own ON public.project_meetings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY project_meetings_insert_own ON public.project_meetings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY project_meetings_update_own ON public.project_meetings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY project_meetings_delete_own ON public.project_meetings FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: projects
-- =====================
REVOKE ALL ON TABLE public.projects FROM PUBLIC;
REVOKE ALL ON TABLE public.projects FROM anon;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='projects' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY projects_select_own ON public.projects FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY projects_insert_own ON public.projects FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY projects_update_own ON public.projects FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY projects_delete_own ON public.projects FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: tasks
-- =====================
REVOKE ALL ON TABLE public.tasks FROM PUBLIC;
REVOKE ALL ON TABLE public.tasks FROM anon;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='tasks' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY tasks_select_own ON public.tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY tasks_insert_own ON public.tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY tasks_update_own ON public.tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY tasks_delete_own ON public.tasks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================
-- Table: time_entries
-- =====================
REVOKE ALL ON TABLE public.time_entries FROM PUBLIC;
REVOKE ALL ON TABLE public.time_entries FROM anon;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries FORCE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='time_entries' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.time_entries;', r.policyname);
  END LOOP;
END$$;
CREATE POLICY time_entries_select_own ON public.time_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY time_entries_insert_own ON public.time_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY time_entries_update_own ON public.time_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY time_entries_delete_own ON public.time_entries FOR DELETE TO authenticated USING (user_id = auth.uid());
