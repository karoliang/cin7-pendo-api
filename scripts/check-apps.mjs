#!/usr/bin/env node

// Check for multiple apps in Pendo account
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

console.log('🔍 CHECKING FOR MULTIPLE APPS IN PENDO ACCOUNT\n');
console.log('=' .repeat(80));

async function checkApps() {
  // Try to get app list
  console.log('\n📱 Fetching app list...\n');

  const endpoints = ['app', 'apps', 'subscription/app'];

  for (const endpoint of endpoints) {
    try {
      const url = `${PENDO_BASE_URL}/${endpoint}`;
      console.log(`Trying: ${endpoint}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': PENDO_API_KEY,
          'Content-Type': 'application/json',
        }
      });

      console.log(`  Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Success!`);

        if (Array.isArray(data)) {
          console.log(`  📊 Found ${data.length} apps:`);
          data.forEach((app, i) => {
            console.log(`    ${i + 1}. ${app.name || app.id} (ID: ${app.id})`);
          });
        } else if (data.results && Array.isArray(data.results)) {
          console.log(`  📊 Found ${data.results.length} apps:`);
          data.results.forEach((app, i) => {
            console.log(`    ${i + 1}. ${app.name || app.id} (ID: ${app.id})`);
          });
        } else {
          console.log(`  Data structure: ${Object.keys(data).join(', ')}`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }
}

async function analyzeCurrentData() {
  console.log('\n📊 ANALYZING CURRENT DATA FOR APP IDs:\n');

  const entities = [
    { name: 'Pages', endpoint: 'page' },
    { name: 'Features', endpoint: 'feature' },
    { name: 'Reports', endpoint: 'report' }
  ];

  for (const entity of entities) {
    try {
      const response = await fetch(`${PENDO_BASE_URL}/${entity.endpoint}?limit=1000`, {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': PENDO_API_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);

        // Collect unique appIds
        const appIds = new Set();
        const appIdsArray = new Set();

        results.forEach(item => {
          if (item.appId) appIds.add(item.appId);
          if (item.appIds && Array.isArray(item.appIds)) {
            item.appIds.forEach(id => appIdsArray.add(id));
          }
        });

        console.log(`${entity.name}:`);
        console.log(`  Total records: ${results.length}`);
        console.log(`  Unique appId values: ${appIds.size}`);
        if (appIds.size > 0) {
          console.log(`  App IDs: ${Array.from(appIds).join(', ')}`);
        }
        if (appIdsArray.size > 0) {
          console.log(`  appIds array (${appIdsArray.size}): ${Array.from(appIdsArray).slice(0, 5).join(', ')}${appIdsArray.size > 5 ? '...' : ''}`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`${entity.name}: Error - ${error.message}\n`);
    }
  }
}

async function testAppFiltering() {
  console.log('\n🔬 TESTING APP-SPECIFIC QUERIES:\n');

  // Get first page to find an appId
  try {
    const response = await fetch(`${PENDO_BASE_URL}/page?limit=1`, {
      method: 'GET',
      headers: {
        'X-Pendo-Integration-Key': PENDO_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      const results = Array.isArray(data) ? data : (data.results || []);

      if (results.length > 0 && results[0].appId) {
        const appId = results[0].appId;
        console.log(`Found appId: ${appId}`);
        console.log('\nTrying to query with appId filter...');

        // Try different filter formats
        const filterTests = [
          { param: 'appId', value: appId },
          { param: 'app', value: appId },
          { param: 'filter', value: `appId:${appId}` }
        ];

        for (const test of filterTests) {
          const url = new URL(`${PENDO_BASE_URL}/page`);
          url.searchParams.append(test.param, test.value);

          const testResponse = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'X-Pendo-Integration-Key': PENDO_API_KEY,
              'Content-Type': 'application/json',
            }
          });

          console.log(`  ${test.param}=${test.value}: ${testResponse.status} ${testResponse.statusText}`);
        }
      }
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

async function run() {
  await checkApps();
  await analyzeCurrentData();
  await testAppFiltering();

  console.log('\n' + '=' .repeat(80));
  console.log('\n💡 FINDINGS:\n');
  console.log('If you see multiple app IDs above, this explains the discrepancy!');
  console.log('\nThe Pendo UI shows data from ALL apps, but the API integration key');
  console.log('might only have access to ONE app\'s data.');
  console.log('\nSOLUTION: Contact Pendo support to:');
  console.log('  1. List all apps in your account');
  console.log('  2. Get API access to all apps (or separate keys per app)');
  console.log('  3. Learn how to query across multiple apps');
}

run().catch(console.error);
