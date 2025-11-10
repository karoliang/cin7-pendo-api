#!/usr/bin/env node

/**
 * RE-ENABLE CRONJOB SCRIPT
 *
 * This script safely re-enables the automated Pendo data sync cronjob
 * after confirming the Edge Function is working correctly.
 *
 * Prerequisites:
 * - Edge Function has been manually tested and verified safe
 * - Analytics are NOT being zeroed out
 * - SERVICE_ROLE_KEY has access to pendo_events table
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

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔄 CRONJOB RE-ENABLEMENT SCRIPT\n');
console.log('='.repeat(80));

async function step1_PreFlightCheck() {
  console.log('\n📊 STEP 1: Pre-Flight Safety Check\n');

  // Check current analytics baseline
  const { count: guidesWithViews } = await client
    .from('pendo_guides')
    .select('id', { count: 'exact', head: true })
    .gt('views', 0);

  console.log(`   Current Analytics Baseline:`);
  console.log(`   - Guides with views: ${guidesWithViews}`);

  if (guidesWithViews < 80) {
    console.log(`\n   ⚠️  WARNING: Only ${guidesWithViews} guides have views (expected ~92)`);
    console.log(`   This might indicate analytics have already been affected.`);
    console.log(`   Recommendation: Run manual sync first to restore data.\n`);
    return { safe: false, guidesWithViews };
  }

  console.log(`   ✅ Analytics look healthy (${guidesWithViews} guides with views)\n`);
  return { safe: true, guidesWithViews };
}

async function step2_CheckCurrentCronjobStatus() {
  console.log('📊 STEP 2: Check Current Cronjob Status\n');

  try {
    // Query cron.job table to see if cronjob exists
    const { data: jobs, error } = await client
      .rpc('sql', {
        query: `SELECT jobname, schedule, active, command
                FROM cron.job
                WHERE jobname LIKE '%pendo%'`
      });

    if (error) {
      console.log(`   ℹ️  Cannot query cron.job directly (requires SQL Editor)`);
      console.log(`   We'll re-create the cronjob schedule.\n`);
      return null;
    }

    if (jobs && jobs.length > 0) {
      console.log(`   Found ${jobs.length} Pendo cronjob(s):`);
      jobs.forEach(job => {
        console.log(`   - ${job.jobname}`);
        console.log(`     Schedule: ${job.schedule}`);
        console.log(`     Active: ${job.active}`);
        console.log(`     Command: ${job.command}\n`);
      });
      return jobs;
    } else {
      console.log(`   ✅ No active Pendo cronjobs found (as expected)\n`);
      return [];
    }
  } catch (err) {
    console.log(`   ℹ️  Cronjob status check requires SQL Editor access\n`);
    return null;
  }
}

async function step3_TestEdgeFunction() {
  console.log('📊 STEP 3: Test Edge Function Once More\n');

  const url = `${SUPABASE_URL}/functions/v1/sync-pendo-incremental`;

  console.log(`   Triggering: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Edge Function failed: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorText}\n`);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log(`   ✅ Edge Function executed successfully`);
    console.log(`   Results:`);
    console.log(`      - Guides synced: ${result.results?.guides || 0}`);
    console.log(`      - Features synced: ${result.results?.features || 0}`);
    console.log(`      - Pages synced: ${result.results?.pages || 0}`);
    console.log(`      - Events synced: ${result.results?.events || 0}\n`);

    return { success: true, result };
  } catch (error) {
    console.log(`   ❌ Edge Function trigger failed: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function step4_VerifyAnalyticsIntact() {
  console.log('📊 STEP 4: Verify Analytics Are Still Intact\n');

  console.log('   Waiting 5 seconds for Edge Function to complete...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const { count: guidesWithViews } = await client
    .from('pendo_guides')
    .select('id', { count: 'exact', head: true })
    .gt('views', 0);

  console.log(`   Post-sync Analytics:`);
  console.log(`   - Guides with views: ${guidesWithViews}`);

  if (guidesWithViews < 80) {
    console.log(`\n   ❌ CRITICAL: Analytics have been affected!`);
    console.log(`   Guides with views dropped to ${guidesWithViews}`);
    console.log(`   DO NOT RE-ENABLE CRONJOB. Investigate Edge Function logs.\n`);
    return { safe: false, guidesWithViews };
  }

  console.log(`   ✅ Analytics are intact! Safe to proceed.\n`);
  return { safe: true, guidesWithViews };
}

async function step5_GenerateReenableSQL() {
  console.log('📊 STEP 5: Generate Re-Enable SQL Commands\n');

  const sql = `-- Re-enable Pendo Data Sync Cronjob
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/your-supabase-project-id/sql

-- Re-create the cronjob schedule
SELECT cron.schedule(
  'sync-pendo-incremental-every-6-hours',
  '0 */6 * * *',
  $$SELECT call_pendo_sync_edge_function();$$
);

