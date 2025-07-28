-- Add total_hours to projects table
ALTER TABLE public.projects 
ADD COLUMN total_hours NUMERIC DEFAULT 0;

-- Add assigned_to field to tasks table for team member assignment
ALTER TABLE public.tasks 
ADD COLUMN assigned_to TEXT CHECK (assigned_to IN ('Tijn', 'Twan'));

-- Add deliverable_id to time_entries table to track time per deliverable
ALTER TABLE public.time_entries 
ADD COLUMN deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_time_entries_deliverable ON public.time_entries(deliverable_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);