-- Secure RLS and privileges for sensitive tables
-- This script is idempotent: it drops existing policies per table before recreating strict ones
-- and revokes broad privileges from anon/public. It also adds service_role exceptions
-- where background jobs/Edge Functions must read/write.

-- =============================
-- LEADS (owner: user_id)
-- =============================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.leads FROM anon, public;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='leads' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY leads_select_own
ON public.leads FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY leads_insert_own
ON public.leads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY leads_update_own
ON public.leads FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY leads_delete_own
ON public.leads FOR DELETE TO authenticated
USING (user_id = auth.uid());


-- =============================
-- PROFILES (owner: id)
-- =============================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM anon, public;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY profiles_select_own
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY profiles_insert_own
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- (No DELETE policy for profiles by design)


-- =============================
-- CLIENT_PORTALS (owner: user_id)
-- =============================
ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portals FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.client_portals FROM anon, public;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='client_portals' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.client_portals', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY client_portals_select_own
ON public.client_portals FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY client_portals_insert_own
ON public.client_portals FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY client_portals_update_own
ON public.client_portals FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY client_portals_delete_own
ON public.client_portals FOR DELETE TO authenticated
USING (user_id = auth.uid());


-- =============================
-- MONEYBIRD_CONNECTIONS (owner: user_id)
-- =============================
ALTER TABLE public.moneybird_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moneybird_connections FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.moneybird_connections FROM anon, public;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='moneybird_connections' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.moneybird_connections', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY moneybird_connections_select_own
ON public.moneybird_connections FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY moneybird_connections_insert_own
ON public.moneybird_connections FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY moneybird_connections_update_own
ON public.moneybird_connections FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY moneybird_connections_delete_own
ON public.moneybird_connections FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- service_role full access for jobs / edge functions
CREATE POLICY moneybird_connections_all_service_role
ON public.moneybird_connections FOR ALL TO service_role
USING (true) WITH CHECK (true);


-- =============================
-- MONEYBIRD_AGGREGATES_DAILY (owner: user_id; end-users SELECT only; jobs write)
-- =============================
ALTER TABLE public.moneybird_aggregates_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moneybird_aggregates_daily FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.moneybird_aggregates_daily FROM anon, public;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='moneybird_aggregates_daily' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.moneybird_aggregates_daily', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY moneybird_agg_select_own
ON public.moneybird_aggregates_daily FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- service_role full access
CREATE POLICY moneybird_agg_all_service_role
ON public.moneybird_aggregates_daily FOR ALL TO service_role
USING (true) WITH CHECK (true);


-- =============================
-- MONEYBIRD_SYNC_STATE (owner: user_id; SELECT for end-users, ALL for service_role)
-- =============================
ALTER TABLE public.moneybird_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moneybird_sync_state FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.moneybird_sync_state FROM anon, public;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='moneybird_sync_state' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.moneybird_sync_state', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY moneybird_sync_state_select_own
ON public.moneybird_sync_state FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- service_role full access
CREATE POLICY moneybird_sync_state_all_service_role
ON public.moneybird_sync_state FOR ALL TO service_role
USING (true) WITH CHECK (true);


-- =============================
-- PROJECT_MESSAGES (restrict; remove public insert; owner via projects.user_id)
-- =============================
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.project_messages FROM anon, public;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='project_messages' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_messages', pol.policyname);
  END LOOP;
END $$;

-- Owner-based via project ownership
CREATE POLICY project_messages_select_own
ON public.project_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY project_messages_insert_own
ON public.project_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY project_messages_update_own
ON public.project_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY project_messages_delete_own
ON public.project_messages FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_messages.project_id
      AND p.user_id = auth.uid()
  )
);

-- service_role full access
CREATE POLICY project_messages_all_service_role
ON public.project_messages FOR ALL TO service_role
USING (true) WITH CHECK (true);


-- =============================
-- PORTAL_ACCESS_LOGS (SELECT only for portal owner; INSERT only service_role)
-- =============================
ALTER TABLE public.portal_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_access_logs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.portal_access_logs FROM anon, public;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='portal_access_logs' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.portal_access_logs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY portal_access_logs_select_owner
ON public.portal_access_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_portals cp
    WHERE cp.id = portal_access_logs.portal_id
      AND cp.user_id = auth.uid()
  )
);

-- Insert strictly via service_role (Edge Function)
CREATE POLICY portal_access_logs_insert_service_role
ON public.portal_access_logs FOR INSERT TO service_role
WITH CHECK (true);

-- No UPDATE/DELETE for end-users


-- =============================
-- Acceptatie: Korte testqueries (informative)
-- =============================
-- 1) Controleer dat anon/public geen privileges hebben:
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'leads','profiles','client_portals','moneybird_connections',
    'moneybird_aggregates_daily','moneybird_sync_state','project_messages','portal_access_logs'
  )
  AND grantee IN ('anon','public')
ORDER BY table_name, privilege_type;

-- 2) Controleer dat policies per tabel aanwezig zijn en alleen voor 'authenticated' en/of 'service_role':
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'leads','profiles','client_portals','moneybird_connections',
    'moneybird_aggregates_daily','moneybird_sync_state','project_messages','portal_access_logs'
  )
ORDER BY tablename, policyname;

-- 3) (Optioneel) Simuleer requests door claims te zetten (voor SELECT policies):
--    NB: in SQL editor draait u als service_role; onderstaande is puur ter illustratie
--    hoe auth.uid() zou resolven. Werkelijke verificatie doet u via de app met JWT.
-- SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
-- SELECT set_config('request.jwt.claim.role', 'authenticated', true);
-- SELECT * FROM public.leads; -- zou alleen rijen voor bovenstaande user_id tonen.
