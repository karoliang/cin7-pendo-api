# Deploy Simplified Pendo Analytics Sync Function

## Quick Deployment Guide

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm
   - Navigate to: Edge Functions

2. **Create New Function**
   - Click "Create a new function"
   - Name: `sync-pendo-analytics-simple`
   - Copy the code from: `supabase/functions/sync-pendo-analytics-simple/index.ts`
   - Paste into the editor
   - Click "Deploy"

3. **Verify Environment Variables**
   Ensure these secrets are set in Supabase:
   - `PENDO_API_KEY` = `f4acdb2c-038c-4de1-a88b-ab90423037bf.us`
   - `SUPABASE_URL` = `https://nrutlzclujyejusvbafm.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)

### Option 2: Command Line (If you have access)

```bash
# From project root
supabase functions deploy sync-pendo-analytics-simple --project-ref nrutlzclujyejusvbafm
```

## Testing the Deployment

Once deployed, test with:

```bash
curl -X POST \
  "https://nrutlzclujyejusvbafm.supabase.co/functions/v1/sync-pendo-analytics-simple" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRsemNsdWp5ZWp1c3ZiYWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTM4MTAsImV4cCI6MjA3Nzk4OTgxMH0.wailzK_IBHtUig3sdragy-WVcyZDxrQEQaCt76AD130" \
  --max-time 120
```

**Expected Response:**
```json
{
  "success": true,
  "duration": "5.23s",
  "summary": {
    "guides": 15,
    "features": 42,
    "pages": 67
  }
}
```

## Verify Data in Database

After successful sync, check the data:

```sql
-- Check guides
SELECT
  name,
  views,
  completions,
  completion_rate,
  last_synced
FROM pendo_guides
WHERE views > 0
LIMIT 10;

-- Check features
SELECT
  name,
  usage_count,
  unique_users,
  last_synced
FROM pendo_features
WHERE usage_count > 0
LIMIT 10;

-- Check pages
SELECT
  name,
  views,
  unique_visitors,
  last_synced
FROM pendo_pages
WHERE views > 0
LIMIT 10;
```

## Set Up Automated Daily Sync (Optional)

Once the function works, add a daily cron job:

```sql
-- Run every day at 1 AM UTC
SELECT cron.schedule(
  'sync-pendo-analytics-simple-daily',
  '0 1 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://nrutlzclujyejusvbafm.supabase.co/functions/v1/sync-pendo-analytics-simple',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

## Troubleshooting

### If you get "Pendo API error"
- Verify `PENDO_API_KEY` is correct in Supabase secrets
- Check Pendo API key is valid: https://app.pendo.io/admin

### If you get "Supabase error"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check database tables exist: `pendo_guides`, `pendo_features`, `pendo_pages`

### If data doesn't appear in dashboard
- Wait 30 seconds for dashboard to refresh
- Check browser console for errors
- Verify data exists in database with SQL queries above

## What's Different from Old Function?

**Old Function (`sync-pendo-analytics`):**
- Used complex Pendo Aggregation API
- Required specific pipeline syntax
- Failed with "Bad Request" error
- Only worked on paid Pendo plans

**New Function (`sync-pendo-analytics-simple`):**
- Uses basic Pendo REST API (`/api/v1/guide`, `/api/v1/feature`, `/api/v1/page`)
- Extracts data from `pollData` fields
- Works on Pendo free tier
- Simpler, more reliable, easier to debug
