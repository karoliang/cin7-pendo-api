#!/usr/bin/env node

/**
 * Manually trigger the Edge Function via HTTP
 * This bypasses the SQL function and calls the Edge Function directly
 */

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

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 MANUALLY TRIGGERING EDGE FUNCTION VIA HTTP\n');
console.log('='.repeat(80));

const url = `${SUPABASE_URL}/functions/v1/sync-pendo-incremental`;

console.log(`\n📡 Calling: ${url}`);
console.log(`🔑 Using: ANON_KEY\n`);

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`\n❌ Error Response:`);
    console.log(errorText);
    process.exit(1);
  }

  const result = await response.json();
  console.log(`\n✅ Success!`);
  console.log(JSON.stringify(result, null, 2));

  console.log(`\n${'='.repeat(80)}`);
  console.log(`\n🎯 NEXT STEPS:\n`);
  console.log(`   1. Wait 1-2 minutes for Edge Function to complete`);
  console.log(`   2. Run verification script: node scripts/verify-cronjob-status.mjs`);
  console.log(`   3. Check if analytics are still intact (should be ~92 guides with views)`);
  console.log(`   4. If safe, re-enable cronjob in Supabase SQL Editor\n`);

} catch (error) {
  console.error(`\n❌ Failed to trigger Edge Function:`, error.message);
  console.log(`\n💡 Troubleshooting:`);
  console.log(`   - Check if Edge Function is deployed`);
  console.log(`   - Verify SUPABASE_URL and ANON_KEY are correct`);
  console.log(`   - Check Edge Function logs in Supabase Dashboard`);
  process.exit(1);
}
