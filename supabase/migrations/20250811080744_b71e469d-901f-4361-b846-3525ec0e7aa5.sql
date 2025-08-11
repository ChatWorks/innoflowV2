-- Fix: Restrict public access to client_updates
-- Remove public SELECT policy that exposed updates without portal verification
DROP POLICY IF EXISTS "Public can view client updates via portal" ON public.client_updates;

-- Keep existing owner-scoped policies as-is (insert/update/delete/select own)
-- No further changes required since get_secure_portal_data() returns client updates securely
-- via a SECURITY DEFINER function after validating the portal hash.
