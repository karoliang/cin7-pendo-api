#!/usr/bin/env node

// Audit script to check database counts and compare with Pendo API
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
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

const PENDO_API_KEY = env.VITE_PENDO_API_KEY;
const PENDO_BASE_URL = 'https://app.pendo.io/api/v1';
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!PENDO_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 DATABASE & PENDO API AUDIT\n');
console.log('=' .repeat(80));

// Entity mappings
const entities = [
  { name: 'Guides', table: 'pendo_guides', endpoint: 'guide' },
  { name: 'Features', table: 'pendo_features', endpoint: 'feature' },
  { name: 'Pages', table: 'pendo_pages', endpoint: 'page' },
  { name: 'Reports', table: 'pendo_reports', endpoint: 'report' },
  { name: 'Events', table: 'pendo_events', endpoint: 'track-event' }
];

async function getSupabaseCount(table) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function getPendoCount(endpoint) {
  try {
    const url = `${PENDO_BASE_URL}/${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Pendo-Integration-Key': PENDO_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || data || [];
    return results.length;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function audit() {
  console.log('\n📊 RECORD COUNTS:\n');
  console.log(`${'Entity'.padEnd(15)} ${'Database'.padEnd(15)} ${'Pendo API'.padEnd(15)} ${'Difference'.padEnd(15)} Status`);
  console.log('-'.repeat(80));

  let totalDbRecords = 0;
  let totalPendoRecords = 0;
  const issues = [];

  for (const entity of entities) {
    const dbCount = await getSupabaseCount(entity.table);
    const pendoCount = await getPendoCount(entity.endpoint);

    const dbNum = typeof dbCount === 'number' ? dbCount : 0;
    const pendoNum = typeof pendoCount === 'number' ? pendoCount : 0;
    const diff = pendoNum - dbNum;

    let status = '✅';
    if (typeof dbCount === 'string' && dbCount.includes('Error')) {
      status = '❌ DB Error';
      issues.push(`${entity.name}: Database query failed - ${dbCount}`);
    } else if (typeof pendoCount === 'string' && pendoCount.includes('Error')) {
      status = '❌ API Error';
      issues.push(`${entity.name}: Pendo API query failed - ${pendoCount}`);
    } else if (diff > 0) {
      status = `⚠️  Missing ${diff}`;
      issues.push(`${entity.name}: Missing ${diff} records in database (DB: ${dbNum}, Pendo: ${pendoNum})`);
    }

    console.log(
      `${entity.name.padEnd(15)} ${String(dbCount).padEnd(15)} ${String(pendoCount).padEnd(15)} ${String(diff).padEnd(15)} ${status}`
    );

    if (typeof dbCount === 'number') totalDbRecords += dbCount;
    if (typeof pendoCount === 'number') totalPendoRecords += pendoCount;
  }

  console.log('-'.repeat(80));
  console.log(`${'TOTAL'.padEnd(15)} ${String(totalDbRecords).padEnd(15)} ${String(totalPendoRecords).padEnd(15)} ${String(totalPendoRecords - totalDbRecords).padEnd(15)}`);
  console.log('=' .repeat(80));

  if (issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:\n');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ All data synced successfully!');
  }

  // Check RLS status
  console.log('\n🔒 ROW-LEVEL SECURITY CHECK:\n');
  for (const entity of entities) {
    const { data, error } = await supabase
      .from(entity.table)
      .select('id')
      .limit(1);

    if (error) {
      console.log(`❌ ${entity.name}: RLS blocking access - ${error.message}`);
    } else {
      console.log(`✅ ${entity.name}: Read access OK (RLS: ${data.length > 0 ? 'permissive' : 'empty table'})`);
    }
  }
}

audit().catch(console.error);
