-- Re-enable Pendo Data Sync Cronjob
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/sql

-- Re-create the cronjob schedule
SELECT cron.schedule(
  'sync-pendo-incremental-every-6-hours',
  '0 */6 * * *',
  $$SELECT call_pendo_sync_edge_function();$$
);

-- Verify the cronjob is scheduled
SELECT
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname LIKE '%pendo%';

-- Check when it will run next (should be next 00:00, 06:00, 12:00, or 18:00 UTC)
SELECT
  jobname,
  last_run,
  next_run
FROM cron.job_run_details
WHERE jobname = 'sync-pendo-incremental-every-6-hours'
ORDER BY run_time DESC
LIMIT 1;
