#!/usr/bin/env node

// Test different API filter combinations to find missing records
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

console.log('🔍 TESTING PENDO API FILTERS FOR MISSING DATA\n');
console.log('=' .repeat(80));

// Test different filter combinations
const tests = [
  {
    name: 'Pages - Default (no filters)',
    endpoint: 'page',
    params: {}
  },
  {
    name: 'Pages - With expand=all',
    endpoint: 'page',
    params: { expand: 'all' }
  },
  {
    name: 'Pages - High limit (5000)',
    endpoint: 'page',
    params: { limit: 5000 }
  },
  {
    name: 'Features - Default',
    endpoint: 'feature',
    params: {}
  },
  {
    name: 'Features - High limit (5000)',
    endpoint: 'feature',
    params: { limit: 5000 }
  },
  {
    name: 'Features - With archived',
    endpoint: 'feature',
    params: { includeArchived: true }
  },
  {
    name: 'Reports - Default',
    endpoint: 'report',
    params: {}
  },
  {
    name: 'Reports - High limit (1000)',
    endpoint: 'report',
    params: { limit: 1000 }
  }
];

async function testFilter(test) {
  console.log(`\n📊 ${test.name}:`);
  console.log('-'.repeat(80));

  try {
    const url = new URL(`${PENDO_BASE_URL}/${test.endpoint}`);

    // Add query parameters
    Object.entries(test.params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    console.log(`   URL: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Pendo-Integration-Key': PENDO_API_KEY,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    const results = Array.isArray(data) ? data : (data.results || []);

    console.log(`   ✅ Returned: ${results.length} records`);

    // Show sample of fields if available
    if (results.length > 0) {
      const sample = results[0];
      const keys = Object.keys(sample).slice(0, 10);
      console.log(`   Fields: ${keys.join(', ')}${Object.keys(sample).length > 10 ? '...' : ''}`);

      // Check for archived/deleted flags
      if ('archived' in sample) console.log(`   ⚠️  Has 'archived' field`);
      if ('deleted' in sample) console.log(`   ⚠️  Has 'deleted' field`);
      if ('state' in sample) console.log(`   ⚠️  Has 'state' field: ${sample.state}`);
    }

  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

async function checkMetadata() {
  console.log('\n\n📋 CHECKING FIELD SCHEMAS:\n');
  console.log('=' .repeat(80));

  const endpoints = ['page', 'feature', 'report'];

  for (const endpoint of endpoints) {
    console.log(`\n${endpoint.toUpperCase()} schema:`);

    try {
      const url = `${PENDO_BASE_URL}/metadata/schema/${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': PENDO_API_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const schema = await response.json();
        console.log(`   ✅ Available fields: ${Object.keys(schema).length}`);

        // Look for filter-related fields
        const filterFields = Object.keys(schema).filter(key =>
          ['archived', 'deleted', 'state', 'status', 'visible', 'active'].includes(key.toLowerCase())
        );

        if (filterFields.length > 0) {
          console.log(`   🔍 Filter fields found: ${filterFields.join(', ')}`);
        }
      } else {
        console.log(`   ❌ Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function runTests() {
  for (const test of tests) {
    await testFilter(test);
  }

  await checkMetadata();

  console.log('\n\n' + '=' .repeat(80));
  console.log('\n💡 RECOMMENDATIONS:\n');
  console.log('1. Check Pendo UI filters (top of screenshots):');
  console.log('   - "All Accounts" filter');
  console.log('   - "All Apps" filter');
  console.log('   - "All product areas" filter');
  console.log('\n2. Verify your API key has access to all apps/accounts');
  console.log('\n3. Contact Pendo support to ask about:');
  console.log('   - Why API returns different counts than UI');
  console.log('   - How to access archived/deleted items via API');
  console.log('   - Whether there are multiple apps in your account');
  console.log('\n4. Try Pendo GraphQL API if available (may have more flexibility)');
}

runTests().catch(console.error);
