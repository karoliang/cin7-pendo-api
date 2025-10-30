# Pendo API Expert Skill

## Overview
You are now a Pendo API expert. This skill provides comprehensive knowledge of Pendo's v1 REST Aggregation API, data sources, authentication, and best practices for building analytics dashboards.

## Core API Information

### Base URL
```
https://app.pendo.io
```

### Authentication
All requests require these headers:
```
Content-Type: application/json
X-Pendo-Integration-Key: <YOUR_INTEGRATION_KEY>
```

Integration keys are managed at: `https://app.pendo.io/admin/integrationkeys`

### Primary Endpoints

#### 1. List Endpoints (Metadata Only - NO Analytics)
```
GET /api/v1/guide          # Guide metadata (name, state, createdAt, etc.)
GET /api/v1/page           # Page metadata (url, title, etc.)
GET /api/v1/feature        # Feature metadata
GET /api/v1/report         # Report metadata
```

**CRITICAL**: List endpoints return NO analytics data. Fields like `viewedCount`, `visitorCount`, `completedCount` are always `undefined` or `0`.

#### 2. Aggregation API (Real Analytics Data)
```
POST /api/v1/aggregation   # All analytics queries
```

This is the PRIMARY endpoint for fetching real analytics data.

## API Request Formats

Pendo supports TWO formats for aggregation requests:

### Format 1: Flat Format (Simple, Currently Used)

**Use when:** Simple filtering and totals

```json
{
  "source": {
    "guideEvents": null,
    "timeSeries": {
      "first": 1234567890000,
      "count": 30,
      "period": "dayRange"
    }
  },
  "filter": "guideId == \"abc123\"",
  "requestId": "unique_id_123"
}
```

### Format 2: Pipeline Format (Advanced, More Powerful)

**Use when:** Need field selection, grouping, joining, or complex operations

```json
{
  "response": {
    "mimeType": "application/json"
  },
  "request": {
    "pipeline": [
      {
        "source": {
          "visitors": null
        }
      },
      {
        "identified": "visitorId"
      },
      {
        "select": {
          "visitorId": "visitorId",
          "email": "metadata.auto.email",
          "firstvisit": "metadata.auto.firstvisit"
        }
      },
      {
        "sort": ["email"]
      }
    ],
    "requestId": "visitor_list_123"
  }
}
```

## Available Data Sources

### Event Sources (Time-Series Data)

#### 1. guideEvents
**Purpose:** Guide analytics (views, completions, shown count)

**Fields Available:**
- `type`: "guideActivity"
- `action`: "view", "advanced", "completed", "dismissed"
- `guideId`: Guide identifier
- `visitorId`: Visitor who saw the guide
- `accountId`: Account associated with visitor
- `day`: Timestamp (when using timeSeries)

**Example - Get Guide Totals:**
```json
{
  "source": { "guideEvents": null },
  "filter": "guideId == \"guide-123\"",
  "requestId": "totals"
}
```

**Example - Get Guide Time Series:**
```json
{
  "source": {
    "guideEvents": null,
    "timeSeries": {
      "first": 1704067200000,
      "count": 30,
      "period": "dayRange"
    }
  },
  "filter": "guideId == \"guide-123\"",
  "requestId": "timeseries"
}
```

#### 2. pageEvents
**Purpose:** Page view analytics

**Fields Available:**
- `pageId`: Page identifier
- `visitorId`: Visitor who viewed the page
- `accountId`: Account associated with visitor
- `day`: Timestamp (when using timeSeries)

**Example - Get Page Totals:**
```json
{
  "source": { "pageEvents": null },
  "filter": "pageId == \"page-123\"",
  "requestId": "page_totals"
}
```

**Processing Pattern:**
Count unique `visitorId` values for visitor count, count total events for view count.

#### 3. featureEvents
**Purpose:** Feature click/interaction tracking

**Fields Available:**
- `featureId`: Feature identifier
- `visitorId`: Visitor who clicked
- `accountId`: Account
- `numEvents`: Number of clicks
- `numMinutes`: Time spent
- `day`: Timestamp

**Example:**
```json
{
  "source": {
    "featureEvents": null,
    "timeSeries": {
      "period": "dayRange",
      "first": "now()",
      "count": -30
    }
  }
}
```

#### 4. events
**Purpose:** All application events (web, iOS, Android)

