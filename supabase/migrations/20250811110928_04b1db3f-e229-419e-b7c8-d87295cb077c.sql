-- Backfill: ensure duration_seconds populated where only minutes exist
UPDATE public.time_entries
SET duration_seconds = (duration_minutes * 60)::integer
WHERE duration_seconds IS NULL AND duration_minutes IS NOT NULL;
