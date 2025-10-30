/**
 * Test script for new page-specific methods
 * Tests getFeaturesTargetingPage and getGuidesTargetingPage
 */

import { pendoAPI } from './src/lib/pendo-api.ts';

async function testPageMethods() {
  console.log('🧪 Testing Page-Specific Methods');
  console.log('=====================================\n');

  try {
    // First, get a real page ID to test with
    console.log('1️⃣ Fetching pages to get test page ID...');
    const pages = await pendoAPI.getPages({ limit: 5 });

    if (pages.length === 0) {
      console.error('❌ No pages found in Pendo');
      return;
    }

    const testPage = pages[0];
    console.log(`✅ Using test page: ${testPage.id} (${testPage.url})\n`);

    // Test getFeaturesTargetingPage
    console.log('2️⃣ Testing getFeaturesTargetingPage...');
    console.log('-----------------------------------');
    const features = await pendoAPI.getFeaturesTargetingPage(testPage.id, 5);

    console.log(`\n📊 Results: ${features.length} features`);
    features.forEach((feature, index) => {
      console.log(`\n${index + 1}. ${feature.name}`);
      console.log(`   Feature ID: ${feature.featureId}`);
      console.log(`   Event Count: ${feature.eventCount}`);
      console.log(`   Dead Clicks: ${feature.deadClicks ?? 'N/A'}`);
      console.log(`   Error Clicks: ${feature.errorClicks ?? 'N/A'}`);
      console.log(`   Rage Clicks: ${feature.rageClicks ?? 'N/A'}`);
    });

    // Test getGuidesTargetingPage
    console.log('\n\n3️⃣ Testing getGuidesTargetingPage...');
    console.log('-----------------------------------');
    const guides = await pendoAPI.getGuidesTargetingPage(testPage.id, 5);

    console.log(`\n📊 Results: ${guides.length} guides`);
    guides.forEach((guide, index) => {
      console.log(`\n${index + 1}. ${guide.name}`);
      console.log(`   Guide ID: ${guide.guideId}`);
      console.log(`   Status: ${guide.status}`);
      console.log(`   Product Area: ${guide.productArea ?? 'N/A'}`);
      console.log(`   Segment: ${guide.segment ?? 'N/A'}`);
    });

    console.log('\n\n✅ All tests completed successfully!');
    console.log('=====================================\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nStack trace:', error.stack);
  }
}

// Run tests
testPageMethods().catch(console.error);
