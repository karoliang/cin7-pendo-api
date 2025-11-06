-- Supabase Cron Job Setup for Pendo Data Sync
-- Run this in Supabase SQL Editor to set up automatic syncing every 6 hours
-- This replaces the need for GitHub Actions (no additional cost!)

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Remove any existing sync jobs (for clean setup)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'sync-pendo-metadata-every-6-hours';

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION call_pendo_sync_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  response_status integer;
  response_body text;
BEGIN
  -- Call the Edge Function using pg_net
  SELECT net.http_post(
    url := 'https://nrutlzclujyejusvbafm.supabase.co/functions/v1/sync-pendo-metadata',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRsemNsdWp5ZWp1c3ZiYWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTM4MTAsImV4cCI6MjA3Nzk4OTgxMH0.wailzK_IBHtUig3sdragy-WVcyZDxrQEQaCt76AD130',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  -- Log the request
  RAISE NOTICE 'Pendo sync triggered. Request ID: %', request_id;

  -- Optional: Wait for response and log it
  -- Note: This is async, so we won't wait in production
  -- You can check sync_status table for results

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the cron job
    RAISE WARNING 'Error calling Pendo sync Edge Function: %', SQLERRM;

    -- Insert error into sync_status table
    INSERT INTO sync_status (
      entity_type,
      last_sync_start,
      last_sync_end,
      status,
      records_processed,
      error_message
    ) VALUES (
      'cron_job',
      NOW(),
      NOW(),
      'failed',
      0,
      SQLERRM
    );
END;
$$;

-- Create cron job: Run every 6 hours at :00
-- Schedule: '0 */6 * * *' means "at minute 0 of every 6th hour"
-- Examples of when it will run (UTC):
-- - 00:00 (midnight)
-- - 06:00 (6 AM)
-- - 12:00 (noon)
-- - 18:00 (6 PM)
SELECT cron.schedule(
  'sync-pendo-metadata-every-6-hours',  -- Job name
  '0 */6 * * *',                        -- Cron expression (every 6 hours)
  $$SELECT call_pendo_sync_edge_function();$$
);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION call_pendo_sync_edge_function() TO postgres;

-- View scheduled jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename
FROM cron.job
WHERE jobname LIKE '%pendo%';

-- View recent cron job runs (after some time has passed)
-- SELECT
--   runid,
--   jobid,
--   job_name,
--   status,
--   start_time,
--   end_time,
--   command
-- FROM cron.job_run_details
-- WHERE job_name LIKE '%pendo%'
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Verify the function works (manual test)
-- SELECT call_pendo_sync_edge_function();

-- To manually trigger the sync anytime:
-- SELECT call_pendo_sync_edge_function();

-- To disable the cron job:
-- SELECT cron.unschedule('sync-pendo-metadata-every-6-hours');

-- To change the schedule (e.g., every 4 hours):
-- SELECT cron.unschedule('sync-pendo-metadata-every-6-hours');
-- SELECT cron.schedule('sync-pendo-metadata-every-6-hours', '0 */4 * * *', $$SELECT call_pendo_sync_edge_function();$$);

-- To view all cron jobs:
-- SELECT * FROM cron.job;

-- Comments for documentation
COMMENT ON FUNCTION call_pendo_sync_edge_function() IS 'Triggers the Pendo metadata sync Edge Function via HTTP POST. Called by pg_cron every 6 hours.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cron job setup complete!';
  RAISE NOTICE '📅 Pendo metadata will sync every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)';
  RAISE NOTICE '🔄 To manually trigger: SELECT call_pendo_sync_edge_function();';
  RAISE NOTICE '📊 Check sync results in the sync_status table';
END $$;
