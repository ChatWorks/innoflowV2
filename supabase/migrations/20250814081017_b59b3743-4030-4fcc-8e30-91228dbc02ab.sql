-- Add estimated_time_seconds column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN estimated_time_seconds integer DEFAULT 0;