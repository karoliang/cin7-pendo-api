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

// Sync guides (limited) with analytics
async function syncGuidesIncremental() {
  console.log('📊 Syncing Guides (incremental with analytics)...');
  const guides = await fetchPendoDataLimited('guide');

  console.log('  📈 Calculating analytics for guides (max 20 to prevent timeout)...');

  // Limit analytics calculation to prevent timeout (20 guides max - reduced for resource constraints)
  const guidesForAnalytics = guides.slice(0, 20);

  // Process in smaller batches to avoid memory/compute issues
  const analyticsMap = new Map();
  const batchSize = 5;

  for (let i = 0; i < guidesForAnalytics.length; i += batchSize) {
    const batch = guidesForAnalytics.slice(i, i + batchSize);
    const batchPromises = batch.map(async (guide: any) => {
      const analytics = await calculateGuideAnalyticsFromEvents(guide.id);
      return { id: guide.id, analytics };
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(r => analyticsMap.set(r.id, r.analytics));

    console.log(`  ✓ Processed batch ${Math.floor(i / batchSize) + 1}: ${batchResults.length} guides`);
  }

  console.log(`  ✓ Calculated analytics for ${analyticsMap.size} guides`);

  const guidesFormatted = guides.map((guide: any) => {
    const analytics = analyticsMap.get(guide.id) || {
      views: 0,
      completions: 0,
      completion_rate: 0,
      unique_visitors: 0,
      avg_time_to_complete: 0
    };

    return {
      id: guide.id,
      name: guide.name || 'Unnamed Guide',
      state: guide.state || 'unknown',
      created_at: guide.createdAt ? new Date(guide.createdAt).toISOString() : new Date().toISOString(),
      last_updated_at: guide.lastUpdatedAt ? new Date(guide.lastUpdatedAt).toISOString() : new Date().toISOString(),
      views: analytics.views,
      completions: analytics.completions,
      completion_rate: analytics.completion_rate,
      avg_time_to_complete: analytics.avg_time_to_complete,
      steps: guide.steps?.length || 0,
      last_synced: new Date().toISOString(),
    };
  });

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

  console.log(`✅ Synced ${uniqueGuides.length} unique guides with real analytics\n`);
  return uniqueGuides.length;
}

// Sync features (limited) with analytics
async function syncFeaturesIncremental() {
  console.log('📊 Syncing Features (incremental with analytics)...');
  const features = await fetchPendoDataLimited('feature');

  console.log('  📈 Calculating analytics for features (max 20 to prevent timeout)...');

  // Limit analytics calculation to prevent timeout (20 features max - reduced for resource constraints)
  const featuresForAnalytics = features.slice(0, 20);

  // Process in smaller batches to avoid memory/compute issues
  const analyticsMap = new Map();
  const batchSize = 5;

  for (let i = 0; i < featuresForAnalytics.length; i += batchSize) {
    const batch = featuresForAnalytics.slice(i, i + batchSize);
    const batchPromises = batch.map(async (feature: any) => {
      const analytics = await calculateFeatureAnalyticsFromEvents(feature.id);
      return { id: feature.id, analytics };
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(r => analyticsMap.set(r.id, r.analytics));

    console.log(`  ✓ Processed batch ${Math.floor(i / batchSize) + 1}: ${batchResults.length} features`);
  }

  console.log(`  ✓ Calculated analytics for ${analyticsMap.size} features`);

  const featuresFormatted = features.map((feature: any) => {
    const analytics = analyticsMap.get(feature.id) || {
      usage_count: 0,
      unique_users: 0,
      avg_usage_per_user: 0
    };

    return {
      id: feature.id,
      name: feature.name || 'Unnamed Feature',
      created_at: feature.createdAt ? new Date(feature.createdAt).toISOString() : new Date().toISOString(),
      last_updated_at: feature.lastUpdatedAt ? new Date(feature.lastUpdatedAt).toISOString() : new Date().toISOString(),
      usage_count: analytics.usage_count,
      unique_users: analytics.unique_users,
      avg_usage_per_user: analytics.avg_usage_per_user,
      last_synced: new Date().toISOString(),
    };
  });

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

  console.log(`✅ Synced ${uniqueFeatures.length} unique features with real analytics\n`);
  return uniqueFeatures.length;
}

// Sync pages (limited) with analytics
async function syncPagesIncremental() {
  console.log('📊 Syncing Pages (incremental with analytics)...');
  const pages = await fetchPendoDataLimited('page');

  console.log('  📈 Calculating analytics for pages (max 20 to prevent timeout)...');

  // Limit analytics calculation to prevent timeout (20 pages max - reduced for resource constraints)
  const pagesForAnalytics = pages.slice(0, 20);

  // Process in smaller batches to avoid memory/compute issues
  const analyticsMap = new Map();
  const batchSize = 5;

  for (let i = 0; i < pagesForAnalytics.length; i += batchSize) {
    const batch = pagesForAnalytics.slice(i, i + batchSize);
    const batchPromises = batch.map(async (page: any) => {
      const analytics = await calculatePageAnalyticsFromEvents(page.id);
      return { id: page.id, analytics };
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(r => analyticsMap.set(r.id, r.analytics));

    console.log(`  ✓ Processed batch ${Math.floor(i / batchSize) + 1}: ${batchResults.length} pages`);
  }

  console.log(`  ✓ Calculated analytics for ${analyticsMap.size} pages`);

  const pagesFormatted = pages.map((page: any) => {
    const analytics = analyticsMap.get(page.id) || {
      views: 0,
      unique_visitors: 0,
      avg_time_on_page: 0
    };

    return {
      id: page.id,
      name: page.name || 'Unnamed Page',
      url: page.url || '',
      created_at: page.createdAt ? new Date(page.createdAt).toISOString() : new Date().toISOString(),
      last_updated_at: page.lastUpdatedAt ? new Date(page.lastUpdatedAt).toISOString() : new Date().toISOString(),
      views: analytics.views,
      unique_visitors: analytics.unique_visitors,
      avg_time_on_page: analytics.avg_time_on_page,
      bounce_rate: 0, // TODO: Calculate from events if available
      last_synced: new Date().toISOString(),
    };
  });

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

  console.log(`✅ Synced ${uniquePages.length} unique pages with real analytics\n`);
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

// Calculate analytics from local pendo_events table (much faster than API calls)
async function calculateGuideAnalyticsFromEvents(guideId: string): Promise<{
  views: number;
  completions: number;
  completion_rate: number;
  unique_visitors: number;
  avg_time_to_complete: number;
}> {
  try {
    // Query events from local database instead of Pendo API
    const { data: events, error } = await supabase
      .from('pendo_events')
      .select('*')
      .eq('entity_id', guideId)
      .eq('entity_type', 'guide');

    if (error || !events || events.length === 0) {
      return { views: 0, completions: 0, completion_rate: 0, unique_visitors: 0, avg_time_to_complete: 0 };
    }

    // Count different event types (assuming event_type contains 'guideEvents')
    // Note: The actual event type detection may need adjustment based on your data structure
    const seenEvents = events.filter(e => {
      const metadata = e.metadata as any;
      return metadata?.type === 'guideSeen' || e.event_type === 'guideSeen';
    });

    const completeEvents = events.filter(e => {
      const metadata = e.metadata as any;
      return metadata?.type === 'guideComplete' || e.event_type === 'guideComplete';
    });

    const uniqueVisitors = new Set(events.map(e => e.visitor_id).filter(Boolean)).size;

    const views = seenEvents.length;
    const completions = completeEvents.length;
    const completion_rate = views > 0 ? (completions / views) * 100 : 0;

    return {
      views,
      completions,
      completion_rate: Math.round(completion_rate * 100) / 100,
      unique_visitors: uniqueVisitors,
      avg_time_to_complete: 0 // TODO: Calculate if duration data available
    };
  } catch (error: any) {
    console.error(`  ⚠️  Error calculating analytics for guide ${guideId}:`, error.message);
    return { views: 0, completions: 0, completion_rate: 0, unique_visitors: 0, avg_time_to_complete: 0 };
  }
}

// Calculate feature analytics from local pendo_events table
async function calculateFeatureAnalyticsFromEvents(featureId: string): Promise<{
  usage_count: number;
  unique_users: number;
  avg_usage_per_user: number;
}> {
  try {
    const { data: events, error } = await supabase
      .from('pendo_events')
      .select('*')
      .eq('entity_id', featureId)
      .eq('entity_type', 'feature');

    if (error || !events || events.length === 0) {
      return { usage_count: 0, unique_users: 0, avg_usage_per_user: 0 };
    }

    const usage_count = events.length;
    const unique_users = new Set(events.map(e => e.visitor_id).filter(Boolean)).size;
    const avg_usage_per_user = unique_users > 0 ? usage_count / unique_users : 0;

    return {
      usage_count,
      unique_users,
      avg_usage_per_user: Math.round(avg_usage_per_user * 100) / 100
    };
  } catch (error: any) {
    console.error(`  ⚠️  Error calculating analytics for feature ${featureId}:`, error.message);
    return { usage_count: 0, unique_users: 0, avg_usage_per_user: 0 };
  }
}

// Calculate page analytics from local pendo_events table
async function calculatePageAnalyticsFromEvents(pageId: string): Promise<{
  views: number;
  unique_visitors: number;
  avg_time_on_page: number;
}> {
  try {
    const { data: events, error } = await supabase
      .from('pendo_events')
      .select('*')
      .eq('entity_id', pageId)
      .eq('entity_type', 'page');

    if (error || !events || events.length === 0) {
      return { views: 0, unique_visitors: 0, avg_time_on_page: 0 };
    }

    const views = events.length;
    const unique_visitors = new Set(events.map(e => e.visitor_id).filter(Boolean)).size;

    return {
      views,
      unique_visitors,
      avg_time_on_page: 0 // TODO: Calculate if duration data available
    };
  } catch (error: any) {
    console.error(`  ⚠️  Error calculating analytics for page ${pageId}:`, error.message);
    return { views: 0, unique_visitors: 0, avg_time_on_page: 0 };
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
