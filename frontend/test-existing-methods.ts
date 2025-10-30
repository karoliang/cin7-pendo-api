import { pendoAPI } from './src/lib/pendo-api';

async function testExistingPageMethods() {
  console.log('Testing existing page methods...\n');

  try {
    const pages = await pendoAPI.getPages({ limit: 5 });
    const testPage = pages[0];
    console.log(`Testing with page: ${testPage.id}\n`);

    // Test getPageAnalytics which uses getPageTimeSeries internally
    console.log('Testing getPageAnalytics (which uses getPageTimeSeries)...');
    const analytics = await pendoAPI.getPageAnalytics(testPage.id, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    });

    console.log(`✅ getPageAnalytics worked!`);
    console.log(`   Views: ${analytics.viewedCount}`);
    const timeSeriesLength = analytics.timeSeriesData ? analytics.timeSeriesData.length : 0;
    console.log(`   Time series points: ${timeSeriesLength}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testExistingPageMethods();
