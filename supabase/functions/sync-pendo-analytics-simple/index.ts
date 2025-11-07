// Supabase Edge Function: Simple Analytics Sync (FREE TIER OPTIMIZED)
// Uses basic Pendo API instead of complex aggregation pipelines
// Syncs guide/feature/page stats directly from Pendo

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

// Update guide analytics using basic API
async function updateGuideAnalytics() {
  console.log('📊 Updating guide analytics...');

  try {
    // Fetch guides from Pendo (includes lastUpdatedAt and state)
    const guides = await fetchPendoData('guide');

    console.log(`✅ Fetched ${guides.length} guides from Pendo`);

    // Update each guide in database
    const updates = [];
    for (const guide of guides) {
      // Use pollData for stats if available
      const views = guide.pollData?.viewCount || guide.viewedCount || 0;
      const completions = guide.pollData?.completedCount || guide.completedCount || 0;
      const completionRate = views > 0 ? (completions / views) * 100 : 0;

      updates.push({
        id: guide.id,
        name: guide.name,
        kind: guide.kind || 'standard',
        state: guide.state || 'draft',
        created_at: guide.createdAt ? new Date(guide.createdAt).toISOString() : null,
        last_updated_at: guide.lastUpdatedAt ? new Date(guide.lastUpdatedAt).toISOString() : null,
        views: views,
        completions: completions,
        completion_rate: Math.round(completionRate * 100) / 100,
        last_synced: new Date().toISOString()
      });
    }

    // Batch update guides (100 at a time)
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

    console.log(`✅ Updated ${updates.length} guides`);
    return updates.length;
  } catch (error) {
    console.error('Error updating guide analytics:', error);
    throw error;
  }
}

// Update feature analytics using basic API
async function updateFeatureAnalytics() {
  console.log('📊 Updating feature analytics...');

  try {
    // Fetch features from Pendo
    const features = await fetchPendoData('feature');

    console.log(`✅ Fetched ${features.length} features from Pendo`);

    // Update each feature in database
    const updates = [];
    for (const feature of features) {
      // Use pollData for stats if available
      const usageCount = feature.pollData?.count || feature.numEvents || 0;
      const uniqueUsers = feature.pollData?.visitorCount || feature.visitorCount || 0;
      const avgUsagePerUser = uniqueUsers > 0 ? Math.round((usageCount / uniqueUsers) * 100) / 100 : 0;

      updates.push({
        id: feature.id,
        name: feature.name,
        kind: feature.kind || 'click',
        created_at: feature.createdAt ? new Date(feature.createdAt).toISOString() : null,
        last_updated_at: feature.lastUpdatedAt ? new Date(feature.lastUpdatedAt).toISOString() : null,
        usage_count: usageCount,
        unique_users: uniqueUsers,
        avg_usage_per_user: avgUsagePerUser,
        last_synced: new Date().toISOString()
      });
    }

    // Batch update features
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const { error } = await supabase
        .from('pendo_features')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`Error updating batch ${i}-${i + batchSize}:`, error);
      }
    }

    console.log(`✅ Updated ${updates.length} features`);
    return updates.length;
  } catch (error) {
    console.error('Error updating feature analytics:', error);
    throw error;
  }
}

// Update page analytics using basic API
async function updatePageAnalytics() {
  console.log('📊 Updating page analytics...');

  try {
    // Fetch pages from Pendo
    const pages = await fetchPendoData('page');

    console.log(`✅ Fetched ${pages.length} pages from Pendo`);

    // Update each page in database
    const updates = [];
    for (const page of pages) {
      // Use pollData for stats if available
      const views = page.pollData?.count || page.numEvents || 0;
      const uniqueVisitors = page.pollData?.visitorCount || page.visitorCount || 0;

      updates.push({
        id: page.id,
        name: page.name,
        url: page.url || '',
        created_at: page.createdAt ? new Date(page.createdAt).toISOString() : null,
        last_updated_at: page.lastUpdatedAt ? new Date(page.lastUpdatedAt).toISOString() : null,
        views: views,
        unique_visitors: uniqueVisitors,
        last_synced: new Date().toISOString()
      });
    }

    // Batch update pages
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const { error } = await supabase
        .from('pendo_pages')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`Error updating batch ${i}-${i + batchSize}:`, error);
      }
    }

    console.log(`✅ Updated ${updates.length} pages`);
    return updates.length;
  } catch (error) {
    console.error('Error updating page analytics:', error);
    throw error;
  }
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
    console.log('🚀 Starting simple analytics sync...');

    const startTime = Date.now();

    // Update analytics for each entity type
    const guideCount = await updateGuideAnalytics();
    await recordSyncStatus('guides_analytics_simple', 'completed', guideCount);

    const featureCount = await updateFeatureAnalytics();
    await recordSyncStatus('features_analytics_simple', 'completed', featureCount);

    const pageCount = await updatePageAnalytics();
    await recordSyncStatus('pages_analytics_simple', 'completed', pageCount);

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
      'analytics_sync_simple',
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
