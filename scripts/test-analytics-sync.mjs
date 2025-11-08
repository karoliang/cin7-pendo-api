#!/usr/bin/env node

// Test the new analytics sync by calling the Edge Function and verifying results
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

console.log('🧪 TESTING ANALYTICS SYNC\n');
console.log('='.repeat(80));

async function checkGuidesBeforeSync() {
  console.log('\n📊 Checking guides BEFORE sync:\n');

  const { data, error } = await supabase
    .from('pendo_guides')
    .select('*')
    .limit(5);

  if (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return;
  }

  console.log('   Sample guides:');
  data.forEach((guide, idx) => {
    console.log(`   ${idx + 1}. ${guide.name}`);
    console.log(`      Views: ${guide.views} | Completions: ${guide.completions} | Rate: ${guide.completion_rate}%`);
  });
  console.log('');
}

async function triggerSync() {
  console.log('📡 Triggering Edge Function sync...\n');

  try {
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
      return false;
    }

    const data = await response.json();
    console.log('\n✅ Sync Response:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function checkGuidesAfterSync() {
  console.log('\n📊 Checking guides AFTER sync:\n');

  const { data, error } = await supabase
    .from('pendo_guides')
    .select('*')
    .order('views', { ascending: false })
    .limit(10);

  if (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return;
  }

  console.log('   Top 10 guides by views:');
  data.forEach((guide, idx) => {
    console.log(`   ${idx + 1}. ${guide.name}`);
    console.log(`      Views: ${guide.views} | Completions: ${guide.completions} | Rate: ${guide.completion_rate}%`);
  });

  const guidesWithViews = data.filter(g => g.views > 0);
  console.log(`\n   ✅ Guides with views > 0: ${guidesWithViews.length} / ${data.length}`);

  // Check for the Trial Guide specifically
  const { data: trialGuide } = await supabase
    .from('pendo_guides')
    .select('*')
    .ilike('name', '%trial%')
    .limit(1);

  if (trialGuide && trialGuide.length > 0) {
    console.log('\n   🎯 Trial Guide Analytics:');
    console.log(`      Name: ${trialGuide[0].name}`);
    console.log(`      Views: ${trialGuide[0].views}`);
    console.log(`      Completions: ${trialGuide[0].completions}`);
    console.log(`      Completion Rate: ${trialGuide[0].completion_rate}%`);
    console.log(`      State: ${trialGuide[0].state}`);
  }
  console.log('');
}

async function checkFeaturesAfterSync() {
  console.log('\n📊 Checking features AFTER sync:\n');

  const { data, error } = await supabase
    .from('pendo_features')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return;
  }

  console.log('   Top 10 features by usage:');
  data.forEach((feature, idx) => {
    console.log(`   ${idx + 1}. ${feature.name}`);
    console.log(`      Usage: ${feature.usage_count} | Unique Users: ${feature.unique_users} | Avg: ${feature.avg_usage_per_user}`);
  });

  const featuresWithUsage = data.filter(f => f.usage_count > 0);
  console.log(`\n   ✅ Features with usage_count > 0: ${featuresWithUsage.length} / ${data.length}`);
  console.log('');
}

async function run() {
  await checkGuidesBeforeSync();

  const syncSuccess = await triggerSync();

  if (!syncSuccess) {
    console.log('❌ Sync failed. Cannot verify results.');
    process.exit(1);
  }

  // Wait a few seconds for data to settle
  console.log('⏳ Waiting 5 seconds for data to settle...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  await checkGuidesAfterSync();
  await checkFeaturesAfterSync();

  console.log('='.repeat(80));
  console.log('\n💡 ANALYSIS:\n');
  console.log('   If guides/features now show non-zero values, analytics sync is working!');
  console.log('   The Edge Function is now calculating real engagement metrics from Pendo events.\n');
  console.log('   Next: Verify in the dashboard that Trial Guide and other guides show real numbers.\n');
}

run().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
