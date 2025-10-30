/**
 * Test script for getPageEventBreakdown method - tests multiple pages
 */

import { pendoAPI } from './src/lib/pendo-api';

async function testMultiplePages() {
  console.log('🧪 Testing Page Event Breakdown with Multiple Pages');
  console.log('===================================================\n');

  try {
    // Get pages
    console.log('📋 Fetching pages...');
    const pages = await pendoAPI.getPages({ limit: 20 });

    console.log(`✅ Found ${pages.length} pages\n`);

    // Try to find a page with some views
    console.log('🔍 Looking for pages with activity...\n');

    let foundData = false;
    for (let i = 0; i < Math.min(pages.length, 10); i++) {
      const page = pages[i];
      console.log(`Testing page ${i + 1}: ${page.url || page.id}`);

      try {
        const eventBreakdown = await pendoAPI.getPageEventBreakdown(page.id, 50);

        if (eventBreakdown.length > 0) {
          foundData = true;
          console.log(`✅ Found ${eventBreakdown.length} event records!\n`);

          // Display sample
          console.log('📋 Sample rows (first 3):');
          eventBreakdown.slice(0, 3).forEach((row, index) => {
            console.log(`\n${index + 1}. Visitor: ${row.visitorId}`);
            console.log(`   Date: ${row.date}`);
            console.log(`   Views: ${row.totalViews}`);
            console.log(`   Browser: ${row.browserName || 'N/A'} ${row.browserVersion || ''}`);
            console.log(`   Frustration: U-Turns=${row.uTurns||0}, Dead=${row.deadClicks||0}, Error=${row.errorClicks||0}, Rage=${row.rageClicks||0}`);
          });

          // Check what fields are available
          const sampleRow = eventBreakdown[0];
          console.log(`\n📋 Available fields in response:`);
          Object.keys(sampleRow).forEach(key => {
            const value = sampleRow[key as keyof typeof sampleRow];
            if (value !== undefined && value !== null) {
              console.log(`   - ${key}: ${typeof value === 'object' ? 'object' : value}`);
            }
          });

          break;
        } else {
          console.log(`   No data for this page\n`);
        }
      } catch (error) {
        console.log(`   Error: ${error}\n`);
      }
    }

    if (!foundData) {
      console.log('\n⚠️  No pages with event data found in first 10 pages');
      console.log('   This might mean:');
      console.log('   - The events source does not track page views');
      console.log('   - Need to use pageEvents source instead');
      console.log('   - No recent activity on these pages');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMultiplePages();
