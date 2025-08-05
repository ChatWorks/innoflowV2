-- Add declarable_hours column to phases table
ALTER TABLE public.phases 
ADD COLUMN declarable_hours numeric DEFAULT 0;