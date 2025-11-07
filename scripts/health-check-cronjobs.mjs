#!/usr/bin/env node

// Cronjob Health Check
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
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log('⏰ CRONJOB HEALTH CHECK\n');
console.log('=' .repeat(80));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCronJobStatus() {
  console.log('\n📋 CHECKING CRON JOB STATUS:\n');

  try {
    // Query cron.job table for our job
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT
            jobid,
            jobname,
            schedule,
            active,
            nodename,
            database
          FROM cron.job
          WHERE jobname LIKE '%pendo%'
        `
      });

    if (error) {
      // Try alternative approach without RPC
      console.log('⚠️  Cannot query cron.job directly (requires service role key)');
      console.log('   Using sync_status table instead...\n');
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ Cron Jobs Found:\n');
      data.forEach(job => {
        console.log(`   Job Name: ${job.jobname}`);
        console.log(`   Schedule: ${job.schedule}`);
        console.log(`   Active: ${job.active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Job ID: ${job.jobid}`);
        console.log('');
      });
      return true;
    } else {
      console.log('⚠️  No Pendo cron jobs found in database');
      console.log('   Run supabase-cron-setup.sql to configure');
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Cannot check cron jobs: ${error.message}`);
    return false;
  }
}

async function checkSyncHistory() {
  console.log('\n📊 SYNC HISTORY (Last 10 syncs):\n');

  try {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .order('last_sync_end', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('⚠️  No sync history found');
      console.log('   This could mean:');
      console.log('   1. Cron job hasn\'t run yet (runs every 6 hours)');
      console.log('   2. sync_status table doesn\'t exist');
      console.log('   3. Syncs are failing silently\n');
      return false;
    }

    // Group by entity type
    const byEntity = {};
    data.forEach(row => {
      if (!byEntity[row.entity_type]) {
        byEntity[row.entity_type] = [];
      }
      byEntity[row.entity_type].push(row);
    });

    Object.keys(byEntity).forEach(entityType => {
      console.log(`\n   ${entityType.toUpperCase()}:`);
      const syncs = byEntity[entityType];

      syncs.forEach((sync, i) => {
        if (i < 3) { // Show last 3 per entity
          const statusIcon = sync.status === 'success' ? '✅' : (sync.status === 'failed' ? '❌' : '⏳');
          const time = new Date(sync.last_sync_end);
          const hoursAgo = ((Date.now() - time.getTime()) / 3600000).toFixed(1);

          console.log(`     ${statusIcon} ${time.toLocaleString()}`);
          console.log(`        Status: ${sync.status}`);
          console.log(`        Records: ${sync.records_processed || 0}`);
          console.log(`        Time ago: ${hoursAgo} hours`);

          if (sync.error_message) {
            console.log(`        Error: ${sync.error_message.substring(0, 100)}...`);
          }
        }
      });
    });

    // Check if syncs are recent
    const mostRecent = new Date(data[0].last_sync_end);
    const hoursSince = (Date.now() - mostRecent.getTime()) / 3600000;

    console.log('\n\n   ⏱️  TIME SINCE LAST SYNC:');
    console.log(`   ${hoursSince.toFixed(1)} hours ago`);

    if (hoursSince > 7) {
      console.log('   ⚠️  WARNING: Last sync was over 7 hours ago!');
      console.log('   Expected frequency: Every 6 hours');
      return false;
    } else if (hoursSince > 6.5) {
      console.log('   ⚠️  Sync might be overdue (should run every 6 hours)');
      return true;
    } else {
      console.log('   ✅ Sync schedule is on track');
      return true;
    }

  } catch (error) {
    console.log(`❌ Error checking sync history: ${error.message}`);
    return false;
  }
}

