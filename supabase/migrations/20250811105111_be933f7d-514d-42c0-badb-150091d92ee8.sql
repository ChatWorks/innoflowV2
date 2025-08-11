-- Security hardening migration: unique index and secure RPC for client messages
-- Note: Uses unique index (not constraint) to support upsert on user_id

BEGIN;

-- 1) Ensure only one Moneybird connection per user (required for upsert)
CREATE UNIQUE INDEX IF NOT EXISTS ux_moneybird_connections_user_id
ON public.moneybird_connections(user_id);

-- 2) Secure RPC to insert client messages via portal hash
--    - Validates portal is active and not expired
--    - Derives project_id server-side (no trust on client)
--    - Inserts message as sender_type = 'client'
--    - Returns inserted message id
CREATE OR REPLACE FUNCTION public.insert_client_message(
  p_portal_hash text,
  p_subject text,
  p_message text,
  p_sender_name text DEFAULT NULL,
  p_sender_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_project_id uuid;
  v_msg_id uuid;
BEGIN
  -- Lookup active portal and derive project
  SELECT cp.project_id INTO v_project_id
  FROM public.client_portals cp
  WHERE cp.portal_hash = p_portal_hash
    AND cp.is_active = true
    AND (cp.expires_at IS NULL OR cp.expires_at > now())
  LIMIT 1;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive portal';
  END IF;

  INSERT INTO public.project_messages (
    id, project_id, sender_type, sender_name, sender_email,
    subject, message, is_read, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_project_id, 'client', p_sender_name, p_sender_email,
    p_subject, p_message, false, now(), now()
  ) RETURNING id INTO v_msg_id;

  RETURN v_msg_id;
END;
$fn$;

COMMIT;