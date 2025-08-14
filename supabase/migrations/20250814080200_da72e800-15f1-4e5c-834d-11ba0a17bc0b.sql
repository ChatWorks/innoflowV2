-- Add is_todo_list column to projects table
ALTER TABLE public.projects 
ADD COLUMN is_todo_list boolean NOT NULL DEFAULT false;

-- Create index for better performance when filtering todo lists
CREATE INDEX idx_projects_is_todo_list ON public.projects(is_todo_list);