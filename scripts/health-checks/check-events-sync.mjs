#!/usr/bin/env node

// Check Events sync status
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

console.log('🔍 CHECKING EVENTS SYNC STATUS\n');
console.log('=' .repeat(80));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkEventsSync() {
  try {
    console.log('\n📊 Querying sync_status for events:\n');

    // Get all events sync records
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('entity_type', 'events')
      .order('last_sync_end', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('⚠️  No events sync records found in sync_status table');
      console.log('   This could mean:');
      console.log('   1. Events have never been synced');
      console.log('   2. Events sync is not configured in the Edge Function');
      console.log('   3. Events are tracked under a different entity_type name\n');
      return;
    }

    console.log(`✅ Found ${data.length} events sync record(s)\n`);

    // Analyze most recent sync
    const mostRecent = data[0];
    const statusIcon = mostRecent.status === 'completed' ? '✅' : (mostRecent.status === 'failed' ? '❌' : '⏳');
    const time = new Date(mostRecent.last_sync_end);
    const hoursAgo = ((Date.now() - time.getTime()) / 3600000).toFixed(1);

    console.log('   LATEST SYNC:');
    console.log(`     ${statusIcon} Status: ${mostRecent.status}`);
    console.log(`     📅 Last sync: ${time.toLocaleString()} (${hoursAgo} hours ago)`);
    console.log(`     📦 Records processed: ${mostRecent.records_processed || 0}`);

    if (mostRecent.error_message) {
      console.log(`     ⚠️  Error: ${mostRecent.error_message}`);
    }

    // Count successful vs failed
    const successfulSyncs = data.filter(s => s.status === 'completed').length;
    const failedSyncs = data.filter(s => s.status === 'failed').length;

    console.log(`\n   SYNC HISTORY (last ${data.length} records):`);
    console.log(`     ✅ Successful: ${successfulSyncs}`);
    console.log(`     ❌ Failed: ${failedSyncs}`);

    // Show recent history
    console.log('\n   RECENT SYNC ATTEMPTS:');
    data.slice(0, 5).forEach((sync, idx) => {
      const icon = sync.status === 'completed' ? '✅' : '❌';
      const time = new Date(sync.last_sync_end);
      console.log(`     ${idx + 1}. ${icon} ${time.toLocaleString()} - ${sync.records_processed || 0} records`);
    });

    console.log('\n\n🔍 ANALYSIS:\n');

    if (mostRecent.status === 'completed') {
      console.log('✅ Events sync is working correctly!');
      console.log(`   Last successful sync processed ${mostRecent.records_processed} event records`);
      console.log(`   Last sync was ${hoursAgo} hours ago\n`);
    } else if (mostRecent.status === 'failed') {
      console.log('⚠️  Events sync is failing');
      console.log('   Error:', mostRecent.error_message);
      console.log('   This needs attention!\n');
    } else {
      console.log('⏳ Events sync is in progress or pending');
      console.log(`   Status: ${mostRecent.status}\n`);
    }

    // Check if sync is stale (more than 12 hours old)
    if (parseFloat(hoursAgo) > 12) {
      console.log('⚠️  Warning: Last sync is older than 12 hours');
      console.log('   The cronjob runs every 6 hours, so this might indicate an issue\n');
    }

  } catch (error) {
    console.error(`❌ Error checking events sync: ${error.message}`);
  }
}

async function checkEventsTable() {
  try {
    console.log('\n📦 Checking events table for data:\n');

    // Get count of events
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`   Total events in database: ${count || 0}`);

    // Get most recent event
    const { data: recentEvents, error: recentError } = await supabase
      .from('events')
      .select('id, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (recentError) throw recentError;

    if (recentEvents && recentEvents.length > 0) {
      const mostRecent = recentEvents[0];
      const time = new Date(mostRecent.updated_at);
      const hoursAgo = ((Date.now() - time.getTime()) / 3600000).toFixed(1);
      console.log(`   Most recent event update: ${time.toLocaleString()} (${hoursAgo} hours ago)`);
    }

  } catch (error) {
    console.error(`   Error checking events table: ${error.message}`);
  }
}

async function run() {
  await checkEventsSync();
  await checkEventsTable();

  console.log('\n' + '=' .repeat(80));
  console.log('\n💡 Next Steps:');
  console.log('   - If events sync is failing, check Edge Function logs');
  console.log('   - If no sync records exist, verify events are configured in sync-pendo-incremental');
  console.log('   - Compare with other entity types (pages, features, guides) to ensure consistency\n');
}

run().catch(error => {
  console.error('\n❌ Check failed:', error);
  process.exit(1);
});
