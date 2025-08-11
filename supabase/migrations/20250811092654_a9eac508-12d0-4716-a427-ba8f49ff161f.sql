-- Harden RLS for leads: add WITH CHECK to update policy, enforce ensure_user_id trigger, and force RLS
BEGIN;

-- Ensure RLS is enabled and forced (prevents owner bypass)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Recreate UPDATE policy with both USING and WITH CHECK
DROP POLICY IF EXISTS "leads_update_own_authenticated" ON public.leads;
CREATE POLICY "leads_update_own_authenticated"
ON public.leads
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure INSERT policy exists with WITH CHECK (idempotent, create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'leads' 
      AND policyname = 'leads_insert_own_authenticated'
  ) THEN
    CREATE POLICY "leads_insert_own_authenticated"
    ON public.leads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure SELECT policy exists (idempotent, create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'leads' 
      AND policyname = 'leads_select_own_authenticated'
  ) THEN
    CREATE POLICY "leads_select_own_authenticated"
    ON public.leads
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure DELETE policy exists (idempotent, create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'leads' 
      AND policyname = 'leads_delete_own_authenticated'
  ) THEN
    CREATE POLICY "leads_delete_own_authenticated"
    ON public.leads
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Attach trigger to lock user_id to the authenticated user on insert/update
DROP TRIGGER IF EXISTS ensure_leads_user_id ON public.leads;
CREATE TRIGGER ensure_leads_user_id
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id();

COMMIT;