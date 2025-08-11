-- Narrow portal message insert policy to anon only to eliminate overlap with authenticated
ALTER POLICY "Public can create client messages via portal"
ON public.project_messages
TO anon;