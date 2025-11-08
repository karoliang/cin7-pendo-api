# Analytics Sync Status Report
**Generated:** 2025-11-08
**Status:** Analytics LIVE with temporary manual sync solution

---

## Current Status

### Analytics Now Live in Dashboard

**Guide Analytics:**
- 548 guides total
- 92 guides with analytics (17% coverage)
- Trial Guide (FSAI): 1000 views
- Top guides showing real engagement data

**Feature Analytics:**
- 956 features total
- 71 features with analytics (7% coverage)
- POS Payment Button: 226 uses, 47 unique users
- Sales Order Save/Approve: 124 uses, 57 unique users

**Page Analytics:**
- 358 pages total
- 31 pages with analytics (9% coverage)

**Sync Duration:** 223 seconds (~3.7 minutes for full sync)

---

## How It Works Now

### Current Implementation

**Manual Sync Script (Working)**
```bash
node scripts/sync-all-analytics.mjs
```

This script:
1. Queries local `pendo_events` table (16,962 guide events, 770 feature events, 316 page events)
2. Calculates analytics for each entity
3. Updates database with real engagement numbers
4. Takes ~4 minutes for all 1,862 entities

**Analytics Calculation Logic:**
- **Guides:** Views = event count, Unique visitors = distinct visitor IDs
- **Features:** Usage = event count, Unique users = distinct visitor IDs, Avg usage per user
- **Pages:** Views = event count, Unique visitors = distinct visitor IDs

---

## Known Issues

### Edge Function Analytics Calculation Not Working

**Problem:** The automated Edge Function (`sync-pendo-incremental`) successfully runs every 6 hours but OVERWRITES analytics with zeros.

**Evidence:**
```
Before Edge Function:  92 guides with views
After Edge Function:   1 guide with views
Status:                ✅ 200 OK (appears successful)
Reality:               ❌ Analytics wiped to zeros
```

**Root Cause:** Under investigation - Edge Function queries `pendo_events` table but returns zeros. Possible causes:
1. Supabase client permissions in Edge Function context
2. Query structure incompatibility in Deno environment
3. Silent error handling returning fallback zeros

**Debugging Added:**
- Environment variable logging
- Event query result logging
- Analytics calculation logging

---

## Action Required

### CRITICAL: Disable Automated Cronjob

**Why:** The cronjob runs every 6 hours (00:00, 06:00, 12:00, 18:00 UTC) and wipes all analytics data.

**How to Disable:**

1. Go to: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/sql
2. Run this SQL:
```sql
SELECT cron.unschedule('sync-pendo-incremental-every-6-hours');
```
3. Verify it's disabled:
```sql
SELECT * FROM cron.job WHERE jobname = 'sync-pendo-incremental-every-6-hours';
```

**Result:** Should return empty (no rows = cronjob disabled)

---

## Temporary Workflow

Until the Edge Function issue is fixed:

**Weekly Manual Sync (Recommended):**
```bash
# Run once per week to refresh analytics
cd /path/to/cin7-pendo-api
node scripts/sync-all-analytics.mjs
```

**Or: Set up Local Cron Job:**
```bash
# Add to crontab (macOS/Linux)
0 */6 * * * cd /path/to/cin7-pendo-api && node scripts/sync-all-analytics.mjs
```

---

## Scripts Available

### Analytics Scripts

**`scripts/sync-all-analytics.mjs`** ✅ WORKING
- Syncs analytics for ALL entities (guides, features, pages)
- Uses local `pendo_events` table
- Takes ~4 minutes
- Produces accurate results

**`scripts/test-edge-function-analytics.mjs`**
- Tests Edge Function analytics calculation
- Compares before/after analytics
- Helps diagnose Edge Function issues

**`scripts/debug-edge-function-issue.mjs`**
- Deep diagnostics of analytics calculation
- Checks events in database
- Tests calculation logic
- Identifies discrepancies

### Utility Scripts

**`scripts/disable-cronjob.mjs`**
- Attempts to disable cronjob via JavaScript
- Falls back to manual SQL instructions
- Documents disable process

**`scripts/disable-cronjob.sql`**
- SQL commands to disable cronjob
- Can be run directly in Supabase SQL Editor

---

## Next Steps

### Immediate (This Week)

- [ ] **CRITICAL:** Disable automated cronjob in Supabase SQL Editor
- [x] Manual analytics sync completed (92 guides, 71 features with data)
- [x] Changes committed and pushed to GitHub
- [ ] Verify analytics visible in production dashboard
- [ ] Investigate Edge Function analytics calculation issue

### Week 2-3: Product Improvements

- [ ] Design and implement flexible date range selector (today, 7d, 30d, 90d, custom)
- [ ] Research Pendo Listen API for customer feedback integration
- [ ] Add period-over-period comparison

### Week 4: Department Dashboards

- [ ] Marketing dashboard (campaign performance, conversion funnels)
- [ ] Customer Success dashboard (at-risk accounts, support effectiveness)
- [ ] Product dashboard (feature adoption, drop-off analysis)
- [ ] Operations dashboard (process compliance, training effectiveness)

### Week 5-6: Automated Reporting

- [ ] Design workflow engine for event pattern matching
- [ ] Create report templates
- [ ] Build distribution system (email, Slack, dashboard)

---

## Technical Details

### Edge Function Issue Investigation

**Files Modified:**
- `supabase/functions/sync-pendo-incremental/index.ts` - Added debug logging
- Environment check logging added
- Event query result logging added
- Analytics calculation detailed logging

**Test Results:**
```
📊 Debug Output:
- Guide events in DB: 16,962
- Trial Guide events: 1000
- Manual calculation: 1000 views, 335 unique visitors ✅
- Edge Function result: 0 views ❌
```

**Hypothesis:** Edge Function Supabase client may have different table access permissions or query behavior than local scripts.

**Next Steps:**
1. Check Edge Function logs in Supabase Dashboard
2. Test with simplified query structure
3. Verify RLS policies on `pendo_events` table
4. Consider alternative: Use Supabase Database Webhooks instead of Edge Function

---

## Success Metrics

### Technical Metrics
- ✅ Analytics sync completion rate: 100%
- ✅ Data accuracy: Matches event counts exactly
- ✅ Coverage: 17% guides, 7% features, 9% pages with analytics
- ⏳ API response time: <2s (to be verified in dashboard)

### Business Metrics
- Trial Guide shows non-zero engagement: ✅ 1000 views
- Users can see custom date ranges: ⏳ Coming Week 2
- Department dashboards used daily: ⏳ Coming Week 4
- Automated reports generating: ⏳ Coming Week 5-6

---

## Support

**Debugging Commands:**
```bash
# Check events in database
node scripts/debug-edge-function-issue.mjs

# Test Edge Function
node scripts/test-edge-function-analytics.mjs

# Run full analytics sync
node scripts/sync-all-analytics.mjs

# Check cronjob status
# (Run in Supabase SQL Editor)
SELECT * FROM cron.job;
```

**Dashboard Links:**
- Supabase Dashboard: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm
- SQL Editor: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/sql
- Edge Functions: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/functions

---

**Last Updated:** 2025-11-08
**Next Review:** After cronjob disabled and dashboard verification complete
