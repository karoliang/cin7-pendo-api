// Supabase Edge Function to sync Pendo data
// Deploy with: supabase functions deploy sync-pendo-data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const PENDO_API_KEY = Deno.env.get('PENDO_API_KEY');
const PENDO_BASE_URL = 'https://app.pendo.io/api/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PendoGuide {
  id: string;
  name: string;
  state: string;
  createdAt: number;
  lastUpdatedAt: number;
}

interface PendoFeature {
  id: string;
  name: string;
  createdAt: number;
  lastUpdatedAt: number;
}

interface PendoPage {
  id: string;
  name: string;
  url: string;
  createdAt: number;
  lastUpdatedAt: number;
}

// Fetch data from Pendo API with pagination
async function fetchPendoData(endpoint: string, params: Record<string, any> = {}) {
  let allResults: any[] = [];
  let offset = 0;
  const limit = 500; // Fetch 500 at a time
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${PENDO_BASE_URL}/${endpoint}`);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());
    Object.keys(params).forEach(key => {
      if (key !== 'limit' && key !== 'offset') {
        url.searchParams.append(key, params[key]);
      }
    });

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

    allResults = allResults.concat(results);

    // Check if we got fewer results than the limit, which means we're done
    if (results.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }

    console.log(`Fetched ${results.length} records (total: ${allResults.length})`);
  }

  return allResults;
}

// Fetch aggregation data from Pendo
async function fetchPendoAggregation(request: any) {
  const url = `${PENDO_BASE_URL}/aggregation`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Pendo-Integration-Key': PENDO_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Pendo Aggregation API error: ${response.statusText}`);
  }

  return await response.json();
}

// Process guides with analytics
async function syncGuides(daysBack: number = 7) {
  console.log('Fetching guides from Pendo...');

  // Fetch guide metadata (fetchPendoData now handles pagination)
  const guides = await fetchPendoData('guide');

  console.log(`Fetched ${guides.length} total guides`);

  // Fetch analytics for guides
  const startTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
  const aggregationRequest = {
    response: { mimeType: 'application/json' },
    request: {
      pipeline: [
        {
          source: {
            guideEvents: null,
            timeSeries: {
              first: startTime,
              count: daysBack,
              period: 'dayRange',
            },
          },
        },
      ],
      requestId: `sync_guides_${Date.now()}`,
    },
  };

  const eventsData = await fetchPendoAggregation(aggregationRequest);
  const events = eventsData.results || [];

  console.log(`Fetched ${events.length} guide events`);

  // Process each guide and calculate analytics
  const guidesWithAnalytics = guides.map((guide: PendoGuide) => {
    const guideEvents = events.filter((e: any) => e.guideId === guide.id);

    const views = guideEvents.filter((e: any) =>
      e.type === 'guideSeen' || e.type === 'guideActivity'
    ).length;

    const completions = guideEvents.filter((e: any) =>
      e.type === 'guideCompleted' || e.action === 'complete'
    ).length;

    const completionRate = views > 0 ? (completions / views) * 100 : 0;

    return {
      id: guide.id,
      name: guide.name,
      state: guide.state,
      created_at: new Date(guide.createdAt).toISOString(),
      last_updated_at: new Date(guide.lastUpdatedAt).toISOString(),
      views,
      completions,
      completion_rate: completionRate.toFixed(2),
      avg_time_to_complete: 0, // TODO: Calculate from events
      steps: 0, // TODO: Extract from guide definition
      last_synced: new Date().toISOString(),
    };
  });

  // Upsert into Supabase
  const { data, error } = await supabase
    .from('pendo_guides')
    .upsert(guidesWithAnalytics, { onConflict: 'id' });

  if (error) {
    console.error('Error upserting guides:', error);
    throw error;
  }

  console.log(`Synced ${guidesWithAnalytics.length} guides to Supabase`);
  return guidesWithAnalytics.length;
}

