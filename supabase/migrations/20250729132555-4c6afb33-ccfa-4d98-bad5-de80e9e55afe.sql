-- Add declarable_hours column to deliverables table
ALTER TABLE public.deliverables 
ADD COLUMN declarable_hours NUMERIC DEFAULT 0;