#!/usr/bin/env node

// Check all sync entity types
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
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 CHECKING ALL SYNC ENTITY TYPES\n');
console.log('=' .repeat(80));

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAllSyncs() {
  try {
    console.log('\n📊 Querying all entity types in sync_status:\n');

    // Get all sync records grouped by entity_type
    const { data, error } = await supabase
      .from('sync_status')
      .select('entity_type, status, last_sync_end, records_processed')
      .order('last_sync_end', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('⚠️  No sync records found');
      return;
    }

    // Group by entity type
    const byEntity = {};
    data.forEach(row => {
      if (!byEntity[row.entity_type]) {
        byEntity[row.entity_type] = [];
      }
      byEntity[row.entity_type].push(row);
    });

    const entityTypes = Object.keys(byEntity).sort();
    console.log(`✅ Found ${entityTypes.length} entity type(s): ${entityTypes.join(', ')}\n`);

    // Analyze each entity type
    entityTypes.forEach(entityType => {
      const syncs = byEntity[entityType];
      const mostRecent = syncs[0];
      const statusIcon = mostRecent.status === 'completed' ? '✅' : (mostRecent.status === 'failed' ? '❌' : '⏳');
      const time = new Date(mostRecent.last_sync_end);
      const hoursAgo = ((Date.now() - time.getTime()) / 3600000).toFixed(1);

      console.log(`   ${entityType.toUpperCase()}:`);
      console.log(`     ${statusIcon} Status: ${mostRecent.status}`);
      console.log(`     📅 Last sync: ${time.toLocaleString()} (${hoursAgo} hours ago)`);
      console.log(`     📦 Records: ${mostRecent.records_processed || 0}`);
      console.log(`     📊 History: ${syncs.length} sync records`);

      const successCount = syncs.filter(s => s.status === 'completed').length;
      const failCount = syncs.filter(s => s.status === 'failed').length;
      console.log(`     ✓ Success rate: ${successCount}/${syncs.length} (${failCount} failures)`);
      console.log('');
    });

    console.log('\n🔍 EVENTS ANALYSIS:\n');
    if (!entityTypes.includes('events')) {
      console.log('❌ EVENTS ARE NOT BEING SYNCED!');
      console.log('   No sync records found for events entity type');
      console.log('   This needs to be added to the Edge Function configuration\n');
    } else {
      console.log('✅ Events are configured and being synced\n');
    }

  } catch (error) {
    console.error(`❌ Error checking syncs: ${error.message}`);
  }
}

async function checkTables() {
  try {
    console.log('\n📦 Checking what Pendo tables exist:\n');

    const tablesToCheck = ['pages', 'features', 'guides', 'events', 'track_events', 'visitors', 'accounts'];

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ ${table}: Does not exist`);
        } else {
          console.log(`   ✅ ${table}: ${count || 0} records`);
        }
      } catch (e) {
        console.log(`   ❌ ${table}: ${e.message}`);
      }
    }

  } catch (error) {
    console.error(`\n   Error checking tables: ${error.message}`);
  }
}

async function run() {
  await checkAllSyncs();
  await checkTables();

  console.log('\n' + '=' .repeat(80));
  console.log('\n💡 Summary:');
  console.log('   This check shows which entity types are configured for syncing');
  console.log('   and which Pendo tables exist in the database.\n');
}

run().catch(error => {
  console.error('\n❌ Check failed:', error);
  process.exit(1);
});
