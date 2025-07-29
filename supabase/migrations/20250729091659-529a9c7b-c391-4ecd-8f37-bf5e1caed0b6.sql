-- Remove billable_hours from tasks table as tasks no longer have estimated hours
ALTER TABLE public.tasks DROP COLUMN IF EXISTS billable_hours;

-- Add hourly_rate to projects table for revenue calculation
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 75;

-- Add declarable_hours to deliverables table (using existing fields for now, but making sure it's clear)
-- Note: We'll use the existing structure but clarify that deliverables represent contract hours