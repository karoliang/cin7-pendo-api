#!/usr/bin/env node

// Test if Supabase query works the same way as in Edge Function
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

// Create client exactly like Edge Function does
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🧪 TESTING SUPABASE QUERY (Edge Function Style)\n');
console.log('='.repeat(80));

// Replicate the exact function from Edge Function
async function calculateGuideAnalyticsFromEvents(guideId) {
  try {
    console.log(`\n   Testing guide: ${guideId}`);

    // Query events from local database instead of Pendo API
    const { data: events, error } = await supabase
      .from('pendo_events')
      .select('*')
      .eq('entity_id', guideId)
      .eq('entity_type', 'guide');

    console.log(`   Query error: ${error ? error.message : 'None'}`);
    console.log(`   Events returned: ${events ? events.length : 'null'}`);

    if (error) {
      console.error(`  ❌ Error querying events for guide ${guideId}:`, error);
      return { views: 0, completions: 0, completion_rate: 0, unique_visitors: 0, avg_time_to_complete: 0 };
    }

    if (!events || events.length === 0) {
      console.log(`  ℹ️  No events found for guide ${guideId}`);
      return { views: 0, completions: 0, completion_rate: 0, unique_visitors: 0, avg_time_to_complete: 0 };
    }

    console.log(`  ✅ Found ${events.length} events for guide ${guideId}`);

    // All guide events are views
    const views = events.length;
    const uniqueVisitors = new Set(events.map(e => e.visitor_id).filter(Boolean)).size;

    const completions = 0;
    const completion_rate = 0;

    return {
      views,
      completions,
      completion_rate: Math.round(completion_rate * 100) / 100,
      unique_visitors: uniqueVisitors,
      avg_time_to_complete: 0
    };
  } catch (error) {
    console.error(`  ⚠️  Error calculating analytics for guide ${guideId}:`, error.message);
    return { views: 0, completions: 0, completion_rate: 0, unique_visitors: 0, avg_time_to_complete: 0 };
  }
}

async function run() {
  console.log('\n📊 Test 1: Guide with known events\n');

  const guideWithEvents = '_4dv5Oc2XNi0uKvNvDi7k8mUXKg'; // Should have 329 events

  const result1 = await calculateGuideAnalyticsFromEvents(guideWithEvents);
  console.log(`   Result: views=${result1.views}, unique_visitors=${result1.unique_visitors}`);

  console.log('\n📊 Test 2: Guide without events\n');

  const guideWithoutEvents = 'X5936F8CdWB5R2SBJ0qGzXOXBgE'; // Should have 0 events

  const result2 = await calculateGuideAnalyticsFromEvents(guideWithoutEvents);
  console.log(`   Result: views=${result2.views}, unique_visitors=${result2.unique_visitors}`);

  console.log('\n📊 Test 3: Check SERVICE_ROLE_KEY environment\n');

  console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`   SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Set (length: ' + SUPABASE_SERVICE_ROLE_KEY.length + ')' : '❌ Missing'}`);

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ If this script works but Edge Function doesn\'t, the issue is:');
  console.log('   1. Environment variables not set in Edge Function');
  console.log('   2. Different Supabase client behavior in Deno');
  console.log('   3. RLS policies blocking Edge Function queries\n');
}

run().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