**Fields Available:**
- `eventClass`: ["web", "ios", "android"]
- `numEvents`: Total events
- `numMinutes`: Time spent
- `visitorId`: Visitor
- `accountId`: Account
- `day`: Timestamp

**Example:**
```json
{
  "request": {
    "pipeline": [
      {
        "source": {
          "events": {
            "eventClass": ["web", "ios"]
          },
          "timeSeries": {
            "period": "dayRange",
            "first": "now()",
            "count": -30
          }
        }
      },
      {
        "identified": "visitorId"
      },
      {
        "select": {
          "numEvents": "numEvents",
          "numMinutes": "numMinutes",
          "accountId": "accountId",
          "visitorId": "visitorId",
          "day": "day"
        }
      },
      {
        "group": {
          "group": ["visitorId", "accountId", "day"],
          "fields": {
            "totalTime": { "sum": "numMinutes" },
            "totalEvents": { "sum": "numEvents" }
          }
        }
      }
    ]
  }
}
```

### Entity Sources (Metadata & Properties)

#### 5. visitors
**Purpose:** Visitor-level metadata and properties

**Auto Metadata Fields:**
- `visitorId`: Unique identifier
- `metadata.auto.firstvisit`: First visit timestamp
- `metadata.auto.lastvisit`: Last visit timestamp
- `metadata.auto.lastbrowsername`: Browser (Chrome, Firefox, Safari, etc.)
- `metadata.auto.lastbrowserversion`: Browser version
- `metadata.auto.lastoperatingsystem`: OS (Windows, macOS, Linux, iOS, Android)
- `metadata.auto.lastservername`: Server/domain
- `metadata.auto.lastuseragent`: Full user agent string
- `metadata.auto.lastupdated`: Last update timestamp
- `metadata.auto.accountid`: Associated account ID
- `metadata.auto.email`: Email address (if identified)

**Agent Metadata Fields:**
- `metadata.agent.name`: Visitor name (set via Pendo agent)
- `metadata.agent.role`: User role
- Any custom fields set via agent

**Example - Get All Visitors:**
```json
{
  "response": { "mimeType": "application/json" },
  "request": {
    "pipeline": [
      {
        "source": { "visitors": null }
      },
      {
        "identified": "visitorId"
      },
      {
        "select": {
          "visitorId": "visitorId",
          "email": "metadata.auto.email",
          "name": "metadata.agent.name",
          "firstvisit": "metadata.auto.firstvisit",
          "lastvisit": "metadata.auto.lastvisit",
          "browser": "metadata.auto.lastbrowsername",
          "os": "metadata.auto.lastoperatingsystem",
          "accountid": "metadata.auto.accountid"
        }
      }
    ]
  }
}
```

**Note:** Visitors are subscription-wide, not scoped to specific apps.

#### 6. accounts
**Purpose:** Account-level metadata and properties

**Auto Metadata Fields:**
- `accountId`: Unique identifier
- `metadata.auto.firstvisit`: First visit timestamp
- `metadata.auto.lastvisit`: Last visit timestamp
- `metadata.auto.lastupdated`: Last update timestamp

**Agent/Custom Metadata Fields:**
- `metadata.agent.name`: Account/company name
- `metadata.custom.arrannuallyrecurringrevenue`: ARR value
- `metadata.custom.customersuccessmanager`: CSM name
- `metadata.custom.industry`: Industry/vertical
- `metadata.custom.planlevel`: Subscription plan (Free, Pro, Enterprise, etc.)
- `metadata.custom.renewaldate`: Renewal date
- `metadata.custom.totallicenses`: License count
- Any other custom fields

**Example - Get All Accounts:**
```json
{
  "response": { "mimeType": "application/json" },
  "request": {
    "pipeline": [
      {
        "source": { "accounts": null }
      },
      {
        "identified": "accountId"
      },
      {
        "select": {
          "accountId": "accountId",
          "name": "metadata.agent.name",
          "firstvisit": "metadata.auto.firstvisit",
          "lastvisit": "metadata.auto.lastvisit",
          "arr": "metadata.custom.arrannuallyrecurringrevenue",
          "csm": "metadata.custom.customersuccessmanager",
          "industry": "metadata.custom.industry",
          "planlevel": "metadata.custom.planlevel"
        }
      }
    ]
  }
}
```

