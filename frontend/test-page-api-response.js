// Test script to fetch actual Pendo page data and inspect the response structure
// Run with: node test-page-api-response.js

const PENDO_BASE_URL = 'https://app.pendo.io';
const PENDO_API_KEY = 'f4acdb2c-038c-4de1-a88b-ab90423037bf.us';

async function testPageEndpoint() {
  console.log('🔍 Testing Pendo Page API Endpoint');
  console.log('===================================\n');

  try {
    const url = `${PENDO_BASE_URL}/api/v1/page?limit=5`;
    console.log(`📡 Fetching: ${url}\n`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Pendo-Integration-Key': PENDO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error(`📄 Response: ${errorText}`);
      return;
    }

    const data = await response.json();

    console.log(`✅ Success! Retrieved ${data.length} pages\n`);
    console.log('📋 Response Structure Analysis:');
    console.log('================================\n');

    if (data.length > 0) {
      const firstPage = data[0];
      console.log('First page object keys:');
      console.log(Object.keys(firstPage));
      console.log('\n');

      console.log('Full first page object:');
      console.log(JSON.stringify(firstPage, null, 2));
      console.log('\n');

      console.log('Field Analysis:');
      console.log('---------------');
      console.log(`Has 'name' field: ${firstPage.hasOwnProperty('name')}`);
      console.log(`Has 'title' field: ${firstPage.hasOwnProperty('title')}`);
      console.log(`Has 'displayName' field: ${firstPage.hasOwnProperty('displayName')}`);
      console.log(`Has 'url' field: ${firstPage.hasOwnProperty('url')}`);
      console.log('\n');

      if (firstPage.name) {
        console.log(`✅ 'name' field value: "${firstPage.name}"`);
      }
      if (firstPage.title) {
        console.log(`✅ 'title' field value: "${firstPage.title}"`);
      }
      if (firstPage.displayName) {
        console.log(`✅ 'displayName' field value: "${firstPage.displayName}"`);
      }
      if (firstPage.url) {
        console.log(`✅ 'url' field value: "${firstPage.url}"`);
      }

      console.log('\n📊 All Pages Summary:');
      console.log('=====================\n');
      data.forEach((page, index) => {
        console.log(`Page ${index + 1}:`);
        console.log(`  ID: ${page.id}`);
        console.log(`  Name: ${page.name || 'N/A'}`);
        console.log(`  Title: ${page.title || 'N/A'}`);
        console.log(`  DisplayName: ${page.displayName || 'N/A'}`);
        console.log(`  URL: ${page.url || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No pages found in the response');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testPageEndpoint();
