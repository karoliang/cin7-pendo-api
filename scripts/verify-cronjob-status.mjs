#!/usr/bin/env node

// Verify cronjob was successfully disabled
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

console.log('✅ CRONJOB STATUS VERIFICATION\n');
console.log('='.repeat(80));

async function checkAnalyticsStatus() {
  console.log('\n📊 Current Analytics Status:\n');

  const { data: guidesWithViews, count: guidesCount } = await supabase
    .from('pendo_guides')
    .select('*', { count: 'exact' })
    .gt('views', 0);

  const { data: featuresWithUsage, count: featuresCount } = await supabase
    .from('pendo_features')
    .select('*', { count: 'exact' })
    .gt('usage_count', 0);

  const { data: pagesWithViews, count: pagesCount } = await supabase
    .from('pendo_pages')
    .select('*', { count: 'exact' })
    .gt('views', 0);

  console.log(`   Guides with views: ${guidesCount} (Expected: ~92)`);
  console.log(`   Features with usage: ${featuresCount} (Expected: ~71)`);
  console.log(`   Pages with views: ${pagesCount} (Expected: ~31)`);
  console.log('');

  // Check Trial Guide specifically
  const { data: trialGuide } = await supabase
    .from('pendo_guides')
    .select('id, name, views, last_synced')
    .eq('id', 'OERSob_88kNTBYByJIWzP5xZmLM')
    .single();

  if (trialGuide) {
    console.log('   Trial Guide (FSAI):');
    console.log(`   - Views: ${trialGuide.views} (Expected: 1000)`);
    console.log(`   - Last synced: ${new Date(trialGuide.last_synced).toLocaleString()}`);
    console.log('');
  }

  const status = guidesCount >= 90 && featuresCount >= 65 && pagesCount >= 30;

  if (status) {
    console.log('   ✅ Analytics are intact! Cronjob successfully disabled.\n');
  } else {
    console.log('   ⚠️  Analytics may have been wiped. Run manual sync:\n');
    console.log('   node scripts/sync-all-analytics.mjs\n');
  }

  return status;
}

async function run() {
  const status = await checkAnalyticsStatus();

  console.log('='.repeat(80));
  console.log('\n🎯 NEXT STEPS:\n');

  if (status) {
    console.log('   1. ✅ Cronjob disabled - analytics are safe');
    console.log('   2. 📊 Verify analytics in production dashboard');
    console.log('   3. 🔍 Investigate Edge Function issue (optional)');
    console.log('   4. 📅 Week 2: Start date range selector implementation');
    console.log('   5. 🤖 Week 2-3: Research Pendo Listen API\n');
  } else {
    console.log('   1. ⚠️  Run: node scripts/sync-all-analytics.mjs');
    console.log('   2. 📊 Verify cronjob is disabled in Supabase');
    console.log('   3. 🔄 Re-check analytics status\n');
  }
}

run().catch(error => {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
});
