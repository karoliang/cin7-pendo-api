#!/usr/bin/env node

// Manual script to sync analytics for ALL guides, features, and pages from local events
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
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔄 SYNCING ALL ANALYTICS FROM LOCAL EVENTS\n');
console.log('='.repeat(80));

// Calculate guide analytics from events
async function calculateGuideAnalytics(guideId) {
  try {
    const { data: events, error } = await supabase
      .from('pendo_events')
      .select('*')
      .eq('entity_id', guideId)
      .eq('entity_type', 'guide');

    if (error || !events || events.length === 0) {
      return { views: 0, completions: 0, completion_rate: 0, unique_visitors: 0 };
    }

    // All guide events are views (event_type is just "guideEvents", not subdivided)
    const views = events.length;
    const uniqueVisitors = new Set(events.map(e => e.visitor_id).filter(Boolean)).size;

    // Note: We don't have separate "seen" vs "complete" events in current structure
    // All events are counted as views. Completions would require additional API data.
    const completions = 0; // TODO: Fetch from Pendo API if needed
    const completion_rate = 0;

    return {
      views,
      completions,
      completion_rate: Math.round(completion_rate * 100) / 100,
      unique_visitors: uniqueVisitors,
    };
  } catch (error) {
    console.error(`  ⚠️  Error calculating analytics for guide ${guideId}:`, error.message);
    return { views: 0, completions: 0, completion_rate: 0, unique_visitors: 0 };
  }
}

// Calculate feature analytics from events
async function calculateFeatureAnalytics(featureId) {
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
  } catch (error) {
    console.error(`  ⚠️  Error calculating analytics for feature ${featureId}:`, error.message);
    return { usage_count: 0, unique_users: 0, avg_usage_per_user: 0 };
  }
}

// Calculate page analytics from events
async function calculatePageAnalytics(pageId) {
  try {
    const { data: events, error } = await supabase
      .from('pendo_events')
      .select('*')
      .eq('entity_id', pageId)
      .eq('entity_type', 'page');

    if (error || !events || events.length === 0) {
      return { views: 0, unique_visitors: 0 };
    }

    const views = events.length;
    const unique_visitors = new Set(events.map(e => e.visitor_id).filter(Boolean)).size;

    return {
      views,
      unique_visitors,
    };
  } catch (error) {
    console.error(`  ⚠️  Error calculating analytics for page ${pageId}:`, error.message);
    return { views: 0, unique_visitors: 0 };
  }
}

