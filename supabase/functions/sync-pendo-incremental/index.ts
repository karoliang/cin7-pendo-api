// Incremental Supabase Edge Function for cron jobs
// Only fetches recent records to avoid timeout
// For full sync, use the local script: node scripts/sync-all-pendo-data.mjs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const PENDO_API_KEY = Deno.env.get('PENDO_API_KEY');
const PENDO_BASE_URL = 'https://app.pendo.io/api/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Limit for incremental updates (prevents timeout)
const MAX_RECORDS_PER_TYPE = 5000;
const BATCH_SIZE = 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fetch LIMITED data from Pendo API (for incremental updates)
async function fetchPendoDataLimited(endpoint: string, maxRecords: number = MAX_RECORDS_PER_TYPE) {
  let allResults: any[] = [];
  let offset = 0;

  console.log(`📥 Fetching up to ${maxRecords} ${endpoint} records (incremental)...`);

  while (allResults.length < maxRecords) {
    const url = new URL(`${PENDO_BASE_URL}/${endpoint}`);
    url.searchParams.append('limit', BATCH_SIZE.toString());
    url.searchParams.append('offset', offset.toString());

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

    const data = await response.json();
    const results = data.results || data || [];

    if (results.length === 0) break;

    allResults = allResults.concat(results);
    console.log(`  ✓ Fetched ${results.length} records (total: ${allResults.length})`);

    // Stop if we've reached our limit or got fewer results than requested
    if (allResults.length >= maxRecords || results.length < BATCH_SIZE) {
      break;
    }

    offset += BATCH_SIZE;
  }

  console.log(`✅ Total ${endpoint}: ${allResults.length}\n`);
  return allResults.slice(0, maxRecords);
}

// Sync guides (limited)
async function syncGuidesIncremental() {
  console.log('📊 Syncing Guides (incremental)...');
  const guides = await fetchPendoDataLimited('guide');

  const guidesFormatted = guides.map((guide: any) => ({
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

  // Deduplicate by ID (fixes "ON CONFLICT DO UPDATE command cannot affect row a second time" error)
  const uniqueGuides = Array.from(
    new Map(guidesFormatted.map(guide => [guide.id, guide])).values()
  );

  console.log(`  📦 Deduplication: ${guidesFormatted.length} → ${uniqueGuides.length} unique records`);

  const { error } = await supabase
    .from('pendo_guides')
    .upsert(uniqueGuides, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error upserting guides:', error);
    throw error;
  }

  console.log(`✅ Synced ${uniqueGuides.length} unique guides\n`);
  return uniqueGuides.length;
}

// Sync features (limited)
async function syncFeaturesIncremental() {
  console.log('📊 Syncing Features (incremental)...');
  const features = await fetchPendoDataLimited('feature');

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

  // Deduplicate by ID (fixes "ON CONFLICT DO UPDATE command cannot affect row a second time" error)
  const uniqueFeatures = Array.from(
    new Map(featuresFormatted.map(feature => [feature.id, feature])).values()
  );

  console.log(`  📦 Deduplication: ${featuresFormatted.length} → ${uniqueFeatures.length} unique records`);

  const { error } = await supabase
    .from('pendo_features')
    .upsert(uniqueFeatures, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error upserting features:', error);
    throw error;
  }

  console.log(`✅ Synced ${uniqueFeatures.length} unique features\n`);
  return uniqueFeatures.length;
}

// Sync pages (limited)
async function syncPagesIncremental() {
  console.log('📊 Syncing Pages (incremental)...');
  const pages = await fetchPendoDataLimited('page');

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
    last_synced: new Date().toISOString(),
  }));

  // Deduplicate by ID (fixes "ON CONFLICT DO UPDATE command cannot affect row a second time" error)
  const uniquePages = Array.from(
    new Map(pagesFormatted.map(page => [page.id, page])).values()
  );

  console.log(`  📦 Deduplication: ${pagesFormatted.length} → ${uniquePages.length} unique records`);

  const { error } = await supabase
    .from('pendo_pages')
    .upsert(uniquePages, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error upserting pages:', error);
    throw error;
  }

  console.log(`✅ Synced ${uniquePages.length} unique pages\n`);
  return uniquePages.length;
}

// Sync reports (limited)
async function syncReportsIncremental() {
  console.log('📊 Syncing Reports (incremental)...');
  const reports = await fetchPendoDataLimited('report');

  const reportsFormatted = reports.map((report: any) => ({
    id: report.id,
    name: report.name || 'Unnamed Report',
    description: report.description || null,
    last_success_run_at: report.lastSuccessRunAt ? new Date(report.lastSuccessRunAt).toISOString() : null,
    configuration: report.configuration || {},
    created_at: report.createdAt ? new Date(report.createdAt).toISOString() : new Date().toISOString(),
    last_updated_at: report.updatedAt ? new Date(report.updatedAt).toISOString() : new Date().toISOString(),
    last_synced: new Date().toISOString(),
  }));

  // Deduplicate by ID (fixes "ON CONFLICT DO UPDATE command cannot affect row a second time" error)
  const uniqueReports = Array.from(
    new Map(reportsFormatted.map(report => [report.id, report])).values()
  );

  console.log(`  📦 Deduplication: ${reportsFormatted.length} → ${uniqueReports.length} unique records`);

  const { error } = await supabase
    .from('pendo_reports')
    .upsert(uniqueReports, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error upserting reports:', error);
    throw error;
  }

  console.log(`✅ Synced ${uniqueReports.length} unique reports\n`);
  return uniqueReports.length;
}

