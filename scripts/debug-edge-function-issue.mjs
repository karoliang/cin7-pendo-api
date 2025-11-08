#!/usr/bin/env node

// Debug why Edge Function isn't calculating analytics
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
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 DEBUGGING EDGE FUNCTION ANALYTICS ISSUE\n');
console.log('='.repeat(80));

// Step 1: Check how many events exist
async function checkEventsData() {
  console.log('\n📊 Step 1: Check events in database\n');

  const { data: guideEvents, count: guideCount } = await supabase
    .from('pendo_events')
    .select('*', { count: 'exact' })
    .eq('entity_type', 'guide');

  const { data: featureEvents, count: featureCount } = await supabase
    .from('pendo_events')
    .select('*', { count: 'exact' })
    .eq('entity_type', 'feature');

  const { data: pageEvents, count: pageCount } = await supabase
    .from('pendo_events')
    .select('*', { count: 'exact' })
    .eq('entity_type', 'page');

  console.log(`   Guide events: ${guideCount}`);
  console.log(`   Feature events: ${featureCount}`);
  console.log(`   Page events: ${pageCount}`);
  console.log('');

  return { guideCount, featureCount, pageCount };
}

// Step 2: Test analytics calculation for a guide with known events
async function testAnalyticsCalculation() {
  console.log('\n📊 Step 2: Test analytics calculation for Trial Guide\n');

  const trialGuideId = 'OERSob_88kNTBYByJIWzP5xZmLM';

  // Get events for Trial Guide
  const { data: events, error } = await supabase
    .from('pendo_events')
    .select('*')
    .eq('entity_id', trialGuideId)
    .eq('entity_type', 'guide');

  if (error) {
    console.log(`   ❌ Error fetching events: ${error.message}`);
    return null;
  }

  console.log(`   Events found: ${events.length}`);

  if (events.length > 0) {
    console.log(`   Sample event:`);
    console.log(`   - visitor_id: ${events[0].visitor_id}`);
    console.log(`   - event_type: ${events[0].event_type}`);
    console.log(`   - entity_id: ${events[0].entity_id}`);
    console.log(`   - entity_type: ${events[0].entity_type}`);
    console.log('');

    const views = events.length;
    const uniqueVisitors = new Set(events.map(e => e.visitor_id).filter(Boolean)).size;

    console.log(`   ✅ Calculated analytics:`);
    console.log(`   - Views: ${views}`);
    console.log(`   - Unique visitors: ${uniqueVisitors}`);
    console.log('');
  }

  // Check what's in the database for Trial Guide
  const { data: guide } = await supabase
    .from('pendo_guides')
    .select('*')
    .eq('id', trialGuideId)
    .single();

  if (guide) {
    console.log(`   Database record for Trial Guide:`);
    console.log(`   - Name: ${guide.name}`);
    console.log(`   - Views in DB: ${guide.views}`);
    console.log(`   - Last synced: ${new Date(guide.last_synced).toLocaleString()}`);
    console.log('');
  }

  return { expectedViews: events.length, actualViews: guide?.views || 0 };
}

// Step 3: Check first 20 guides (which should get analytics)
async function checkFirst20Guides() {
  console.log('\n📊 Step 3: Check first 20 guides that Edge Function processes\n');

  const { data: guides } = await supabase
    .from('pendo_guides')
    .select('id, name, views, last_synced')
    .order('id')
    .limit(20);

  console.log('   First 20 guides by ID (Edge Function processes these):\n');

  let withViews = 0;
  for (const guide of guides) {
    // Check if this guide has events
    const { count } = await supabase
      .from('pendo_events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', guide.id)
      .eq('entity_type', 'guide');

    if (count > 0 || guide.views > 0) {
      console.log(`   ${guide.name.substring(0, 40)}...`);
      console.log(`      ID: ${guide.id}`);
      console.log(`      Events: ${count} | Views in DB: ${guide.views}`);
      console.log(`      Last synced: ${new Date(guide.last_synced).toLocaleString()}`);
      console.log('');

      if (guide.views > 0) withViews++;
    }
  }

  console.log(`   Guides with views > 0: ${withViews} / 20\n`);

  return withViews;
}

async function run() {
  await checkEventsData();
  const result = await testAnalyticsCalculation();
  await checkFirst20Guides();

  console.log('='.repeat(80));
  console.log('\n🔍 DIAGNOSIS:\n');

  if (result && result.expectedViews > 0 && result.actualViews === 0) {
    console.log('   ❌ PROBLEM: Events exist but analytics not calculated');
    console.log('   CAUSE: Edge Function analytics calculation not working');
    console.log('   SOLUTION: Check Edge Function logs or permissions\n');
  } else if (result && result.expectedViews === result.actualViews && result.actualViews > 0) {
    console.log('   ✅ Analytics calculation working correctly!\n');
  } else {
    console.log('   ⚠️  Need to investigate further\n');
  }
}

run().catch(error => {
  console.error('\n❌ Debug failed:', error);
  process.exit(1);
});
