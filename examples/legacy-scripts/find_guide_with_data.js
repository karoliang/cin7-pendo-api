#!/usr/bin/env node
/**
 * Script to find Pendo guides with actual analytics data
 * Run with: node find_guide_with_data.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from frontend/.env
dotenv.config({ path: join(__dirname, 'frontend', '.env') });

const API_KEY = process.env.VITE_PENDO_API_KEY;
const BASE_URL = 'https://app.pendo.io';

if (!API_KEY) {
  console.error('❌ Error: VITE_PENDO_API_KEY not found in frontend/.env');
  console.error('Please ensure frontend/.env exists with your Pendo API key');
  process.exit(1);
}

async function fetchGuides() {
  const url = `${BASE_URL}/api/v1/guide?limit=1000`;
  const headers = {
    'X-Pendo-Integration-Key': API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching guides:', error.message);
    process.exit(1);
  }
}

async function analyzeGuides() {
  console.log('🔍 Fetching all guides from Pendo...\n');
  const guides = await fetchGuides();

  console.log(`✅ Retrieved ${guides.length} total guides\n`);
  console.log('='  * 80);
  console.log('📊 ANALYZING GUIDE DATA');
  console.log('=' * 80);

  // Analyze guide states
  const stateGroups = guides.reduce((acc, guide) => {
    const state = guide.state || 'unknown';
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📋 Guides by State:');
  Object.entries(stateGroups).forEach(([state, count]) => {
    console.log(`  ${state}: ${count} guides`);
  });

  // Look for guides that might have data based on field analysis
  console.log('\n🔎 Analyzing guide fields for potential data...');

  const guidesWithNumericFields = guides.map(guide => {
    const numericFields = {};
    Object.entries(guide).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0 && key !== 'id') {
        numericFields[key] = value;
      }
    });
    return {
      id: guide.id,
      name: guide.name,
      state: guide.state,
      numericFields: Object.keys(numericFields).length > 0 ? numericFields : null
    };
  }).filter(g => g.numericFields !== null);

  if (guidesWithNumericFields.length > 0) {
    console.log(`\n✨ Found ${guidesWithNumericFields.length} guides with numeric data fields:\n`);
    guidesWithNumericFields.slice(0, 10).forEach((guide, i) => {
      console.log(`${i + 1}. ${guide.name}`);
      console.log(`   ID: ${guide.id}`);
      console.log(`   State: ${guide.state}`);
      console.log(`   Data fields: ${JSON.stringify(guide.numericFields)}`);
      console.log('');
    });
  } else {
    console.log('\n⚠️  No guides found with numeric data fields in metadata');
    console.log('    This confirms: Analytics data is NOT in guide metadata');
  }

  // Show sample guides from different states
  console.log('\n📌 Sample Guides to Test:\n');

  const sampleGuides = [
    guides.find(g => g.state === 'published'),
    guides.find(g => g.state === 'public'),
    guides.find(g => g.state === 'staging'),
    guides.find(g => g.state === 'pendingReview'),
    guides.find(g => g.state === 'disabled'),
  ].filter(Boolean);

  sampleGuides.forEach((guide, i) => {
    console.log(`${i + 1}. ${guide.name || 'Unnamed'}`);
    console.log(`   ID: ${guide.id}`);
    console.log(`   State: ${guide.state}`);
    console.log(`   URL: http://localhost:5173/report/guides/${guide.id}`);
    console.log('');
  });

  // Show first 20 guides overall
  console.log('\n📝 First 20 Guides (any state):\n');
  guides.slice(0, 20).forEach((guide, i) => {
    console.log(`${i + 1}. ${guide.name || 'Unnamed'}`);
    console.log(`   ID: ${guide.id}`);
    console.log(`   State: ${guide.state}`);
    console.log(`   Test URL: http://localhost:5173/report/guides/${guide.id}`);
    console.log('');
  });

  console.log('\n' + '=' * 80);
  console.log('💡 NEXT STEPS');
  console.log('=' * 80);
  console.log('\n1. Open http://localhost:5173/ in your browser');
  console.log('2. Try visiting the test URLs above');
  console.log('3. Check browser console for API response details');
  console.log('4. Note: Guide metadata does NOT include analytics (views, completions)');
  console.log('5. Analytics require aggregation API (currently using generated data)');
  console.log('');
}

analyzeGuides().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
