# Pendo API Mapping for Page Details Dashboard

This document maps each UI section to the Pendo API sources and fields needed to fetch real data.

## Current Implementation Status

✅ **Implemented (Real Data)**:
- Key Metrics (viewedCount, visitorCount from pageEvents aggregation)
- Daily Traffic Chart (time series from pageEvents)

🔄 **Needs Implementation (Currently Placeholder)**:
- Top Visitors (10)
- Top Accounts (10)
- Features targeting this Page
- Guides targeting this Page
- Event Breakdown table
- Adoption/Acquisition metrics
- Frustration Metrics

---

## Section 1: Top Visitors (10)

**UI Location**: Page Details > Top Visitors card

**Data Displayed**:
- Visitor email/ID
- Number of page views per visitor

**Pendo API Strategy**:

### Step 1: Get page events grouped by visitor
```typescript
// Request format
{
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        source: {
          pageEvents: null,
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
        identified: "visitorId"  // Only identified visitors
      },
      {
        group: {
          group: ["visitorId"],
          fields: {
            viewCount: { count: "*" }
          }
        }
      },
      {
        sort: ["-viewCount"]  // Sort descending by view count
      }
    ],
    requestId: `top_visitors_${Date.now()}`
  }
}
```

**Returns**: Array of `{ visitorId, viewCount }`

### Step 2: Enrich with visitor metadata (email, name)
```typescript
// Use spawn to combine pageEvents with visitors source
{
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        spawn: [
          // Query 1: Get view counts
          [
            {
              source: { pageEvents: null }
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
                fields: { viewCount: { count: "*" } }
              }
            }
          ],
          // Query 2: Get visitor details
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
    requestId: `top_visitors_enriched_${Date.now()}`
  }
}
```

**Returns**: Array of `{ visitorId, email, name, viewCount }` sorted by views

**Implementation**: `pendo-api.ts::getTopVisitorsForPage(pageId, limit = 10)`

---

## Section 2: Top Accounts (10)

**UI Location**: Page Details > Top Accounts card

**Data Displayed**:
- Account name/ID
- Number of page views per account

**Pendo API Strategy**:

Similar to Top Visitors but group by accountId:

```typescript
{
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        spawn: [
          // Query 1: Get view counts by account
          [
            {
              source: { pageEvents: null }
            },
            {
              filter: `pageId == "${pageId}"`
            },
            {
              identified: "accountId"
            },
            {
              group: {
                group: ["accountId"],
                fields: { viewCount: { count: "*" } }
              }
            }
          ],
          // Query 2: Get account details
          [
            {
              source: { accounts: null }
            },
            {
              identified: "accountId"
            },
            {
              select: {
                accountId: "accountId",
                name: "metadata.agent.name",
                arr: "metadata.custom.arrannuallyrecurringrevenue",
                planlevel: "metadata.custom.planlevel"
              }
            }
          ]
        ]
      },
      {
        join: {
          fields: ["accountId"],
          width: 2
        }
      },
      {
        sort: ["-viewCount"]
      }
    ],
    requestId: `top_accounts_${Date.now()}`
  }
}
```

**Returns**: Array of `{ accountId, name, arr, planlevel, viewCount }`

**Implementation**: `pendo-api.ts::getTopAccountsForPage(pageId, limit = 10)`

---

## Section 3: Features targeting this Page (7)

**UI Location**: Page Details > Features targeting this Page table

**Data Displayed**:
- Feature name
- Number of events (clicks)
- Dead clicks
- Error clicks
- Rage clicks

**Pendo API Strategy**:

### Challenge:
Pendo doesn't directly associate features with pages. Features are tracked independently via `featureEvents`.

### Possible Approach:
1. Get all features from `/api/v1/feature` list endpoint
2. For each feature, check if it targets the current page URL (via feature config)
3. Fetch click counts and frustration metrics for those features

**OR** use `featureEvents` source with page filtering if available:

```typescript
{
  source: {
    featureEvents: null,
    timeSeries: {
      first: startTime,
      count: 30,
      period: "dayRange"
    }
  },
  filter: `pageUrl contains "${pageUrl}"`,  // If pageUrl is available in featureEvents
  requestId: `features_on_page_${Date.now()}`
}
```

**Note**: Frustration metrics (dead clicks, error clicks, rage clicks) may require additional `events` source queries or may be part of featureEvents response.

**Implementation**: `pendo-api.ts::getFeaturesTargetingPage(pageId, limit = 10)`

---

## Section 4: Guides targeting this Page (175)

**UI Location**: Page Details > Guides targeting this Page table

**Data Displayed**:
- Guide name
- Product Area
- Segment
- Guide Status (Public/Disabled/Draft)

**Pendo API Strategy**:

### Step 1: Get all guides
```typescript
const guides = await fetch('/api/v1/guide', {
  headers: { 'X-Pendo-Integration-Key': API_KEY }
});
```

### Step 2: Filter guides that target this page
Check guide configuration for page targeting rules. This may require:
- Checking guide activation rules
- Looking at guide.rules or guide.audience fields
- Matching against pageId or pageUrl

### Step 3: Enrich with guide activity
```typescript
// For each guide, get view counts from guideEvents
{
  source: { guideEvents: null },
  filter: `guideId == "${guideId}" && pageId == "${pageId}"`,  // If pageId is tracked in guideEvents
  requestId: `guide_${guideId}_on_page`
}
```

**Implementation**: `pendo-api.ts::getGuidesTargetingPage(pageId, limit = 175)`

---

## Section 5: Event Breakdown (5000)

