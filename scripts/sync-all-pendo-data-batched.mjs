#!/usr/bin/env node

// Batched local script to sync ALL Pendo data to Supabase
// Avoids memory issues by upserting in batches instead of accumulating all data
// Run with: node scripts/sync-all-pendo-data-batched.mjs

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
// Use service role key to bypass RLS, fall back to anon key
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!PENDO_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables in frontend/.env');
  console.error('Required: VITE_PENDO_API_KEY, VITE_SUPABASE_URL');
  console.error('Recommended: VITE_SUPABASE_SERVICE_ROLE_KEY (to bypass RLS)');
  process.exit(1);
}

// Warn if using anon key (has RLS restrictions)
if (!env.VITE_SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  WARNING: Using anon key. Add VITE_SUPABASE_SERVICE_ROLE_KEY to .env to bypass RLS.');
  console.warn('   Get it from: Supabase Dashboard > Settings > API > service_role key\n');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 Starting Pendo data sync (batched)...\n');

const BATCH_SIZE = 5000; // Upsert every 5000 records to avoid memory issues

// Fetch and upsert data in batches to avoid memory issues
async function fetchAndUpsertPendoDataBatched(endpoint, tableName, formatFunction) {
  let offset = 0;
  const limit = 500; // Fetch 500 at a time from API
  let hasMore = true;
  let totalSynced = 0;
  let batch = [];
  const seenIds = new Set(); // Track all IDs we've seen to detect when API returns duplicates

  console.log(`📥 Fetching and syncing ${endpoint} in batches...`);

  while (hasMore) {
    const url = new URL(`${PENDO_BASE_URL}/${endpoint}`);
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

    // Check if all fetched records are duplicates (already seen)
    const newIds = results.filter(item => !seenIds.has(item.id));
    if (newIds.length === 0) {
      console.log(`  ℹ️  All ${results.length} records already synced. Stopping pagination.`);
      hasMore = false;
      break;
    }

    // Track seen IDs
    results.forEach(item => seenIds.add(item.id));

    // Format and add to batch
    const formatted = results.map(formatFunction);
    batch = batch.concat(formatted);

    console.log(`  ✓ Fetched ${results.length} records (${newIds.length} new, total fetched: ${offset + results.length}, batch size: ${batch.length})`);

    // Upsert when batch reaches BATCH_SIZE or no more data
    if (batch.length >= BATCH_SIZE || results.length < limit) {
      // Deduplicate batch by ID (keep the last occurrence of each ID)
      const uniqueBatch = Array.from(
        new Map(batch.map(item => [item.id, item])).values()
      );

      const duplicatesRemoved = batch.length - uniqueBatch.length;
      if (duplicatesRemoved > 0) {
        console.log(`  ⚠️  Removed ${duplicatesRemoved} duplicate records from batch`);
      }

      console.log(`  📤 Upserting batch of ${uniqueBatch.length} unique records to Supabase...`);

      const { error } = await supabase
        .from(tableName)
        .upsert(uniqueBatch, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error upserting ${tableName}:`, error);
        throw error;
      }

      totalSynced += uniqueBatch.length;
      console.log(`  ✅ Synced ${totalSynced} ${endpoint} so far\n`);
      batch = []; // Clear batch
    }

    // Check if we got fewer results than the limit (last page)
    if (results.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  console.log(`✅ Total ${endpoint} synced: ${totalSynced}\n`);
  return totalSynced;
}

// Sync guides with batching
async function syncGuides() {
  console.log('📊 Syncing Guides (batched)...');

  const formatGuide = (guide) => ({
    id: guide.id,
    name: guide.name || 'Unnamed Guide',
    state: guide.state || 'unknown',
    created_at: guide.createdAt ? new Date(guide.createdAt).toISOString() : new Date().toISOString(),
    last_updated_at: guide.lastUpdatedAt ? new Date(guide.lastUpdatedAt).toISOString() : new Date().toISOString(),
    views: 0,
    completions: 0,
    completion_rate: 0,
    avg_time_to_complete: 0,
    steps: guide.steps?.length || 0,
    last_synced: new Date().toISOString(),
  });

  return await fetchAndUpsertPendoDataBatched('guide', 'pendo_guides', formatGuide);
}

// Sync features with batching
async function syncFeatures() {
  console.log('📊 Syncing Features (batched)...');

  const formatFeature = (feature) => ({
    id: feature.id,
    name: feature.name || 'Unnamed Feature',
    created_at: feature.createdAt ? new Date(feature.createdAt).toISOString() : new Date().toISOString(),
    last_updated_at: feature.lastUpdatedAt ? new Date(feature.lastUpdatedAt).toISOString() : new Date().toISOString(),
    usage_count: 0,
    unique_users: 0,
    avg_usage_per_user: 0,
    last_synced: new Date().toISOString(),
  });

  return await fetchAndUpsertPendoDataBatched('feature', 'pendo_features', formatFeature);
}

// Sync pages with batching
async function syncPages() {
  console.log('📊 Syncing Pages (batched)...');

  const formatPage = (page) => ({
    id: page.id,
    name: page.name || 'Unnamed Page',
    url: page.url || '',
    created_at: page.createdAt ? new Date(page.createdAt).toISOString() : new Date().toISOString(),
    last_updated_at: page.lastUpdatedAt ? new Date(page.lastUpdatedAt).toISOString() : new Date().toISOString(),
    views: 0,
    unique_visitors: 0,
    avg_time_on_page: 0,
    bounce_rate: 0,
    geographic_data: {},
    top_accounts: {},
    last_synced: new Date().toISOString(),
  });

  return await fetchAndUpsertPendoDataBatched('page', 'pendo_pages', formatPage);
}

// Main execution
async function main() {
  try {
    const startTime = Date.now();

    const guidesCount = await syncGuides();
    const featuresCount = await syncFeatures();
    const pagesCount = await syncPages();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('═══════════════════════════════════════');
    console.log('✅ Batched Sync Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`  Guides:   ${guidesCount}`);
    console.log(`  Features: ${featuresCount}`);
    console.log(`  Pages:    ${pagesCount}`);
    console.log(`  Duration: ${duration}s`);
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();
