-- Fix portal hash generation function
CREATE OR REPLACE FUNCTION public.generate_portal_hash()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a simpler approach: combine random UUID with timestamp
  RETURN lower(replace(gen_random_uuid()::text, '-', '') || to_char(extract(epoch from now()), 'FM999999999'));
END;
$$;