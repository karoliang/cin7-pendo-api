#!/usr/bin/env node
/**
 * Test script for Top Visitors and Top Accounts API methods
 * Run with: node test_top_visitors_accounts.js [pageId]
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually (try multiple locations)
let API_KEY;

const envPaths = [
  join(__dirname, 'frontend', '.env'),
  join(__dirname, '.env')
];

for (const envPath of envPaths) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/(?:VITE_)?PENDO_API_KEY=(.+)/);
    if (match) {
      API_KEY = match[1].trim();
      console.log(`✅ API key loaded from: ${envPath}`);
      break;
    }
  } catch (error) {
    // Try next path
  }
}

const BASE_URL = 'https://app.pendo.io';

if (!API_KEY) {
  console.error('❌ Error: VITE_PENDO_API_KEY not found in frontend/.env');
  process.exit(1);
}

async function testTopVisitorsAndAccounts(pageId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TESTING TOP VISITORS AND TOP ACCOUNTS API METHODS`);
  console.log(`${'='.repeat(80)}\n`);

  const headers = {
    'X-Pendo-Integration-Key': API_KEY,
    'Content-Type': 'application/json'
  };

  // Get a test page ID if not provided
  let testPageId = pageId;
  if (!testPageId) {
    console.log('📄 Fetching pages to get a test page ID...');
    try {
      const response = await fetch(`${BASE_URL}/api/v1/page?limit=5`, {
        method: 'GET',
        headers
      });
      const pages = await response.json();
      if (pages.length === 0) {
        console.error('❌ No pages found');
        return;
      }
      testPageId = pages[0].id;
      console.log(`✅ Using page: ${pages[0].title || pages[0].url} (${testPageId})\n`);
    } catch (error) {
      console.error('❌ Error fetching pages:', error.message);
      return;
    }
  }

  const endTime = Date.now();
  const startTime = endTime - (90 * 24 * 60 * 60 * 1000); // Last 90 days

  // Test 1: Top Visitors
  console.log(`\n📊 Test 1: Fetching top 10 visitors for page ${testPageId}`);

  const visitorsRequest = {
    response: { mimeType: "application/json" },
    request: {
      pipeline: [
        {
          spawn: [
            // Query 1: Get view counts by visitor
            [
              {
                source: {
                  pageEvents: null,
                  timeSeries: {
                    first: startTime,
                    count: 90,
                    period: "dayRange"
                  }
                }
              },
              {
                filter: `pageId == "${testPageId}"`
              },
              {
                identified: "visitorId"
              },
              {
                group: {
                  group: ["visitorId"],
                  fields: {
                    viewCount: { count: "visitorId" }
                  }
                }
              }
            ],
            // Query 2: Get visitor details
            [
              {
                source: { visitors: null }
              },
              {
                identified: "visitorId"
              },
              {
                select: {
                  visitorId: "visitorId",
                  email: "metadata.auto.email",
                  name: "metadata.agent.name"
                }
              }
            ]
          ]
        },
        {
          join: {
            fields: ["visitorId"],
            width: 2
          }
        },
        {
          sort: ["-viewCount"]
        }
      ],
      requestId: `top_visitors_${testPageId}_${Date.now()}`
    }
  };

  try {
    console.log(`🔍 Request:`, JSON.stringify(visitorsRequest, null, 2));

    const response = await fetch(`${BASE_URL}/api/v1/aggregation`, {
      method: 'POST',
      headers,
      body: JSON.stringify(visitorsRequest)
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    let data;
    const responseText = await response.text();
    console.log(`📦 Raw response:`, responseText);

    try {
      data = JSON.parse(responseText);
      console.log(`📦 Parsed response data:`, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`❌ Failed to parse response as JSON`);
      data = { error: responseText };
    }

    if (response.ok) {
      console.log(`✅ Top Visitors API call successful!`);

      if (data.results && data.results.length > 0) {
        console.log(`\n📊 Found ${data.results.length} visitors`);
        console.log(`\nTop 5 visitors:`);
        data.results.slice(0, 5).forEach((result, i) => {
          const visitorId = result.visitorId || result[0]?.visitorId || 'unknown';
          const email = result.email || result[1]?.email || 'N/A';
          const name = result.name || result[1]?.name || 'N/A';
          const viewCount = result.viewCount || result[0]?.viewCount || 0;
          console.log(`\n${i + 1}. ${email} (${name})`);
          console.log(`   Visitor ID: ${visitorId}`);
          console.log(`   View Count: ${viewCount}`);
        });
      } else {
        console.log(`\n⚠️  No visitor results found for page ${testPageId}`);
      }
    } else {
      console.error(`❌ API Error: ${response.status}`);
      console.error(`   ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
  }

  // Test 2: Top Accounts
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📊 Test 2: Fetching top 10 accounts for page ${testPageId}`);

  const accountsRequest = {
    response: { mimeType: "application/json" },
    request: {
      pipeline: [
        {
          spawn: [
            // Query 1: Get view counts by account
            [
              {
                source: {
                  pageEvents: null,
                  timeSeries: {
                    first: startTime,
                    count: 90,
                    period: "dayRange"
                  }
                }
              },
              {
                filter: `pageId == "${testPageId}"`
              },
              {
                identified: "accountId"
              },
              {
                group: {
                  group: ["accountId"],
                  fields: {
                    viewCount: { count: "accountId" }
                  }
                }
              }
            ],
            // Query 2: Get account details
            [
              {
                source: { accounts: null }
              },
              {
                identified: "accountId"
              },
              {
                select: {
                  accountId: "accountId",
                  name: "metadata.agent.name",
                  arr: "metadata.custom.arrannuallyrecurringrevenue",
                  planlevel: "metadata.custom.planlevel"
                }
              }
            ]
          ]
        },
        {
          join: {
            fields: ["accountId"],
            width: 2
          }
        },
        {
          sort: ["-viewCount"]
        }
      ],
      requestId: `top_accounts_${testPageId}_${Date.now()}`
    }
  };

  try {
    console.log(`🔍 Request:`, JSON.stringify(accountsRequest, null, 2));

    const response = await fetch(`${BASE_URL}/api/v1/aggregation`, {
      method: 'POST',
      headers,
      body: JSON.stringify(accountsRequest)
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    let data;
    const responseText = await response.text();
    console.log(`📦 Raw response:`, responseText);

    try {
      data = JSON.parse(responseText);
      console.log(`📦 Parsed response data:`, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`❌ Failed to parse response as JSON`);
      data = { error: responseText };
    }

    if (response.ok) {
      console.log(`✅ Top Accounts API call successful!`);

      if (data.results && data.results.length > 0) {
        console.log(`\n📊 Found ${data.results.length} accounts`);
        console.log(`\nTop 5 accounts:`);
        data.results.slice(0, 5).forEach((result, i) => {
          const accountId = result.accountId || result[0]?.accountId || 'unknown';
          const name = result.name || result[1]?.name || 'N/A';
          const arr = result.arr || result[1]?.arr || 'N/A';
          const planlevel = result.planlevel || result[1]?.planlevel || 'N/A';
          const viewCount = result.viewCount || result[0]?.viewCount || 0;
          console.log(`\n${i + 1}. ${name}`);
          console.log(`   Account ID: ${accountId}`);
          console.log(`   View Count: ${viewCount}`);
          console.log(`   ARR: ${arr}`);
          console.log(`   Plan Level: ${planlevel}`);
        });
      } else {
        console.log(`\n⚠️  No account results found for page ${testPageId}`);
      }
    } else {
      console.error(`❌ API Error: ${response.status}`);
      console.error(`   ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ TESTING COMPLETE`);
  console.log(`${'='.repeat(80)}\n`);
}

// Get pageId from command line argument
const testPageId = process.argv[2];
if (testPageId) {
  console.log(`🎯 Testing with page ID: ${testPageId}`);
} else {
  console.log(`🎯 No page ID provided, will fetch one automatically`);
}

testTopVisitorsAndAccounts(testPageId).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
