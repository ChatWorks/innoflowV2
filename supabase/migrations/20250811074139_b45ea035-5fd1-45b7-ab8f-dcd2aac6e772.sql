-- Create project_meetings table
CREATE TABLE IF NOT EXISTS public.project_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME NULL,
  subject TEXT NOT NULL,
  description TEXT NULL,
  attendees TEXT NULL,
  location TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_meetings_project_id ON public.project_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_meetings_meeting_date ON public.project_meetings(meeting_date);

-- Enable RLS
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view own meetings
CREATE POLICY IF NOT EXISTS "Users can view own meetings"
ON public.project_meetings
FOR SELECT
USING (auth.uid() = user_id);

-- RLS: Users can insert own meetings
CREATE POLICY IF NOT EXISTS "Users can create own meetings"
ON public.project_meetings
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- RLS: Users can update own meetings
CREATE POLICY IF NOT EXISTS "Users can update own meetings"
ON public.project_meetings
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS: Users can delete own meetings
CREATE POLICY IF NOT EXISTS "Users can delete own meetings"
ON public.project_meetings
FOR DELETE
USING (auth.uid() = user_id);

-- RLS: Anon can access meetings via active portal (read-only)
CREATE POLICY IF NOT EXISTS "Anon can access meetings via active portal"
ON public.project_meetings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_portals cp
    WHERE cp.project_id = project_meetings.project_id
      AND cp.is_active = true
      AND (cp.expires_at IS NULL OR cp.expires_at > now())
  )
);

-- Triggers for updated_at and ensuring user_id
DROP TRIGGER IF EXISTS trg_project_meetings_updated_at ON public.project_meetings;
CREATE TRIGGER trg_project_meetings_updated_at
BEFORE UPDATE ON public.project_meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_project_meetings_ensure_user ON public.project_meetings;
CREATE TRIGGER trg_project_meetings_ensure_user
BEFORE INSERT OR UPDATE ON public.project_meetings
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id();