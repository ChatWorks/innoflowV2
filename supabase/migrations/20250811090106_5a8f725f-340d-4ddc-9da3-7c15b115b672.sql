-- Harden portal_access_logs INSERT policy to only allow when portal exists and is active
ALTER POLICY "System can insert access logs"
ON public.portal_access_logs
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.client_portals cp
    WHERE cp.id = portal_access_logs.portal_id
      AND cp.is_active = true
      AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Ensure user_id triggers on user-owned tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_projects') THEN
    CREATE TRIGGER ensure_user_id_projects
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_leads') THEN
    CREATE TRIGGER ensure_user_id_leads
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_phases') THEN
    CREATE TRIGGER ensure_user_id_phases
    BEFORE INSERT OR UPDATE ON public.phases
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_deliverables') THEN
    CREATE TRIGGER ensure_user_id_deliverables
    BEFORE INSERT OR UPDATE ON public.deliverables
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_tasks') THEN
    CREATE TRIGGER ensure_user_id_tasks
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_time_entries') THEN
    CREATE TRIGGER ensure_user_id_time_entries
    BEFORE INSERT OR UPDATE ON public.time_entries
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_manual_time_entries') THEN
    CREATE TRIGGER ensure_user_id_manual_time_entries
    BEFORE INSERT OR UPDATE ON public.manual_time_entries
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_goals') THEN
    CREATE TRIGGER ensure_user_id_goals
    BEFORE INSERT OR UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_lead_activities') THEN
    CREATE TRIGGER ensure_user_id_lead_activities
    BEFORE INSERT OR UPDATE ON public.lead_activities
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_lead_settings') THEN
    CREATE TRIGGER ensure_user_id_lead_settings
    BEFORE INSERT OR UPDATE ON public.lead_settings
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_client_updates') THEN
    CREATE TRIGGER ensure_user_id_client_updates
    BEFORE INSERT OR UPDATE ON public.client_updates
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_project_meetings') THEN
    CREATE TRIGGER ensure_user_id_project_meetings
    BEFORE INSERT OR UPDATE ON public.project_meetings
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_notifications') THEN
    CREATE TRIGGER ensure_user_id_notifications
    BEFORE INSERT OR UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_moneybird_aggregates_daily') THEN
    CREATE TRIGGER ensure_user_id_moneybird_aggregates_daily
    BEFORE INSERT OR UPDATE ON public.moneybird_aggregates_daily
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_moneybird_connections') THEN
    CREATE TRIGGER ensure_user_id_moneybird_connections
    BEFORE INSERT OR UPDATE ON public.moneybird_connections
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_moneybird_sync_state') THEN
    CREATE TRIGGER ensure_user_id_moneybird_sync_state
    BEFORE INSERT OR UPDATE ON public.moneybird_sync_state
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_user_id_client_portals') THEN
    CREATE TRIGGER ensure_user_id_client_portals
    BEFORE INSERT OR UPDATE ON public.client_portals
    FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();
  END IF;
END $$;