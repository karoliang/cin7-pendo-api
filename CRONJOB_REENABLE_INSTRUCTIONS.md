
INSTRUCTIONS TO RE-ENABLE CRONJOB:

1️⃣  FIX RLS POLICIES (REQUIRED FIRST):
   - Go to: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/sql
   - Run the SQL from: scripts/fix-rls-policies.sql
   - Choose Option 1 (disable RLS) or Option 2 (enable with service_role bypass)

2️⃣  VERIFY THE FIX:
   - Run this script again: node scripts/fix-and-reenable-cronjob.mjs
   - Confirm "SERVICE_ROLE_KEY: Can access pendo_events" shows ✅
   - Confirm analytics calculation works

3️⃣  RE-ENABLE THE CRONJOB:
   - Go to: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/sql
   - Run this SQL:

     SELECT cron.schedule(
       'sync-pendo-incremental-every-6-hours',
       '0 */6 * * *',
       $$SELECT call_pendo_sync_edge_function();$$
     );

4️⃣  VERIFY CRONJOB IS RUNNING:
   - Wait for next scheduled time (00:00, 06:00, 12:00, or 18:00 UTC)
   - Or manually trigger: SELECT call_pendo_sync_edge_function();
   - Check sync_status table:
     SELECT * FROM sync_status ORDER BY last_sync_end DESC LIMIT 5;

5️⃣  MONITOR FOR 24 HOURS:
   - Run: node scripts/verify-cronjob-status.mjs
   - Confirm analytics are NOT being zeroed out
   - Check that guides with views remain >0

ROLLBACK IF ISSUES:
   If analytics start getting zeroed out again:
   - Immediately disable: SELECT cron.unschedule('sync-pendo-incremental-every-6-hours');
   - Report issue with Edge Function logs
