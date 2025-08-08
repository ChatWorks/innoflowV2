-- Create Moneybird integration tables for multi-tenant caching and sync
-- Note: Scoped by user_id for now; organization_id is optional for future org support

-- 1) Connections
CREATE TABLE IF NOT EXISTS public.moneybird_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID,
  administration_id TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('pat','oauth')),
  connection_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.moneybird_connections ENABLE ROW LEVEL SECURITY;

-- Policies: only owner can access/manage
CREATE POLICY IF NOT EXISTS "moneybird_connections_select_own"
ON public.moneybird_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_connections_insert_own"
ON public.moneybird_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_connections_update_own"
ON public.moneybird_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_connections_delete_own"
ON public.moneybird_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Auto-set user_id and protect updates using existing function
DROP TRIGGER IF EXISTS ensure_user_id_moneybird_connections ON public.moneybird_connections;
CREATE TRIGGER ensure_user_id_moneybird_connections
BEFORE INSERT OR UPDATE ON public.moneybird_connections
FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();

CREATE INDEX IF NOT EXISTS idx_moneybird_connections_user_id ON public.moneybird_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_moneybird_connections_admin ON public.moneybird_connections(administration_id);

-- 2) Sync state per resource
CREATE TABLE IF NOT EXISTS public.moneybird_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.moneybird_connections(id) ON DELETE CASCADE,
  resource TEXT NOT NULL CHECK (resource IN ('sales_invoices','purchase_invoices','receipts','financial_mutations','ledger_accounts')),
  last_synced_at TIMESTAMPTZ,
  cursor TEXT,
  etag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (connection_id, resource)
);

ALTER TABLE public.moneybird_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "moneybird_sync_state_select_own"
ON public.moneybird_sync_state
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_sync_state_insert_own"
ON public.moneybird_sync_state
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_sync_state_update_own"
ON public.moneybird_sync_state
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_sync_state_delete_own"
ON public.moneybird_sync_state
FOR DELETE
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS ensure_user_id_moneybird_sync_state ON public.moneybird_sync_state;
CREATE TRIGGER ensure_user_id_moneybird_sync_state
BEFORE INSERT OR UPDATE ON public.moneybird_sync_state
FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();

-- Update updated_at on row changes
DROP TRIGGER IF EXISTS update_moneybird_sync_state_updated_at ON public.moneybird_sync_state;
CREATE TRIGGER update_moneybird_sync_state_updated_at
BEFORE UPDATE ON public.moneybird_sync_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_moneybird_sync_state_user ON public.moneybird_sync_state(user_id);
CREATE INDEX IF NOT EXISTS idx_moneybird_sync_state_conn ON public.moneybird_sync_state(connection_id);

-- 3) Daily aggregates cache (table; can later migrate to materialized view)
CREATE TABLE IF NOT EXISTS public.moneybird_aggregates_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID,
  connection_id UUID REFERENCES public.moneybird_connections(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  grouping TEXT NOT NULL DEFAULT 'none', -- none | ledger_account | project
  group_key TEXT, -- ledger account id/code or project id/name
  basis TEXT NOT NULL DEFAULT 'accrual' CHECK (basis IN ('cash','accrual')),
  revenue_excl_vat NUMERIC NOT NULL DEFAULT 0,
  costs_excl_vat NUMERIC NOT NULL DEFAULT 0,
  cash_in NUMERIC NOT NULL DEFAULT 0,
  cash_out NUMERIC NOT NULL DEFAULT 0,
  cash_net NUMERIC NOT NULL DEFAULT 0,
  source_counts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, grouping, COALESCE(group_key, ''), basis)
);

ALTER TABLE public.moneybird_aggregates_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "moneybird_agg_select_own"
ON public.moneybird_aggregates_daily
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_agg_insert_own"
ON public.moneybird_aggregates_daily
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_agg_update_own"
ON public.moneybird_aggregates_daily
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "moneybird_agg_delete_own"
ON public.moneybird_aggregates_daily
FOR DELETE
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS ensure_user_id_moneybird_aggregates_daily ON public.moneybird_aggregates_daily;
CREATE TRIGGER ensure_user_id_moneybird_aggregates_daily
BEFORE INSERT OR UPDATE ON public.moneybird_aggregates_daily
FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id();

DROP TRIGGER IF EXISTS update_moneybird_aggregates_daily_updated_at ON public.moneybird_aggregates_daily;
CREATE TRIGGER update_moneybird_aggregates_daily_updated_at
BEFORE UPDATE ON public.moneybird_aggregates_daily
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_moneybird_agg_user_date ON public.moneybird_aggregates_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_moneybird_agg_conn_date ON public.moneybird_aggregates_daily(connection_id, date);
CREATE INDEX IF NOT EXISTS idx_moneybird_agg_grouping ON public.moneybird_aggregates_daily(grouping, group_key);
CREATE INDEX IF NOT EXISTS idx_moneybird_agg_basis ON public.moneybird_aggregates_daily(basis);