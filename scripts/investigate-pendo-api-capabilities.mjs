#!/usr/bin/env node

/**
 * Deep Investigation of Pendo API Capabilities
 *
 * This script tests various Pendo API endpoints to determine:
 * 1. NPS data availability (via Aggregation API)
 * 2. Frustration metrics (rage clicks, dead clicks, error clicks)
 * 3. Completion rate data for guides
 * 4. ARR/Account data
 * 5. Track events vs Poll events
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const envPath = './frontend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const PENDO_API_KEY = env.VITE_PENDO_API_KEY;
const PENDO_BASE_URL = 'https://app.pendo.io';

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 PENDO API CAPABILITIES INVESTIGATION\n');
console.log('='.repeat(80));

// Helper function to make Pendo API requests
async function pendoRequest(method, endpoint, body = null) {
  const url = `${PENDO_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'x-pendo-integration-key': PENDO_API_KEY,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 1. Test NPS Data via Aggregation API
async function testNPSData() {
  console.log('\n📊 Test 1: NPS Data Availability\n');
  console.log('-'.repeat(80));

  // First, get all guides and find NPS polls
  const guidesResult = await pendoRequest('GET', '/api/v1/guide?expand=pollCount');

  if (!guidesResult.success) {
    console.log('❌ Could not fetch guides');
    return;
  }

  const npsGuides = guidesResult.data.filter(guide =>
    guide.name && (
      guide.name.toLowerCase().includes('nps') ||
      guide.name.toLowerCase().includes('poll')
    )
  );

  console.log(`Found ${npsGuides.length} potential NPS/Poll guides:`);
  npsGuides.forEach(guide => {
    console.log(`  - ${guide.name} (ID: ${guide.id})`);
    console.log(`    Polls: ${guide.pollCount || 0}`);
  });

  if (npsGuides.length > 0) {
    const testGuide = npsGuides[0];
    console.log(`\n🧪 Testing poll events for: ${testGuide.name}`);

    // Try to get poll events via Aggregation API
    const aggregationPipeline = {
      "response": {
        "mimeType": "application/json"
      },
      "request": {
        "pipeline": [
          {
            "source": {
              "pollEvents": {
                "guideId": testGuide.id
              }
            }
          },
          {
            "timeSeries": {
              "period": "dayRange",
              "first": 90
            }
          }
        ],
        "requestId": "nps-test-" + Date.now()
      }
    };

    const pollResult = await pendoRequest('POST', '/api/v1/aggregation', aggregationPipeline);

    if (pollResult.success && pollResult.data && pollResult.data.length > 0) {
      console.log(`✅ NPS Data Available: ${pollResult.data.length} poll responses found`);
      console.log('   Sample response:', JSON.stringify(pollResult.data[0], null, 2));
    } else {
      console.log('⚠️  No poll responses found (may not have been answered yet)');
    }
  }
}

// 2. Test Frustration Metrics (Track Events)
async function testFrustrationMetrics() {
  console.log('\n\n😤 Test 2: Frustration Metrics Availability\n');
  console.log('-'.repeat(80));

  // Test if track events API exists for frustration metrics
  const frustrationEvents = ['rageClick', 'deadClick', 'errorClick', 'thrashing'];

  for (const eventType of frustrationEvents) {
    const pipeline = {
      "response": {
        "mimeType": "application/json"
      },
      "request": {
        "pipeline": [
          {
            "source": {
              "trackEvents": {
                "trackType": eventType
              }
            }
          },
          {
            "timeSeries": {
              "period": "dayRange",
              "first": 30
            }
          }
        ],
        "requestId": `${eventType}-test-` + Date.now()
      }
    };

    const result = await pendoRequest('POST', '/api/v1/aggregation', pipeline);

    if (result.success && result.data && result.data.length > 0) {
      console.log(`✅ ${eventType}: Available (${result.data.length} events found)`);
    } else {
      console.log(`❌ ${eventType}: Not available or no data`);
    }
  }
}

// 3. Test Guide Completion Data
async function testCompletionData() {
  console.log('\n\n✅ Test 3: Guide Completion Data\n');
  console.log('-'.repeat(80));

  // Check database for guide events
  const { data: guideEvents, error } = await supabase
    .from('pendo_events')
    .select('*')
    .eq('entity_type', 'guide')
    .limit(1000);

  if (error) {
    console.log('❌ Error fetching guide events from database:', error.message);
    return;
  }

  console.log(`Total guide events in database: ${guideEvents.length}`);

  // Check for guide completion events
  const eventTypes = new Set(guideEvents.map(e => e.event_type).filter(Boolean));
  console.log('\nEvent types found:', Array.from(eventTypes));

  // Check metadata for completion indicators
  const sampleWithMetadata = guideEvents.find(e => e.metadata);
  if (sampleWithMetadata) {
    console.log('\nSample event metadata:', JSON.stringify(sampleWithMetadata.metadata, null, 2));
  }

  // Test Aggregation API for guide state tracking
  const pipeline = {
    "response": {
      "mimeType": "application/json"
    },
    "request": {
      "pipeline": [
        {
          "source": {
            "guideEvents": null
          }
        },
        {
          "timeSeries": {
            "period": "dayRange",
            "first": 30
          }
        },
        {
          "filter": "guideSeenState == 'advanced' || guideSeenState == 'completed'"
        }
      ],
      "requestId": "completion-test-" + Date.now()
    }
  };

  const result = await pendoRequest('POST', '/api/v1/aggregation', pipeline);

  if (result.success && result.data && result.data.length > 0) {
    console.log(`\n✅ Completion events available: ${result.data.length} found`);
    console.log('   Sample:', JSON.stringify(result.data[0], null, 2));
  } else {
    console.log('\n❌ No completion events found via Aggregation API');
  }
}

// 4. Test ARR/Account Data
async function testARRData() {
  console.log('\n\n💰 Test 4: ARR/Account Data\n');
  console.log('-'.repeat(80));

  // Test Account API
  const accountsResult = await pendoRequest('GET', '/api/v1/account?pageSize=10');

  if (!accountsResult.success) {
    console.log('❌ Account API not available');
    return;
  }

  const accounts = accountsResult.data;
  console.log(`✅ Accounts API available: ${accounts.length} accounts found`);

  if (accounts.length > 0) {
    const sampleAccount = accounts[0];
    console.log('\nSample account structure:');
    console.log(JSON.stringify(sampleAccount, null, 2));

    // Check for ARR field
    const accountWithARR = accounts.find(a => a.metadata && (
      a.metadata.arr || a.metadata.ARR || a.metadata.revenue || a.metadata.mrr
    ));

    if (accountWithARR) {
      console.log('\n✅ ARR data available in account metadata');
      console.log('   ARR fields:', Object.keys(accountWithARR.metadata).filter(k =>
        k.toLowerCase().includes('arr') || k.toLowerCase().includes('revenue')
      ));
    } else {
      console.log('\n⚠️  No ARR data found in account metadata');
      console.log('   Available metadata fields:', Object.keys(sampleAccount.metadata || {}));
    }
  }
}

// 5. Check what's in our database
async function checkDatabaseContent() {
  console.log('\n\n💾 Test 5: Current Database Content\n');
  console.log('-'.repeat(80));

  // Check guides table
  const { data: guides, error: guidesError } = await supabase
    .from('pendo_guides')
    .select('id, name, views, completions, completion_rate, unique_visitors')
    .gt('views', 0)
    .order('views', { ascending: false })
    .limit(5);

  if (!guidesError && guides) {
    console.log(`\n📊 Top 5 Guides by Views:`);
    guides.forEach(g => {
      console.log(`  ${g.name}`);
      console.log(`    Views: ${g.views}, Completions: ${g.completions}, Rate: ${g.completion_rate}%`);
    });
  }

  // Check pages table for frustration data
  const { data: pages, error: pagesError } = await supabase
    .from('pendo_pages')
    .select('id, title, url, views')
    .limit(1);

  if (!pagesError && pages && pages.length > 0) {
    console.log(`\n📄 Sample Page Data:`);
    console.log(JSON.stringify(pages[0], null, 2));
  }

  // Check if frustration metrics exist in pages
  const { data: pagesSchema } = await supabase
    .from('pendo_pages')
    .select('*')
    .limit(0);

  console.log('\n📝 Pages table structure:');
  console.log('   Columns:', Object.keys(pagesSchema?.[0] || {}));
}

// Run all tests
async function runAllTests() {
  try {
    await testNPSData();
    await testFrustrationMetrics();
    await testCompletionData();
    await testARRData();
    await checkDatabaseContent();

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ INVESTIGATION COMPLETE\n');
    console.log('Summary of Findings:');
    console.log('-------------------');
    console.log('Run this script to see detailed results for each API capability.');
    console.log('\nNext Steps:');
    console.log('1. Review the output above');
    console.log('2. Remove unavailable metrics from dashboard');
    console.log('3. Implement NPS dashboard widget if data is available');
    console.log('4. Consider alternative data sources for missing metrics\n');

  } catch (error) {
    console.error('\n❌ Error during investigation:', error);
  }
}

runAllTests();
