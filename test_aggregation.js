#!/usr/bin/env node
/**
 * Test script to verify Pendo Aggregation API implementation
 * Run with: node test_aggregation.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually
const envPath = join(__dirname, 'frontend', '.env');
let API_KEY;

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/VITE_PENDO_API_KEY=(.+)/);
  if (match) {
    API_KEY = match[1].trim();
  }
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
}

const BASE_URL = 'https://app.pendo.io';

if (!API_KEY) {
  console.error('❌ Error: VITE_PENDO_API_KEY not found in frontend/.env');
  process.exit(1);
}

async function testAggregationAPI(guideId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TESTING PENDO AGGREGATION API`);
  console.log(`${'='.repeat(80)}\n`);

  const headers = {
    'X-Pendo-Integration-Key': API_KEY,
    'Content-Type': 'application/json'
  };

  // Test 1: Fetch guide totals
  console.log(`📊 Test 1: Fetching total analytics for guide ${guideId}`);

  const totalsRequest = {
    source: {
      guideEvents: null,
    },
    filter: `guideId == "${guideId}"`,
    requestId: `test_totals_${Date.now()}`
  };

  try {
    console.log(`🔍 Request:`, JSON.stringify(totalsRequest, null, 2));

    const response = await fetch(`${BASE_URL}/api/v1/aggregation`, {
      method: 'POST',
      headers,
      body: JSON.stringify(totalsRequest)
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log(`📦 Response data:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log(`✅ Aggregation API call successful!`);

      if (data.results && data.results.length > 0) {
        console.log(`\n📊 Found ${data.results.length} results`);
        console.log(`\nFirst 5 results:`);
        data.results.slice(0, 5).forEach((result, i) => {
          console.log(`\n${i + 1}.`, JSON.stringify(result, null, 2));
        });
      } else {
        console.log(`\n⚠️  No results found for guide ${guideId}`);
        console.log(`   This could mean:`);
        console.log(`   - The guide has no activity yet`);
        console.log(`   - The filter might need adjustment`);
        console.log(`   - The guide ID might be incorrect`);
      }
    } else {
      console.error(`❌ API Error: ${response.status}`);
      console.error(`   ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
  }

  // Test 2: Fetch time series data
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📊 Test 2: Fetching time series analytics for guide ${guideId}`);

  const endTime = Date.now();
  const startTime = endTime - (30 * 24 * 60 * 60 * 1000); // Last 30 days

  const timeSeriesRequest = {
    source: {
      guideEvents: null,
      timeSeries: {
        first: startTime,
        count: 30,
        period: "dayRange"
      }
    },
    filter: `guideId == "${guideId}"`,
    requestId: `test_timeseries_${Date.now()}`
  };

  try {
    console.log(`🔍 Request:`, JSON.stringify(timeSeriesRequest, null, 2));

    const response = await fetch(`${BASE_URL}/api/v1/aggregation`, {
      method: 'POST',
      headers,
      body: JSON.stringify(timeSeriesRequest)
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log(`📦 Response data:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log(`✅ Time series API call successful!`);

      if (data.results && data.results.length > 0) {
        console.log(`\n📊 Found ${data.results.length} time periods`);
      } else {
        console.log(`\n⚠️  No time series results found`);
      }
    } else {
      console.error(`❌ API Error: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ TESTING COMPLETE`);
  console.log(`${'='.repeat(80)}\n`);
}

// Test with the guide ID from the screenshot
const testGuideId = '-kQmkRDITY56l7r2LXDaXP3SHZA';
console.log(`🎯 Testing with guide ID: ${testGuideId}`);

testAggregationAPI(testGuideId).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
