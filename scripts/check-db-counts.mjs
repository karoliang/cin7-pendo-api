#!/usr/bin/env node

// Quick script to check actual counts in Supabase database

import { createClient } from '@supabase/supabase-js';
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

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCounts() {
  console.log('🔍 Checking database counts...\n');

  // Check guides count
  const { count: guidesCount, error: guidesError } = await supabase
    .from('pendo_guides')
    .select('*', { count: 'exact', head: true });

  if (guidesError) {
    console.error('❌ Error counting guides:', guidesError);
  } else {
    console.log(`📊 Guides: ${guidesCount}`);
  }

  // Check features count
  const { count: featuresCount, error: featuresError } = await supabase
    .from('pendo_features')
    .select('*', { count: 'exact', head: true });

  if (featuresError) {
    console.error('❌ Error counting features:', featuresError);
  } else {
    console.log(`🔧 Features: ${featuresCount}`);
  }

  // Check pages count
  const { count: pagesCount, error: pagesError } = await supabase
    .from('pendo_pages')
    .select('*', { count: 'exact', head: true });

  if (pagesError) {
    console.error('❌ Error counting pages:', pagesError);
  } else {
    console.log(`📄 Pages: ${pagesCount}`);
  }

  console.log('\n✅ Count check complete');
}

checkCounts();