// Fetch events using aggregation API with pipeline
async function fetchPendoEvents(eventSource: string, daysBack: number = 7, maxResults: number = 2000): Promise<any[]> {
  const startTimestamp = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

  const pipeline = {
    response: {
      mimeType: 'application/json'
    },
    request: {
      requestId: `${eventSource}-sync`,
      pipeline: [
        {
          source: {
            [eventSource]: null,
            timeSeries: {
              period: 'dayRange',
              first: startTimestamp.toString(),
              count: -daysBack
            }
          }
        },
        {
          limit: maxResults
        }
      ]
    }
  };

  console.log(`  📥 Fetching ${eventSource} (max ${maxResults})...`);

  try {
    const response = await fetch(`${PENDO_BASE_URL}/aggregation`, {
      method: 'POST',
      headers: {
        'X-Pendo-Integration-Key': PENDO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline)
    });

    if (!response.ok) {
      console.log(`  ⚠️  ${eventSource} API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];
    console.log(`  ✓ Fetched ${results.length} ${eventSource}`);
    return results;
  } catch (error: any) {
    console.error(`  ❌ Error fetching ${eventSource}:`, error.message);
    return [];
  }
}

// Sync events (last 7 days only for incremental)
async function syncEventsIncremental() {
  console.log('📊 Syncing Events (incremental, last 7 days, 2k per source)...');

  const formatEvent = (event: any, eventType: string) => ({
    id: event.id || `${event.visitorId || 'unknown'}_${event.browserTime || Date.now()}_${eventType}`,
    event_type: eventType,
    entity_id: event.guideId || event.featureId || event.pageId || null,
    entity_type: event.guideId ? 'guide' : event.featureId ? 'feature' : event.pageId ? 'page' : null,
    visitor_id: event.visitorId || null,
    account_id: event.accountId || null,
    browser_time: event.browserTime ? new Date(event.browserTime).toISOString() : new Date().toISOString(),
    remote_ip: event.remoteIp || null,
    user_agent: event.userAgent || null,
    country: event.location?.country || event.country || null,
    region: event.location?.region || event.region || null,
    city: event.location?.city || event.city || null,
    metadata: {
      url: event.url,
      ...(event.parameters || {}),
    },
    created_at: new Date().toISOString(),
  });

  let allEvents: any[] = [];
  const seenIds = new Set<string>();

  // Fetch all event types (2000 per source to avoid Edge Function timeout)
  const eventSources = ['guideEvents', 'pageEvents', 'featureEvents'];

  for (const source of eventSources) {
    const events = await fetchPendoEvents(source, 7, 2000);

    // Format and deduplicate
    events.forEach(event => {
      const formatted = formatEvent(event, source);
      if (!seenIds.has(formatted.id)) {
        seenIds.add(formatted.id);
        allEvents.push(formatted);
      }
    });

    console.log(`  📦 Total unique events: ${allEvents.length}`);
  }

  if (allEvents.length === 0) {
    console.log('ℹ️  No events to sync\n');
    return 0;
  }

  const { error } = await supabase
    .from('pendo_events')
    .upsert(allEvents, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error upserting events:', error);
    throw error;
  }

  console.log(`✅ Synced ${allEvents.length} events\n`);
  return allEvents.length;
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
    console.log('🔄 Starting incremental Pendo sync (limited to avoid timeout)...');
    console.log(`   Max records per type: ${MAX_RECORDS_PER_TYPE}\n`);

    const results: Record<string, number> = {};

    // Sync guides
    try {
      const guidesCount = await syncGuidesIncremental();
      results.guides = guidesCount;
      await updateSyncStatus('guides', 'completed', guidesCount);
    } catch (error: any) {
      console.error('❌ Error syncing guides:', error);
      await updateSyncStatus('guides', 'failed', 0, error.message);
      results.guides = 0;
    }

    // Sync features
    try {
      const featuresCount = await syncFeaturesIncremental();
      results.features = featuresCount;
      await updateSyncStatus('features', 'completed', featuresCount);
    } catch (error: any) {
      console.error('❌ Error syncing features:', error);
      await updateSyncStatus('features', 'failed', 0, error.message);
      results.features = 0;
    }

    // Sync pages
    try {
      const pagesCount = await syncPagesIncremental();
      results.pages = pagesCount;
      await updateSyncStatus('pages', 'completed', pagesCount);
    } catch (error: any) {
      console.error('❌ Error syncing pages:', error);
      await updateSyncStatus('pages', 'failed', 0, error.message);
      results.pages = 0;
    }

    // Sync reports
    try {
      const reportsCount = await syncReportsIncremental();
      results.reports = reportsCount;
      await updateSyncStatus('reports', 'completed', reportsCount);
    } catch (error: any) {
      console.error('❌ Error syncing reports:', error);
      await updateSyncStatus('reports', 'failed', 0, error.message);
      results.reports = 0;
    }

    // Sync events
    try {
      const eventsCount = await syncEventsIncremental();
      results.events = eventsCount;
      await updateSyncStatus('events', 'completed', eventsCount);
    } catch (error: any) {
      console.error('❌ Error syncing events:', error);
      await updateSyncStatus('events', 'failed', 0, error.message);
      results.events = 0;
    }

    console.log('✅ Incremental sync completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Incremental sync completed (limited to ${MAX_RECORDS_PER_TYPE} per type)`,
        results,
        note: 'For full sync, run: node scripts/sync-all-pendo-data.mjs',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Sync error:', error);
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
