// Supabase Edge Function: Incremental Analytics Sync (FREE TIER OPTIMIZED)
// Syncs last 7 days of analytics using Pendo Aggregation API
// Keeps database under 100MB by using rolling window

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

// Fetch aggregation data from Pendo
async function fetchAggregation(pipeline: any, requestId: string) {
  const url = `${PENDO_BASE_URL}/aggregation`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Pendo-Integration-Key': PENDO_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      response: { mimeType: 'application/json' },
      request: { pipeline, requestId }
    })
  });

  if (!response.ok) {
    throw new Error(`Aggregation API error: ${response.statusText}`);
  }

  return await response.json();
}

// Update guide analytics from last 7 days
async function updateGuideAnalytics() {
  console.log('📊 Updating guide analytics (last 7 days)...');

  // Get all guides
  const { data: guides, error: guidesError } = await supabase
    .from('pendo_guides')
    .select('id');

  if (guidesError) throw guidesError;

  console.log(`Found ${guides?.length || 0} guides to update`);

  // Fetch analytics for last 7 days using aggregation API
  const endTime = Date.now();
  const startTime = endTime - (7 * 24 * 60 * 60 * 1000);

  const aggregationData = await fetchAggregation([
    {
      source: {
        guideEvents: null,
        timeSeries: {
          first: startTime,
          count: 7,
          period: 'dayRange'
        }
      }
    },
    {
      aggregate: {
        group: ['guideId'],
        aggregations: [
          { type: 'count', value: 'guideId', as: 'views' },
          { type: 'countUnique', value: 'visitorId', as: 'visitors' }
        ]
      }
    }
  ], `guide-analytics-${Date.now()}`);

  console.log(`✅ Received aggregation data: ${aggregationData.results?.length || 0} guides with events`);

  // Update each guide with its analytics
  const updates = [];
  for (const result of (aggregationData.results || [])) {
    const guideId = result.guideId;
    const views = result.views || 0;
    const visitors = result.visitors || 0;

    // Count completions separately
    const completionData = await fetchAggregation([
      {
        source: {
          guideEvents: {
            guideId: [guideId]
          },
          timeSeries: {
            first: startTime,
            last: endTime,
            period: 'dayRange'
          }
        },
        filter: 'type == "guideCompleted"'
      }
    ], `guide-completions-${guideId}`);

    const completions = completionData.results?.length || 0;
    const completion_rate = views > 0 ? (completions / views) * 100 : 0;

    updates.push({
      id: guideId,
      views,
      completions,
      completion_rate: Math.round(completion_rate * 100) / 100,
      last_synced: new Date().toISOString()
    });
  }

  // Batch update guides (100 at a time to stay within limits)
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const { error } = await supabase
      .from('pendo_guides')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error updating batch ${i}-${i + batchSize}:`, error);
    }
  }

  console.log(`✅ Updated analytics for ${updates.length} guides`);
  return updates.length;
}

// Update feature analytics from last 7 days
async function updateFeatureAnalytics() {
  console.log('📊 Updating feature analytics (last 7 days)...');

  const endTime = Date.now();
  const startTime = endTime - (7 * 24 * 60 * 60 * 1000);

  const aggregationData = await fetchAggregation([
    {
      source: {
        featureEvents: null,
        timeSeries: {
          first: startTime,
          count: 7,
          period: 'dayRange'
        }
      }
    },
    {
      aggregate: {
        group: ['featureId'],
        aggregations: [
          { type: 'count', value: 'featureId', as: 'usage_count' },
          { type: 'countUnique', value: 'visitorId', as: 'unique_users' }
        ]
      }
    }
  ], `feature-analytics-${Date.now()}`);

  const updates = (aggregationData.results || []).map((result: any) => ({
    id: result.featureId,
    usage_count: result.usage_count || 0,
    unique_users: result.unique_users || 0,
    avg_usage_per_user: result.unique_users > 0
      ? Math.round((result.usage_count / result.unique_users) * 100) / 100
      : 0,
    last_synced: new Date().toISOString()
  }));

  // Batch update
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await supabase
      .from('pendo_features')
      .upsert(batch, { onConflict: 'id' });
  }

  console.log(`✅ Updated analytics for ${updates.length} features`);
  return updates.length;
}

// Update page analytics from last 7 days
async function updatePageAnalytics() {
  console.log('📊 Updating page analytics (last 7 days)...');

  const endTime = Date.now();
  const startTime = endTime - (7 * 24 * 60 * 60 * 1000);

  const aggregationData = await fetchAggregation([
    {
      source: {
        pageEvents: null,
        timeSeries: {
          first: startTime,
          count: 7,
          period: 'dayRange'
        }
      }
    },
    {
      aggregate: {
        group: ['pageId'],
        aggregations: [
          { type: 'count', value: 'pageId', as: 'views' },
          { type: 'countUnique', value: 'visitorId', as: 'unique_visitors' }
        ]
      }
    }
  ], `page-analytics-${Date.now()}`);

  const updates = (aggregationData.results || []).map((result: any) => ({
    id: result.pageId,
    views: result.views || 0,
    unique_visitors: result.unique_visitors || 0,
    last_synced: new Date().toISOString()
  }));

  // Batch update
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await supabase
      .from('pendo_pages')
      .upsert(batch, { onConflict: 'id' });
  }

  console.log(`✅ Updated analytics for ${updates.length} pages`);
  return updates.length;
}

// Record sync status
async function recordSyncStatus(
  entityType: string,
  status: string,
  recordsProcessed: number,
  errorMessage?: string
) {
  await supabase.from('sync_status').insert({
    entity_type: entityType,
    last_sync_start: new Date().toISOString(),
    last_sync_end: new Date().toISOString(),
    status,
    records_processed: recordsProcessed,
    error_message: errorMessage
  });
}

// Main handler
serve(async (req) => {
  try {
    console.log('🚀 Starting incremental analytics sync (7-day rolling window)...');

    const startTime = Date.now();

    // Update analytics for each entity type
    const guideCount = await updateGuideAnalytics();
    await recordSyncStatus('guides_analytics', 'completed', guideCount);

    const featureCount = await updateFeatureAnalytics();
    await recordSyncStatus('features_analytics', 'completed', featureCount);

    const pageCount = await updatePageAnalytics();
    await recordSyncStatus('pages_analytics', 'completed', pageCount);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Analytics sync complete in ${duration}s`);
    console.log(`📊 Updated: ${guideCount} guides, ${featureCount} features, ${pageCount} pages`);

    return new Response(
      JSON.stringify({
        success: true,
        duration: `${duration}s`,
        summary: {
          guides: guideCount,
          features: featureCount,
          pages: pageCount
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Analytics sync failed:', error);

    await recordSyncStatus(
      'analytics_sync',
      'failed',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
