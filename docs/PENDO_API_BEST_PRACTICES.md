# Pendo Aggregation API Best Practices - Comprehensive Guide

> Last Updated: 2025-01-30
>
> Based on official Pendo documentation, industry best practices, and production implementation experience

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pendo Aggregation API Architecture](#pendo-aggregation-api-architecture)
3. [Request Structure Best Practices](#request-structure-best-practices)
4. [Pipeline Construction Patterns](#pipeline-construction-patterns)
5. [Data Sources and Their Uses](#data-sources-and-their-uses)
6. [Frustration Metrics Implementation](#frustration-metrics-implementation)
7. [Feature and Page Association](#feature-and-page-association)
8. [Error Handling and Resilience](#error-handling-and-resilience)
9. [Caching Strategies](#caching-strategies)
10. [Performance Optimization](#performance-optimization)
11. [UI/UX Best Practices](#ui-ux-best-practices)
12. [Security and Rate Limiting](#security-and-rate-limiting)
13. [Testing and Validation](#testing-and-validation)
14. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
15. [Production Checklist](#production-checklist)

---

## Executive Summary

### Key Principles

1. **Use TWO request formats**: Flat format for simple totals, Pipeline format for complex queries
2. **Always include requestId**: Unique identifier for debugging and tracking
3. **Implement graceful fallbacks**: Never fail completely - degrade gracefully
4. **Cache aggressively**: 5-minute TTL for most analytics data
5. **Validate response structures**: Pendo API responses vary by query type
6. **Handle frustration metrics carefully**: Not all event sources include these fields
7. **Understand source limitations**: Each data source has specific capabilities and constraints

### Critical Warnings

- **List endpoints return NO analytics**: `/api/v1/guide`, `/api/v1/page`, etc. only return metadata
- **Aggregation API is the only source of analytics**: Use `/api/v1/aggregation` for all metrics
- **PageEvents lacks frustration metrics**: Use the `events` source for dead clicks, rage clicks, etc.
- **Features are not page-scoped**: featureEvents don't include pageId/pageUrl fields
- **Guide targeting rules are complex**: Cannot reliably filter guides by page via API

---

## Pendo Aggregation API Architecture

### Base URL and Authentication

```typescript
const PENDO_BASE_URL = 'https://app.pendo.io';
const PENDO_API_KEY = process.env.PENDO_API_KEY; // Never hardcode

const headers = {
  'X-Pendo-Integration-Key': PENDO_API_KEY,
  'Content-Type': 'application/json',
};
```

### Endpoint Structure

```
GET/POST https://app.pendo.io/api/v1/aggregation
```

**Method**: Use POST for all aggregation queries (GET has limited support)

---

## Request Structure Best Practices

### Format 1: Flat Format (Simple Queries)

**Use When:**
- Fetching totals for a single entity
- Simple time series data
- No field selection or joins needed

**Structure:**
```typescript
{
  source: {
    guideEvents: null,
    timeSeries: {
      first: startTime,      // Unix timestamp in milliseconds
      count: 30,             // Number of periods
      period: "dayRange"     // dayRange, hourRange, weekRange, monthRange
    }
  },
  filter: "guideId == \"abc123\"",
  requestId: "guide_totals_1738264800000"
}
```

**Example:**
```typescript
// Get guide totals (views/completions)
const totalsRequest = {
  source: { guideEvents: null },
  filter: `guideId == "${guideId}"`,
  requestId: `guide_totals_${Date.now()}`
};
```

### Format 2: Pipeline Format (Complex Queries)

**Use When:**
- Need field selection (`select`)
- Grouping and aggregation (`group`)
- Joining multiple sources (`spawn` + `join`)
- Filtering identified visitors/accounts (`identified`)
- Complex transformations

**Structure:**
```typescript
{
  response: {
    mimeType: "application/json"
  },
  request: {
    pipeline: [
      { source: { ... } },
      { filter: "..." },
      { identified: "visitorId" },
      { select: { ... } },
      { group: { ... } },
      { sort: [...] }
    ],
    requestId: "unique_id"
  }
}
```

**Example:**
```typescript
// Get top visitors for a page
const topVisitorsRequest = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        spawn: [
          // Query 1: Get view counts
          [
            {
              source: {
                pageEvents: null,
                timeSeries: {
                  first: startTime,
                  count: 90,
                  period: "dayRange"
                }
              }
            },
            {
              filter: `pageId == "${pageId}"`
            },
            {
              identified: "visitorId"
            },
            {
              group: {
                group: ["visitorId"],
                fields: {
                  viewCount: { count: "visitorId" }
                }
              }
            }
          ],
          // Query 2: Get visitor metadata
          [
            {
              source: { visitors: null }
            },
            {
              identified: "visitorId"
            },
            {
              select: {
                visitorId: "visitorId",
                email: "metadata.auto.email",
                name: "metadata.agent.name"
              }
            }
          ]
        ]
      },
      {
        join: {
          fields: ["visitorId"],
          width: 2
        }
      },
      {
        sort: ["-viewCount"]
      }
    ],
    requestId: `top_visitors_${pageId}_${Date.now()}`
  }
};
```

### Best Practice: Multi-Approach Strategy

**Pattern**: Try multiple request formats in sequence with graceful degradation

```typescript
async function handleAggregationRequest(params) {
  const approaches = [
    { name: 'Pipeline format', body: buildPipelineRequest(params) },
    { name: 'Flat format', body: params },
    { name: 'Alternative pipeline', body: buildAlternativePipeline(params) }
  ];

  for (const approach of approaches) {
    try {
      console.log(`Trying: ${approach.name}`);
      const result = await makeAggregationCall(approach.body);
      console.log(`Success with: ${approach.name}`);
      return result;
    } catch (error) {
      console.log(`Failed: ${approach.name} - ${error.message}`);
      continue;
    }
  }

  // Graceful fallback
  return { message: 'Aggregation API unavailable', data: [] };
}
```

---

## Pipeline Construction Patterns

### 1. Source Operators

**Always first in pipeline** (except when using `spawn`)

```typescript
// Event sources (time-series data)
{ source: { guideEvents: null } }
{ source: { pageEvents: null } }
{ source: { featureEvents: null } }
{ source: { events: { eventClass: ["web", "ios", "android"] } } }

// Entity sources (metadata)
{ source: { visitors: null } }
{ source: { accounts: null } }

// Survey sources
{ source: { pollsSeenEver: { guideId: "x", pollId: "y" } } }
```

**With TimeSeries:**
```typescript
{
  source: {
    pageEvents: null,
    timeSeries: {
      first: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      count: 30,                                        // 30 periods
      period: "dayRange"                               // daily buckets
    }
  }
}
```

**Period Options:**
- `dayRange` - Daily buckets
- `hourRange` - Hourly buckets
- `weekRange` - Weekly buckets
- `monthRange` - Monthly buckets

### 2. Filter Operator

**Syntax:**
```typescript
{ filter: "field == \"value\"" }
{ filter: "field != \"value\"" }
{ filter: "field > 1000" }
{ filter: "field >= 1000" }
{ filter: "field < 1000" }
{ filter: "field <= 1000" }
{ filter: "field in [\"a\", \"b\", \"c\"]" }
{ filter: "field1 == \"x\" && field2 > 100" }
```

**Best Practices:**
- Always escape quotes in string values
- Use `&&` for AND conditions
- Use `||` for OR conditions
- Filter as early as possible in the pipeline

**Example:**
```typescript
{
  filter: `guideId == "${guideId}" && day >= ${startTime} && day <= ${endTime}`
}
```

### 3. Identified Operator

**Purpose**: Filter to only identified (non-anonymous) visitors/accounts

```typescript
{ identified: "visitorId" }  // Only visitors with visitorId
{ identified: "accountId" }  // Only visitors with accountId
```

**Best Practice**: Use after source but before grouping

### 4. Select Operator

**Purpose**: Choose specific fields and rename them

```typescript
{
  select: {
    visitor: "visitorId",
    email: "metadata.auto.email",
    name: "metadata.agent.name",
    browser: "metadata.auto.lastbrowsername",
    firstVisit: "metadata.auto.firstvisit"
  }
}
```

**Metadata Access Patterns:**
- Auto metadata: `metadata.auto.fieldname`
- Agent metadata: `metadata.agent.fieldname`
- Custom metadata: `metadata.custom.fieldname`

### 5. Group Operator

**Purpose**: Aggregate data by fields

```typescript
{
  group: {
    group: ["visitorId", "day"],
    fields: {
      totalViews: { sum: "numEvents" },
      avgDuration: { avg: "numMinutes" },
      maxDuration: { max: "numMinutes" },
      minDuration: { min: "numMinutes" },
      visitorCount: { count: "visitorId" },
      uniquePages: { count_distinct: "pageId" }
    }
  }
}
```

**Aggregation Functions:**
- `count` - Count occurrences
- `count_distinct` - Count unique values
- `sum` - Sum numeric values
- `avg` - Average numeric values
- `max` - Maximum value
- `min` - Minimum value

### 6. Sort Operator

```typescript
{ sort: ["accountId"] }           // Ascending
{ sort: ["-viewCount"] }          // Descending (use minus prefix)
{ sort: ["date", "-viewCount"] }  // Multi-field sort
```

### 7. Spawn and Join Operators

**Purpose**: Run multiple queries in parallel and combine results

```typescript
{
  spawn: [
    // Pipeline 1
    [
      { source: { pageEvents: null } },
      { filter: `pageId == "${pageId}"` },
      { group: { group: ["visitorId"], fields: { views: { count: "*" } } } }
    ],
    // Pipeline 2
    [
      { source: { visitors: null } },
      { select: { visitorId: "visitorId", email: "metadata.auto.email" } }
    ]
  ]
}
```

**Then join:**
```typescript
{
  join: {
    fields: ["visitorId"],  // Join key(s)
    width: 2                // Number of spawned pipelines
  }
}
```

**Best Practice**: Use spawn/join for enriching event data with entity metadata

---

## Data Sources and Their Uses

### 1. guideEvents

**Purpose**: Guide analytics (views, completions, shown count)

**Available Fields:**
- `type`: "guideActivity"
- `action`: "view", "advanced", "completed", "dismissed"
- `guideId`: Guide identifier
- `visitorId`: Visitor who saw the guide
- `accountId`: Account
- `day`: Timestamp (when using timeSeries)

**Example Use Case:**
```typescript
// Get guide completion rate
{
  source: { guideEvents: null },
  filter: `guideId == "${guideId}"`,
  requestId: "guide_completion"
}

// Process results:
let viewedCount = 0;
let completedCount = 0;

for (const result of response.results) {
  if (result.action === 'view' || result.action === 'advanced') {
    viewedCount++;
  }
  if (result.action === 'completed') {
    completedCount++;
  }
}

const completionRate = (completedCount / viewedCount) * 100;
```

### 2. pageEvents

**Purpose**: Page view analytics

**Available Fields:**
- `pageId`: Page identifier
- `visitorId`: Visitor
- `accountId`: Account
- `numEvents`: Number of page views
- `day`: Timestamp (when using timeSeries)
- `server`: Server/domain
- `userAgent`: Browser user agent string

**NOT Available:**
- Frustration metrics (dead clicks, rage clicks, error clicks)
- Feature IDs
- Detailed interaction data

**Example Use Case:**
```typescript
// Get page views by day
{
  source: {
    pageEvents: null,
    timeSeries: {
      first: startTime,
      count: 30,
      period: "dayRange"
    }
  },
  filter: `pageId == "${pageId}"`,
  requestId: "page_daily_views"
}

// Count unique visitors
const uniqueVisitors = new Set();
for (const result of response.results) {
  if (result.visitorId) {
    uniqueVisitors.add(result.visitorId);
  }
}
```

### 3. featureEvents

**Purpose**: Feature click/interaction tracking

**Available Fields:**
- `featureId`: Feature identifier
- `visitorId`: Visitor
- `accountId`: Account
- `numEvents`: Number of clicks
- `numMinutes`: Time spent
- `day`: Timestamp

**NOT Available:**
- `pageId` or `pageUrl` (features are not page-scoped)
- Frustration metrics

**Limitation**: Cannot reliably filter features by page

**Example Use Case:**
```typescript
// Get feature usage counts
{
  source: { featureEvents: null },
  requestId: "feature_usage"
}

// Group by featureId
const featureUsage = new Map();
for (const event of response.results) {
  const count = featureUsage.get(event.featureId) || 0;
  featureUsage.set(event.featureId, count + (event.numEvents || 1));
}
```

### 4. events

**Purpose**: All application events including frustration metrics

**Available Fields:**
- `eventClass`: ["web", "ios", "android"]
- `visitorId`: Visitor
- `accountId`: Account
- `pageId`: Page (if available)
- `numEvents`: Total events
- `numMinutes`: Time spent
- `uTurnCount`: U-turn count
- `deadClickCount`: Dead click count
- `errorClickCount`: Error click count
- `rageClickCount`: Rage click count
- `day`: Timestamp

**Best Use**: Frustration metrics and detailed event analysis

**Example Use Case:**
```typescript
// Get frustration metrics for a page
{
  request: {
    pipeline: [
      {
        source: {
          events: { eventClass: ["web"] },
          timeSeries: {
            first: startTime,
            count: 30,
            period: "dayRange"
          }
        }
      },
      {
        filter: `pageId == "${pageId}"`
      },
      {
        identified: "visitorId"
      },
      {
        group: {
          group: ["visitorId", "day"],
          fields: {
            totalEvents: { sum: "numEvents" },
            uTurns: { sum: "uTurnCount" },
            deadClicks: { sum: "deadClickCount" },
            errorClicks: { sum: "errorClickCount" },
            rageClicks: { sum: "rageClickCount" }
          }
        }
      }
    ],
    requestId: "page_frustration_metrics"
  }
}
```

### 5. visitors

**Purpose**: Visitor-level metadata and properties

**Auto Metadata Fields:**
- `visitorId`: Unique identifier
- `metadata.auto.firstvisit`: First visit timestamp
- `metadata.auto.lastvisit`: Last visit timestamp
- `metadata.auto.lastbrowsername`: Browser
- `metadata.auto.lastbrowserversion`: Browser version
- `metadata.auto.lastoperatingsystem`: OS
- `metadata.auto.lastservername`: Server/domain
- `metadata.auto.lastuseragent`: Full user agent
- `metadata.auto.accountid`: Associated account
- `metadata.auto.email`: Email (if identified)

**Agent Metadata Fields:**
- `metadata.agent.name`: Visitor name
- `metadata.agent.role`: User role
- Custom fields set via Pendo agent

**Example Use Case:**
```typescript
// Get visitor profile
{
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        source: { visitors: null }
      },
      {
        filter: `visitorId == "${visitorId}"`
      },
      {
        select: {
          visitorId: "visitorId",
          email: "metadata.auto.email",
          name: "metadata.agent.name",
          browser: "metadata.auto.lastbrowsername",
          os: "metadata.auto.lastoperatingsystem",
          firstVisit: "metadata.auto.firstvisit",
          lastVisit: "metadata.auto.lastvisit"
        }
      }
    ]
  }
}
```

### 6. accounts

**Purpose**: Account-level metadata

**Auto Metadata Fields:**
- `accountId`: Unique identifier
- `metadata.auto.firstvisit`: First visit
- `metadata.auto.lastvisit`: Last visit
- `metadata.auto.lastupdated`: Last update

**Custom Metadata Fields (common):**
- `metadata.agent.name`: Account/company name
- `metadata.custom.arrannuallyrecurringrevenue`: ARR value
- `metadata.custom.customersuccessmanager`: CSM name
- `metadata.custom.industry`: Industry
- `metadata.custom.planlevel`: Plan (Free, Pro, Enterprise)
- `metadata.custom.renewaldate`: Renewal date
- `metadata.custom.totallicenses`: License count

**Example Use Case:**
```typescript
// Get high-value accounts
{
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        source: { accounts: null }
      },
      {
        filter: `metadata.custom.arrannuallyrecurringrevenue > 100000`
      },
      {
        select: {
          accountId: "accountId",
          name: "metadata.agent.name",
          arr: "metadata.custom.arrannuallyrecurringrevenue",
          plan: "metadata.custom.planlevel",
          csm: "metadata.custom.customersuccessmanager"
        }
      },
      {
        sort: ["-arr"]
      }
    ]
  }
}
```

---

## Frustration Metrics Implementation

### Understanding Frustration Metrics

**Four Types:**

1. **Rage Clicks**: Multiple rapid clicks in concentrated area (user frustration)
2. **Error Clicks**: Click immediately results in JavaScript error (within 100ms)
3. **Dead Clicks**: Click doesn't cause visible interface change
4. **U-Turns**: Quick navigation away from page

### Source Selection

**Critical**: Frustration metrics are ONLY available in the `events` source, NOT in `pageEvents` or `featureEvents`

```typescript
// CORRECT: Use events source
{
  source: {
    events: { eventClass: ["web"] },
    timeSeries: { ... }
  }
}

// WRONG: pageEvents doesn't include frustration metrics
{
  source: { pageEvents: null }  // No uTurnCount, deadClickCount, etc.
}
```

### Implementation Pattern

```typescript
async function getFrustrationMetrics(pageId: string, days: number = 30) {
  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);

  const request = {
    response: { mimeType: "application/json" },
    request: {
      pipeline: [
        {
          source: {
            events: { eventClass: ["web"] },
            timeSeries: {
              first: startTime,
              count: days,
              period: "dayRange"
            }
          }
        },
        {
          filter: `pageId == "${pageId}"`
        },
        {
          identified: "visitorId"
        },
        {
          group: {
            group: ["visitorId", "accountId", "day"],
            fields: {
              totalEvents: { sum: "numEvents" },
              timeSpent: { sum: "numMinutes" },
              uTurns: { sum: "uTurnCount" },
              deadClicks: { sum: "deadClickCount" },
              errorClicks: { sum: "errorClickCount" },
              rageClicks: { sum: "rageClickCount" }
            }
          }
        },
        {
          sort: ["-day"]
        }
      ],
      requestId: `frustration_metrics_${pageId}_${Date.now()}`
    }
  };

  const response = await makeAggregationCall(request);

  // Process and calculate frustration rate
  if (response.results) {
    const totalInteractions = response.results.reduce(
      (sum, row) => sum + (row.totalEvents || 0), 0
    );
    const totalFrustrations = response.results.reduce(
      (sum, row) => sum + (row.uTurns || 0) + (row.deadClicks || 0) +
                          (row.errorClicks || 0) + (row.rageClicks || 0), 0
    );

    const frustrationRate = totalInteractions > 0
      ? (totalFrustrations / totalInteractions) * 100
      : 0;

    return {
      frustrationRate,
      totalInteractions,
      breakdown: {
        uTurns: response.results.reduce((sum, r) => sum + (r.uTurns || 0), 0),
        deadClicks: response.results.reduce((sum, r) => sum + (r.deadClicks || 0), 0),
        errorClicks: response.results.reduce((sum, r) => sum + (r.errorClicks || 0), 0),
        rageClicks: response.results.reduce((sum, r) => sum + (r.rageClicks || 0), 0)
      },
      details: response.results
    };
  }

  return null;
}
```

### Best Practices

1. **Always check for null/undefined**: Frustration fields may not be present
2. **Calculate rates, not just counts**: Show percentages for context
3. **Set expectations**: Mark features with expected frustrations to avoid false positives
4. **Time-based analysis**: Track trends over time, not just totals
5. **Segment by visitor type**: Power users vs new users may have different patterns

### UI Display Recommendations

```typescript
// Display frustration metrics with context
interface FrustrationMetrics {
  total: number;
  rate: number;  // Percentage
  breakdown: {
    uTurns: { count: number; percentage: number };
    deadClicks: { count: number; percentage: number };
    errorClicks: { count: number; percentage: number };
    rageClicks: { count: number; percentage: number };
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  severity: 'low' | 'medium' | 'high';
}

// Severity thresholds
function calculateSeverity(rate: number): 'low' | 'medium' | 'high' {
  if (rate < 5) return 'low';
  if (rate < 15) return 'medium';
  return 'high';
}
```

---

## Feature and Page Association

### The Challenge

**Problem**: Pendo's `featureEvents` source does NOT include `pageId` or `pageUrl` fields

**Impact**: Cannot reliably filter features by page through the Aggregation API

### Available Approaches

#### Approach 1: CSS Selector Analysis (Limited)

```typescript
async function getFeaturesForPage(pageId: string) {
  // Step 1: Get page URL
  const pages = await getPages();
  const targetPage = pages.find(p => p.id === pageId);
  if (!targetPage) return [];

  // Step 2: Get all features
  const allFeatures = await getFeatures();

  // Step 3: Filter features by URL pattern (if available in feature metadata)
  // NOTE: This requires feature.pageUrl or similar field which may not exist
  const pageFeatures = allFeatures.filter(feature =>
    feature.pageUrl?.includes(targetPage.url)
  );

  return pageFeatures;
}
```

**Limitation**: Feature metadata often doesn't include page association

#### Approach 2: Client-Side Page Tagging

**Best Practice**: Tag pages with feature associations during feature creation

```typescript
// In Pendo Visual Designer, add custom metadata to features
{
  "feature": {
    "id": "feature-123",
    "name": "Sign Up Button",
    "selector": "button#signup",
    "customMetadata": {
      "associatedPages": ["page-home", "page-pricing"]
    }
  }
}

// Then filter in your application
const featuresForPage = allFeatures.filter(f =>
  f.customMetadata?.associatedPages?.includes(pageId)
);
```

#### Approach 3: Session Replay Analysis (Advanced)

**Use Pendo Session Replay** to understand which features appear on which pages

**Implementation**: Export session replay data and build page-feature association map

### Recommendation for Your Use Case

Since you need to show "Features targeting this Page", use a hybrid approach:

```typescript
async function getFeaturesTargetingPage(pageId: string, limit: number = 10) {
  console.log(`Fetching features for page ${pageId}`);
  console.log(`WARNING: Cannot filter by page - showing top features by usage`);

  // Step 1: Get all features
  const features = await getFeatures({ limit: 1000 });

  // Step 2: Get feature event counts
  const featureEventCounts = new Map();

  try {
    const aggregationRequest = {
      response: { mimeType: "application/json" },
      request: {
        pipeline: [
          {
            source: { featureEvents: null }
          },
          {
            group: {
              group: ["featureId"],
              fields: {
                clickCount: { sum: "numEvents" }
              }
            }
          },
          {
            sort: ["-clickCount"]
          }
        ],
        requestId: `feature_counts_${Date.now()}`
      }
    };

    const response = await makeAggregationCall(aggregationRequest);

    if (response.results) {
      response.results.forEach(result => {
        featureEventCounts.set(result.featureId, result.clickCount || 0);
      });
    }
  } catch (error) {
    console.warn('Could not fetch feature event counts:', error);
  }

  // Step 3: Combine and sort by usage
  const featuresWithCounts = features.map(feature => ({
    featureId: feature.id,
    name: feature.name,
    eventCount: featureEventCounts.get(feature.id) || 0,
    // Frustration metrics NOT available in featureEvents
    deadClicks: undefined,
    errorClicks: undefined,
    rageClicks: undefined
  }));

  // Step 4: Return top N by usage (not page-specific)
  return featuresWithCounts
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, limit);
}
```

### Guide Targeting and Page Association

**Similar Challenge**: Guide targeting rules are complex and not fully exposed via API

**Guide Activation Rules Include:**
- Page URL patterns
- Element selectors
- Visitor segments
- Account properties
- Custom JavaScript conditions

**API Access**: Limited - guide metadata doesn't expose complete targeting logic

**Recommendation**: Display all guides, not filtered by page

```typescript
async function getGuidesTargetingPage(pageId: string, limit: number = 175) {
  console.log(`Getting guides (note: cannot filter by page accurately)`);

  // Get all guides
  const allGuides = await getGuides({ limit: 1000 });

  // Map to PageGuide format
  const pageGuides = allGuides.map(guide => ({
    guideId: guide.id,
    name: guide.name,
    productArea: undefined,  // Not in standard API
    segment: guide.audience?.[0],
    status: guide.state
  }));

  return pageGuides.slice(0, limit);
}
```

---

## Error Handling and Resilience

### Multi-Layered Error Handling Strategy

#### Layer 1: Request-Level Retries

```typescript
async function makeAggregationCall(
  params: any,
  method: string = 'POST',
  maxRetries: number = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${PENDO_BASE_URL}/api/v1/aggregation`, {
        method,
        headers: this.headers,
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client error: ${response.status} - ${errorText}`);
        }

        // Retry server errors (5xx)
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed, retrying...`);
          await sleep(1000 * attempt); // Exponential backoff
          continue;
        }

        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      return await response.json();

    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed:`, error);
      await sleep(1000 * attempt);
    }
  }
}
```

#### Layer 2: Approach Fallbacks

```typescript
async function getPageAnalytics(pageId: string) {
  const approaches = [
    {
      name: 'Pipeline with spawn/join',
      fn: () => getPageAnalyticsWithPipeline(pageId)
    },
    {
      name: 'Flat format aggregation',
      fn: () => getPageAnalyticsFlat(pageId)
    },
    {
      name: 'Basic page events',
      fn: () => getBasicPageEvents(pageId)
    }
  ];

  for (const approach of approaches) {
    try {
      console.log(`Trying: ${approach.name}`);
      const result = await approach.fn();

      if (result && result.viewedCount !== undefined) {
        console.log(`Success with: ${approach.name}`);
        return result;
      }
    } catch (error) {
      console.warn(`Failed with ${approach.name}:`, error);
      continue;
    }
  }

  // Ultimate fallback: return structure with fallback data
  return {
    viewedCount: 0,
    visitorCount: 0,
    message: 'Using fallback data - API unavailable',
    usingFallback: true
  };
}
```

#### Layer 3: Graceful Degradation

```typescript
async function getComprehensivePageData(pageId: string) {
  const results = {
    metadata: null,
    keyMetrics: null,
    topVisitors: [],
    topAccounts: [],
    eventBreakdown: [],
    frustrationMetrics: null,
    errors: []
  };

  // Fetch metadata (critical)
  try {
    results.metadata = await getPageMetadata(pageId);
  } catch (error) {
    results.errors.push({ section: 'metadata', error: error.message });
    throw error; // Metadata is critical, propagate error
  }

  // Fetch key metrics (important)
  try {
    results.keyMetrics = await getPageKeyMetrics(pageId);
  } catch (error) {
    results.errors.push({ section: 'keyMetrics', error: error.message });
    results.keyMetrics = { viewedCount: 0, visitorCount: 0 };
  }

  // Fetch top visitors (nice-to-have)
  try {
    results.topVisitors = await getTopVisitorsForPage(pageId, 10);
  } catch (error) {
    results.errors.push({ section: 'topVisitors', error: error.message });
    // Continue without top visitors
  }

  // Fetch top accounts (nice-to-have)
  try {
    results.topAccounts = await getTopAccountsForPage(pageId, 10);
  } catch (error) {
    results.errors.push({ section: 'topAccounts', error: error.message });
    // Continue without top accounts
  }

  // Fetch event breakdown (optional)
  try {
    results.eventBreakdown = await getPageEventBreakdown(pageId, 100);
  } catch (error) {
    results.errors.push({ section: 'eventBreakdown', error: error.message });
    // Continue without event breakdown
  }

  // Fetch frustration metrics (optional)
  try {
    results.frustrationMetrics = await getFrustrationMetrics(pageId);
  } catch (error) {
    results.errors.push({ section: 'frustrationMetrics', error: error.message });
    // Continue without frustration metrics
  }

  return results;
}
```

### Error Response Parsing

```typescript
async function parseApiError(response: Response): Promise<string> {
  const errorText = await response.text();

  try {
    const errorData = JSON.parse(errorText);

    // Common Pendo error formats
    if (errorData.message) return errorData.message;
    if (errorData.error) return errorData.error;
    if (errorData.errors) return JSON.stringify(errorData.errors);
    if (errorData.fields) return `Field errors: ${JSON.stringify(errorData.fields)}`;

    return errorText;
  } catch {
    return errorText;
  }
}
```

### Common Error Codes and Handling

```typescript
const ERROR_HANDLERS = {
  400: (error) => {
    // Bad request - check request syntax
    console.error('Invalid request format:', error);
    console.log('Tip: Check filter syntax and field names');
    return 'Request format error';
  },

  401: (error) => {
    // Unauthorized - API key issue
    console.error('Authentication failed:', error);
    console.log('Tip: Verify PENDO_API_KEY is correct');
    return 'Authentication error';
  },

  404: (error) => {
    // Not found - entity doesn't exist
    console.error('Resource not found:', error);
    console.log('Tip: Verify guideId/pageId exists');
    return 'Resource not found';
  },

  422: (error) => {
    // Unprocessable entity - missing required field
    console.error('Validation error:', error);
    console.log('Tip: Check required fields like pipeline, source, etc.');
    return 'Validation error';
  },

  429: (error) => {
    // Rate limit exceeded
    console.error('Rate limit exceeded:', error);
    console.log('Tip: Implement exponential backoff and request throttling');
    return 'Rate limit exceeded';
  },

  500: (error) => {
    // Server error - retry
    console.error('Pendo server error:', error);
    console.log('Tip: Retry with exponential backoff');
    return 'Server error';
  },

  503: (error) => {
    // Service unavailable - retry
    console.error('Pendo service unavailable:', error);
    console.log('Tip: Retry after delay');
    return 'Service unavailable';
  }
};

function handleApiError(statusCode: number, error: any) {
  const handler = ERROR_HANDLERS[statusCode] || ((e) => `Unknown error: ${e}`);
  return handler(error);
}
```

---

## Caching Strategies

### Cache Implementation

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PendoAPICache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache hit: ${key} (age: ${Math.round(age / 1000)}s)`);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    console.log(`Caching: ${key} (TTL: ${ttl / 1000}s)`);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  generateKey(endpoint: string, params: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  clear(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  clearPattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### Cache TTL Guidelines

```typescript
const CACHE_TTLS = {
  // Metadata (changes infrequently)
  guides: 30 * 60 * 1000,        // 30 minutes
  pages: 30 * 60 * 1000,         // 30 minutes
  features: 30 * 60 * 1000,      // 30 minutes

  // Analytics (real-time but expensive)
  realTimeMetrics: 1 * 60 * 1000,      // 1 minute
  hourlyAnalytics: 5 * 60 * 1000,      // 5 minutes
  dailyAnalytics: 15 * 60 * 1000,      // 15 minutes
  weeklyAnalytics: 60 * 60 * 1000,     // 1 hour

  // Visitor/Account data (changes frequently)
  topVisitors: 5 * 60 * 1000,          // 5 minutes
  topAccounts: 5 * 60 * 1000,          // 5 minutes

  // Heavy queries (expensive to compute)
  eventBreakdown: 10 * 60 * 1000,      // 10 minutes
  frustrationMetrics: 15 * 60 * 1000,  // 15 minutes
};
```

### Cache Invalidation Strategies

#### Time-Based Invalidation (Simple)

```typescript
// Automatically handled by TTL in cache.get()
```

#### Event-Based Invalidation (Advanced)

```typescript
class SmartCache extends PendoAPICache {
  invalidateGuide(guideId: string) {
    this.clearPattern(new RegExp(`guide.*${guideId}`));
    console.log(`Invalidated cache for guide: ${guideId}`);
  }

  invalidatePage(pageId: string) {
    this.clearPattern(new RegExp(`page.*${pageId}`));
    console.log(`Invalidated cache for page: ${pageId}`);
  }

  invalidateAll() {
    this.clear();
    console.log('Invalidated entire cache');
  }
}
```

#### User-Triggered Refresh

```typescript
async function getPageDataWithRefresh(pageId: string, forceRefresh: boolean = false) {
  const cacheKey = `page_data_${pageId}`;

  if (forceRefresh) {
    cache.clearPattern(new RegExp(`page.*${pageId}`));
    console.log('Force refresh requested');
  }

  const cached = cache.get(cacheKey);
  if (cached && !forceRefresh) {
    return { ...cached, fromCache: true };
  }

  const data = await fetchPageData(pageId);
  cache.set(cacheKey, data, CACHE_TTLS.dailyAnalytics);

  return { ...data, fromCache: false };
}
```

### Cache Warming (Proactive)

```typescript
async function warmCache() {
  console.log('Starting cache warming...');

  try {
    // Warm most-accessed pages
    const topPages = ['page-home', 'page-dashboard', 'page-settings'];

    for (const pageId of topPages) {
      await getPageAnalytics(pageId);
      console.log(`Warmed cache for ${pageId}`);
      await sleep(100); // Rate limit friendly
    }

    console.log('Cache warming complete');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}

// Run on application startup or scheduled intervals
warmCache();
```

---

## Performance Optimization

### 1. Parallel Requests

**Pattern**: Fetch independent data in parallel

```typescript
async function getPageDetailsOptimized(pageId: string) {
  console.log(`Fetching page details in parallel for ${pageId}`);

  const [
    metadata,
    keyMetrics,
    topVisitors,
    topAccounts,
    eventBreakdown
  ] = await Promise.allSettled([
    getPageMetadata(pageId),
    getPageKeyMetrics(pageId),
    getTopVisitorsForPage(pageId, 10),
    getTopAccountsForPage(pageId, 10),
    getPageEventBreakdown(pageId, 100)
  ]);

  return {
    metadata: metadata.status === 'fulfilled' ? metadata.value : null,
    keyMetrics: keyMetrics.status === 'fulfilled' ? keyMetrics.value : null,
    topVisitors: topVisitors.status === 'fulfilled' ? topVisitors.value : [],
    topAccounts: topAccounts.status === 'fulfilled' ? topAccounts.value : [],
    eventBreakdown: eventBreakdown.status === 'fulfilled' ? eventBreakdown.value : []
  };
}
```

### 2. Request Batching

**Pattern**: Combine multiple entity requests

```typescript
async function getMultiplePageMetrics(pageIds: string[]) {
  console.log(`Batch fetching metrics for ${pageIds.length} pages`);

  // Build filter for multiple pages
  const pageFilter = pageIds.map(id => `pageId == "${id}"`).join(' || ');

  const request = {
    source: { pageEvents: null },
    filter: `(${pageFilter})`,
    requestId: `batch_pages_${Date.now()}`
  };

  const response = await makeAggregationCall(request);

  // Group results by pageId
  const metricsByPage = new Map();

  for (const result of response.results || []) {
    const pageId = result.pageId;
    if (!metricsByPage.has(pageId)) {
      metricsByPage.set(pageId, {
        viewedCount: 0,
        visitorIds: new Set()
      });
    }

    const metrics = metricsByPage.get(pageId);
    metrics.viewedCount++;
    if (result.visitorId) {
      metrics.visitorIds.add(result.visitorId);
    }
  }

  // Convert to final format
  return Array.from(metricsByPage.entries()).map(([pageId, metrics]) => ({
    pageId,
    viewedCount: metrics.viewedCount,
    visitorCount: metrics.visitorIds.size
  }));
}
```

### 3. Pagination for Large Datasets

```typescript
async function getPageEventBreakdownPaginated(
  pageId: string,
  limit: number = 100,
  offset: number = 0
) {
  const request = {
    response: { mimeType: "application/json" },
    request: {
      pipeline: [
        {
          source: {
            pageEvents: null,
            timeSeries: {
              first: Date.now() - (30 * 24 * 60 * 60 * 1000),
              count: 30,
              period: "dayRange"
            }
          }
        },
        {
          filter: `pageId == "${pageId}"`
        },
        {
          sort: ["-day"]
        },
        {
          skip: offset  // Skip first N results
        },
        {
          limit: limit  // Take next N results
        }
      ],
      requestId: `page_breakdown_${pageId}_${offset}_${Date.now()}`
    }
  };

  const response = await makeAggregationCall(request);

  return {
    data: response.results || [],
    offset,
    limit,
    hasMore: response.results && response.results.length === limit
  };
}
```

### 4. Query Optimization

**Best Practices:**

1. **Filter Early**: Apply filters before grouping/aggregation
2. **Select Only Needed Fields**: Don't fetch unused metadata
3. **Limit Time Ranges**: Use smallest time range that meets requirements
4. **Use Appropriate Periods**: Don't use hourRange when dayRange suffices

**Example:**

```typescript
// BAD: Fetches everything then filters
{
  source: { pageEvents: null, timeSeries: { count: 365, period: "dayRange" } },
  // No filter applied
  group: { group: ["pageId"], fields: { views: { count: "*" } } }
}

// GOOD: Filters early and limits range
{
  source: { pageEvents: null, timeSeries: { count: 30, period: "dayRange" } },
  filter: `pageId == "${pageId}"`,
  group: { group: ["day"], fields: { views: { count: "*" } } }
}
```

### 5. Memory Management

```typescript
async function processLargeEventSet(pageId: string) {
  const BATCH_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  const results = [];

  while (hasMore) {
    const batch = await getPageEventBreakdownPaginated(pageId, BATCH_SIZE, offset);

    // Process batch immediately (don't accumulate in memory)
    const processed = batch.data.map(processEventRow);
    results.push(...processed);

    // Check if more data available
    hasMore = batch.hasMore;
    offset += BATCH_SIZE;

    // Rate limit protection
    await sleep(100);

    console.log(`Processed ${offset} events...`);
  }

  return results;
}
```

---

## UI/UX Best Practices

### 1. Loading States

```typescript
interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

// Progressive loading pattern
async function loadPageDetailsWithProgress(pageId: string, setProgress: (state: LoadingState) => void) {
  const steps = [
    { name: 'metadata', fn: () => getPageMetadata(pageId), weight: 10 },
    { name: 'keyMetrics', fn: () => getPageKeyMetrics(pageId), weight: 20 },
    { name: 'topVisitors', fn: () => getTopVisitorsForPage(pageId, 10), weight: 25 },
    { name: 'topAccounts', fn: () => getTopAccountsForPage(pageId, 10), weight: 25 },
    { name: 'events', fn: () => getPageEventBreakdown(pageId, 100), weight: 20 }
  ];

  let completedWeight = 0;
  const results = {};

  for (const step of steps) {
    setProgress({
      isLoading: true,
      progress: (completedWeight / 100) * 100,
      message: `Loading ${step.name}...`
    });

    try {
      results[step.name] = await step.fn();
      completedWeight += step.weight;
    } catch (error) {
      console.error(`Failed to load ${step.name}:`, error);
      results[step.name] = null;
    }
  }

  setProgress({ isLoading: false, progress: 100 });
  return results;
}
```

### 2. Error State Display

```typescript
interface ErrorDisplay {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  severity: 'warning' | 'error';
}

function createErrorDisplay(error: any, context: string): ErrorDisplay {
  // API errors
  if (error.status === 401) {
    return {
      title: 'Authentication Error',
      message: 'Your Pendo API key is invalid or expired.',
      action: {
        label: 'Check Settings',
        onClick: () => navigateTo('/settings')
      },
      severity: 'error'
    };
  }

  if (error.status === 429) {
    return {
      title: 'Rate Limit Exceeded',
      message: 'Too many requests. Please wait a moment and try again.',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      },
      severity: 'warning'
    };
  }

  // Network errors
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to Pendo API. Check your internet connection.',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      },
      severity: 'error'
    };
  }

  // Generic error
  return {
    title: 'Unable to Load Data',
    message: `There was a problem loading ${context}. ${error.message || 'Please try again.'}`,
    action: {
      label: 'Retry',
      onClick: () => window.location.reload()
    },
    severity: 'error'
  };
}
```

### 3. Empty States

```typescript
interface EmptyState {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function getEmptyState(dataType: string): EmptyState {
  const emptyStates = {
    topVisitors: {
      icon: 'users',
      title: 'No Visitor Data',
      description: 'This page has not been visited by identified users yet.',
      action: {
        label: 'Learn about visitor identification',
        onClick: () => openDocs('/visitor-identification')
      }
    },

    frustrationMetrics: {
      icon: 'activity',
      title: 'No Frustration Data',
      description: 'No frustration events detected for this page.',
      action: undefined
    },

    eventBreakdown: {
      icon: 'calendar',
      title: 'No Events in Date Range',
      description: 'Try selecting a different date range or check your Pendo installation.',
      action: {
        label: 'Change Date Range',
        onClick: () => openDatePicker()
      }
    }
  };

  return emptyStates[dataType] || {
    icon: 'info',
    title: 'No Data Available',
    description: 'Data for this section is not available.',
    action: undefined
  };
}
```

### 4. Data Quality Indicators

```typescript
interface DataQualityIndicator {
  level: 'complete' | 'partial' | 'fallback' | 'none';
  message: string;
  affectedSections: string[];
}

function assessDataQuality(results: any): DataQualityIndicator {
  const sections = {
    metadata: !!results.metadata,
    keyMetrics: !!results.keyMetrics && results.keyMetrics.viewedCount > 0,
    topVisitors: results.topVisitors?.length > 0,
    topAccounts: results.topAccounts?.length > 0,
    eventBreakdown: results.eventBreakdown?.length > 0,
    frustrationMetrics: !!results.frustrationMetrics
  };

  const available = Object.values(sections).filter(Boolean).length;
  const total = Object.keys(sections).length;
  const percentage = (available / total) * 100;

  if (percentage === 100) {
    return {
      level: 'complete',
      message: 'All data loaded successfully',
      affectedSections: []
    };
  }

  if (percentage >= 50) {
    const missing = Object.entries(sections)
      .filter(([_, available]) => !available)
      .map(([section]) => section);

    return {
      level: 'partial',
      message: `Some data unavailable: ${missing.join(', ')}`,
      affectedSections: missing
    };
  }

  if (results.usingFallback) {
    return {
      level: 'fallback',
      message: 'Displaying fallback data - API unavailable',
      affectedSections: Object.keys(sections)
    };
  }

  return {
    level: 'none',
    message: 'Unable to load data',
    affectedSections: Object.keys(sections)
  };
}
```

### 5. Refresh Strategies

```typescript
interface RefreshStrategy {
  auto: boolean;
  interval?: number;
  manual: boolean;
}

const REFRESH_STRATEGIES = {
  realtime: {
    auto: true,
    interval: 30 * 1000,  // 30 seconds
    manual: true
  },

  dashboard: {
    auto: true,
    interval: 5 * 60 * 1000,  // 5 minutes
    manual: true
  },

  report: {
    auto: false,
    manual: true
  }
};

function setupAutoRefresh(
  refreshFn: () => Promise<void>,
  strategy: RefreshStrategy
) {
  if (!strategy.auto || !strategy.interval) return null;

  console.log(`Auto-refresh enabled: every ${strategy.interval / 1000}s`);

  return setInterval(async () => {
    try {
      console.log('Auto-refreshing...');
      await refreshFn();
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, strategy.interval);
}

// Usage
const refreshInterval = setupAutoRefresh(
  () => getPageDetails(pageId),
  REFRESH_STRATEGIES.dashboard
);

// Cleanup on unmount
return () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
};
```

---

## Security and Rate Limiting

### 1. API Key Management

**Never hardcode API keys:**

```typescript
// BAD
const API_KEY = 'f4acdb4c-038c-4de1-a88b-ab90423037bf.us';

// GOOD
const API_KEY = process.env.PENDO_API_KEY || import.meta.env.VITE_PENDO_API_KEY;

if (!API_KEY) {
  throw new Error('PENDO_API_KEY environment variable is required');
}
```

**Environment Configuration:**

```bash
# .env file (never commit)
VITE_PENDO_API_KEY=f4acdb4c-038c-4de1-a88b-ab90423037bf.us
VITE_PENDO_BASE_URL=https://app.pendo.io
```

**Gitignore:**

```gitignore
.env
.env.local
.env.production
*.key
```

### 2. Rate Limiting

**Pendo API Limits** (typical):
- Requests per minute: ~60 (exact limits not documented)
- Concurrent requests: ~10
- Data volume: Large queries may timeout

**Implementation:**

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running: number = 0;
  private readonly maxConcurrent: number = 5;
  private readonly minInterval: number = 1000; // 1 second between requests
  private lastRequest: number = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithDelay(fn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async executeWithDelay<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minInterval) {
      const delay = this.minInterval - timeSinceLastRequest;
      await sleep(delay);
    }

    this.lastRequest = Date.now();
    return await fn();
  }

  private async processQueue() {
    if (this.queue.length === 0 || this.running >= this.maxConcurrent) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.running++;

    try {
      await task();
    } finally {
      this.running--;
      this.processQueue();
    }
  }
}

// Usage
const rateLimiter = new RateLimiter();

async function makeRateLimitedRequest(params: any) {
  return rateLimiter.execute(() => makeAggregationCall(params));
}
```

### 3. Request Deduplication

**Prevent duplicate requests:**

```typescript
class RequestDeduplicator {
  private inFlight = new Map<string, Promise<any>>();

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if request is already in flight
    if (this.inFlight.has(key)) {
      console.log(`Deduplicating request: ${key}`);
      return this.inFlight.get(key) as Promise<T>;
    }

    // Execute request
    const promise = fn().finally(() => {
      // Remove from in-flight map when complete
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }
}

// Usage
const deduplicator = new RequestDeduplicator();

async function getPageAnalytics(pageId: string) {
  return deduplicator.execute(
    `page_analytics_${pageId}`,
    () => fetchPageAnalytics(pageId)
  );
}
```

### 4. Secure Data Handling

**Don't log sensitive data:**

```typescript
function logRequest(endpoint: string, params: any) {
  // Remove sensitive fields before logging
  const safeParams = { ...params };

  // Redact visitor emails, account names, etc.
  if (safeParams.filter) {
    safeParams.filter = safeParams.filter.replace(
      /email == "[^"]+"/g,
      'email == "[REDACTED]"'
    );
  }

  console.log(`Request to ${endpoint}:`, JSON.stringify(safeParams, null, 2));
}
```

**Sanitize error messages:**

```typescript
function sanitizeError(error: any): string {
  const message = error.message || String(error);

  // Remove potential sensitive data from error messages
  return message
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\b\d{16}\b/g, '[CARD]');
}
```

---

## Testing and Validation

### 1. Unit Tests for API Methods

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('PendoAPIClient', () => {
  describe('getTopVisitorsForPage', () => {
    it('should return top visitors with email and view count', async () => {
      const mockResponse = {
        results: [
          { visitorId: 'v1', email: 'user1@example.com', viewCount: 50 },
          { visitorId: 'v2', email: 'user2@example.com', viewCount: 30 }
        ]
      };

      vi.spyOn(pendoAPI, 'makeAggregationCall').mockResolvedValue(mockResponse);

      const visitors = await pendoAPI.getTopVisitorsForPage('page-123', 10);

      expect(visitors).toHaveLength(2);
      expect(visitors[0].visitorId).toBe('v1');
      expect(visitors[0].viewCount).toBe(50);
    });

    it('should handle empty results gracefully', async () => {
      vi.spyOn(pendoAPI, 'makeAggregationCall').mockResolvedValue({ results: [] });

      const visitors = await pendoAPI.getTopVisitorsForPage('page-123', 10);

      expect(visitors).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      vi.spyOn(pendoAPI, 'makeAggregationCall').mockRejectedValue(
        new Error('API Error')
      );

      const visitors = await pendoAPI.getTopVisitorsForPage('page-123', 10);

      expect(visitors).toEqual([]);
    });
  });
});
```

### 2. Integration Tests

```typescript
describe('Pendo API Integration', () => {
  it('should fetch real guide data', async () => {
    const guides = await pendoAPI.getGuides({ limit: 5 });

    expect(guides.length).toBeGreaterThan(0);
    expect(guides[0]).toHaveProperty('id');
    expect(guides[0]).toHaveProperty('name');
    expect(guides[0]).toHaveProperty('state');
  });

  it('should fetch guide analytics', async () => {
    const guides = await pendoAPI.getGuides({ limit: 1 });
    const guideId = guides[0].id;

    const analytics = await pendoAPI.getGuideAnalytics(guideId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    });

    expect(analytics).toHaveProperty('viewedCount');
    expect(analytics).toHaveProperty('completedCount');
    expect(analytics).toHaveProperty('dailyStats');
  });
});
```

### 3. Validation Functions

```typescript
function validateAggregationRequest(request: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required fields
  if (request.response && !request.request) {
    errors.push('Pipeline format requires request.request field');
  }

  if (request.request?.pipeline) {
    const pipeline = request.request.pipeline;

    // Validate pipeline structure
    if (!Array.isArray(pipeline)) {
      errors.push('Pipeline must be an array');
    }

    // Check for source (unless using spawn)
    const hasSource = pipeline.some(step => step.source);
    const hasSpawn = pipeline.some(step => step.spawn);

    if (!hasSource && !hasSpawn) {
      errors.push('Pipeline must include source or spawn operator');
    }

    // Validate filter syntax
    const filterSteps = pipeline.filter(step => step.filter);
    for (const step of filterSteps) {
      if (typeof step.filter !== 'string') {
        errors.push('Filter must be a string');
      }
    }
  }

  // Validate flat format
  if (!request.request && !request.response) {
    if (!request.source) {
      errors.push('Flat format requires source field');
    }
  }

  // Check for requestId
  if (!request.requestId && !request.request?.requestId) {
    errors.push('requestId is recommended for debugging');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 4. Mock Data for Development

```typescript
export const MOCK_PAGE_ANALYTICS = {
  viewedCount: 12345,
  visitorCount: 3456,
  topVisitors: [
    { visitorId: 'v1', email: 'user1@example.com', viewCount: 50 },
    { visitorId: 'v2', email: 'user2@example.com', viewCount: 45 },
    { visitorId: 'v3', email: 'user3@example.com', viewCount: 40 }
  ],
  topAccounts: [
    { accountId: 'a1', name: 'Acme Corp', viewCount: 150 },
    { accountId: 'a2', name: 'TechCo', viewCount: 120 }
  ],
  frustrationMetrics: {
    total: 234,
    rate: 5.2,
    breakdown: {
      uTurns: { count: 100, percentage: 42.7 },
      deadClicks: { count: 80, percentage: 34.2 },
      errorClicks: { count: 34, percentage: 14.5 },
      rageClicks: { count: 20, percentage: 8.5 }
    }
  }
};

// Use in development
const useMockData = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true';

async function getPageAnalytics(pageId: string) {
  if (useMockData) {
    console.log('Using mock data');
    return MOCK_PAGE_ANALYTICS;
  }

  return fetchRealPageAnalytics(pageId);
}
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Assuming List Endpoints Return Analytics

**Problem:**
```typescript
// This does NOT work
const guides = await fetch('/api/v1/guide');
console.log(guides[0].viewedCount); // undefined!
```

**Solution:**
```typescript
// Get metadata from list endpoint
const guides = await fetch('/api/v1/guide');

// Get analytics from aggregation endpoint
const analytics = await fetch('/api/v1/aggregation', {
  method: 'POST',
  body: JSON.stringify({
    source: { guideEvents: null },
    filter: `guideId == "${guides[0].id}"`,
    requestId: 'guide_analytics'
  })
});
```

### Pitfall 2: Using pageEvents for Frustration Metrics

**Problem:**
```typescript
// This DOES NOT include frustration metrics
const request = {
  source: { pageEvents: null },
  // ...
};
// Response will NOT have uTurnCount, deadClickCount, etc.
```

**Solution:**
```typescript
// Use events source instead
const request = {
  source: { events: { eventClass: ["web"] } },
  // ...
};
// Response WILL include frustration metrics
```

### Pitfall 3: Filtering Features by Page

**Problem:**
```typescript
// This filter DOES NOT work - pageId not in featureEvents
const request = {
  source: { featureEvents: null },
  filter: `pageId == "${pageId}"`, // pageId field doesn't exist
};
```

**Solution:**
```typescript
// Accept limitation and show all features, sorted by usage
const request = {
  source: { featureEvents: null },
  // No page filter - show top features by usage
};
```

### Pitfall 4: Missing TimeSeries for Event Sources

**Problem:**
```typescript
// This fails with "no period specified for time series source"
const request = {
  source: { guideEvents: null },
  filter: `guideId == "${guideId}"`
};
```

**Solution:**
```typescript
// Always include timeSeries for event sources when you need time-based data
const request = {
  source: {
    guideEvents: null,
    timeSeries: {
      first: Date.now() - (30 * 24 * 60 * 60 * 1000),
      count: 30,
      period: "dayRange"
    }
  },
  filter: `guideId == "${guideId}"`
};

// OR use without timeSeries for totals only
const request = {
  source: { guideEvents: null },
  filter: `guideId == "${guideId}"`,
  // Pendo will return all matching events without time bucketing
};
```

### Pitfall 5: Incorrect Filter Syntax

**Problem:**
```typescript
// These filters are WRONG
filter: `guideId = "${id}"`        // Use == not =
filter: `guideId == ${id}`         // Missing quotes around value
filter: `guideId == \"${id}\"`     // Wrong escaping in template literal
```

**Solution:**
```typescript
// Correct filter syntax
filter: `guideId == "${id}"`                           // Basic
filter: `guideId == "${id}" && day > ${timestamp}`    // Multiple conditions
filter: `accountId in ["a1", "a2", "a3"]`            // In clause
```

### Pitfall 6: Not Handling Undefined Metrics

**Problem:**
```typescript
// This crashes when frustrationMetrics are not available
const totalClicks = event.rageClicks + event.deadClicks; // TypeError!
```

**Solution:**
```typescript
// Always provide defaults
const totalClicks = (event.rageClicks || 0) + (event.deadClicks || 0);

// Or check existence
if (event.rageClicks !== undefined) {
  // Use event.rageClicks
}
```

### Pitfall 7: Cache Stampede

**Problem:**
```typescript
// Multiple components request same data simultaneously
componentA: await getPageAnalytics('page-123');
componentB: await getPageAnalytics('page-123');
componentC: await getPageAnalytics('page-123');
// Results in 3 identical API calls
```

**Solution:**
```typescript
// Use request deduplication (see Security section)
const deduplicator = new RequestDeduplicator();

async function getPageAnalytics(pageId: string) {
  return deduplicator.execute(
    `page_analytics_${pageId}`,
    () => fetchPageAnalytics(pageId)
  );
}
```

---

## Production Checklist

### Pre-Launch

- [ ] **API Key Security**
  - [ ] API keys in environment variables (not hardcoded)
  - [ ] .env files in .gitignore
  - [ ] Different keys for dev/staging/production

- [ ] **Error Handling**
  - [ ] Multi-approach fallback strategy implemented
  - [ ] Graceful degradation for all API calls
  - [ ] User-friendly error messages
  - [ ] Error logging/monitoring setup

- [ ] **Caching**
  - [ ] Cache implementation with appropriate TTLs
  - [ ] Cache invalidation strategy
  - [ ] Memory management for large datasets

- [ ] **Performance**
  - [ ] Parallel requests for independent data
  - [ ] Request batching where applicable
  - [ ] Pagination for large datasets
  - [ ] Rate limiting implemented

- [ ] **Testing**
  - [ ] Unit tests for API methods
  - [ ] Integration tests with real API
  - [ ] Error scenario tests
  - [ ] Load testing for concurrent requests

### Launch

- [ ] **Monitoring**
  - [ ] API error rate tracking
  - [ ] Response time monitoring
  - [ ] Cache hit rate monitoring
  - [ ] User-facing error alerts

- [ ] **Documentation**
  - [ ] API usage documented for team
  - [ ] Common patterns shared
  - [ ] Troubleshooting guide available

### Post-Launch

- [ ] **Optimization**
  - [ ] Review slow queries
  - [ ] Optimize cache TTLs based on usage
  - [ ] Implement batch requests where beneficial
  - [ ] Review and optimize filter patterns

- [ ] **Maintenance**
  - [ ] Regular API health checks
  - [ ] Update to new Pendo API features
  - [ ] Review and clean up unused code
  - [ ] Update documentation

---

## Additional Resources

### Official Documentation

- **Pendo Developers**: https://developers.pendo.io
- **ETL Examples**: https://github.com/pendo-io/pendo-ETL-API-calls
- **Integration Keys**: https://app.pendo.io/admin/integrationkeys
- **Support**: support@pendo.io

### Community Resources

- Pendo Community Forum
- Stack Overflow (tag: pendo)
- GitHub Issues

### Internal Documentation

- [Pendo API Expert Skill](/.claude/skills/pendo-api-expert.md)
- [Pendo API Mapping](./PENDO_API_MAPPING.md)
- [Pendo Aggregation API Fix](./PENDO_AGGREGATION_API_FIX.md)

---

## Version History

- **2025-01-30**: Initial comprehensive guide
  - Covered all major API patterns
  - Included frustration metrics implementation
  - Added production best practices
  - Documented common pitfalls

---

**This document is based on production implementation experience with the Pendo Aggregation API and official Pendo documentation. For the most up-to-date information, always refer to Pendo's official documentation.**
