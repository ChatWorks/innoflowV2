-- Fix portal hash generator om te werken zonder gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_portal_hash()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hash_result TEXT;
  uuid_part TEXT;
  timestamp_part TEXT;
BEGIN
  -- Gebruik gen_random_uuid() voor randomness
  SELECT replace(gen_random_uuid()::text, '-', '') INTO uuid_part;
  
  -- Voeg timestamp toe voor extra uniciteit
  SELECT extract(epoch from now())::bigint::text INTO timestamp_part;
  
  -- Combineer en hash met md5 voor consistente 32-karakter output
  SELECT substr(md5(uuid_part || timestamp_part), 1, 32) INTO hash_result;
  
  RETURN hash_result;
END;
$$;