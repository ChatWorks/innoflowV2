-- Add task_id column to time_entries table to track which task the time is spent on
ALTER TABLE public.time_entries 
ADD COLUMN task_id UUID REFERENCES public.tasks(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(task_id);