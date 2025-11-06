# Supabase Cron Job Setup Guide

This guide explains how to set up automatic Pendo data syncing using Supabase's built-in `pg_cron` extension - **completely free, no additional costs!**

## Why Supabase Cron?

✅ **Free** - Included with Supabase (no GitHub Actions costs)
✅ **Integrated** - Everything in one platform
✅ **Reliable** - Built-in PostgreSQL extension
✅ **Simple** - Single SQL script to set up
✅ **Flexible** - Easy to modify schedule

## Setup Instructions

### Step 1: Run the SQL Script

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm
2. Click **SQL Editor** in the sidebar
3. Create a new query
4. Copy the entire contents of `supabase-cron-setup.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

You should see success messages:
```
✅ Cron job setup complete!
📅 Pendo metadata will sync every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
🔄 To manually trigger: SELECT call_pendo_sync_edge_function();
📊 Check sync results in the sync_status table
```

### Step 2: Verify the Cron Job

Run this query to see your scheduled job:

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename
FROM cron.job
WHERE jobname LIKE '%pendo%';
```

You should see:
- **jobname:** `sync-pendo-metadata-every-6-hours`
- **schedule:** `0 */6 * * *`
- **active:** `true`

## How It Works

### Schedule

The cron job runs **every 6 hours** at these times (UTC):
- **00:00** (midnight)
- **06:00** (6 AM)
- **12:00** (noon)
- **18:00** (6 PM)

### What It Does

1. **Calls Edge Function:** Uses `pg_net` to POST to `/sync-pendo-metadata`
2. **Syncs Metadata:** Fetches 100 guides, 100 features, 100 pages
3. **Updates Database:** Upserts data into `pendo_guides`, `pendo_features`, `pendo_pages`
4. **Logs Status:** Records results in `sync_status` table

### Architecture

```
┌──────────────────┐
│   pg_cron        │  Every 6 hours
│   (PostgreSQL)   │ ───────┐
└──────────────────┘        │
                            │
                            ▼
┌──────────────────────────────────┐
│  call_pendo_sync_edge_function() │
│  (SQL Function)                  │
└───────────┬──────────────────────┘
            │ HTTP POST (pg_net)
            │
            ▼
┌──────────────────────────────┐
│  Edge Function               │
│  sync-pendo-metadata         │
│                              │
│  - Fetch from Pendo API      │
│  - Process metadata          │
│  - Store in Supabase         │
└──────────────────────────────┘
```

## Manual Operations

### Manually Trigger Sync

To run the sync immediately (useful for testing):

```sql
SELECT call_pendo_sync_edge_function();
```

### View Recent Sync Results

```sql
SELECT
  entity_type,
  status,
  records_processed,
  last_sync_end,
  error_message
FROM sync_status
ORDER BY last_sync_end DESC
LIMIT 10;
```

### View Cron Job Execution History

```sql
SELECT
  runid,
  jobid,
  job_name,
  status,
  start_time,
  end_time
FROM cron.job_run_details
WHERE job_name LIKE '%pendo%'
ORDER BY start_time DESC
LIMIT 10;
```

## Modify Schedule

### Change to Every 4 Hours

```sql
SELECT cron.unschedule('sync-pendo-metadata-every-6-hours');
SELECT cron.schedule(
  'sync-pendo-metadata-every-6-hours',
  '0 */4 * * *',  -- Every 4 hours
  $$SELECT call_pendo_sync_edge_function();$$
);
```

### Change to Every 12 Hours

```sql
SELECT cron.unschedule('sync-pendo-metadata-every-6-hours');
SELECT cron.schedule(
  'sync-pendo-metadata-every-6-hours',
  '0 */12 * * *',  -- Every 12 hours
  $$SELECT call_pendo_sync_edge_function();$$
);
```

### Change to Daily at Midnight

```sql
SELECT cron.unschedule('sync-pendo-metadata-every-6-hours');
SELECT cron.schedule(
  'sync-pendo-metadata-every-6-hours',
  '0 0 * * *',  -- Daily at midnight
  $$SELECT call_pendo_sync_edge_function();$$
);
```

### Cron Expression Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, where 0 and 7 = Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

Common examples:
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `0 9,17 * * *` - At 9 AM and 5 PM daily
- `0 0 * * 1` - Every Monday at midnight

## Disable/Enable Cron Job

### Temporarily Disable

```sql
SELECT cron.unschedule('sync-pendo-metadata-every-6-hours');
```

### Re-enable

Just run the setup script again or:

```sql
SELECT cron.schedule(
  'sync-pendo-metadata-every-6-hours',
  '0 */6 * * *',
  $$SELECT call_pendo_sync_edge_function();$$
);
```

## Troubleshooting

### Check if Extensions are Enabled

```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

Both should show up. If not, enable them:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### View All Cron Jobs

```sql
SELECT * FROM cron.job;
```

### Check Edge Function Logs

Go to: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/functions

Click on `sync-pendo-metadata` → **Logs**

### Check Database Sync Status

```sql
SELECT * FROM sync_status ORDER BY last_sync_end DESC LIMIT 5;
```

### Test Edge Function Directly

```bash
curl -X POST \
  "https://nrutlzclujyejusvbafm.supabase.co/functions/v1/sync-pendo-metadata" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRsemNsdWp5ZWp1c3ZiYWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTM4MTAsImV4cCI6MjA3Nzk4OTgxMH0.wailzK_IBHtUig3sdragy-WVcyZDxrQEQaCt76AD130"
```

## Cost Comparison

### Supabase Cron (Current Setup)
- **Cost:** $0 (included in Supabase free/pro plan)
- **Setup:** One SQL script
- **Maintenance:** Built-in monitoring

### GitHub Actions (Alternative)
- **Cost:** ~$0.008 per minute of runtime
- **Monthly:** ~$3.50 for 6-hour intervals
- **Setup:** Workflow file + secrets management
- **Maintenance:** Separate platform

**Savings: ~$42/year by using Supabase cron!** 💰

## Security Notes

✅ **Anon Key in SQL** - Safe because:
- Only used for triggering Edge Function
- Edge Function has RLS protection
- Anon key is public-facing (designed for client use)
- Service role key stays secure in Edge Function

✅ **SQL Function Security:**
- Marked as `SECURITY DEFINER`
- Only callable by authorized users
- Logs all executions

## Monitoring

### Create a Monitoring Query

```sql
-- Save this as a favorite in SQL Editor for quick checks
SELECT
  entity_type,
  status,
  records_processed,
  last_sync_end,
  EXTRACT(EPOCH FROM (NOW() - last_sync_end))/3600 as hours_since_last_sync
FROM sync_status
WHERE entity_type IN ('guides', 'features', 'pages')
ORDER BY last_sync_end DESC
LIMIT 3;
```

### Set Up Alerts (Optional)

You can use Supabase webhooks to get notified of sync failures:

1. Go to **Database** → **Webhooks**
2. Create webhook on `sync_status` table
3. Trigger on `INSERT` where `status = 'failed'`
4. Send to Slack/Discord/Email

## Summary

Your cron job is now set up to:
- ✅ Run every 6 hours automatically
- ✅ Sync Pendo metadata (guides, features, pages)
- ✅ Update Supabase database
- ✅ Log results for monitoring
- ✅ No additional costs!

**Next sync:** Check `cron.job_run_details` table after the next scheduled time (00:00, 06:00, 12:00, or 18:00 UTC)

---

For questions or issues, check:
1. Edge Function logs
2. `sync_status` table
3. `cron.job_run_details` table
