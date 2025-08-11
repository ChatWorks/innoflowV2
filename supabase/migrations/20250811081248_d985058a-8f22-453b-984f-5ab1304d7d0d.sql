-- Harden leads table RLS against unauthorized access of sensitive PII

-- Ensure RLS is enabled and enforced
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Replace broad role policies with explicit authenticated-only policies
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;

-- Recreate policies scoped to authenticated users only
CREATE POLICY "leads_insert_own_authenticated"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leads_select_own_authenticated"
ON public.leads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "leads_update_own_authenticated"
ON public.leads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "leads_delete_own_authenticated"
ON public.leads
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Keep triggers from previous hardening (ensure_user_id & updated_at) in place