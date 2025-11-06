// Simplified Supabase Edge Function to sync Pendo metadata only
// This is a lightweight version that doesn't fetch events to avoid resource limits

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const PENDO_API_KEY = Deno.env.get('PENDO_API_KEY');
const PENDO_BASE_URL = 'https://app.pendo.io/api/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fetch data from Pendo API
async function fetchPendoData(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${PENDO_BASE_URL}/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-Pendo-Integration-Key': PENDO_API_KEY || '',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Pendo API error: ${response.statusText}`);
  }

  return await response.json();
}

// Sync guides metadata (lightweight)
async function syncGuidesMetadata() {
  console.log('Fetching guides metadata...');

  const guidesData = await fetchPendoData('guide', { limit: 1000 });
  const guides = (guidesData.results || guidesData || []).slice(0, 100); // Limit to 100 for now

  console.log(`Processing ${guides.length} guides`);

  const guidesFormatted = guides.map((guide: any) => ({
    id: guide.id,
    name: guide.name || 'Unnamed Guide',
    state: guide.state || 'unknown',
    created_at: guide.createdAt ? new Date(guide.createdAt).toISOString() : new Date().toISOString(),
    last_updated_at: guide.lastUpdatedAt ? new Date(guide.lastUpdatedAt).toISOString() : new Date().toISOString(),
    views: 0, // Will be updated by separate analytics sync
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
    console.error('Error upserting guides:', error);
    throw error;
  }

  return guidesFormatted.length;
}

// Sync features metadata (lightweight)
async function syncFeaturesMetadata() {
  console.log('Fetching features metadata...');

  const featuresData = await fetchPendoData('feature', { limit: 1000 });
  const features = (featuresData.results || featuresData || []).slice(0, 100);

  console.log(`Processing ${features.length} features`);

  const featuresFormatted = features.map((feature: any) => ({
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
    console.error('Error upserting features:', error);
    throw error;
  }

  return featuresFormatted.length;
}

// Sync pages metadata (lightweight)
async function syncPagesMetadata() {
  console.log('Fetching pages metadata...');

  const pagesData = await fetchPendoData('page', { limit: 1000 });
  const pages = (pagesData.results || pagesData || []).slice(0, 100);

  console.log(`Processing ${pages.length} pages`);

  const pagesFormatted = pages.map((page: any) => ({
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
    console.error('Error upserting pages:', error);
    throw error;
  }

  return pagesFormatted.length;
}

// Update sync status
async function updateSyncStatus(entityType: string, status: string, recordsProcessed: number, errorMessage?: string) {
  await supabase.from('sync_status').insert({
    entity_type: entityType,
    last_sync_start: new Date().toISOString(),
    last_sync_end: new Date().toISOString(),
    status,
    records_processed: recordsProcessed,
    error_message: errorMessage,
  });
}

// Main handler
serve(async (req) => {
  try {
    console.log('Starting lightweight Pendo metadata sync...');

    const results: Record<string, number> = {};

    // Sync guides metadata
    try {
      const guidesCount = await syncGuidesMetadata();
      results.guides = guidesCount;
      await updateSyncStatus('guides', 'completed', guidesCount);
    } catch (error: any) {
      console.error('Error syncing guides:', error);
      await updateSyncStatus('guides', 'failed', 0, error.message);
      results.guides = 0;
    }

    // Sync features metadata
    try {
      const featuresCount = await syncFeaturesMetadata();
      results.features = featuresCount;
      await updateSyncStatus('features', 'completed', featuresCount);
    } catch (error: any) {
      console.error('Error syncing features:', error);
      await updateSyncStatus('features', 'failed', 0, error.message);
      results.features = 0;
    }

    // Sync pages metadata
    try {
      const pagesCount = await syncPagesMetadata();
      results.pages = pagesCount;
      await updateSyncStatus('pages', 'completed', pagesCount);
    } catch (error: any) {
      console.error('Error syncing pages:', error);
      await updateSyncStatus('pages', 'failed', 0, error.message);
      results.pages = 0;
    }

    console.log('Metadata sync completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pendo metadata sync completed (analytics will be added separately)',
        results,
        note: 'This is a lightweight sync. Analytics data will be computed separately.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
