# Pendo API Quick Reference

Quick copy-paste examples for common Pendo API tasks.

## Authentication
```typescript
const headers = {
  'Content-Type': 'application/json',
  'X-Pendo-Integration-Key': process.env.VITE_PENDO_API_KEY
};
```

## Get Guide Totals (Views & Completions)
```typescript
const request = {
  source: { guideEvents: null },
  filter: `guideId == "${guideId}"`,
  requestId: `totals_${Date.now()}`
};

const response = await fetch('https://app.pendo.io/api/v1/aggregation', {
  method: 'POST',
  headers,
  body: JSON.stringify(request)
});

const data = await response.json();
let viewedCount = 0;
let completedCount = 0;

for (const result of data.results || []) {
  if (result.action === 'view' || result.action === 'advanced') {
    viewedCount++;
  }
  if (result.action === 'completed') {
    completedCount++;
  }
}
```

## Get Page Views & Unique Visitors
```typescript
const request = {
  source: { pageEvents: null },
  filter: `pageId == "${pageId}"`,
  requestId: `page_${Date.now()}`
};

const response = await fetch('https://app.pendo.io/api/v1/aggregation', {
  method: 'POST',
  headers,
  body: JSON.stringify(request)
});

const data = await response.json();
const uniqueVisitors = new Set();
let viewCount = 0;

for (const result of data.results || []) {
  viewCount++;
  if (result.visitorId) {
    uniqueVisitors.add(result.visitorId);
  }
}

return { viewCount, visitorCount: uniqueVisitors.size };
```

## Get Time Series (Last 30 Days)
```typescript
const endTime = Date.now();
const startTime = endTime - (30 * 24 * 60 * 60 * 1000);

const request = {
  source: {
    guideEvents: null, // or pageEvents, featureEvents
    timeSeries: {
      first: startTime,
      count: 30,
      period: "dayRange"
    }
  },
  filter: `guideId == "${guideId}"`,
  requestId: `timeseries_${Date.now()}`
};
```

## Get All Visitors (Pipeline Format)
```typescript
const request = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
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
          firstvisit: "metadata.auto.firstvisit",
          lastvisit: "metadata.auto.lastvisit",
          accountId: "metadata.auto.accountid"
        }
      },
      {
        sort: ["-lastvisit"]
      }
    ],
    requestId: `visitors_${Date.now()}`
  }
};
```

## Get All Accounts (Pipeline Format)
```typescript
const request = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
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
          planlevel: "metadata.custom.planlevel",
          lastvisit: "metadata.auto.lastvisit"
        }
      },
      {
        sort: ["-lastvisit"]
      }
    ],
    requestId: `accounts_${Date.now()}`
  }
};
```

## Get Top Visitors for a Page
```typescript
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
        identified: "visitorId"
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
        sort: ["-viewCount"]
      }
    ],
    requestId: `top_visitors_${Date.now()}`
  }
};
```

## Common Filters
```typescript
// Single ID
`guideId == "${id}"`

// Date range
`day >= ${startTime} && day <= ${endTime}`

// Multiple conditions
`guideId == "${id}" && day >= ${startTime}`

// In list
`accountId in ["acc1", "acc2", "acc3"]`
```

## Time Periods
```typescript
// Last 24 hours
{
  first: Date.now() - (24 * 60 * 60 * 1000),
  count: 24,
  period: "hourRange"
}

// Last 7 days
{
  first: Date.now() - (7 * 24 * 60 * 60 * 1000),
  count: 7,
  period: "dayRange"
}

// Last 30 days
{
  first: Date.now() - (30 * 24 * 60 * 60 * 1000),
  count: 30,
  period: "dayRange"
}

// Last 12 weeks
{
  first: Date.now() - (12 * 7 * 24 * 60 * 60 * 1000),
  count: 12,
  period: "weekRange"
}
```

## Error Handling Template
```typescript
try {
  const response = await fetch('https://app.pendo.io/api/v1/aggregation', {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Pendo API Error:', error);
    throw new Error(`Pendo API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();

  if (!data.results) {
    console.warn('⚠️ No results returned');
    return { /* fallback values */ };
  }

  // Process results
  return processResults(data.results);

} catch (error) {
  console.error('❌ Failed to fetch from Pendo:', error);
  throw error;
}
```
