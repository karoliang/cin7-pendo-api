#!/usr/bin/env node

// Quick verification script to check Pendo data sync
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const SUPABASE_URL = 'https://your-supabase-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Verifying Pendo Analytics Sync...\n');

// Check guides
const { data: guides, error: guidesError } = await supabase
  .from('pendo_guides')
  .select('name, views, completions, completion_rate, last_synced')
  .gt('views', 0)
  .order('views', { ascending: false })
  .limit(10);

if (guidesError) {
  console.error('❌ Guides Error:', guidesError);
} else {
  console.log(`✅ Top 10 Guides (${guides.length} total with views > 0):`);
  guides.forEach((guide, i) => {
    console.log(`   ${i + 1}. ${guide.name}`);
    console.log(`      Views: ${guide.views}, Completions: ${guide.completions}, Rate: ${guide.completion_rate}%`);
    console.log(`      Last Synced: ${new Date(guide.last_synced).toLocaleString()}`);
  });
  console.log();
}

// Check features
const { data: features, error: featuresError } = await supabase
  .from('pendo_features')
  .select('name, usage_count, unique_users, last_synced')
  .gt('usage_count', 0)
  .order('usage_count', { ascending: false })
  .limit(10);

if (featuresError) {
  console.error('❌ Features Error:', featuresError);
} else {
  console.log(`✅ Top 10 Features (${features.length} total with usage > 0):`);
  features.forEach((feature, i) => {
    console.log(`   ${i + 1}. ${feature.name}`);
    console.log(`      Usage: ${feature.usage_count}, Users: ${feature.unique_users}`);
    console.log(`      Last Synced: ${new Date(feature.last_synced).toLocaleString()}`);
  });
  console.log();
}

// Check pages
const { data: pages, error: pagesError } = await supabase
  .from('pendo_pages')
  .select('name, views, unique_visitors, last_synced')
  .gt('views', 0)
  .order('views', { ascending: false })
  .limit(10);

if (pagesError) {
  console.error('❌ Pages Error:', pagesError);
} else {
  console.log(`✅ Top 10 Pages (${pages.length} total with views > 0):`);
  pages.forEach((page, i) => {
    console.log(`   ${i + 1}. ${page.name}`);
    console.log(`      Views: ${page.views}, Visitors: ${page.unique_visitors}`);
    console.log(`      Last Synced: ${new Date(page.last_synced).toLocaleString()}`);
  });
  console.log();
}

// Summary
const { count: totalGuides } = await supabase.from('pendo_guides').select('*', { count: 'exact', head: true }).gt('views', 0);
const { count: totalFeatures } = await supabase.from('pendo_features').select('*', { count: 'exact', head: true }).gt('usage_count', 0);
const { count: totalPages } = await supabase.from('pendo_pages').select('*', { count: 'exact', head: true }).gt('views', 0);

console.log('📊 Summary:');
console.log(`   Guides with data: ${totalGuides}`);
console.log(`   Features with data: ${totalFeatures}`);
console.log(`   Pages with data: ${totalPages}`);
console.log('\n✅ Verification Complete! Your dashboard should now show real data.');
