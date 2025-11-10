#!/usr/bin/env node

// Check pendo_events table
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

async function checkPendoEvents() {
  console.log('🔍 Checking pendo_events table:\n');

  try {
    // Get count
    const { count, error: countError } = await supabase
      .from('pendo_events')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`❌ Error getting count: ${countError.message}`);
      return;
    }

    console.log(`   Total records: ${count || 0}\n`);

    if (count && count > 0) {
      // Get sample records
      const { data, error } = await supabase
        .from('pendo_events')
        .select('*')
        .limit(3);

      if (error) {
        console.error(`❌ Error fetching records: ${error.message}`);
      } else {
        console.log('   Sample records:\n');
        data.forEach((record, idx) => {
          console.log(`   ${idx + 1}. ID: ${record.id}`);
          console.log(`      Type: ${record.event_type}`);
          console.log(`      Entity: ${record.entity_type} (${record.entity_id})`);
          console.log(`      Time: ${new Date(record.browser_time).toLocaleString()}`);
          console.log('');
        });
      }
    } else {
      console.log('   ⚠️  Table is empty - no events were actually inserted\n');
      console.log('   This confirms the Edge Function reports success but events');
      console.log('   are not being inserted into the database.');
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

checkPendoEvents().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
