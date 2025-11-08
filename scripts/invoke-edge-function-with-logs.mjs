#!/usr/bin/env node

// Invoke Edge Function and show detailed response
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
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 INVOKING EDGE FUNCTION WITH DETAILED LOGGING\n');
console.log('='.repeat(80));

async function invokeEdgeFunction() {
  console.log('\n📡 Calling Edge Function...\n');

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/sync-pendo-incremental`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    console.log(`   Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();
    console.log('   📊 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    console.log('\n💡 To see Edge Function logs:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/functions/sync-pendo-incremental/logs');
    console.log('   2. Or run: supabase functions serve (for local testing)');
    console.log('');

    return data;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    throw error;
  }
}

invokeEdgeFunction().catch(error => {
  console.error('\n❌ Failed:', error);
  process.exit(1);
});