async function checkDataFreshness() {
  console.log('\n\n🕐 DATA FRESHNESS:\n');

  const tables = [
    { name: 'pendo_guides', dateColumn: 'lastUpdatedAt' },
    { name: 'pendo_features', dateColumn: 'lastUpdatedAt' },
    { name: 'pendo_pages', dateColumn: 'lastUpdatedAt' }
  ];

  for (const table of tables) {
    try {
      // Get most recent update
      const { data, error } = await supabase
        .from(table.name)
        .select(table.dateColumn)
        .order(table.dateColumn, { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastUpdate = new Date(data[0][table.dateColumn]);
        const daysOld = (Date.now() - lastUpdate.getTime()) / 86400000;

        let status = '✅';
        if (daysOld > 7) status = '❌';
        else if (daysOld > 2) status = '⚠️ ';

        console.log(`   ${status} ${table.name.padEnd(20)} - Last update: ${lastUpdate.toLocaleDateString()} (${daysOld.toFixed(1)} days ago)`);
      } else {
        console.log(`   ⚠️  ${table.name.padEnd(20)} - No data`);
      }
    } catch (error) {
      console.log(`   ❌ ${table.name.padEnd(20)} - Error: ${error.message}`);
    }
  }
}

async function checkNextScheduledRun() {
  console.log('\n\n🔮 NEXT SCHEDULED SYNC:\n');

  try {
    const { data, error } = await supabase
      .from('sync_status')
      .select('last_sync_end')
      .order('last_sync_end', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      console.log('   ⚠️  Cannot determine next run (no sync history)');
      console.log('   Cron runs every 6 hours at: 00:00, 06:00, 12:00, 18:00 UTC');
      return;
    }

    const lastSync = new Date(data[0].last_sync_end);
    const now = new Date();

    // Calculate next run times (every 6 hours at :00)
    const nextRuns = [];
    for (let hour = 0; hour < 24; hour += 6) {
      const nextRun = new Date(now);
      nextRun.setUTCHours(hour, 0, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      nextRuns.push(nextRun);
    }

    nextRuns.sort((a, b) => a - b);
    const nextRun = nextRuns[0];

    const hoursUntil = (nextRun - now) / 3600000;

    console.log(`   Last sync: ${lastSync.toLocaleString()}`);
    console.log(`   Next sync: ${nextRun.toLocaleString()} (in ${hoursUntil.toFixed(1)} hours)`);
    console.log(`   Schedule: Every 6 hours at 00:00, 06:00, 12:00, 18:00 UTC`);

  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }
}

async function provideRecommendations() {
  console.log('\n\n💡 RECOMMENDATIONS:\n');

  try {
    // Check if service role key is configured
    const hasServiceRole = !!env.VITE_SUPABASE_SERVICE_ROLE_KEY || !!env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasServiceRole) {
      console.log('   ⚠️  Service role key not found');
      console.log('      Add VITE_SUPABASE_SERVICE_ROLE_KEY to .env for:');
      console.log('      - Full cronjob monitoring');
      console.log('      - Direct cron.job table access');
      console.log('      - Better sync script performance\n');
    }

    // Check sync history
    const { data } = await supabase
      .from('sync_status')
      .select('status')
      .eq('status', 'failed')
      .limit(5);

    if (data && data.length > 0) {
      console.log(`   ⚠️  Found ${data.length} recent failed syncs`);
      console.log('      Check Edge Function logs: https://supabase.com/dashboard');
      console.log('      Go to: Edge Functions > sync-pendo-incremental > Logs\n');
    }

    console.log('   📖 Useful Commands:');
    console.log('      - Check API health: node scripts/health-check-api.mjs');
    console.log('      - Manual sync: node scripts/sync-all-pendo-data-batched.mjs');
    console.log('      - View audit: cat AUDIT_REPORT.md');

  } catch (error) {
    console.log(`   ⚠️  Error generating recommendations: ${error.message}`);
  }
}

async function run() {
  const cronStatus = await checkCronJobStatus();
  const syncHealth = await checkSyncHistory();
  await checkDataFreshness();
  await checkNextScheduledRun();
  await provideRecommendations();

  console.log('\n' + '=' .repeat(80));

  if (!syncHealth) {
    console.log('\n⚠️  CRONJOB HEALTH: NEEDS ATTENTION');
    console.log('\nPossible issues:');
    console.log('1. Cron job not set up (run supabase-cron-setup.sql)');
    console.log('2. Cron job failing silently');
    console.log('3. Waiting for first run (runs every 6 hours)\n');
    process.exit(1);
  } else {
    console.log('\n✅ CRONJOB HEALTH: GOOD\n');
    process.exit(0);
  }
}

run().catch(error => {
  console.error('\n❌ Cronjob check failed:', error);
  process.exit(1);
});
