#!/usr/bin/env node

// Disable the automatic sync cronjob temporarily
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

console.log('🔧 DISABLING AUTOMATED CRONJOB\n');
console.log('='.repeat(80));

async function disableCronjob() {
  console.log('\n📊 Step 1: Check current cronjob status\n');

  // Check current jobs
  const { data: currentJobs, error: checkError } = await supabase
    .rpc('cron.job');

  if (checkError) {
    console.log(`   ℹ️  Cannot check cron jobs (might need to run via SQL Editor)\n`);
  } else if (currentJobs) {
    console.log(`   Current cron jobs: ${JSON.stringify(currentJobs, null, 2)}\n`);
  }

  console.log('📊 Step 2: Unschedule the sync cronjob\n');

  // Unschedule the cronjob
  const { data, error } = await supabase.rpc('cron.unschedule', {
    job_name: 'sync-pendo-incremental-every-6-hours'
  });

  if (error) {
    console.log(`   ⚠️  Could not unschedule via RPC: ${error.message}`);
    console.log('   Please run this SQL in Supabase SQL Editor:\n');
    console.log('   SELECT cron.unschedule(\'sync-pendo-incremental-every-6-hours\');\n');
    console.log('   Dashboard: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/sql\n');
  } else {
    console.log(`   ✅ Cronjob unscheduled successfully\n`);
  }
}

disableCronjob().catch(error => {
  console.error('\n❌ Error:', error);
  console.log('\n📌 MANUAL STEP REQUIRED:');
  console.log('   Go to: https://supabase.com/dashboard/project/nrutlzclujyejusvbafm/sql');
  console.log('   Run: SELECT cron.unschedule(\'sync-pendo-incremental-every-6-hours\');\n');
  process.exit(1);
});