// Sync all guides
async function syncAllGuides() {
  console.log('\n📊 Syncing ALL Guides...\n');

  // Get all guides
  const { data: guides, error } = await supabase
    .from('pendo_guides')
    .select('id, name, state');

  if (error) {
    console.error(`❌ Error fetching guides: ${error.message}`);
    return 0;
  }

  console.log(`   Found ${guides.length} guides to process`);

  let updated = 0;
  let withAnalytics = 0;

  // Process in batches of 10 to avoid overwhelming the connection
  const batchSize = 10;
  for (let i = 0; i < guides.length; i += batchSize) {
    const batch = guides.slice(i, i + batchSize);

    const updates = await Promise.all(
      batch.map(async (guide) => {
        const analytics = await calculateGuideAnalytics(guide.id);

        if (analytics.views > 0) {
          withAnalytics++;
        }

        return {
          id: guide.id,
          views: analytics.views,
          completions: analytics.completions,
          completion_rate: analytics.completion_rate,
          last_synced: new Date().toISOString(),
        };
      })
    );

    // Update database
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('pendo_guides')
        .update(update)
        .eq('id', update.id);

      if (updateError) {
        console.error(`  ⚠️  Error updating guide ${update.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    console.log(`   ✓ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(guides.length / batchSize)} (${updated}/${guides.length} updated)`);
  }

  console.log(`\n✅ Guides: ${updated} updated, ${withAnalytics} with analytics data\n`);
  return updated;
}

// Sync all features
async function syncAllFeatures() {
  console.log('\n📊 Syncing ALL Features...\n');

  const { data: features, error } = await supabase
    .from('pendo_features')
    .select('id, name');

  if (error) {
    console.error(`❌ Error fetching features: ${error.message}`);
    return 0;
  }

  console.log(`   Found ${features.length} features to process`);

  let updated = 0;
  let withAnalytics = 0;

  const batchSize = 10;
  for (let i = 0; i < features.length; i += batchSize) {
    const batch = features.slice(i, i + batchSize);

    const updates = await Promise.all(
      batch.map(async (feature) => {
        const analytics = await calculateFeatureAnalytics(feature.id);

        if (analytics.usage_count > 0) {
          withAnalytics++;
        }

        return {
          id: feature.id,
          usage_count: analytics.usage_count,
          unique_users: analytics.unique_users,
          avg_usage_per_user: analytics.avg_usage_per_user,
          last_synced: new Date().toISOString(),
        };
      })
    );

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('pendo_features')
        .update(update)
        .eq('id', update.id);

      if (updateError) {
        console.error(`  ⚠️  Error updating feature ${update.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    console.log(`   ✓ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(features.length / batchSize)} (${updated}/${features.length} updated)`);
  }

  console.log(`\n✅ Features: ${updated} updated, ${withAnalytics} with analytics data\n`);
  return updated;
}

// Sync all pages
async function syncAllPages() {
  console.log('\n📊 Syncing ALL Pages...\n');

  const { data: pages, error } = await supabase
    .from('pendo_pages')
    .select('id, name');

  if (error) {
    console.error(`❌ Error fetching pages: ${error.message}`);
    return 0;
  }

  console.log(`   Found ${pages.length} pages to process`);

  let updated = 0;
  let withAnalytics = 0;

  const batchSize = 10;
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);

    const updates = await Promise.all(
      batch.map(async (page) => {
        const analytics = await calculatePageAnalytics(page.id);

        if (analytics.views > 0) {
          withAnalytics++;
        }

        return {
          id: page.id,
          views: analytics.views,
          unique_visitors: analytics.unique_visitors,
          last_synced: new Date().toISOString(),
        };
      })
    );

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('pendo_pages')
        .update(update)
        .eq('id', update.id);

      if (updateError) {
        console.error(`  ⚠️  Error updating page ${update.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    console.log(`   ✓ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)} (${updated}/${pages.length} updated)`);
  }

  console.log(`\n✅ Pages: ${updated} updated, ${withAnalytics} with analytics data\n`);
  return updated;
}

// Main execution
async function run() {
  const startTime = Date.now();

  const guidesUpdated = await syncAllGuides();
  const featuresUpdated = await syncAllFeatures();
  const pagesUpdated = await syncAllPages();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('='.repeat(80));
  console.log('\n✅ ALL ANALYTICS SYNCED\n');
  console.log(`   Guides updated: ${guidesUpdated}`);
  console.log(`   Features updated: ${featuresUpdated}`);
  console.log(`   Pages updated: ${pagesUpdated}`);
  console.log(`   Total time: ${duration}s\n`);

  // Show sample results
  console.log('📊 Sample Results (Top 5 Guides by Views):\n');
  const { data: topGuides } = await supabase
    .from('pendo_guides')
    .select('name, views, completions, completion_rate, state')
    .order('views', { ascending: false })
    .limit(5);

  if (topGuides && topGuides.length > 0) {
    topGuides.forEach((guide, idx) => {
      console.log(`   ${idx + 1}. ${guide.name}`);
      console.log(`      Views: ${guide.views} | Completions: ${guide.completions} | Rate: ${guide.completion_rate}% | State: ${guide.state}`);
    });
  }

  console.log('\n📊 Sample Results (Top 5 Features by Usage):\n');
  const { data: topFeatures } = await supabase
    .from('pendo_features')
    .select('name, usage_count, unique_users, avg_usage_per_user')
    .order('usage_count', { ascending: false })
    .limit(5);

  if (topFeatures && topFeatures.length > 0) {
    topFeatures.forEach((feature, idx) => {
      console.log(`   ${idx + 1}. ${feature.name}`);
      console.log(`      Usage: ${feature.usage_count} | Unique Users: ${feature.unique_users} | Avg: ${feature.avg_usage_per_user}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

run().catch(error => {
  console.error('\n❌ Sync failed:', error);
  process.exit(1);
});
