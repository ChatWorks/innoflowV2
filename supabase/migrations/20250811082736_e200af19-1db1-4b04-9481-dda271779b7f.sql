-- Enforce strict RLS on sensitive tables without altering existing policies
-- Safe, idempotent operations

-- Leads contain PII
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Moneybird connections contain API tokens
ALTER TABLE public.moneybird_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moneybird_connections FORCE ROW LEVEL SECURITY;

-- Financial aggregates
ALTER TABLE public.moneybird_aggregates_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moneybird_aggregates_daily FORCE ROW LEVEL SECURITY;