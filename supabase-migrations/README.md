# Supabase Migrations

This directory contains database migration files that need to be applied to the Supabase database.

## How to Apply Migrations

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file you want to apply
4. Copy the contents
5. Paste into a new query in the SQL Editor
6. Click **Run** to execute

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed:

```bash
# Apply a specific migration
supabase db execute -f supabase-migrations/003_add_usage_heatmap_function.sql

# Or connect directly and run
psql $DATABASE_URL < supabase-migrations/003_add_usage_heatmap_function.sql
```

## Migration Files

### 002_add_reports_table.sql
Adds the `pendo_reports` table to store Pendo report data.

### 003_add_usage_heatmap_function.sql
Creates the `get_usage_heatmap()` PostgreSQL function for the Usage Heatmap dashboard component.

**Purpose:** Aggregates event data by day of week and hour for heatmap visualization.

**Usage:**
```sql
SELECT * FROM get_usage_heatmap(
  '2024-01-01'::timestamptz,
  '2024-12-31'::timestamptz
);
```

**Required for:** Usage Heatmap component (Phase 1.2)

## Verification

After applying a migration, verify it was successful:

```sql
-- Check if function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_usage_heatmap';

-- Test the function
SELECT * FROM get_usage_heatmap(
  NOW() - INTERVAL '7 days',
  NOW()
) LIMIT 10;
```
