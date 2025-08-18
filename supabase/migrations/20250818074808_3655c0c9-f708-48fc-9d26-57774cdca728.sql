-- Add parent_task_id and is_subtask columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
ADD COLUMN is_subtask BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance on hierarchical queries
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX idx_tasks_is_subtask ON public.tasks(is_subtask);

-- Update existing tasks to be main tasks (not subtasks)
UPDATE public.tasks SET is_subtask = false WHERE is_subtask IS NULL;