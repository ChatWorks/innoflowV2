-- Security hardening for sensitive customer data in leads table

-- 1) Ensure user ownership is enforced at write-time
DROP TRIGGER IF EXISTS leads_ensure_user_id ON public.leads;
CREATE TRIGGER leads_ensure_user_id
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id();

-- 2) Keep updated_at accurate automatically
DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Performance: index for RLS lookups and owner-scoped queries
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);

-- Note: Existing RLS policies already restrict access to owner only:
-- SELECT/UPDATE/DELETE/INSERT USING/WITH CHECK (auth.uid() = user_id)
-- No public access remains; authentication is required to evaluate auth.uid().