**UI Location**: Page Details > Event breakdown table

**Data Displayed**:
- Visitor ID
- Account ID
- Date
- Total Views
- U-turns
- Dead clicks
- Error clicks
- Rage clicks
- Page parameter
- Server name
- Browser Name
- Browser Version

**Pendo API Strategy**:

Use `events` source with detailed visitor/account metadata:

```typescript
{
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        source: {
          events: {
            eventClass: ["web"]
          },
          timeSeries: {
            first: startTime,
            count: 30,
            period: "dayRange"
          }
        }
      },
      {
        filter: `pageId == "${pageId}"`  // Filter to current page
      },
      {
        identified: "visitorId"
      },
      {
        select: {
          visitorId: "visitorId",
          accountId: "accountId",
          day: "day",
          totalViews: "numEvents",
          uTurns: "uTurns",  // May need separate calculation
          deadClicks: "deadClicks",
          errorClicks: "errorClicks",
          rageClicks: "rageClicks",
          pageParameter: "pageParameter",
          serverName: "serverName",
          browserName: "browserName",
          browserVersion: "browserVersion"
        }
      },
      {
        sort: ["-day", "-totalViews"]
      }
    ],
    requestId: `event_breakdown_${Date.now()}`
  }
}
```

**Alternative**: Combine multiple sources using `spawn`:
```typescript
{
  spawn: [
    // Get page events with visitor/account
    [pageEvents source],
    // Get visitor metadata (browser, OS)
    [visitors source],
    // Join them
  ]
}
```

**Note**: Frustration metrics (U-turns, dead/error/rage clicks) may require:
- Additional event types in `events` source
- Calculated fields based on event sequences
- May be available as separate fields in event objects

**Implementation**: `pendo-api.ts::getPageEventBreakdown(pageId, limit = 5000)`

---

## Section 6: Frustration Metrics

**UI Location**: Metrics dropdown & Event breakdown table

**Metrics Needed**:
- Dead clicks (click on non-interactive element)
- Error clicks (click that triggers error)
- Rage clicks (rapid repeated clicks)
- U-turns (quick navigation away)

**Pendo API Strategy**:

These may be available as:
1. Event types in `events` source
2. Calculated fields in aggregation responses
3. Part of `pageEvents` with specific action types

**Research needed**: Check Pendo `events` source documentation for available event types and frustration metric fields.

---

## Section 7: Adoption/Acquisition Metrics

**UI Location**: Key metrics section (Pendo screenshot shows)

**Metrics Needed**:
- Visitor adoption: 98% (-0.3%)
- Account adoption: 99.1% (+0.5%)
- Visitor acquisition: 1,725 (+6.6%)
- Account acquisition: 427 (-1.6%)

**Pendo API Strategy**:

### Visitor Adoption
- Total unique visitors to this page / Total subscription visitors
- Requires: `pageEvents` count + `visitors` source total count

### Account Adoption
- Total unique accounts viewing this page / Total subscription accounts
- Requires: `pageEvents` count + `accounts` source total count

### Visitor Acquisition
- New visitors (first visit to this page in date range)
- Requires: `pageEvents` with first visit logic or `visitors` metadata filtering

### Account Acquisition
- New accounts (first visit to this page in date range)
- Requires: Similar to visitor acquisition but for accounts

**Implementation**: Part of `getPageAnalytics()` calculation

---

## Implementation Order (Recommended)

1. ✅ **Top Visitors** - High value, straightforward API call
2. ✅ **Top Accounts** - Similar to visitors, reuse pattern
3. **Event Breakdown** - Shows all visitor activity with browser details
4. **Features targeting Page** - May need research on page-feature association
5. **Guides targeting Page** - Similar complexity to features
6. **Frustration Metrics** - Research needed on event types
7. **Adoption/Acquisition** - Calculations based on existing data

---

## TypeScript Interfaces Needed

```typescript
// Top Visitors
interface PageVisitor {
  visitorId: string;
  email?: string;
  name?: string;
  viewCount: number;
  lastVisit?: string;
}

// Top Accounts
interface PageAccount {
  accountId: string;
  name?: string;
  arr?: number;
  planlevel?: string;
  viewCount: number;
}

// Features on Page
interface PageFeature {
  featureId: string;
  name: string;
  eventCount: number;
  deadClicks: number;
  errorClicks: number;
  rageClicks: number;
}

// Guides on Page
interface PageGuide {
  guideId: string;
  name: string;
  productArea?: string;
  segment?: string;
  status: 'published' | 'draft' | 'archived' | 'disabled';
}

// Event Breakdown Row
interface PageEventRow {
  visitorId: string;
  accountId?: string;
  date: string;
  totalViews: number;
  uTurns: number;
  deadClicks: number;
  errorClicks: number;
  rageClicks: number;
  pageParameter?: string;
  serverName?: string;
  browserName?: string;
  browserVersion?: string;
}

// Adoption Metrics
interface AdoptionMetrics {
  visitorAdoption: {
    rate: number;
    change: number;
    current: number;
    total: number;
  };
  accountAdoption: {
    rate: number;
    change: number;
    current: number;
    total: number;
  };
  visitorAcquisition: {
    count: number;
    change: number;
  };
  accountAcquisition: {
    count: number;
    change: number;
  };
}
```

---

## Next Steps

1. Start with **Top Visitors** implementation - highest impact, clearest API path
2. Follow with **Top Accounts** - reuse visitor pattern
3. Research frustration metrics availability in Pendo events
4. Implement remaining sections based on API research findings
