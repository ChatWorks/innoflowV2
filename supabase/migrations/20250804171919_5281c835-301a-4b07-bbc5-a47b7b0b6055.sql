-- Verbeter de portal hash generator functie om consistente hashes te genereren
CREATE OR REPLACE FUNCTION public.generate_portal_hash()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hash_result TEXT;
BEGIN
  -- Genereer een veilige 32-karakter hash
  SELECT substr(encode(gen_random_bytes(20), 'hex'), 1, 32) INTO hash_result;
  RETURN hash_result;
END;
$$;