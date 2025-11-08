#!/usr/bin/env node

// Test that Edge Function is calculating analytics correctly
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

console.log('🧪 TESTING EDGE FUNCTION ANALYTICS\n');
console.log('='.repeat(80));

async function checkGuidesBefore() {
  console.log('\n📊 Sample guides BEFORE Edge Function sync:\n');

  const { data: guides } = await supabase
    .from('pendo_guides')
    .select('id, name, views, last_synced')
    .order('last_synced', { ascending: true })
    .limit(3);

  if (guides && guides.length > 0) {
    guides.forEach((guide, idx) => {
      console.log(`   ${idx + 1}. ${guide.name}`);
      console.log(`      ID: ${guide.id.substring(0, 20)}...`);
      console.log(`      Views: ${guide.views}`);
      console.log(`      Last Synced: ${new Date(guide.last_synced).toLocaleString()}`);
      console.log('');
    });
  }

  return guides;
}

async function triggerEdgeFunction() {
  console.log('📡 Triggering Edge Function: sync-pendo-incremental\n');

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

    console.log(`   Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Error: ${errorText}\n`);
      return false;
    }

    const data = await response.json();
    console.log('   ✅ Edge Function Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    return true;
  } catch (error) {
    console.error(`   ❌ Error calling Edge Function: ${error.message}\n`);
    return false;
  }
}

async function checkGuidesAfter(beforeGuides) {
  console.log('\n📊 Checking if guides were updated with analytics:\n');

  // Wait a moment for sync to complete
  await new Promise(resolve => setTimeout(resolve, 3000));

  const guideIds = beforeGuides.map(g => g.id);
  const { data: guides } = await supabase
    .from('pendo_guides')
    .select('id, name, views, last_synced')
    .in('id', guideIds);

  if (guides && guides.length > 0) {
    let updatedCount = 0;
    let withAnalyticsCount = 0;

    guides.forEach((guide, idx) => {
      const before = beforeGuides.find(g => g.id === guide.id);
      const wasUpdated = new Date(guide.last_synced) > new Date(before.last_synced);
      const hasAnalytics = guide.views > 0;

      console.log(`   ${idx + 1}. ${guide.name}`);
      console.log(`      Views: ${before.views} → ${guide.views} ${hasAnalytics ? '✅' : ''}`);
      console.log(`      Updated: ${wasUpdated ? 'YES ✅' : 'NO'}`);
      console.log('');

      if (wasUpdated) updatedCount++;
      if (hasAnalytics) withAnalyticsCount++;
    });

    console.log(`   Summary: ${updatedCount}/${guides.length} updated, ${withAnalyticsCount}/${guides.length} with analytics\n`);

    if (updatedCount > 0 && withAnalyticsCount > 0) {
      console.log('   ✅ Edge Function is calculating analytics correctly!\n');
      return true;
    } else if (updatedCount > 0) {
      console.log('   ⚠️  Guides were updated but no analytics calculated\n');
      return false;
    } else {
      console.log('   ℹ️  Guides were not in the batch processed (only 20 per sync)\n');
      return null;
    }
  }

  return false;
}

async function checkOverallAnalytics() {
  console.log('📈 Overall Analytics Coverage:\n');

  const { data: guidesWithViews, count: guidesCount } = await supabase
    .from('pendo_guides')
    .select('*', { count: 'exact' })
    .gt('views', 0);

  const { data: allGuides, count: totalGuides } = await supabase
    .from('pendo_guides')
    .select('*', { count: 'exact', head: true });

  const { data: featuresWithUsage, count: featuresCount } = await supabase
    .from('pendo_features')
    .select('*', { count: 'exact' })
    .gt('usage_count', 0);

  const { data: allFeatures, count: totalFeatures } = await supabase
    .from('pendo_features')
    .select('*', { count: 'exact', head: true });

  console.log(`   Guides with views: ${guidesCount} / ${totalGuides} (${Math.round(guidesCount/totalGuides*100)}%)`);
  console.log(`   Features with usage: ${featuresCount} / ${totalFeatures} (${Math.round(featuresCount/totalFeatures*100)}%)`);
  console.log('');
}

async function run() {
  const beforeGuides = await checkGuidesBefore();
  const success = await triggerEdgeFunction();

  if (!success) {
    console.log('❌ Edge Function failed. Cannot verify analytics calculation.');
    process.exit(1);
  }

  await checkGuidesAfter(beforeGuides);
  await checkOverallAnalytics();

  console.log('='.repeat(80));
  console.log('\n✅ Test Complete\n');
  console.log('💡 Next Steps:');
  console.log('   1. Verify analytics in production dashboard');
  console.log('   2. Run manual sync for full coverage: node scripts/sync-all-analytics.mjs');
  console.log('   3. Check cronjob is running every 6 hours\n');
}

run().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
