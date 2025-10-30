/**
 * Test script for getPageEventBreakdown method
 * Run with: npx tsx test-page-event-breakdown.ts
 */

import { pendoAPI } from './src/lib/pendo-api';

async function testPageEventBreakdown() {
  console.log('🧪 Testing Page Event Breakdown API Method');
  console.log('==========================================\n');

  try {
    // Step 1: Get a real page ID
    console.log('📋 Step 1: Fetching pages...');
    const pages = await pendoAPI.getPages({ limit: 10 });

    if (!pages || pages.length === 0) {
      console.log('❌ No pages found');
      return;
    }

    console.log(`✅ Found ${pages.length} pages`);
    const testPage = pages[0];
    console.log(`📄 Testing with page: ${testPage.url || testPage.id}`);
    console.log(`   Page ID: ${testPage.id}\n`);

    // Step 2: Test the getPageEventBreakdown method
    console.log('📊 Step 2: Calling getPageEventBreakdown...');
    const eventBreakdown = await pendoAPI.getPageEventBreakdown(testPage.id, 100);

    console.log(`✅ Retrieved ${eventBreakdown.length} event breakdown rows\n`);

    if (eventBreakdown.length > 0) {
      // Display first few rows
      console.log('📋 Sample rows (first 5):');
      eventBreakdown.slice(0, 5).forEach((row, index) => {
        console.log(`\n${index + 1}. Visitor: ${row.visitorId}`);
        console.log(`   Date: ${row.date}`);
        console.log(`   Total Views: ${row.totalViews}`);
        console.log(`   Account ID: ${row.accountId || 'N/A'}`);
        console.log(`   Browser: ${row.browserName || 'N/A'} ${row.browserVersion || ''}`);
        console.log(`   Server: ${row.serverName || 'N/A'}`);
        console.log(`   Frustration Metrics:`);
        console.log(`     - U-Turns: ${row.uTurns || 0}`);
        console.log(`     - Dead Clicks: ${row.deadClicks || 0}`);
        console.log(`     - Error Clicks: ${row.errorClicks || 0}`);
        console.log(`     - Rage Clicks: ${row.rageClicks || 0}`);
      });

      // Check for frustration metrics availability
      console.log('\n🔍 Frustration Metrics Analysis:');
      const hasAnyFrustrationMetrics = eventBreakdown.some(r =>
        (r.uTurns && r.uTurns > 0) ||
        (r.deadClicks && r.deadClicks > 0) ||
        (r.errorClicks && r.errorClicks > 0) ||
        (r.rageClicks && r.rageClicks > 0)
      );

      if (hasAnyFrustrationMetrics) {
        console.log('✅ Frustration metrics ARE available in the events source');
        const totalUTurns = eventBreakdown.reduce((sum, r) => sum + (r.uTurns || 0), 0);
        const totalDeadClicks = eventBreakdown.reduce((sum, r) => sum + (r.deadClicks || 0), 0);
        const totalErrorClicks = eventBreakdown.reduce((sum, r) => sum + (r.errorClicks || 0), 0);
        const totalRageClicks = eventBreakdown.reduce((sum, r) => sum + (r.rageClicks || 0), 0);
        console.log(`   Total U-Turns: ${totalUTurns}`);
        console.log(`   Total Dead Clicks: ${totalDeadClicks}`);
        console.log(`   Total Error Clicks: ${totalErrorClicks}`);
        console.log(`   Total Rage Clicks: ${totalRageClicks}`);
      } else {
        console.log('⚠️  Frustration metrics are NOT available in the events source');
        console.log('   The API response does not include these fields');
        console.log('   Consider checking Pendo documentation or contacting support');
      }

      // Browser metadata check
      console.log('\n🌐 Browser Metadata Analysis:');
      const hasBrowserData = eventBreakdown.some(r => r.browserName || r.browserVersion);
      if (hasBrowserData) {
        console.log('✅ Browser metadata IS available');
        const browsers = new Set(eventBreakdown.map(r => r.browserName).filter(Boolean));
        console.log(`   Unique browsers: ${Array.from(browsers).join(', ')}`);
      } else {
        console.log('⚠️  Browser metadata is NOT available');
      }

      // Summary stats
      console.log('\n📈 Summary Statistics:');
      const uniqueVisitors = new Set(eventBreakdown.map(r => r.visitorId)).size;
      const totalViews = eventBreakdown.reduce((sum, r) => sum + r.totalViews, 0);
      const dateRange = {
        earliest: eventBreakdown[eventBreakdown.length - 1]?.date,
        latest: eventBreakdown[0]?.date
      };
      console.log(`   Unique visitors: ${uniqueVisitors}`);
      console.log(`   Total views: ${totalViews}`);
      console.log(`   Date range: ${dateRange.earliest} to ${dateRange.latest}`);

    } else {
      console.log('⚠️  No event breakdown data available for this page');
      console.log('   This could mean:');
      console.log('   1. No events in the last 30 days');
      console.log('   2. The page ID is not tracked');
      console.log('   3. The events source may not support this query format');
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testPageEventBreakdown().catch(console.error);
