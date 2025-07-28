-- Add duration_seconds column to time_entries table for more precise tracking
ALTER TABLE public.time_entries 
ADD COLUMN duration_seconds INTEGER;

-- Add index on task_id for better performance when querying task-specific time entries
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(deliverable_id);

-- Update existing records to have duration_seconds based on duration_minutes
UPDATE public.time_entries 
SET duration_seconds = COALESCE(duration_minutes * 60, 0) 
WHERE duration_seconds IS NULL;