// Process features with analytics
async function syncFeatures(daysBack: number = 7) {
  console.log('Fetching features from Pendo...');

  // Fetch feature metadata (fetchPendoData now handles pagination)
  const features = await fetchPendoData('feature');

  console.log(`Fetched ${features.length} total features`);

  // Fetch analytics for features
  const startTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
  const aggregationRequest = {
    response: { mimeType: 'application/json' },
    request: {
      pipeline: [
        {
          source: {
            featureEvents: null,
            timeSeries: {
              first: startTime,
              count: daysBack,
              period: 'dayRange',
            },
          },
        },
      ],
      requestId: `sync_features_${Date.now()}`,
    },
  };

  const eventsData = await fetchPendoAggregation(aggregationRequest);
  const events = eventsData.results || [];

  console.log(`Fetched ${events.length} feature events`);

  // Process each feature
  const featuresWithAnalytics = features.map((feature: PendoFeature) => {
    const featureEvents = events.filter((e: any) => e.featureId === feature.id);
    const uniqueVisitors = new Set(featureEvents.map((e: any) => e.visitorId)).size;

    return {
      id: feature.id,
      name: feature.name,
      created_at: new Date(feature.createdAt).toISOString(),
      last_updated_at: new Date(feature.lastUpdatedAt).toISOString(),
      usage_count: featureEvents.length,
      unique_users: uniqueVisitors,
      avg_usage_per_user: uniqueVisitors > 0 ? (featureEvents.length / uniqueVisitors).toFixed(2) : 0,
      last_synced: new Date().toISOString(),
    };
  });

  // Upsert into Supabase
  const { data, error } = await supabase
    .from('pendo_features')
    .upsert(featuresWithAnalytics, { onConflict: 'id' });

  if (error) {
    console.error('Error upserting features:', error);
    throw error;
  }

  console.log(`Synced ${featuresWithAnalytics.length} features to Supabase`);
  return featuresWithAnalytics.length;
}

// Process pages with analytics
async function syncPages(daysBack: number = 7) {
  console.log('Fetching pages from Pendo...');

  // Fetch page metadata (fetchPendoData now handles pagination)
  const pages = await fetchPendoData('page');

  console.log(`Fetched ${pages.length} total pages`);

  // Fetch analytics for pages
  const startTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
  const aggregationRequest = {
    response: { mimeType: 'application/json' },
    request: {
      pipeline: [
        {
          source: {
            pageEvents: null,
            timeSeries: {
              first: startTime,
              count: daysBack,
              period: 'dayRange',
            },
          },
        },
      ],
      requestId: `sync_pages_${Date.now()}`,
    },
  };

  const eventsData = await fetchPendoAggregation(aggregationRequest);
  const events = eventsData.results || [];

  console.log(`Fetched ${events.length} page events`);

  // Process each page
  const pagesWithAnalytics = pages.map((page: PendoPage) => {
    const pageEvents = events.filter((e: any) => e.pageId === page.id);
    const uniqueVisitors = new Set(pageEvents.map((e: any) => e.visitorId)).size;

    // Aggregate geographic data
    const geoData: Record<string, number> = {};
    pageEvents.forEach((e: any) => {
      const country = e.country || 'Unknown';
      geoData[country] = (geoData[country] || 0) + 1;
    });

    return {
      id: page.id,
      name: page.name,
      url: page.url,
      created_at: new Date(page.createdAt).toISOString(),
      last_updated_at: new Date(page.lastUpdatedAt).toISOString(),
      views: pageEvents.length,
      unique_visitors: uniqueVisitors,
      avg_time_on_page: 0, // TODO: Calculate from events
      bounce_rate: 0, // TODO: Calculate from events
      geographic_data: geoData,
      top_accounts: {}, // TODO: Aggregate top accounts
      last_synced: new Date().toISOString(),
    };
  });

  // Upsert into Supabase
  const { data, error } = await supabase
    .from('pendo_pages')
    .upsert(pagesWithAnalytics, { onConflict: 'id' });

  if (error) {
    console.error('Error upserting pages:', error);
    throw error;
  }

  console.log(`Synced ${pagesWithAnalytics.length} pages to Supabase`);
  return pagesWithAnalytics.length;
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
    console.log('Starting Pendo data sync...');

    const daysBack = 7; // Sync last 7 days of data
    const results: Record<string, number> = {};

    // Sync guides
    try {
      const guidesCount = await syncGuides(daysBack);
      results.guides = guidesCount;
      await updateSyncStatus('guides', 'completed', guidesCount);
    } catch (error: any) {
      console.error('Error syncing guides:', error);
      await updateSyncStatus('guides', 'failed', 0, error.message);
      results.guides = 0;
    }

    // Sync features
    try {
      const featuresCount = await syncFeatures(daysBack);
      results.features = featuresCount;
      await updateSyncStatus('features', 'completed', featuresCount);
    } catch (error: any) {
      console.error('Error syncing features:', error);
      await updateSyncStatus('features', 'failed', 0, error.message);
      results.features = 0;
    }

    // Sync pages
    try {
      const pagesCount = await syncPages(daysBack);
      results.pages = pagesCount;
      await updateSyncStatus('pages', 'completed', pagesCount);
    } catch (error: any) {
      console.error('Error syncing pages:', error);
      await updateSyncStatus('pages', 'failed', 0, error.message);
      results.pages = 0;
    }

    console.log('Sync completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pendo data sync completed',
        results,
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
