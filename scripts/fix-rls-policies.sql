-- Fix RLS policies for pendo_events table
-- This ensures the Edge Function can query events for analytics calculation

-- Option 1: Disable RLS entirely (SIMPLEST - use for internal tools)
ALTER TABLE pendo_events DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS but allow service_role to bypass (RECOMMENDED)
-- First enable RLS
ALTER TABLE pendo_events ENABLE ROW LEVEL SECURITY;

-- Then create policy that allows service_role full access
DROP POLICY IF EXISTS "Service role can do everything" ON pendo_events;
CREATE POLICY "Service role can do everything"
ON pendo_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Option 3: Allow authenticated users to read events (for dashboard)
DROP POLICY IF EXISTS "Authenticated users can read events" ON pendo_events;
CREATE POLICY "Authenticated users can read events"
ON pendo_events
FOR SELECT
TO authenticated
USING (true);

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'pendo_events';

-- Test query (should work now)
SELECT COUNT(*) FROM pendo_events WHERE entity_type = 'guide';
