-- 1) Tighten portal SELECT policies to only allow anon role

-- Projects
DROP POLICY IF EXISTS "Public can access projects via active portal" ON public.projects;
CREATE POLICY "Anon can access projects via active portal"
ON public.projects
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.client_portals cp
    WHERE cp.project_id = projects.id
      AND cp.is_active = true
      AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Phases
DROP POLICY IF EXISTS "Public can access phases via active portal" ON public.phases;
CREATE POLICY "Anon can access phases via active portal"
ON public.phases
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.client_portals cp
    WHERE cp.project_id = phases.project_id
      AND cp.is_active = true
      AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Deliverables
DROP POLICY IF EXISTS "Public can access deliverables via active portal" ON public.deliverables;
CREATE POLICY "Anon can access deliverables via active portal"
ON public.deliverables
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.client_portals cp
    WHERE cp.project_id = deliverables.project_id
      AND cp.is_active = true
      AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Tasks
DROP POLICY IF EXISTS "Public can access tasks via active portal" ON public.tasks;
CREATE POLICY "Anon can access tasks via active portal"
ON public.tasks
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.client_portals cp
    JOIN public.deliverables d ON cp.project_id = d.project_id
    WHERE d.id = tasks.deliverable_id
      AND cp.is_active = true
      AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- 2) Add user-specific Moneybird token storage
ALTER TABLE public.moneybird_connections
ADD COLUMN IF NOT EXISTS access_token text;

-- Optional: label default
ALTER TABLE public.moneybird_connections
ALTER COLUMN connection_label DROP DEFAULT;