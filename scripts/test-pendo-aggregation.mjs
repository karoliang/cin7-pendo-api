#!/usr/bin/env node

// Test Pendo aggregation API to get comprehensive counts
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

async function testAggregationAPI() {
  console.log('🔍 TESTING PENDO AGGREGATION API\n');
  console.log('=' .repeat(80));

  // Test aggregation endpoint for pages with different time ranges
  const tests = [
    {
      name: 'Pages - Last 30 days',
      endpoint: 'aggregation',
      body: {
        response: { mimeType: 'application/json' },
        request: {
          pipeline: [
            {
              source: {
                pages: null
              }
            }
          ],
          requestId: 'test-pages-all'
        }
      }
    },
    {
      name: 'Pages - Metadata Query',
      endpoint: 'metadata/schema/page',
      method: 'GET'
    },
    {
      name: 'Pages - With filters (all)',
      endpoint: 'page',
      method: 'GET',
      params: { limit: 1000 }
    }
  ];

  for (const test of tests) {
    console.log(`\n📊 ${test.name}:`);
    console.log('-'.repeat(80));

    try {
      const url = `${PENDO_BASE_URL}/${test.endpoint}`;
      const options = {
        method: test.method || 'POST',
        headers: {
          'X-Pendo-Integration-Key': PENDO_API_KEY,
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      if (test.params) {
        const urlObj = new URL(url);
        Object.entries(test.params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
        const response = await fetch(urlObj.toString(), options);

        if (!response.ok) {
          console.log(`❌ Error: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.log(`   Response: ${errorText.substring(0, 200)}`);
        } else {
          const data = await response.json();
          console.log(`✅ Success!`);
          console.log(`   Response type: ${Array.isArray(data) ? 'Array' : typeof data}`);
          if (Array.isArray(data)) {
            console.log(`   Records count: ${data.length}`);
          } else if (data.results) {
            console.log(`   Results count: ${data.results.length}`);
          } else if (data.data) {
            console.log(`   Data length: ${data.data.length}`);
          }
          // Show structure
          console.log(`   Keys: ${Object.keys(data).join(', ')}`);
        }
      } else {
        const response = await fetch(url, options);

        if (!response.ok) {
          console.log(`❌ Error: ${response.status} ${response.statusText}`);
        } else {
          const data = await response.json();
          console.log(`✅ Success!`);
          console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
          if (data.results) console.log(`   Results: ${data.results.length} items`);
        }
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(80));

  // Try to get metadata about available APIs
  console.log('\n📋 CHECKING API CAPABILITIES:\n');

  const endpoints = ['page', 'pages', 'metadata/page', 'metadata/schema/page'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${PENDO_BASE_URL}/${endpoint}`, {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': PENDO_API_KEY,
          'Content-Type': 'application/json',
        }
      });

      console.log(`${endpoint.padEnd(30)} - Status: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${endpoint.padEnd(30)} - Error: ${error.message}`);
    }
  }
}

testAggregationAPI().catch(console.error);
