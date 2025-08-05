-- Remove declarable_hours column from phases table
ALTER TABLE public.phases DROP COLUMN IF EXISTS declarable_hours;