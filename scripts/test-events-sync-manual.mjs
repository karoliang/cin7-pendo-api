#!/usr/bin/env node

// Manually test events sync by calling Supabase Edge Function
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
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 TESTING EVENTS SYNC MANUALLY\n');
console.log('=' .repeat(80));

async function testEventsSyncFunction() {
  try {
    console.log('\n📡 Calling Edge Function: sync-pendo-incremental\n');

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/sync-pendo-incremental`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Error: ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Edge Function Response:\n');
    console.log(JSON.stringify(data, null, 2));

    // Check if events were synced
    if (data.results && typeof data.results.events !== 'undefined') {
      console.log('\n📊 Events Sync Result:');
      console.log(`   Records synced: ${data.results.events}`);

      if (data.results.events === 0) {
        console.log('   ⚠️  No events were synced. This could mean:');
        console.log('      1. No events data available from Pendo API');
        console.log('      2. Events sync failed silently');
        console.log('      3. Edge Function completed but found no events\n');
      } else {
        console.log('   ✅ Events synced successfully!\n');
      }
    } else {
      console.log('\n⚠️  Events not included in response');
      console.log('   This could mean events sync is not configured\n');
    }

  } catch (error) {
    console.error(`\n❌ Error calling Edge Function: ${error.message}`);
  }
}

async function checkEventsTableSchema() {
  try {
    console.log('\n🔍 Checking pendo_events table schema:\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Try to query the table structure
    const { data, error } = await supabase
      .from('pendo_events')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error accessing table: ${error.message}`);
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  Table does not exist! Need to create it.\n');
      }
    } else {
      console.log('   ✅ Table exists and is accessible');
      if (data && data.length > 0) {
        console.log(`   📊 Sample record:`, data[0]);
      } else {
        console.log('   📊 Table is empty (0 records)\n');
      }
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function checkSyncStatusForEvents() {
  try {
    console.log('\n🔍 Checking sync_status for events after Edge Function call:\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('entity_type', 'events')
      .order('last_sync_end', { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('   ⚠️  Still no sync_status records for events');
      console.log('   This means events sync failed before creating a status record\n');
    } else {
      console.log(`   ✅ Found ${data.length} sync_status record(s) for events:`);
      data.forEach((record, idx) => {
        const time = new Date(record.last_sync_end);
        console.log(`\n   ${idx + 1}. Status: ${record.status}`);
        console.log(`      Time: ${time.toLocaleString()}`);
        console.log(`      Records: ${record.records_processed}`);
        if (record.error_message) {
          console.log(`      Error: ${record.error_message}`);
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function run() {
  await checkEventsTableSchema();
  await testEventsSyncFunction();

  // Wait a bit for async processing
  console.log('\n⏳ Waiting 5 seconds for async processing...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  await checkSyncStatusForEvents();

  console.log('=' .repeat(80));
  console.log('\n💡 Next Steps:');
  console.log('   1. Check Edge Function logs for detailed error messages');
  console.log('   2. Verify pendo_events table schema matches Edge Function expectations');
  console.log('   3. Check if Pendo API is returning events data');
  console.log('   4. Review Edge Function code for events sync logic\n');
}

run().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
