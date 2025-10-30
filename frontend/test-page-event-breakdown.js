/**
 * Test script for getPageEventBreakdown method
 * Run with: node test-page-event-breakdown.js
 */

// Simple CommonJS-style test since we're running with node directly
const PENDO_BASE_URL = 'https://app.pendo.io';
const PENDO_API_KEY = 'f4acdb2c-038c-4de1-a88b-ab90423037bf.us';

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Pendo-Integration-Key': PENDO_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

async function testPageEventBreakdown() {
  console.log('🧪 Testing Page Event Breakdown API Method');
  console.log('==========================================\n');

  try {
    // Step 1: Get a list of pages to find a real pageId
    console.log('📋 Step 1: Fetching pages...');
    const pages = await makeRequest(`${PENDO_BASE_URL}/api/v1/page?limit=10`);
    
    if (!pages || pages.length === 0) {
      console.log('❌ No pages found');
      return;
    }

    console.log(`✅ Found ${pages.length} pages`);
    const testPage = pages[0];
    console.log(`📄 Testing with page: ${testPage.url || testPage.id}`);
    console.log(`   Page ID: ${testPage.id}\n`);

    // Step 2: Test the event breakdown aggregation
    console.log('📊 Step 2: Fetching page event breakdown...');
    
    const endTime = Date.now();
    const startTime = endTime - (30 * 24 * 60 * 60 * 1000); // 30 days ago

    const aggregationRequest = {
      source: {
        events: null,
        timeSeries: {
          first: startTime,
          count: 30,
          period: "dayRange"
        }
      },
      filter: `pageId == "${testPage.id}" && eventClass == "web"`,
      requestId: `page_event_breakdown_test_${Date.now()}`
    };

    console.log('📅 Time range: Last 30 days');
    console.log('🔍 Making aggregation request...\n');

    const response = await makeRequest(
      `${PENDO_BASE_URL}/api/v1/aggregation`,
      {
        method: 'POST',
        body: JSON.stringify(aggregationRequest)
      }
    );

    console.log('✅ Aggregation response received');
    console.log(`📊 Total records: ${response.results?.length || 0}\n`);

    if (response.results && response.results.length > 0) {
      // Display sample result structure
      const sample = response.results[0];
      console.log('📋 Sample event record:');
      console.log(JSON.stringify(sample, null, 2));
      console.log('\n📋 Available fields:', Object.keys(sample).join(', '));
      
      // Check for frustration metrics
      console.log('\n🔍 Checking for frustration metrics:');
      const frustrationFields = ['uTurns', 'u_turns', 'deadClicks', 'dead_clicks', 'errorClicks', 'error_clicks', 'rageClicks', 'rage_clicks'];
      const foundFields = frustrationFields.filter(field => sample[field] !== undefined);
      
      if (foundFields.length > 0) {
        console.log(`✅ Found frustration metric fields: ${foundFields.join(', ')}`);
      } else {
        console.log('⚠️  No frustration metric fields found in events source');
        console.log('   TODO: Frustration metrics may not be available in the events source');
        console.log('   Consider alternative data sources or Pendo Analytics addon features');
      }

      // Check for browser metadata
      console.log('\n🌐 Checking for browser metadata:');
      const browserFields = ['browserName', 'browser_name', 'browser', 'browserVersion', 'browser_version'];
      const foundBrowserFields = browserFields.filter(field => sample[field] !== undefined);
      
      if (foundBrowserFields.length > 0) {
        console.log(`✅ Found browser fields: ${foundBrowserFields.join(', ')}`);
      } else {
        console.log('⚠️  No browser metadata fields found');
      }

      // Display processed summary
      console.log('\n📈 Event Summary:');
      const visitors = new Set(response.results.map(r => r.visitorId || r.visitor_id)).size;
      const totalEvents = response.results.length;
      console.log(`   Unique visitors: ${visitors}`);
      console.log(`   Total events: ${totalEvents}`);
      
    } else {
      console.log('⚠️  No events returned for this page in the last 30 days');
      console.log('   Try a different page or extend the time range');
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testPageEventBreakdown();
