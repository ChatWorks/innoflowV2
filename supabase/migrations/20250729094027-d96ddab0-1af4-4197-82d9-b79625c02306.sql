-- Add status column to phases table for real-time status tracking
ALTER TABLE public.phases ADD COLUMN status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed'));