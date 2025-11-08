#!/usr/bin/env node

/**
 * ULTRA DEEP INVESTIGATION of Pendo API Capabilities
 *
 * Comprehensive exploration of ALL available Pendo API endpoints and data sources
 * to discover untapped metrics and visualization opportunities for the dashboard.
 *
 * Investigation Areas:
 * 1. Aggregation API - All event sources (click, scroll, focus, load, etc.)
 * 2. Visitor Analytics - DAU/WAU/MAU, retention, cohorts
 * 3. Guide Analytics - Step-by-step progression, dismiss reasons
 * 4. Feature Analytics - Usage patterns, click heatmaps
 * 5. Page Analytics - Time on page, scroll depth, engagement
 * 6. Segmentation - Visitor/Account metadata, roles, geography
 * 7. Session Analytics - Duration, pages per session, bounce
 * 8. Funnel & Path Analysis - User journeys, conversion funnels
 * 9. Time-series Trends - Growth, adoption curves, seasonality
 * 10. Advanced Metrics - Engagement scores, stickiness, retention curves
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
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
const PENDO_BASE_URL = 'https://app.pendo.io';
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 ULTRA DEEP PENDO API INVESTIGATION\n');
console.log('='.repeat(100));

// Helper: Make Pendo API requests
async function pendoRequest(method, endpoint, body = null) {
  const url = `${PENDO_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'x-pendo-integration-key': PENDO_API_KEY,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper: Test Aggregation API source
async function testAggregationSource(sourceName, sourceConfig = null, description = '') {
  const pipeline = {
    "response": {
      "mimeType": "application/json"
    },
    "request": {
      "pipeline": [
        {
          "source": {
            [sourceName]: sourceConfig
          }
        },
        {
          "timeSeries": {
            "period": "dayRange",
            "first": 30
          }
        }
      ],
      "requestId": `${sourceName}-test-${Date.now()}`
    }
  };

  const result = await pendoRequest('POST', '/api/v1/aggregation', pipeline);

  const hasData = result.success && result.data && (Array.isArray(result.data) ? result.data.length > 0 : Object.keys(result.data).length > 0);

  return {
    source: sourceName,
    description,
    available: hasData,
    status: result.status,
    dataCount: Array.isArray(result.data) ? result.data.length : 0,
    sample: hasData && Array.isArray(result.data) ? result.data[0] : null
  };
}

// 1. COMPREHENSIVE AGGREGATION API EVENT SOURCES
async function testAllEventSources() {
  console.log('\n📊 Investigation 1: ALL Aggregation API Event Sources\n');
  console.log('-'.repeat(100));

  const sources = [
    // Basic event sources
    { name: 'events', config: null, desc: 'All raw events' },
    { name: 'guideEvents', config: null, desc: 'Guide view/interaction events' },
    { name: 'featureEvents', config: null, desc: 'Feature click events' },
    { name: 'pageEvents', config: null, desc: 'Page view events' },
    { name: 'trackEvents', config: null, desc: 'Custom track events' },
    { name: 'pollEvents', config: null, desc: 'Poll/survey responses' },

    // Interaction events
    { name: 'clickEvents', config: null, desc: 'All click interactions' },
    { name: 'focusEvents', config: null, desc: 'Input field focus events' },
    { name: 'changeEvents', config: null, desc: 'Form field changes' },
    { name: 'submitEvents', config: null, desc: 'Form submissions' },

    // Page engagement events
    { name: 'scrollEvents', config: null, desc: 'Page scroll tracking' },
    { name: 'loadEvents', config: null, desc: 'Page load performance' },
    { name: 'unloadEvents', config: null, desc: 'Page exit events' },

    // Session events
    { name: 'sessionEvents', config: null, desc: 'User session data' },
    { name: 'visitorEvents', config: null, desc: 'Visitor lifecycle events' },

    // Guide-specific
    { name: 'guideSeenEvents', config: null, desc: 'Guides that were viewed' },
    { name: 'guideAdvancedEvents', config: null, desc: 'Guides user stepped through' },
    { name: 'guideDismissedEvents', config: null, desc: 'Guides user dismissed' },
    { name: 'guideTimeoutEvents', config: null, desc: 'Guides that timed out' },
    { name: 'guideSkippedEvents', config: null, desc: 'Guides user skipped' },

    // Feature-specific
    { name: 'featureClickEvents', config: null, desc: 'Feature click locations' },
    { name: 'featureHoverEvents', config: null, desc: 'Feature hover events' },

    // Navigation
    { name: 'navigationEvents', config: null, desc: 'Page navigation tracking' },
    { name: 'urlChangeEvents', config: null, desc: 'URL/route changes' },

    // Performance
    { name: 'performanceEvents', config: null, desc: 'App performance metrics' },
    { name: 'errorEvents', config: null, desc: 'JavaScript errors' },

    // Engagement
    { name: 'timers', config: null, desc: 'Time-based engagement' },
    { name: 'milestones', config: null, desc: 'User milestone events' },
  ];

  console.log('Testing all possible event sources...\n');

  const results = [];
  for (const source of sources) {
    process.stdout.write(`Testing ${source.name}... `);
    const result = await testAggregationSource(source.name, source.config, source.desc);
    results.push(result);

    if (result.available) {
      console.log(`✅ AVAILABLE (${result.dataCount} records)`);
    } else {
      console.log(`❌ Not available (${result.status})`);
    }
  }

  console.log('\n📈 SUMMARY - Available Event Sources:\n');
  const available = results.filter(r => r.available);

  if (available.length > 0) {
    available.forEach(r => {
      console.log(`✅ ${r.source.padEnd(30)} - ${r.description}`);
      console.log(`   Data count: ${r.dataCount}, Sample keys: ${r.sample ? Object.keys(r.sample).slice(0, 5).join(', ') : 'N/A'}`);
    });
  } else {
    console.log('⚠️  No additional event sources found beyond basic ones');
  }

  return available;
}

// 2. VISITOR ANALYTICS (DAU/WAU/MAU)
async function testVisitorAnalytics() {
  console.log('\n\n👥 Investigation 2: Visitor Analytics & Engagement Metrics\n');
  console.log('-'.repeat(100));

  // Test visitor metadata endpoint
  const visitorsResult = await pendoRequest('GET', '/api/v1/visitor?pageSize=100');

  if (visitorsResult.success && visitorsResult.data) {
    const visitors = visitorsResult.data;
    console.log(`✅ Visitor API available: ${visitors.length} visitors found\n`);

    if (visitors.length > 0) {
      const sample = visitors[0];
      console.log('Sample visitor structure:');
      console.log(JSON.stringify(sample, null, 2));

      // Analyze metadata
      if (sample.metadata) {
        console.log('\n📋 Available visitor metadata fields:');
        Object.keys(sample.metadata).forEach(key => {
          console.log(`   - ${key}: ${typeof sample.metadata[key]}`);
        });
      }
    }

    // Test for engagement metrics
    console.log('\n🎯 Testing Engagement Metrics via Aggregation API...\n');

    const engagementTests = [
      {
        name: 'DAU (Daily Active Users)',
        pipeline: {
          source: { visitors: null },
          timeSeries: { period: 'dayRange', first: 30 },
          identified: true
        }
      },
      {
        name: 'New vs Returning Visitors',
        pipeline: {
          source: { visitorHistory: null },
          timeSeries: { period: 'dayRange', first: 30 }
        }
      },
      {
        name: 'Visitor Retention Cohorts',
        pipeline: {
          source: { cohorts: { cohortType: 'retention' } },
          timeSeries: { period: 'weekRange', first: 12 }
        }
      }
    ];

    for (const test of engagementTests) {
      const pipeline = {
        response: { mimeType: 'application/json' },
        request: {
          pipeline: [test.pipeline.source, test.pipeline.timeSeries],
          requestId: `engagement-${Date.now()}`
        }
      };

      const result = await pendoRequest('POST', '/api/v1/aggregation', pipeline);

      if (result.success && result.data && result.data.length > 0) {
        console.log(`✅ ${test.name}: Available (${result.data.length} data points)`);
      } else {
        console.log(`❌ ${test.name}: Not available`);
      }
    }
  } else {
    console.log('❌ Visitor API not available');
  }
}

// 3. GUIDE STEP-BY-STEP ANALYTICS
async function testGuideStepAnalytics() {
  console.log('\n\n📖 Investigation 3: Guide Step-by-Step Analytics\n');
  console.log('-'.repeat(100));

  // Get a sample guide with steps
  const guidesResult = await pendoRequest('GET', '/api/v1/guide?expand=steps');

  if (guidesResult.success && guidesResult.data && guidesResult.data.length > 0) {
    const guideWithSteps = guidesResult.data.find(g => g.steps && g.steps.length > 0);

    if (guideWithSteps) {
      console.log(`✅ Found guide with steps: "${guideWithSteps.name}"`);
      console.log(`   Steps: ${guideWithSteps.steps.length}`);

      // Test step-level analytics
      const stepAnalyticsPipeline = {
        response: { mimeType: 'application/json' },
        request: {
          pipeline: [
            {
              source: {
                guideEvents: {
                  guideId: guideWithSteps.id,
                  guideStepId: guideWithSteps.steps[0]?.id
                }
              }
            },
            {
              timeSeries: {
                period: 'dayRange',
                first: 30
              }
            }
          ],
          requestId: `guide-step-${Date.now()}`
        }
      };

      const result = await pendoRequest('POST', '/api/v1/aggregation', stepAnalyticsPipeline);

      if (result.success && result.data && result.data.length > 0) {
        console.log(`✅ Step-level analytics available`);
        console.log(`   Sample data:`, JSON.stringify(result.data[0], null, 2));
      } else {
        console.log(`❌ Step-level analytics not available`);
      }
    } else {
      console.log('⚠️  No guides with steps found');
    }
  }
}

// 4. FEATURE USAGE PATTERNS & HEATMAPS
async function testFeaturePatterns() {
  console.log('\n\n🎨 Investigation 4: Feature Usage Patterns & Click Heatmaps\n');
  console.log('-'.repeat(100));

  // Get features with detailed metadata
  const featuresResult = await pendoRequest('GET', '/api/v1/feature?expand=*');

  if (featuresResult.success && featuresResult.data && featuresResult.data.length > 0) {
    const sample = featuresResult.data[0];
    console.log('Sample feature structure:');
    console.log(JSON.stringify(sample, null, 2));

    // Test feature event details
    const featureDetailsPipeline = {
      response: { mimeType: 'application/json' },
      request: {
        pipeline: [
          {
            source: {
              featureEvents: {
                featureId: sample.id
              }
            }
          },
          {
            timeSeries: {
              period: 'hourRange',
              first: 168 // Last week by hour
            }
          }
        ],
        requestId: `feature-pattern-${Date.now()}`
      }
    };

    const result = await pendoRequest('POST', '/api/v1/aggregation', featureDetailsPipeline);

    if (result.success && result.data && result.data.length > 0) {
      console.log(`\n✅ Hourly feature usage patterns available`);
      console.log(`   Data points: ${result.data.length}`);
      console.log(`   Can visualize: Peak usage hours, day-of-week patterns`);
    }
  }
}

// 5. PAGE ENGAGEMENT METRICS
async function testPageEngagement() {
  console.log('\n\n📄 Investigation 5: Page Engagement & Time-on-Page Metrics\n');
  console.log('-'.repeat(100));

  // Get pages
  const { data: pages } = await supabase
    .from('pendo_pages')
    .select('*')
    .limit(5);

  if (pages && pages.length > 0) {
    const samplePage = pages[0];

    // Test page-level engagement
    const pageEngagementPipeline = {
      response: { mimeType: 'application/json' },
      request: {
        pipeline: [
          {
            source: {
              pageEvents: {
                pageId: samplePage.pendo_page_id
              }
            }
          },
          {
            timeSeries: {
              period: 'dayRange',
              first: 30
            }
          },
          {
            select: {
              avgTimeOnPage: 'avg(duration)',
              totalViews: 'count()',
              uniqueVisitors: 'uniqueCount(visitorId)'
            }
          }
        ],
        requestId: `page-engagement-${Date.now()}`
      }
    };

    const result = await pendoRequest('POST', '/api/v1/aggregation', pageEngagementPipeline);

    if (result.success && result.data) {
      console.log(`✅ Page engagement metrics available`);
      console.log(`   Sample:`, JSON.stringify(result.data, null, 2));
    } else {
      console.log(`❌ Page engagement metrics not available (Status: ${result.status})`);
    }
  }
}

// 6. SEGMENTATION & ACCOUNT METADATA
async function testSegmentation() {
  console.log('\n\n🎯 Investigation 6: Segmentation & Account Metadata\n');
  console.log('-'.repeat(100));

  // Test segments API
  const segmentsResult = await pendoRequest('GET', '/api/v1/segment');

  if (segmentsResult.success && segmentsResult.data) {
    console.log(`✅ Segments API available: ${segmentsResult.data.length} segments found`);

    if (segmentsResult.data.length > 0) {
      const sample = segmentsResult.data[0];
      console.log('\nSample segment structure:');
      console.log(JSON.stringify(sample, null, 2));
    }
  } else {
    console.log('❌ Segments API not available');
  }

  // Test account metadata
  const accountsResult = await pendoRequest('GET', '/api/v1/account?pageSize=50');

  if (accountsResult.success && accountsResult.data && accountsResult.data.length > 0) {
    console.log(`\n✅ Accounts API available: ${accountsResult.data.length} accounts found`);

    const sample = accountsResult.data[0];
    if (sample.metadata) {
      console.log('\n📊 Available account metadata fields:');
      Object.entries(sample.metadata).forEach(([key, value]) => {
        console.log(`   - ${key}: ${typeof value} = ${JSON.stringify(value).slice(0, 50)}`);
      });
    }
  }
}

// 7. SESSION ANALYTICS
async function testSessionAnalytics() {
  console.log('\n\n⏱️  Investigation 7: Session Duration & Pages per Session\n');
  console.log('-'.repeat(100));

  const sessionPipeline = {
    response: { mimeType: 'application/json' },
    request: {
      pipeline: [
        {
          source: {
            events: null
          }
        },
        {
          timeSeries: {
            period: 'dayRange',
            first: 30
          }
        },
        {
          select: {
            avgSessionDuration: 'avg(session.duration)',
            avgPagesPerSession: 'avg(session.pageCount)',
            totalSessions: 'uniqueCount(session.id)'
          }
        }
      ],
      requestId: `session-${Date.now()}`
    }
  };

  const result = await pendoRequest('POST', '/api/v1/aggregation', sessionPipeline);

  if (result.success && result.data) {
    console.log(`✅ Session analytics available`);
    console.log(`   Data:`, JSON.stringify(result.data, null, 2));
  } else {
    console.log(`❌ Session analytics not available (Status: ${result.status})`);
  }
}

// 8. FUNNEL & PATH ANALYSIS
async function testFunnelAnalysis() {
  console.log('\n\n🔄 Investigation 8: Funnel & User Path Analysis\n');
  console.log('-'.repeat(100));

  // Test funnel API
  const funnelResult = await pendoRequest('GET', '/api/v1/funnel');

  if (funnelResult.success && funnelResult.data) {
    console.log(`✅ Funnel API available: ${funnelResult.data.length} funnels found`);

    if (funnelResult.data.length > 0) {
      console.log('\nSample funnel:', JSON.stringify(funnelResult.data[0], null, 2));
    }
  } else {
    console.log('❌ Funnel API not available');
  }

  // Test path analysis
  const pathPipeline = {
    response: { mimeType: 'application/json' },
    request: {
      pipeline: [
        {
          source: {
            paths: {
              includeAnonymous: false
            }
          }
        },
        {
          timeSeries: {
            period: 'dayRange',
            first: 7
          }
        }
      ],
      requestId: `path-${Date.now()}`
    }
  };

  const pathResult = await pendoRequest('POST', '/api/v1/aggregation', pathPipeline);

  if (pathResult.success && pathResult.data) {
    console.log(`✅ Path analysis available`);
  } else {
    console.log(`❌ Path analysis not available`);
  }
}

// 9. METADATA DEEP DIVE
async function testMetadataRichness() {
  console.log('\n\n🔍 Investigation 9: Metadata Richness Analysis\n');
  console.log('-'.repeat(100));

  const { data: guides } = await supabase.from('pendo_guides').select('*').limit(1);
  const { data: features } = await supabase.from('pendo_features').select('*').limit(1);
  const { data: pages } = await supabase.from('pendo_pages').select('*').limit(1);

  console.log('📊 Guide metadata fields:');
  if (guides && guides[0]) {
    Object.keys(guides[0]).forEach(key => {
      console.log(`   - ${key}: ${typeof guides[0][key]}`);
    });
  }

  console.log('\n📊 Feature metadata fields:');
  if (features && features[0]) {
    Object.keys(features[0]).forEach(key => {
      console.log(`   - ${key}: ${typeof features[0][key]}`);
    });
  }

  console.log('\n📊 Page metadata fields:');
  if (pages && pages[0]) {
    Object.keys(pages[0]).forEach(key => {
      console.log(`   - ${key}: ${typeof pages[0][key]}`);
    });
  }
}

// 10. REPORTS & CUSTOM ANALYTICS
async function testReportsAnalytics() {
  console.log('\n\n📈 Investigation 10: Reports & Custom Analytics\n');
  console.log('-'.repeat(100));

  // Get reports with full expansion
  const reportsResult = await pendoRequest('GET', '/api/v1/report?expand=*');

  if (reportsResult.success && reportsResult.data && reportsResult.data.length > 0) {
    console.log(`✅ Reports API available: ${reportsResult.data.length} reports found`);

    // Categorize reports by type
    const reportTypes = {};
    reportsResult.data.forEach(report => {
      const type = report.type || 'unknown';
      reportTypes[type] = (reportTypes[type] || 0) + 1;
    });

    console.log('\n📊 Report Types Distribution:');
    Object.entries(reportTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} reports`);
    });

    // Sample report structure
    const sample = reportsResult.data[0];
    console.log('\nSample report structure:');
    console.log(`   Name: ${sample.name}`);
    console.log(`   Type: ${sample.type}`);
    console.log(`   Keys: ${Object.keys(sample).join(', ')}`);
  }
}

// FINAL RECOMMENDATIONS
async function generateRecommendations(availableSources) {
  console.log('\n\n' + '='.repeat(100));
  console.log('💡 DASHBOARD ENHANCEMENT RECOMMENDATIONS\n');
  console.log('='.repeat(100));

  const recommendations = [];

  if (availableSources.find(s => s.source === 'pollEvents')) {
    recommendations.push({
      priority: 'HIGH',
      metric: 'NPS Dashboard Widget',
      description: 'Create dedicated NPS score tracking with trend over time and sentiment analysis',
      implementation: 'Use pollEvents aggregation API to fetch survey responses'
    });
  }

  if (availableSources.find(s => s.source === 'events')) {
    recommendations.push({
      priority: 'MEDIUM',
      metric: 'Daily/Weekly Active Users (DAU/WAU)',
      description: 'Track unique visitors per day/week to measure engagement',
      implementation: 'Use events source with uniqueCount(visitorId) aggregation'
    });
  }

  if (availableSources.find(s => s.source === 'featureEvents')) {
    recommendations.push({
      priority: 'MEDIUM',
      metric: 'Feature Adoption Curve',
      description: 'Visualize feature adoption over time since launch',
      implementation: 'Track cumulative unique users per feature over time'
    });
  }

  if (availableSources.find(s => s.source === 'pageEvents')) {
    recommendations.push({
      priority: 'LOW',
      metric: 'Page Flow Visualization',
      description: 'Sankey diagram showing user navigation paths',
      implementation: 'Track page transitions using pageEvents sequence'
    });
  }

  recommendations.push({
    priority: 'HIGH',
    metric: 'Usage Heatmap (Day/Hour)',
    description: 'Heatmap showing peak usage times by day of week and hour',
    implementation: 'Aggregate events by hour and day of week'
  });

  recommendations.push({
    priority: 'MEDIUM',
    metric: 'Feature Usage Trends',
    description: 'Line chart showing feature usage trends over time',
    implementation: 'Use existing featureEvents data with time-series grouping'
  });

  recommendations.push({
    priority: 'MEDIUM',
    metric: 'Guide Effectiveness Score',
    description: 'Calculate guide effectiveness based on views and subsequent feature usage',
    implementation: 'Correlate guide views with feature adoption'
  });

  console.log('\n📋 Prioritized Recommendations:\n');

  recommendations
    .sort((a, b) => {
      const priority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priority[b.priority] - priority[a.priority];
    })
    .forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority}] ${rec.metric}`);
      console.log(`   ${rec.description}`);
      console.log(`   Implementation: ${rec.implementation}\n`);
    });
}

// MAIN EXECUTION
async function runUltraDeepInvestigation() {
  try {
    const availableSources = await testAllEventSources();
    await testVisitorAnalytics();
    await testGuideStepAnalytics();
    await testFeaturePatterns();
    await testPageEngagement();
    await testSegmentation();
    await testSessionAnalytics();
    await testFunnelAnalysis();
    await testMetadataRichness();
    await testReportsAnalytics();
    await generateRecommendations(availableSources);

    console.log('\n' + '='.repeat(100));
    console.log('✅ ULTRA DEEP INVESTIGATION COMPLETE\n');
  } catch (error) {
    console.error('\n❌ Error during investigation:', error);
  }
}

runUltraDeepInvestigation();
