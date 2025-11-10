#!/usr/bin/env node

// Check if first 20 guides (by ID) have events - these are the ones Edge Function processes
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

console.log('🔍 CHECKING FIRST 20 GUIDES FOR EVENTS\n');
console.log('='.repeat(80));

async function checkFirst20() {
  // Get first 20 guides by ID (same order Edge Function uses)
  const { data: guides, error } = await supabase
    .from('pendo_guides')
    .select('id, name, views')
    .order('id')  // Edge Function doesn't specify order, so default is probably ID
    .limit(20);

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }

  console.log(`\n📊 First 20 guides (by ID):\n`);

  let withEvents = 0;
  let totalEvents = 0;

  for (let i = 0; i < guides.length; i++) {
    const guide = guides[i];

    const { count } = await supabase
      .from('pendo_events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', guide.id)
      .eq('entity_type', 'guide');

    if (count > 0) {
      console.log(`   ${i+1}. ${guide.name.substring(0, 50)}...`);
      console.log(`      ID: ${guide.id}`);
      console.log(`      Events in DB: ${count}`);
      console.log(`      Views in guide table: ${guide.views}`);
      console.log(`      Match: ${count === guide.views ? '✅' : '❌'}`);
      console.log('');
      withEvents++;
      totalEvents += count;
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   Guides with events: ${withEvents} / 20`);
  console.log(`   Total events: ${totalEvents}`);

  if (withEvents === 0) {
    console.log(`\n   ⚠️  PROBLEM: First 20 guides have NO events!`);
    console.log(`   This means Edge Function will calculate 0 for all.`);
    console.log(`   SOLUTION: Change Edge Function to order by 'views DESC' or 'last_updated_at DESC'`);
  } else {
    console.log(`\n   ✅ ${withEvents} guides should get analytics from Edge Function`);
  }
}

checkFirst20().catch(error => {
  console.error('\n❌ Check failed:', error);
  process.exit(1);
});
