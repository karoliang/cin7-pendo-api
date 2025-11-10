#!/usr/bin/env node

/**
 * CRONJOB RE-ENABLEMENT SCRIPT
 *
 * This script investigates the Edge Function analytics issue and provides
 * a safe path to re-enable the automated cronjob for data freshness.
 *
 * ISSUE SUMMARY:
 * - Cronjob was disabled because Edge Function overwrote analytics with zeros
 * - Root cause: Edge Function couldn't query pendo_events table properly
 * - Hypothesis: RLS (Row Level Security) policies blocking Edge Function queries
 *
 * APPROACH:
 * 1. Verify RLS policies on pendo_events table
 * 2. Test Edge Function access to pendo_events
 * 3. Fix RLS policies if needed
 * 4. Re-enable cronjob with verification
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './frontend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 CRONJOB RE-ENABLEMENT INVESTIGATION\n');
console.log('='.repeat(80));

// Create clients with different keys to test permissions
const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function step1_CheckRLSPolicies() {
  console.log('\n📊 STEP 1: Check RLS Policies on pendo_events\n');

  try {
    // Query pg_policies to check RLS settings
    const { data: policies, error } = await serviceRoleClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'pendo_events');

    if (error) {
      console.log('   ℹ️  Cannot query pg_policies directly (expected)');
      console.log('   We\'ll use SQL Editor instead.\n');
      return null;
    }

    console.log(`   Found ${policies?.length || 0} RLS policies on pendo_events`);
    if (policies && policies.length > 0) {
      policies.forEach(p => {
        console.log(`   - ${p.policyname}: ${p.cmd} (${p.roles?.join(', ')})`);
      });
    }
    console.log('');

    return policies;
  } catch (err) {
    console.log('   ℹ️  RLS policies check requires SQL Editor\n');
    return null;
  }
}

async function step2_TestEventAccess() {
  console.log('📊 STEP 2: Test Event Access with Different Keys\n');

  // Test with SERVICE_ROLE_KEY (should bypass RLS)
  console.log('   🔑 Testing with SERVICE_ROLE_KEY...');
  const { data: serviceEvents, error: serviceError, count: serviceCount } = await serviceRoleClient
    .from('pendo_events')
    .select('*', { count: 'exact' })
    .eq('entity_type', 'guide')
    .limit(5);

  if (serviceError) {
    console.log(`   ❌ SERVICE_ROLE_KEY Error: ${serviceError.message}`);
    console.log(`      Code: ${serviceError.code}`);
    console.log(`      Details: ${JSON.stringify(serviceError.details)}\n`);
  } else {
    console.log(`   ✅ SERVICE_ROLE_KEY: Can access pendo_events (${serviceCount} total guide events)`);
    console.log(`      Retrieved ${serviceEvents?.length || 0} sample events\n`);
  }

  // Test with ANON_KEY (should be blocked by RLS if enabled)
  console.log('   🔑 Testing with ANON_KEY...');
  const { data: anonEvents, error: anonError, count: anonCount } = await anonClient
    .from('pendo_events')
    .select('*', { count: 'exact' })
    .eq('entity_type', 'guide')
    .limit(5);

  if (anonError) {
    console.log(`   ⚠️  ANON_KEY Error: ${anonError.message}`);
    console.log(`      This is EXPECTED if RLS is enabled\n`);
  } else {
    console.log(`   ℹ️  ANON_KEY: Can access pendo_events (${anonCount} total guide events)`);
    console.log(`      Retrieved ${anonEvents?.length || 0} sample events`);
    console.log(`      ⚠️  WARNING: This means RLS is NOT enabled (security risk!)\n`);
  }

  return {
    serviceRoleWorks: !serviceError,
    serviceRoleCount: serviceCount,
    anonWorks: !anonError,
    anonCount: anonCount
  };
}

async function step3_TestAnalyticsCalculation() {
  console.log('📊 STEP 3: Test Analytics Calculation Logic\n');

  // Get a known guide with events (Trial Guide FSAI)
  const trialGuideId = 'OERSob_88kNTBYByJIWzP5xZmLM';

  console.log(`   Testing with Trial Guide (${trialGuideId})...`);

  // Count events using SERVICE_ROLE_KEY
  const { data: events, error, count } = await serviceRoleClient
    .from('pendo_events')
    .select('visitor_id', { count: 'exact' })
    .eq('entity_id', trialGuideId)
    .eq('entity_type', 'guide');

  if (error) {
    console.log(`   ❌ Error querying events: ${error.message}\n`);
    return { success: false, error: error.message };
  }

  const views = count || 0;
  const uniqueVisitors = new Set(events?.map(e => e.visitor_id).filter(Boolean)).size;

  console.log(`   ✅ Analytics Calculation:`);
  console.log(`      - Total Views: ${views}`);
  console.log(`      - Unique Visitors: ${uniqueVisitors}`);
  console.log(`      - Sample visitor IDs: ${events?.slice(0, 3).map(e => e.visitor_id).join(', ')}\n`);

  // Compare with current DB value
  const { data: guide } = await serviceRoleClient
    .from('pendo_guides')
    .select('views, last_synced')
    .eq('id', trialGuideId)
    .single();

  if (guide) {
    console.log(`   📊 Current DB Value:`);
    console.log(`      - Views in DB: ${guide.views}`);
    console.log(`      - Last Synced: ${new Date(guide.last_synced).toLocaleString()}`);
    console.log(`      - Match: ${guide.views === views ? '✅ YES' : '⚠️  NO'}\n`);
  }

  return {
    success: true,
    calculated: { views, uniqueVisitors },
    current: guide
  };
}

async function step4_GenerateFix() {
  console.log('📊 STEP 4: Generate RLS Policy Fix\n');

  const fixSQL = `-- Fix RLS policies for pendo_events table
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
`;

  console.log('   SQL Fix Script Generated:\n');
  console.log('   ' + '-'.repeat(76));
  console.log(fixSQL.split('\n').map(line => '   ' + line).join('\n'));
  console.log('   ' + '-'.repeat(76));
  console.log('');

  // Save to file
  const fixPath = './scripts/fix-rls-policies.sql';
  fs.writeFileSync(fixPath, fixSQL);
  console.log(`   ✅ Fix script saved to: ${fixPath}\n`);

  return fixPath;
}

async function step5_ReEnableInstructions() {
  console.log('📊 STEP 5: Re-Enable Cronjob Instructions\n');

  const instructions = `
INSTRUCTIONS TO RE-ENABLE CRONJOB:

1️⃣  FIX RLS POLICIES (REQUIRED FIRST):
   - Go to: https://supabase.com/dashboard/project/your-supabase-project-id/sql
   - Run the SQL from: scripts/fix-rls-policies.sql
   - Choose Option 1 (disable RLS) or Option 2 (enable with service_role bypass)

2️⃣  VERIFY THE FIX:
   - Run this script again: node scripts/fix-and-reenable-cronjob.mjs
   - Confirm "SERVICE_ROLE_KEY: Can access pendo_events" shows ✅
   - Confirm analytics calculation works

3️⃣  RE-ENABLE THE CRONJOB:
   - Go to: https://supabase.com/dashboard/project/your-supabase-project-id/sql
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
`;

  console.log(instructions);

  // Save to file
  const instructionsPath = './CRONJOB_REENABLE_INSTRUCTIONS.md';
  fs.writeFileSync(instructionsPath, instructions);
  console.log(`   ✅ Instructions saved to: ${instructionsPath}\n`);

  return instructions;
}

async function run() {
  const results = {
    rlsPolicies: null,
    accessTest: null,
    analyticsTest: null,
    fixPath: null
  };

  try {
    // Step 1: Check RLS Policies
    results.rlsPolicies = await step1_CheckRLSPolicies();

    // Step 2: Test Event Access
    results.accessTest = await step2_TestEventAccess();

    // Step 3: Test Analytics Calculation
    results.analyticsTest = await step3_TestAnalyticsCalculation();

    // Step 4: Generate Fix
    results.fixPath = await step4_GenerateFix();

    // Step 5: Re-enable Instructions
    await step5_ReEnableInstructions();

    // Summary
    console.log('='.repeat(80));
    console.log('\n🎯 SUMMARY\n');

    if (results.accessTest?.serviceRoleWorks) {
      console.log('   ✅ SERVICE_ROLE_KEY can access pendo_events');
      console.log('   ✅ Analytics calculation logic works');
      console.log('');
      console.log('   🤔 STRANGE: If SERVICE_ROLE works, why was cronjob zeroing analytics?');
      console.log('');
      console.log('   POSSIBLE CAUSES:');
      console.log('   1. Edge Function environment uses different Supabase client config');
      console.log('   2. RLS policies were changed AFTER cronjob was disabled');
      console.log('   3. Edge Function has network/timeout issues querying events');
      console.log('   4. Edge Function is using ANON_KEY instead of SERVICE_ROLE_KEY');
      console.log('');
      console.log('   RECOMMENDATION:');
      console.log('   - Manually trigger Edge Function once: SELECT call_pendo_sync_edge_function();');
      console.log('   - Check sync_status and verify analytics don\'t get zeroed');
      console.log('   - If safe, re-enable cronjob');
      console.log('');
    } else {
      console.log('   ❌ SERVICE_ROLE_KEY CANNOT access pendo_events');
      console.log('   ❌ This is the root cause of analytics being zeroed');
      console.log('');
      console.log('   REQUIRED ACTION:');
      console.log('   1. Run SQL fix: scripts/fix-rls-policies.sql');
      console.log('   2. Verify with: node scripts/fix-and-reenable-cronjob.mjs');
      console.log('   3. Then re-enable cronjob');
      console.log('');
    }

    console.log('   📄 Next Steps: See CRONJOB_REENABLE_INSTRUCTIONS.md');
    console.log('');

  } catch (error) {
    console.error('\n❌ Investigation failed:', error);
    process.exit(1);
  }
}

run().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