**Note:** Accounts are subscription-wide, not scoped to specific apps.

#### 7. pollsSeenEver
**Purpose:** NPS and survey response data

**Fields Available:**
- `guideId`: Guide containing the poll
- `pollId`: Specific poll ID
- `visitorId`: Respondent
- `accountId`: Account
- `response`: Answer (0-10 for NPS, text for qualitative)
- `time`: Response timestamp

**Example - Get NPS Responses:**
```json
{
  "request": {
    "pipeline": [
      {
        "source": {
          "pollsSeenEver": {
            "guideId": "guide-123",
            "pollId": "poll-456"
          }
        }
      },
      {
        "identified": "visitorId"
      },
      {
        "select": {
          "visitorId": "visitorId",
          "accountId": "accountId",
          "response": "response",
          "time": "time"
        }
      }
    ]
  }
}
```

**Note:** NPS guides have TWO poll IDs (quantitative 0-10 and qualitative feedback). Use `spawn` and `join` to combine them.

## Pipeline Operators

### 1. source
Defines the data source and optional parameters.

### 2. identified
Filters to only identified visitors/accounts (non-anonymous).

**Example:**
```json
{ "identified": "visitorId" }
```

### 3. select
Choose specific fields and rename them.

**Example:**
```json
{
  "select": {
    "visitor": "visitorId",
    "email": "metadata.auto.email",
    "totalViews": "numEvents"
  }
}
```

### 4. filter
Apply conditions (can also use root-level `filter` field).

**Operators:** `==`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `contains`

**Example:**
```json
{ "filter": "accountId == \"acc-123\" && day > 1704067200000" }
```

### 5. group
Aggregate data by fields.

**Example:**
```json
{
  "group": {
    "group": ["accountId", "day"],
    "fields": {
      "totalViews": { "sum": "numEvents" },
      "avgTime": { "avg": "numMinutes" },
      "maxTime": { "max": "numMinutes" },
      "minTime": { "min": "numMinutes" },
      "count": { "count": "*" }
    }
  }
}
```

### 6. sort
Order results.

**Example:**
```json
{ "sort": ["accountId", "-totalViews"] }
```
Use `-` prefix for descending order.

### 7. join
Combine multiple pipelines on matching fields.

**Example:**
```json
{
  "join": {
    "fields": ["visitorId"],
    "width": 2
  }
}
```

### 8. spawn
Run multiple pipelines in parallel and combine results.

**Example:**
```json
{
  "spawn": [
    [
      { "source": { "pollsSeenEver": { "guideId": "g1", "pollId": "p1" } } },
      { "select": { "visitorId": "visitorId", "nps": "response" } }
    ],
    [
      { "source": { "pollsSeenEver": { "guideId": "g1", "pollId": "p2" } } },
      { "select": { "visitorId": "visitorId", "feedback": "response" } }
    ]
  ]
}
```

### 9. eval
Evaluate expressions and transform data.

**Example:**
```json
{
  "eval": {
    "hashedId": "hash(visitorId)",
    "dayOfWeek": "dayOfWeek(day)"
  }
}
```

### 10. cat
Concatenate (used in spawn to flatten results).

## Best Practices

### 1. Always Use Both Formats
- **Flat format** for simple totals and time series
- **Pipeline format** for complex queries with visitors/accounts

### 2. Request IDs
Always include a unique `requestId` for debugging:
```json
"requestId": "page_analytics_${Date.now()}"
```

### 3. Time Series
When using `timeSeries`:
- `first`: Unix timestamp in milliseconds
- `count`: Number of periods (negative for past, positive for future)
- `period`: "dayRange", "hourRange", "weekRange", "monthRange"

**Example - Last 30 days:**
```javascript
const endTime = Date.now();
const startTime = endTime - (30 * 24 * 60 * 60 * 1000);

{
  timeSeries: {
    first: startTime,
    count: 30,
    period: "dayRange"
  }
}
```

### 4. Filters
Use proper filter syntax:
```
guideId == "abc"           // Equals
guideId != "abc"           // Not equals
day > 1704067200000        // Greater than
day >= 1704067200000       // Greater than or equal
day < 1704067200000        // Less than
accountId in ["a1", "a2"]  // In list
```

