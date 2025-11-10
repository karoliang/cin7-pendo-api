#!/usr/bin/env node

// Local script to sync ALL Pendo data to Supabase
// Run with: node scripts/sync-all-pendo-data.mjs

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { config } from 'dotenv';
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
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!PENDO_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables in frontend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 Starting Pendo data sync...\n');

// Fetch data from Pendo API with pagination
async function fetchPendoData(endpoint) {
  let allResults = [];
  let offset = 0;
  const limit = 500;
  let hasMore = true;

  console.log(`📥 Fetching ${endpoint}...`);

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

    allResults = allResults.concat(results);

    if (results.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }

    console.log(`  ✓ Fetched ${results.length} records (total: ${allResults.length})`);
  }

  console.log(`✅ Total ${endpoint}: ${allResults.length}\n`);
  return allResults;
}

// Sync guides
async function syncGuides() {
  console.log('📊 Syncing Guides...');
  const guides = await fetchPendoData('guide');

  const guidesFormatted = guides.map(guide => ({
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
  }));

  const { data, error } = await supabase
    .from('pendo_guides')
    .upsert(guidesFormatted, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error upserting guides:', error);
    throw error;
  }

  console.log(`✅ Synced ${guidesFormatted.length} guides to Supabase\n`);
  return guidesFormatted.length;
}

// Sync features
async function syncFeatures() {
  console.log('📊 Syncing Features...');
  const features = await fetchPendoData('feature');

  const featuresFormatted = features.map(feature => ({
    id: feature.id,
    name: feature.name || 'Unnamed Feature',
    created_at: feature.createdAt ? new Date(feature.createdAt).toISOString() : new Date().toISOString(),
    last_updated_at: feature.lastUpdatedAt ? new Date(feature.lastUpdatedAt).toISOString() : new Date().toISOString(),
    usage_count: 0,
    unique_users: 0,
    avg_usage_per_user: 0,
    last_synced: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('pendo_features')
    .upsert(featuresFormatted, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error upserting features:', error);
    throw error;
  }

  console.log(`✅ Synced ${featuresFormatted.length} features to Supabase\n`);
  return featuresFormatted.length;
}

// Sync pages
async function syncPages() {
  console.log('📊 Syncing Pages...');
  const pages = await fetchPendoData('page');

  const pagesFormatted = pages.map(page => ({
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
  }));

  const { data, error } = await supabase
    .from('pendo_pages')
    .upsert(pagesFormatted, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error upserting pages:', error);
    throw error;
  }

  console.log(`✅ Synced ${pagesFormatted.length} pages to Supabase\n`);
  return pagesFormatted.length;
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
    console.log('✅ Sync Complete!');
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
