# Pendo Data Sync Strategy

## Problem
Pendo has **400,000+ guide records** (and growing). Fetching all records in a single operation causes:
- **Supabase Edge Function timeout** (~30 seconds limit)
- **Memory exhaustion** in local scripts (JavaScript heap limit)
- **Expensive API calls** every sync

## Solution: Two-Tier Sync Approach

### 1. Incremental Sync (Automated via Cron)
**Function:** `sync-pendo-incremental`
**Schedule:** Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
**Limits:**
- 5,000 records per entity type (guides, features, pages)
- Total: ~15,000 records per sync

**Purpose:**
- Keeps data fresh with recent updates
- Avoids Edge Function timeout
- Uses upsert to update existing records

**Command to deploy:**
```bash
supabase functions deploy sync-pendo-incremental --project-ref nrutlzclujyejusvbafm
```

### 2. Full Sync (Manual, as needed)
**Script:** `scripts/sync-all-pendo-data.mjs`
**Schedule:** Run manually when needed (e.g., after major data changes)
**Limits:** None - fetches everything

**Purpose:**
- Initial data population
- Backfill missing historical data
- Recovery from data issues

**Command to run:**
```bash
node scripts/sync-all-pendo-data.mjs
```

**Note:** This script may run for 10+ minutes and consume significant memory. Run on a machine with adequate resources.

## Available Sync Functions

| Function | Purpose | Records | Timeout Risk | Use Case |
|----------|---------|---------|--------------|----------|
| `sync-pendo-incremental` | Lightweight, recent updates | 5,000/type | Low | Cron job (automated) |
| `sync-pendo-metadata` | Metadata only, no analytics | Unlimited | High | Legacy (deprecated) |
| `sync-pendo-data` | Full sync with analytics | Unlimited | High | Legacy (deprecated) |
| `sync-all-pendo-data.mjs` | Local full sync | Unlimited | N/A (no timeout) | Manual full sync |

## Database Tables

### Data Tables
- `pendo_guides` - Guide metadata and stats
- `pendo_features` - Feature metadata and usage
- `pendo_pages` - Page metadata and views
- `pendo_events` - Raw event data (future use)

### Monitoring
- `sync_status` - Tracks sync history and errors

## Updating the Cron Job

The cron job is configured in `supabase-cron-setup.sql`. To update:

1. Edit the SQL file
2. Run in Supabase SQL Editor
3. Verify with: `SELECT * FROM cron.job WHERE jobname LIKE '%pendo%';`

To manually trigger a sync:
```sql
SELECT call_pendo_sync_edge_function();
```

## Frontend Data Access

The frontend uses React Query hooks in `useSupabaseData.ts`:
- `useSupabaseGuides()` - Fetches up to 10,000 guides
- `useSupabaseFeatures()` - Fetches up to 10,000 features
- `useSupabasePages()` - Fetches up to 10,000 pages
- `useSupabaseDashboard()` - Combines all data sources

**Data freshness:** 5-minute cache, refetches every 6 hours (aligned with cron)

## Troubleshooting

### "WORKER_LIMIT" timeout error
**Cause:** Edge Function tried to fetch too many records
**Solution:** Use incremental sync or local script

### "JavaScript heap out of memory"
**Cause:** Local script tried to load too many records into memory
**Solution:** Run on machine with more RAM, or modify script to batch upserts

### Stale data in frontend
**Cause:** React Query cache not invalidated
**Solution:** Hard refresh or wait for 5-minute staleTime

### Missing recent records
**Cause:** Incremental sync only fetches first 5,000 records
**Solution:** Run full sync script: `node scripts/sync-all-pendo-data.mjs`

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Pendo API (400k+ guides)        │
└─────────────────┬───────────────────────┘
                  │
                  │
        ┌─────────┴──────────┐
        │                    │
        │                    │
   ┌────▼─────┐         ┌───▼────────┐
   │  Cron    │         │   Manual   │
   │  Job     │         │   Script   │
   │ (Every   │         │  (Full     │
   │ 6 hours) │         │   Sync)    │
   └────┬─────┘         └───┬────────┘
        │                   │
        │ 5k/type           │ All records
        │                   │
   ┌────▼───────────────────▼────────┐
   │    Supabase Database            │
   │  (pendo_guides, pendo_features, │
   │   pendo_pages, sync_status)     │
   └────┬────────────────────────────┘
        │
        │ React Query (useSupabaseData)
        │
   ┌────▼────────────────────────────┐
   │      Frontend Dashboard         │
   │  (DataTables.tsx, Charts, etc)  │
   └─────────────────────────────────┘
```

## Performance Metrics

### Incremental Sync
- **Duration:** ~10-15 seconds
- **Records synced:** 15,000 (5k × 3 types)
- **API calls:** ~30 (500 records per call)
- **Memory usage:** Low (~100MB)

### Full Sync (when it doesn't crash)
- **Duration:** 10+ minutes
- **Records synced:** 400,000+
- **API calls:** 800+ (500 records per call)
- **Memory usage:** High (4GB+ heap)

## Future Improvements

1. **Date-based incremental sync:** Only fetch records updated since last sync
2. **Parallel entity syncing:** Sync guides, features, pages simultaneously
3. **Chunked upserts:** Insert in smaller batches to reduce memory
4. **Analytics aggregation:** Pre-calculate metrics in Edge Function
5. **Real-time updates:** Use Supabase realtime for instant data updates
