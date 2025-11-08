#!/usr/bin/env node

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

console.log('📊 DATABASE CONTENT ANALYSIS\n');
console.log('='.repeat(80));

// Check guides
const { data: guides } = await supabase
  .from('pendo_guides')
  .select('*')
  .order('views', { ascending: false })
  .limit(10);

console.log('\n📖 Top 10 Guides by Views:');
console.log('-'.repeat(80));
guides?.forEach((g, i) => {
  console.log(`${i + 1}. ${g.name}`);
  console.log(`   Views: ${g.views || 0}, Completions: ${g.completions || 0}`);
  console.log(`   Rate: ${g.completion_rate || 0}%, Visitors: ${g.unique_visitors || 0}`);
});

// Check features  
const { data: features } = await supabase
  .from('pendo_features')
  .select('*')
  .order('usage_count', { ascending: false })
  .limit(5);

console.log('\n\n🔧 Top 5 Features by Usage:');
console.log('-'.repeat(80));
features?.forEach((f, i) => {
  console.log(`${i + 1}. ${f.name}`);
  console.log(`   Usage: ${f.usage_count || 0}, Unique users: ${f.unique_users || 0}`);
});

// Check pages with all columns
const { data: samplePage } = await supabase
  .from('pendo_pages')
  .select('*')
  .limit(1);

console.log('\n\n📄 Pages Table Schema:');
console.log('-'.repeat(80));
if (samplePage && samplePage.length > 0) {
  console.log('Columns:', Object.keys(samplePage[0]));
  console.log('\nSample page:');
  console.log(JSON.stringify(samplePage[0], null, 2));
}

// Check if we have any poll guides
const { data: npsGuides } = await supabase
  .from('pendo_guides')
  .select('*')
  .or('name.ilike.%nps%,name.ilike.%poll%');

console.log('\n\n📊 NPS/Poll Guides:');
console.log('-'.repeat(80));
if (npsGuides && npsGuides.length > 0) {
  npsGuides.forEach(g => {
    console.log(`- ${g.name} (ID: ${g.id})`);
    console.log(`  Views: ${g.views || 0}`);
  });
} else {
  console.log('No NPS/Poll guides found in database');
}

// Get guides count by views
const { data: guidesStats } = await supabase
  .from('pendo_guides')
  .select('views, completions, completion_rate');

const withViews = guidesStats?.filter(g => g.views > 0).length || 0;
const withCompletions = guidesStats?.filter(g => g.completions > 0).length || 0;
const total = guidesStats?.length || 0;

console.log('\n\n📈 Overall Statistics:');
console.log('-'.repeat(80));
console.log(`Total Guides: ${total}`);
console.log(`Guides with Views: ${withViews} (${((withViews/total)*100).toFixed(1)}%)`);
console.log(`Guides with Completions: ${withCompletions} (${((withCompletions/total)*100).toFixed(1)}%)`);

// Calculate average completion rate for guides with data
const guidesWithData = guidesStats?.filter(g => g.views > 0) || [];
const avgCompletionRate = guidesWithData.length > 0
  ? guidesWithData.reduce((sum, g) => sum + (g.completion_rate || 0), 0) / guidesWithData.length
  : 0;

console.log(`\nAverage Completion Rate: ${avgCompletionRate.toFixed(1)}%`);

console.log('\n' + '='.repeat(80));
console.log('✅ ANALYSIS COMPLETE\n');
