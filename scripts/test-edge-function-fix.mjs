#!/usr/bin/env node

// Test the Edge Function fix by checking recent sync status
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

console.log('🧪 TESTING EDGE FUNCTION FIX\n');
console.log('=' .repeat(80));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRecentSyncs() {
  console.log('\n📊 Checking recent sync attempts:\n');

  try {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .order('last_sync_end', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('⚠️  No sync history found');
      return;
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
      const mostRecent = syncs[0];

      const statusIcon = mostRecent.status === 'completed' ? '✅' : (mostRecent.status === 'failed' ? '❌' : '⏳');
      const time = new Date(mostRecent.last_sync_end);
      const hoursAgo = ((Date.now() - time.getTime()) / 3600000).toFixed(1);

      console.log(`     ${statusIcon} Status: ${mostRecent.status}`);
      console.log(`     📅 Last sync: ${time.toLocaleString()} (${hoursAgo} hours ago)`);
      console.log(`     📦 Records: ${mostRecent.records_processed || 0}`);

      if (mostRecent.error_message) {
        console.log(`     ⚠️  Error: ${mostRecent.error_message.substring(0, 80)}...`);
      }

      // Check if there's been a successful sync after deployment
      const successfulSyncs = syncs.filter(s => s.status === 'completed');
      if (successfulSyncs.length > 0) {
        console.log(`     ✓ Has ${successfulSyncs.length} successful sync(s) in history`);
      } else {
        console.log(`     ⚠️  No successful syncs yet`);
      }
    });

    console.log('\n\n🔍 ANALYSIS:\n');

    // Check if Features and Guides are still failing
    const featuresLatest = byEntity['features']?.[0];
    const guidesLatest = byEntity['guides']?.[0];

    if (featuresLatest?.status === 'failed' || guidesLatest?.status === 'failed') {
      console.log('⚠️  Features or Guides are still failing');
      console.log('   This could mean:');
      console.log('   1. Cronjob hasn\'t run since deployment (runs every 6 hours)');
      console.log('   2. There\'s still an issue with the fix');
      console.log('   3. Check Edge Function logs for details\n');

      console.log('📅 Next scheduled run should be in less than 6 hours');
      console.log('   Check again after the next cron execution\n');
    } else if (featuresLatest?.status === 'completed' && guidesLatest?.status === 'completed') {
      console.log('✅ Both Features and Guides are syncing successfully!');
      console.log('   The fix is working as expected.\n');

      console.log(`   Latest sync results:`);
      console.log(`   - Features: ${featuresLatest.records_processed} records`);
      console.log(`   - Guides: ${guidesLatest.records_processed} records\n`);
    }

  } catch (error) {
    console.error(`❌ Error checking sync status: ${error.message}`);
  }
}

async function run() {
  await checkRecentSyncs();

  console.log('=' .repeat(80));
  console.log('\n💡 To monitor Edge Function logs:');
  console.log('   https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/functions/sync-pendo-incremental/logs\n');
  console.log('🔄 To check again after next cron run:');
  console.log('   node scripts/test-edge-function-fix.mjs\n');
}

run().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