### 5. Error Handling
Common errors:
- `no period specified for time series source` - Add `timeSeries` to source
- `404 Not Found` - Guide/page/feature doesn't exist
- `400 Bad Request` - Check filter syntax and field names

### 6. Performance
- Keep `timeSeries.count` ≤ 30 for daily data
- Use pagination for large visitor/account lists
- Run ETL processes daily, not bulk historical

## Common Implementation Patterns

### Pattern 1: Get Guide Analytics
```typescript
async function getGuideAnalytics(guideId: string) {
  // 1. Get totals
  const totalsRequest = {
    source: { guideEvents: null },
    filter: `guideId == "${guideId}"`,
    requestId: `guide_totals_${Date.now()}`
  };

  const totalsResponse = await fetch('https://app.pendo.io/api/v1/aggregation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Pendo-Integration-Key': API_KEY
    },
    body: JSON.stringify(totalsRequest)
  });

  const totals = await totalsResponse.json();

  // Count events
  let viewedCount = 0;
  let completedCount = 0;

  for (const result of totals.results) {
    if (result.action === 'view' || result.action === 'advanced') {
      viewedCount++;
    }
    if (result.action === 'completed') {
      completedCount++;
    }
  }

  // 2. Get time series
  const endTime = Date.now();
  const startTime = endTime - (30 * 24 * 60 * 60 * 1000);

  const timeSeriesRequest = {
    source: {
      guideEvents: null,
      timeSeries: {
        first: startTime,
        count: 30,
        period: "dayRange"
      }
    },
    filter: `guideId == "${guideId}"`,
    requestId: `guide_timeseries_${Date.now()}`
  };

  // ... fetch and process

  return { viewedCount, completedCount, timeSeriesData };
}
```

### Pattern 2: Get Page Analytics
```typescript
async function getPageAnalytics(pageId: string) {
  const totalsRequest = {
    source: { pageEvents: null },
    filter: `pageId == "${pageId}"`,
    requestId: `page_totals_${Date.now()}`
  };

  const response = await fetch('https://app.pendo.io/api/v1/aggregation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Pendo-Integration-Key': API_KEY
    },
    body: JSON.stringify(totalsRequest)
  });

  const data = await response.json();

  // Count unique visitors
  const uniqueVisitors = new Set();
  let viewedCount = 0;

  for (const result of data.results) {
    viewedCount++;
    if (result.visitorId) {
      uniqueVisitors.add(result.visitorId);
    }
  }

  return {
    viewedCount,
    visitorCount: uniqueVisitors.size
  };
}
```

### Pattern 3: Get Top Visitors for a Page
```typescript
async function getTopVisitorsForPage(pageId: string, limit: number = 10) {
  const request = {
    response: { mimeType: "application/json" },
    request: {
      pipeline: [
        // Step 1: Get page events
        {
          source: { pageEvents: null },
          filter: `pageId == "${pageId}"`
        },
        // Step 2: Only identified visitors
        {
          identified: "visitorId"
        },
        // Step 3: Group by visitor and count views
        {
          group: {
            group: ["visitorId"],
            fields: {
              viewCount: { count: "*" }
            }
          }
        },
        // Step 4: Sort by view count descending
        {
          sort: ["-viewCount"]
        }
      ],
      requestId: `top_visitors_${Date.now()}`
    }
  };

  // Fetch and return top N visitors
}
```

### Pattern 4: Combine Visitor Data with Event Data
```typescript
async function getVisitorEngagement(limit: number = 100) {
  const request = {
    response: { mimeType: "application/json" },
    request: {
      pipeline: [
        // Use spawn to run two queries in parallel
        {
          spawn: [
            // Query 1: Get visitor metadata
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
                  name: "metadata.agent.name",
                  accountId: "metadata.auto.accountid"
                }
              }
            ],
            // Query 2: Get event counts per visitor
            [
              {
                source: {
                  events: { eventClass: ["web"] },
                  timeSeries: {
                    first: "now()",
                    count: -30,
                    period: "dayRange"
                  }
                }
              },
              {
                group: {
                  group: ["visitorId"],
                  fields: {
                    totalEvents: { sum: "numEvents" },
                    totalMinutes: { sum: "numMinutes" }
                  }
                }
              }
            ]
          ]
        },
        // Join on visitorId
        {
          join: {
            fields: ["visitorId"],
            width: 2
          }
        },
        // Sort by engagement
        {
          sort: ["-totalEvents"]
        }
      ],
      requestId: `visitor_engagement_${Date.now()}`
    }
  };

  // Fetch and return
}
```