-- Verify the cronjob is scheduled
SELECT
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname LIKE '%pendo%';

-- Check when it will run next (should be next 00:00, 06:00, 12:00, or 18:00 UTC)
SELECT
  jobname,
  last_run,
  next_run
FROM cron.job_run_details
WHERE jobname = 'sync-pendo-incremental-every-6-hours'
ORDER BY run_time DESC
LIMIT 1;
`;

  console.log('   SQL Commands Generated:\n');
  console.log('   ' + '-'.repeat(76));
  console.log(sql.split('\n').map(line => '   ' + line).join('\n'));
  console.log('   ' + '-'.repeat(76));
  console.log('');

  // Save to file
  const sqlPath = './scripts/reenable-cronjob.sql';
  fs.writeFileSync(sqlPath, sql);
  console.log(`   ✅ SQL commands saved to: ${sqlPath}\n`);

  return sqlPath;
}

async function step6_Instructions() {
  console.log('📊 STEP 6: Manual Steps Required\n');

  console.log('   ⚠️  NOTE: Cronjob re-enablement requires Supabase SQL Editor\n');
  console.log('   NEXT STEPS:\n');
  console.log('   1️⃣  Open Supabase SQL Editor:');
  console.log('      https://supabase.com/dashboard/project/your-supabase-project-id/sql\n');
  console.log('   2️⃣  Run the SQL from: scripts/reenable-cronjob.sql\n');
  console.log('   3️⃣  Verify the cronjob is scheduled (check the query results)\n');
  console.log('   4️⃣  Monitor for next 24 hours:');
  console.log('      node scripts/verify-cronjob-status.mjs\n');
  console.log('   5️⃣  Check sync_status table in Supabase to see runs:\n');
  console.log('      SELECT * FROM sync_status ORDER BY last_sync_end DESC LIMIT 5;\n');
  console.log('   MONITORING:\n');
  console.log('   - Cronjob runs at: 00:00, 06:00, 12:00, 18:00 UTC');
  console.log('   - Check Edge Function logs: https://supabase.com/dashboard/project/your-supabase-project-id/functions');
  console.log('   - Verify guides with views stays ~92+ (not dropping)\n');
  console.log('   ROLLBACK (if analytics get zeroed):');
  console.log('   - Run: SELECT cron.unschedule(\'sync-pendo-incremental-every-6-hours\');');
  console.log('   - Restore data: node scripts/sync-all-pendo-data-batched.mjs\n');
}

async function run() {
  try {
    // Step 1: Pre-flight check
    const preCheck = await step1_PreFlightCheck();
    if (!preCheck.safe) {
      console.log('='.repeat(80));
      console.log('\n❌ PRE-FLIGHT CHECK FAILED\n');
      console.log('   Analytics baseline is too low. Run manual sync first:\n');
      console.log('   node scripts/sync-all-pendo-data-batched.mjs\n');
      process.exit(1);
    }

    // Step 2: Check current cronjob status
    await step2_CheckCurrentCronjobStatus();

    // Step 3: Test Edge Function
    const edgeTest = await step3_TestEdgeFunction();
    if (!edgeTest.success) {
      console.log('='.repeat(80));
      console.log('\n❌ EDGE FUNCTION TEST FAILED\n');
      console.log('   Edge Function is not working correctly.');
      console.log('   Check Edge Function logs before re-enabling cronjob.\n');
      process.exit(1);
    }

    // Step 4: Verify analytics intact
    const postCheck = await step4_VerifyAnalyticsIntact();
    if (!postCheck.safe) {
      console.log('='.repeat(80));
      console.log('\n❌ ANALYTICS VERIFICATION FAILED\n');
      console.log('   Edge Function is zeroing analytics. DO NOT re-enable cronjob.\n');
      process.exit(1);
    }

    // Step 5: Generate SQL
    await step5_GenerateReenableSQL();

    // Step 6: Instructions
    await step6_Instructions();

    console.log('='.repeat(80));
    console.log('\n✅ ALL CHECKS PASSED - SAFE TO RE-ENABLE CRONJOB\n');
    console.log('   Follow the instructions above to complete re-enablement.\n');

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

run().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
