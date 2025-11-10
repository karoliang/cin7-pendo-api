-- Temporarily disable the automatic sync cronjob
-- This prevents the Edge Function from overwriting analytics until we fix the calculation issue

SELECT cron.unschedule('sync-pendo-incremental-every-6-hours');

-- Verify the cronjob has been unscheduled
SELECT * FROM cron.job WHERE jobname = 'sync-pendo-incremental-every-6-hours';