## TypeScript Type Definitions

```typescript
// Basic types
interface Guide {
  id: string;
  name: string;
  state: 'published' | 'draft' | 'archived' | '_pendingReview_' | 'public' | 'staging' | 'disabled';
  viewedCount: number;
  completedCount: number;
  lastShownCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface Page {
  id: string;
  url: string;
  title?: string;
  viewedCount: number;
  visitorCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Visitor {
  visitorId: string;
  email?: string;
  name?: string;
  accountId?: string;
  firstvisit: string;
  lastvisit: string;
  browser: string;
  os: string;
}

interface Account {
  accountId: string;
  name?: string;
  arr?: number;
  planlevel?: string;
  industry?: string;
  firstvisit: string;
  lastvisit: string;
}

// Aggregation request types
interface FlatAggregationRequest {
  source: {
    guideEvents?: null;
    pageEvents?: null;
    featureEvents?: null;
    timeSeries?: {
      first: number;
      count: number;
      period: "dayRange" | "hourRange" | "weekRange" | "monthRange";
    };
  };
  filter?: string;
  requestId: string;
}

interface PipelineAggregationRequest {
  response: {
    mimeType: "application/json";
  };
  request: {
    pipeline: PipelineStep[];
    requestId: string;
  };
}

type PipelineStep =
  | { source: any }
  | { identified: string }
  | { select: Record<string, string> }
  | { filter: string }
  | { group: { group: string[]; fields: Record<string, any> } }
  | { sort: string[] }
  | { join: { fields: string[]; width: number } }
  | { spawn: PipelineStep[][] }
  | { eval: Record<string, string> }
  | { cat: null };
```

## Real-World Use Cases

### Use Case 1: Build "Top Visitors" List (Like Pendo Dashboard)
1. Fetch page events for specific page
2. Group by visitorId and count views
3. Join with visitors source to get email/name
4. Sort by view count descending
5. Display top 10 with avatars and view counts

### Use Case 2: Build "Top Accounts" List
1. Fetch page events or guide events
2. Group by accountId and aggregate metrics
3. Join with accounts source to get company name, ARR, plan
4. Sort by engagement or ARR
5. Display with company info

### Use Case 3: Feature Adoption Dashboard
1. Fetch all features from `/api/v1/feature`
2. For each feature, query featureEvents aggregation
3. Calculate adoption rate (visitors who used / total visitors)
4. Show trending features, most/least used

### Use Case 4: NPS Dashboard
1. Get guide with NPS poll
2. Fetch pollsSeenEver for both quantitative and qualitative polls
3. Join responses by visitorId
4. Calculate NPS score: (% promoters - % detractors)
5. Display score, distribution, and qualitative feedback

### Use Case 5: User Journey Analysis
1. Fetch events source with time series
2. Group by visitorId and day
3. Track page sequences and feature clicks
4. Identify common paths to conversion
5. Visualize funnel drop-off points

## Debugging Tips

### 1. Log All Requests
```typescript
console.log('📊 Aggregation Request:', JSON.stringify(request, null, 2));
```

### 2. Check Response Structure
```typescript
const response = await fetch(...);
const data = await response.json();
console.log('📦 Response:', JSON.stringify(data, null, 2));

if (!data.results) {
  console.warn('⚠️ No results array in response');
}
```

### 3. Validate Filters
Test filters with small datasets first:
```typescript
// Bad: Might timeout
filter: "day > 0"

// Good: Specific time range
filter: `guideId == "${id}" && day > ${startTime} && day < ${endTime}`
```

### 4. Check API Limits
- Pendo may rate-limit aggressive queries
- Keep time ranges reasonable (≤ 90 days)
- Cache responses when possible

## Resources

- Official API Docs: https://engageapi.pendo.io/
- ETL Examples: https://github.com/pendo-io/pendo-ETL-API-calls
- Integration Keys: https://app.pendo.io/admin/integrationkeys

---

**You are now a Pendo API expert!** Use this knowledge to:
- Fetch real analytics data instead of mock data
- Implement visitor and account lists
- Build comprehensive dashboards
- Troubleshoot API issues
- Optimize aggregation queries
