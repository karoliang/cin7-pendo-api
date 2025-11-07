#!/usr/bin/env node

// Force re-sync of all features from Pendo to Supabase
// Clears existing features and syncs fresh from Pendo API

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';

// Load .env from frontend folder
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
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔄 Force re-syncing features from Pendo...\n');

async function forceSyncFeatures() {
  // Step 1: Delete existing features
  console.log('🗑️  Deleting existing features from database...');
  const { error: deleteError } = await supabase
    .from('pendo_features')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (dummy condition)

  if (deleteError) {
    console.error('❌ Error deleting features:', deleteError);
    throw deleteError;
  }
  console.log('✅ Existing features deleted\n');

  // Step 2: Fetch all features from Pendo
  console.log('📥 Fetching features from Pendo API...');

  let offset = 0;
  const limit = 500;
  let allFeatures = [];
  let hasMore = true;
  const seenIds = new Set();

  while (hasMore) {
    const url = new URL(`${PENDO_BASE_URL}/feature`);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Pendo-Integration-Key': PENDO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Pendo API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || data || [];

    if (results.length === 0) {
      hasMore = false;
      break;
    }

    // Check if all fetched records are duplicates
    const newIds = results.filter(item => !seenIds.has(item.id));
    if (newIds.length === 0) {
      console.log(`  ℹ️  All ${results.length} records already fetched. Stopping pagination.`);
      hasMore = false;
      break;
    }

    // Track seen IDs and add to collection
    results.forEach(item => seenIds.add(item.id));
    allFeatures = allFeatures.concat(results);

    console.log(`  ✓ Fetched ${results.length} records (${newIds.length} new, total: ${allFeatures.length})`);

    if (results.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  // Step 3: Format features
  console.log(`\n📝 Formatting ${allFeatures.length} features...`);
  const formattedFeatures = allFeatures.map(feature => ({
    id: feature.id,
    name: feature.name || 'Unnamed Feature',
    created_at: feature.createdAt ? new Date(feature.createdAt).toISOString() : new Date().toISOString(),
    last_updated_at: feature.lastUpdatedAt ? new Date(feature.lastUpdatedAt).toISOString() : new Date().toISOString(),
    usage_count: 0,
    unique_users: 0,
    avg_usage_per_user: 0,
    last_synced: new Date().toISOString(),
  }));

  // Deduplicate
  const uniqueFeatures = Array.from(
    new Map(formattedFeatures.map(item => [item.id, item])).values()
  );

  const duplicatesRemoved = formattedFeatures.length - uniqueFeatures.length;
  if (duplicatesRemoved > 0) {
    console.log(`⚠️  Removed ${duplicatesRemoved} duplicate records`);
  }

  // Step 4: Insert into Supabase
  console.log(`\n📤 Upserting ${uniqueFeatures.length} features to Supabase...`);

  const { error: upsertError } = await supabase
    .from('pendo_features')
    .upsert(uniqueFeatures, { onConflict: 'id' });

  if (upsertError) {
    console.error('❌ Error upserting features:', upsertError);
    throw upsertError;
  }

  console.log(`\n✅ Successfully synced ${uniqueFeatures.length} features!`);

  return uniqueFeatures.length;
}

forceSyncFeatures()
  .then(count => {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`✅ Force Sync Complete!`);
    console.log(`═══════════════════════════════════════`);
    console.log(`  Features synced: ${count}`);
    console.log(`═══════════════════════════════════════\n`);
  })
  .catch(error => {
    console.error('\n❌ Force sync failed:', error.message);
    process.exit(1);
  });
