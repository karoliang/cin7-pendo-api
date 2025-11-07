#!/usr/bin/env node

// Comprehensive API Health Check
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
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

const PENDO_API_KEY = env.VITE_PENDO_API_KEY;
const PENDO_BASE_URL = 'https://app.pendo.io/api/v1';
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

console.log('🏥 COMPREHENSIVE API HEALTH CHECK\n');
console.log('=' .repeat(80));

const results = {
  passed: [],
  failed: [],
  warnings: []
};

async function checkPendoAPI() {
  console.log('\n📡 PENDO API HEALTH:\n');

  // Test 1: API Key exists
  if (!PENDO_API_KEY) {
    results.failed.push('Pendo API key not found in .env');
    console.log('❌ API Key: Not configured');
    return false;
  }
  results.passed.push('Pendo API key configured');
  console.log('✅ API Key: Configured');

  // Test 2: Basic connectivity
  try {
    const response = await fetch(`${PENDO_BASE_URL}/page?limit=1`, {
      method: 'GET',
      headers: {
        'X-Pendo-Integration-Key': PENDO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    if (response.ok) {
      results.passed.push('Pendo API connectivity');
      console.log(`✅ Connectivity: ${response.status} ${response.statusText}`);

      const data = await response.json();
      const count = Array.isArray(data) ? data.length : (data.results?.length || 0);
      console.log(`   Returns ${count} record(s)`);
    } else {
      results.failed.push(`Pendo API returned ${response.status}`);
      console.log(`❌ Connectivity: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    results.failed.push(`Pendo API connection error: ${error.message}`);
    console.log(`❌ Connectivity: ${error.message}`);
    return false;
  }

  // Test 3: Rate limits
  try {
    const start = Date.now();
    const promises = Array.from({ length: 5 }, (_, i) =>
      fetch(`${PENDO_BASE_URL}/page?limit=1&offset=${i}`, {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': PENDO_API_KEY,
          'Content-Type': 'application/json',
        }
      })
    );
    const responses = await Promise.all(promises);
    const duration = Date.now() - start;

    const allSuccessful = responses.every(r => r.ok);
    if (allSuccessful) {
      results.passed.push('Pendo API rate limits');
      console.log(`✅ Rate Limits: 5 concurrent requests OK (${duration}ms)`);
    } else {
      results.warnings.push('Some concurrent requests failed');
      console.log(`⚠️  Rate Limits: Some requests failed`);
    }
  } catch (error) {
    results.warnings.push('Rate limit test failed');
    console.log(`⚠️  Rate Limits: ${error.message}`);
  }

  // Test 4: All endpoints
  const endpoints = [
    { name: 'Pages', endpoint: 'page' },
    { name: 'Features', endpoint: 'feature' },
    { name: 'Guides', endpoint: 'guide' },
    { name: 'Reports', endpoint: 'report' }
  ];

  console.log('\n   Endpoint Tests:');
  for (const { name, endpoint } of endpoints) {
    try {
      const response = await fetch(`${PENDO_BASE_URL}/${endpoint}?limit=1`, {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': PENDO_API_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        console.log(`   ✅ ${name.padEnd(10)} - ${response.status}`);
      } else {
        console.log(`   ❌ ${name.padEnd(10)} - ${response.status}`);
        results.warnings.push(`${name} endpoint returned ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${name.padEnd(10)} - ${error.message}`);
      results.failed.push(`${name} endpoint failed`);
    }
  }

  return true;
}

async function checkSupabaseDB() {
  console.log('\n\n💾 SUPABASE DATABASE HEALTH:\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    results.failed.push('Supabase credentials not found');
    console.log('❌ Credentials: Not configured');
    return false;
  }
  results.passed.push('Supabase credentials configured');
  console.log('✅ Credentials: Configured');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test 1: Basic connectivity
  try {
    const { data, error } = await supabase
      .from('pendo_pages')
      .select('id')
      .limit(1);

    if (error) throw error;
    results.passed.push('Supabase connectivity');
    console.log('✅ Connectivity: OK');
  } catch (error) {
    results.failed.push(`Supabase connection error: ${error.message}`);
    console.log(`❌ Connectivity: ${error.message}`);
    return false;
  }

  // Test 2: Table counts
  const tables = ['pendo_guides', 'pendo_features', 'pendo_pages', 'pendo_reports', 'pendo_events'];

  console.log('\n   Table Health:');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      console.log(`   ✅ ${table.padEnd(20)} - ${count} records`);

      if (count === 0) {
        results.warnings.push(`${table} is empty`);
      }
    } catch (error) {
      console.log(`   ❌ ${table.padEnd(20)} - ${error.message}`);
      results.failed.push(`${table} query failed`);
    }
  }

  // Test 3: Check sync_status table
  try {
    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .order('last_sync_end', { ascending: false })
      .limit(3);

    if (error) throw error;
    console.log('\n   Recent Syncs:');
    if (data && data.length > 0) {
      data.forEach(row => {
        const status = row.status === 'success' ? '✅' : '❌';
        const time = new Date(row.last_sync_end).toLocaleString();
        console.log(`   ${status} ${row.entity_type.padEnd(10)} - ${time} (${row.records_processed} records)`);
      });
      results.passed.push('Sync status tracking active');
    } else {
      console.log('   ⚠️  No sync history found');
      results.warnings.push('No sync history in sync_status table');
    }
  } catch (error) {
    console.log(`   ⚠️  sync_status: ${error.message}`);
    results.warnings.push('sync_status table issue');
  }

  return true;
}

async function checkEdgeFunctions() {
  console.log('\n\n⚡ SUPABASE EDGE FUNCTIONS:\n');

  const functions = [
    { name: 'sync-pendo-incremental', url: `${SUPABASE_URL}/functions/v1/sync-pendo-incremental` }
  ];

  for (const func of functions) {
    try {
      const response = await fetch(func.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: '{}',
        timeout: 5000
      });

      // Edge functions might return 200 or other status codes
      console.log(`   ${func.name}: ${response.status} ${response.statusText}`);

      if (response.status < 500) {
        results.passed.push(`${func.name} reachable`);
      } else {
        results.warnings.push(`${func.name} returned ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${func.name}: ${error.message}`);
      results.warnings.push(`${func.name} not reachable`);
    }
  }
}

async function checkEnvironmentVariables() {
  console.log('\n\n🔐 ENVIRONMENT VARIABLES:\n');

  const requiredVars = [
    'VITE_PENDO_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const optionalVars = [
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  console.log('   Required:');
  requiredVars.forEach(varName => {
    const exists = !!env[varName];
    const masked = exists ? `${env[varName].substring(0, 10)}...` : 'NOT SET';
    console.log(`   ${exists ? '✅' : '❌'} ${varName.padEnd(30)} - ${masked}`);

    if (exists) {
      results.passed.push(`${varName} configured`);
    } else {
      results.failed.push(`${varName} missing`);
    }
  });

  console.log('\n   Optional:');
  optionalVars.forEach(varName => {
    const exists = !!env[varName];
    const masked = exists ? `${env[varName].substring(0, 10)}...` : 'Not set';
    console.log(`   ${exists ? '✅' : '⚠️ '} ${varName.padEnd(30)} - ${masked}`);

    if (exists) {
      results.passed.push(`${varName} configured`);
    } else {
      results.warnings.push(`${varName} not set (recommended for sync)`);
    }
  });
}

async function generateReport() {
  console.log('\n\n' + '=' .repeat(80));
  console.log('\n📊 HEALTH CHECK SUMMARY\n');

  console.log(`✅ Passed: ${results.passed.length} checks`);
  console.log(`❌ Failed: ${results.failed.length} checks`);
  console.log(`⚠️  Warnings: ${results.warnings.length} issues`);

  if (results.failed.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:');
    results.failed.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  }

  if (results.failed.length === 0 && results.warnings.length === 0) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
  }

  console.log('\n' + '=' .repeat(80));

  // Return exit code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

async function run() {
  await checkEnvironmentVariables();
  await checkPendoAPI();
  await checkSupabaseDB();
  await checkEdgeFunctions();
  await generateReport();
}

run().catch(error => {
  console.error('\n❌ Health check failed:', error);
  process.exit(1);
});
