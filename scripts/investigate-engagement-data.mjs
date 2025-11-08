#!/usr/bin/env node

// Investigate why engagement data shows 0
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
const PENDO_API_KEY = env.VITE_PENDO_API_KEY || env.PENDO_API_KEY;

console.log('🔍 INVESTIGATING ENGAGEMENT DATA\n');
console.log('=' .repeat(80));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkGuideData() {
  console.log('\n📊 Checking Guide Data in Database:\n');

  try {
    // Get sample guides
    const { data: guides, error } = await supabase
      .from('pendo_guides')
      .select('*')
      .limit(5);

    if (error) throw error;

    if (!guides || guides.length === 0) {
      console.log('   ⚠️  No guides found in database\n');
      return;
    }

    console.log(`   Found ${guides.length} guides. Sample data:\n`);
    guides.forEach((guide, idx) => {
      console.log(`   ${idx + 1}. ${guide.name}`);
      console.log(`      ID: ${guide.id}`);
      console.log(`      State: ${guide.state}`);
      console.log(`      Views: ${guide.views}`);
      console.log(`      Completions: ${guide.completions}`);
      console.log(`      Completion Rate: ${guide.completion_rate}`);
      console.log(`      Steps: ${guide.steps}`);
      console.log(`      Last Synced: ${new Date(guide.last_synced).toLocaleString()}`);
      console.log('');
    });

    // Check if we have ANY guides with non-zero engagement
    const { data: engagedGuides, error: engagedError } = await supabase
      .from('pendo_guides')
      .select('*')
      .gt('views', 0);

    if (engagedError) throw engagedError;

    console.log(`   ✅ Guides with views > 0: ${engagedGuides?.length || 0}`);

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function checkFeatureData() {
  console.log('\n📊 Checking Feature Data in Database:\n');

  try {
    const { data: features, error } = await supabase
      .from('pendo_features')
      .select('*')
      .limit(5);

    if (error) throw error;

    if (!features || features.length === 0) {
      console.log('   ⚠️  No features found in database\n');
      return;
    }

    console.log(`   Found ${features.length} features. Sample data:\n`);
    features.forEach((feature, idx) => {
      console.log(`   ${idx + 1}. ${feature.name}`);
      console.log(`      ID: ${feature.id}`);
      console.log(`      Usage Count: ${feature.usage_count}`);
      console.log(`      Unique Users: ${feature.unique_users}`);
      console.log(`      Avg Usage Per User: ${feature.avg_usage_per_user}`);
      console.log('');
    });

    const { data: usedFeatures, error: usedError } = await supabase
      .from('pendo_features')
      .select('*')
      .gt('usage_count', 0);

    if (usedError) throw usedError;

    console.log(`   ✅ Features with usage_count > 0: ${usedFeatures?.length || 0}`);

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function checkPendoAPIForAnalytics() {
  console.log('\n🔍 Checking Pendo API for Analytics Data:\n');

  try {
    // Try to fetch guide analytics from Pendo API
    const guideId = 'OERSob_88kNTBYByJIWzP5xZmLM'; // Example guide ID

    console.log(`   Testing Pendo Aggregation API for guide analytics...\n`);

    const pipeline = {
      response: {
        mimeType: 'application/json'
      },
      request: {
        requestId: 'test-guide-analytics',
        pipeline: [
          {
            source: {
              guideEvents: null,
              timeSeries: {
                period: 'dayRange',
                first: (Date.now() - (30 * 24 * 60 * 60 * 1000)).toString(), // Last 30 days
                count: -30
              }
            }
          },
          {
            filter: `guideId == "${guideId}"`
          }
        ]
      }
    };

    const response = await fetch('https://app.pendo.io/api/v1/aggregation', {
      method: 'POST',
      headers: {
        'X-Pendo-Integration-Key': PENDO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pipeline)
    });

    if (!response.ok) {
      console.log(`   ⚠️  API returned ${response.status}: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log(`   ✅ Received ${data.results?.length || 0} events for test guide`);

    if (data.results && data.results.length > 0) {
      console.log(`   📊 Sample event:`, JSON.stringify(data.results[0], null, 2));
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function run() {
  await checkGuideData();
  await checkFeatureData();
  await checkPendoAPIForAnalytics();

  console.log('\n' + '=' .repeat(80));
  console.log('\n💡 ANALYSIS:\n');
  console.log('   The current sync appears to only fetch METADATA (names, IDs, states)');
  console.log('   but NOT ANALYTICS DATA (views, completions, usage stats).\n');
  console.log('   To fix this, we need to:');
  console.log('   1. Use Pendo Aggregation API to fetch analytics for each guide/feature');
  console.log('   2. Calculate metrics like views, completions, unique users');
  console.log('   3. Update the sync process to include analytics data\n');
}

run().catch(error => {
  console.error('\n❌ Investigation failed:', error);
  process.exit(1);
});
