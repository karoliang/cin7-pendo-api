#!/usr/bin/env node

// Test Pendo API pagination to find all available records
import fetch from 'node-fetch';
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

const PENDO_API_KEY = env.VITE_PENDO_API_KEY;
const PENDO_BASE_URL = 'https://app.pendo.io/api/v1';

async function testPagination(endpoint, name) {
  console.log(`\n🔍 Testing ${name} pagination...\n`);

  let offset = 0;
  const limit = 500;
  let totalFetched = 0;
  let hasMore = true;
  const allIds = new Set();

  while (hasMore && offset < 5000) { // Safety limit
    const url = new URL(`${PENDO_BASE_URL}/${endpoint}`);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': PENDO_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`❌ API error at offset ${offset}: ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const results = data.results || data || [];

      if (results.length === 0) {
        console.log(`✓ No more results at offset ${offset}`);
        break;
      }

      // Track unique IDs
      const newIds = results.filter(item => !allIds.has(item.id));
      newIds.forEach(item => allIds.add(item.id));

      totalFetched += results.length;
      console.log(`  Offset ${offset}: Fetched ${results.length} records (${newIds.length} new, ${allIds.size} unique total)`);

      if (newIds.length === 0) {
        console.log(`  ℹ️  All records at this offset were duplicates. Stopping.`);
        break;
      }

      offset += limit;
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      break;
    }
  }

  console.log(`\n📊 ${name} Summary:`);
  console.log(`   Total API calls: ${Math.ceil(offset / limit)}`);
  console.log(`   Total records fetched: ${totalFetched}`);
  console.log(`   Unique records: ${allIds.size}`);
  console.log(`   Duplicates: ${totalFetched - allIds.size}`);
}

async function runTests() {
  console.log('🚀 PENDO API PAGINATION TEST\n');
  console.log('=' .repeat(80));

  await testPagination('guide', 'Guides');
  await testPagination('feature', 'Features');
  await testPagination('page', 'Pages');
  await testPagination('report', 'Reports');

  console.log('\n' + '=' .repeat(80));
  console.log('\n✅ Pagination test complete!');
}

runTests().catch(console.error);
