
BEGIN;

-- Make sure RLS is enabled and enforced (idempotent)
ALTER TABLE public.moneybird_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moneybird_connections FORCE ROW LEVEL SECURITY;

-- Remove SELECT access for clients completely to prevent token exposure
DROP POLICY IF EXISTS "moneybird_connections_select_own" ON public.moneybird_connections;

COMMIT;
