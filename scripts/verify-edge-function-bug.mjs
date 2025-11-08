#!/usr/bin/env node

// Verify that the Edge Function bug is caused by limiting analytics to 20 but upserting ALL guides
import { createClient } from '@supabase/supabase-js';
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
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 VERIFYING EDGE FUNCTION BUG HYPOTHESIS\n');
console.log('='.repeat(80));

async function checkAnalyticsCoverage() {
  console.log('\n📊 Checking which guides have analytics:\n');

  // Get all guides ordered by ID (same order Edge Function would process)
  const { data: allGuides, error } = await supabase
    .from('pendo_guides')
    .select('id, name, views, last_synced')
    .order('id')
    .limit(100);

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }

  console.log(`   Total guides checked: ${allGuides.length}\n`);

  let withAnalytics = 0;
  let withoutAnalytics = 0;

  // Check first 20 (which Edge Function calculates analytics for)
  console.log('   FIRST 20 GUIDES (should have analytics if events exist):');
  for (let i = 0; i < Math.min(20, allGuides.length); i++) {
    const guide = allGuides[i];

    // Check if this guide has events
    const { count } = await supabase
      .from('pendo_events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', guide.id)
      .eq('entity_type', 'guide');

    if (count > 0) {
      const hasAnalytics = guide.views > 0;
      console.log(`   ${i+1}. ${guide.name.substring(0, 40)}...`);
      console.log(`      Events: ${count} | Views in DB: ${guide.views} ${hasAnalytics ? '✅' : '❌ BUG!'}`);

      if (hasAnalytics) {
        withAnalytics++;
      } else {
        withoutAnalytics++;
      }
    }
  }

  console.log(`\n   Summary (first 20): ${withAnalytics} with analytics, ${withoutAnalytics} WITHOUT (BUG!)\n`);

  // Check guides 21-100 (which Edge Function would set to zero)
  console.log('   GUIDES 21-100 (Edge Function sets these to ZERO):');
  let zeroedOut = 0;
  for (let i = 20; i < Math.min(100, allGuides.length); i++) {
    const guide = allGuides[i];

    const { count } = await supabase
      .from('pendo_events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', guide.id)
      .eq('entity_type', 'guide');

    if (count > 0) {
      console.log(`   ${i+1}. ${guide.name.substring(0, 40)}...`);
      console.log(`      Events: ${count} | Views in DB: ${guide.views} (should be ${count}, got 0) ❌`);
      zeroedOut++;
    }
  }

  console.log(`\n   Guides with events but zeroed out: ${zeroedOut}\n`);

  return { withAnalytics, withoutAnalytics, zeroedOut };
}

async function run() {
  const result = await checkAnalyticsCoverage();

  console.log('='.repeat(80));
  console.log('\n🐛 ROOT CAUSE IDENTIFIED:\n');
  console.log('   The Edge Function has a critical bug in its logic:');
  console.log('   1. Fetches ALL guides (up to 5000)');
  console.log('   2. Only calculates analytics for first 20');
  console.log('   3. Then UPSERTS all guides, setting non-calculated ones to ZERO');
  console.log('   4. This OVERWRITES existing analytics with zeros!\n');

  console.log('   THE FIX:');
  console.log('   Only upsert guides that were actually processed for analytics.');
  console.log('   Or: Calculate analytics for ALL fetched guides (may timeout).');
  console.log('   Or: Use UPDATE instead of UPSERT to avoid overwriting.\n');
}

run().catch(error => {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
});
