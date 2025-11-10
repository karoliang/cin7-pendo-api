# Pendo API Complete Guide

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [API Overview](#api-overview)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Aggregation API](#aggregation-api)
5. [Page API](#page-api)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Implementation Examples](#implementation-examples)
9. [Troubleshooting](#troubleshooting)

---

## Executive Summary

This guide consolidates all Pendo API knowledge from the cin7-pendo-api project, including analysis of timeout issues, data limitations, and implementation best practices.

**Key Findings:**
- Pendo processes events with significant delays (hourly processing, up to 15-minute delays)
- Aggregation API has strict time limits (5 minutes) and size limits (4GB response)
- Maximum recommended time range is 30 days for optimal performance
- Data freshness issues affect queries including "today"

**Primary Issues Addressed:**
- API timeouts and performance optimization
- Data processing delays and empty results
- Field mapping errors (name vs title)
- Pagination and rate limiting

---

## API Overview

### Base Endpoints

**Production:** `https://app.pendo.io/api/v1/`
**Aggregations:** `https://app.pendo.io/api/v1/aggregation`

**Authentication:**
```http
X-Pendo-Integration-Key: YOUR_INTEGRATION_KEY
Content-Type: application/json
```

### Rate Limits
- **Standard API:** 100 requests/minute
- **Aggregation API:** 10 requests/minute
- **Timeout:** 5 minutes for aggregation calls
- **Response Size:** 4GB maximum

---

## Common Issues & Solutions

### 1. Empty Results (200 OK with empty arrays)

**Problem:** API returns successful status but empty data arrays.

**Root Causes:**
1. **Data Processing Delays:** Events processed hourly at the top of the hour
2. **Page Not Tagged:** Page exists but has no tagging rules configured
3. **Time Range Issues:** Query includes today before data is processed
4. **Page ID Mismatch:** Incorrect pageId in query

**Solutions:**
```typescript
// Exclude today to avoid processing delays
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(23, 59, 59, 999);

const aggregationRequest = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [{
      source: {
        pageEvents: { pageId: pageId },
        timeSeries: {
          first: yesterday.getTime(),  // Start from yesterday
          count: -30,                 // Maximum recommended
          period: "dayRange"
        }
      }
    }],
    requestId: `safe_query_${Date.now()}`
  }
};
```

### 2. API Timeouts

**Problem:** Requests timeout after 30 seconds or 5 minutes.

**Solutions:**
```typescript
// Use bulkExpand instead of spawn/join
const optimizedRequest = {
  pipeline: [
    {
      source: {
        pageEvents: { pageId: pageId },
        timeSeries: { first: "now()", count: -30, period: "dayRange" }
      }
    },
    {
      bulkExpand: {
        account: { account: "accountId" },
        visitor: { visitor: "visitorId" }
      }
    },
    {
      aggregate: {
        views: { sum: "numEvents" },
        uniqueVisitors: { uniqueCount: "visitorId" }
      },
      by: ["day"]
    }
  ]
};

// Implement retry logic with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.status >= 500) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 3. Field Mapping Errors

**Problem:** Page names showing as "Untitled" instead of actual names.

**Root Cause:** API returns `name` field, but code looks for `title` field.

**Solution:**
```typescript
// Correct type definition
export interface Page {
  id: string;
  name: string;        // ✅ Use 'name' instead of 'title'
  url?: string;
  viewedCount: number;
  visitorCount: number;
  createdAt: string;
  updatedAt: string;
  group?: {
    id: string;
    name: string;
  };
}

// Correct transform function
private transformPage = (page: any): Page => ({
  id: page.id || '',
  name: page.name || 'Untitled',  // ✅ Map from page.name
  url: extractUrlFromRules(page.rules),
  viewedCount: page.viewedCount || 0,
  visitorCount: page.visitorCount || 0,
  createdAt: page.createdAt ? new Date(page.createdAt).toISOString() : new Date().toISOString(),
  updatedAt: page.lastUpdatedAt ? new Date(page.lastUpdatedAt).toISOString() : new Date().toISOString(),
  group: page.group,
});

// Helper to extract URL from rules
private extractUrlFromRules = (rules: any[]): string => {
  if (!rules || rules.length === 0) return '';
  return rules[0]?.designerHint || rules[0]?.parsedRule || '';
};
```

---

## Aggregation API

### Time Series Configuration

**Correct Pattern:**
```typescript
timeSeries: {
  first: "now()",     // Expression evaluated to current timestamp
  count: -30,         // Negative count looks backward (max recommended)
  period: "dayRange"  // Daily granularity
}
```

**Alternatives:**
```typescript
// Start from specific timestamp
const yesterday = Date.now() - (24 * 60 * 60 * 1000);
timeSeries: {
  first: yesterday,
  count: -30,
  period: "dayRange"
}

// Weekly granularity
timeSeries: {
  first: "now()",
  count: -12,  // 12 weeks back
  period: "weekRange"
}
```

### Pipeline Best Practices

**Use bulkExpand for enrichment:**
```typescript
const pipeline = [
  // 1. Get page events
  {
    source: {
      pageEvents: { pageId: pageId },
      timeSeries: { first: "now()", count: -30, period: "dayRange" }
    }
  },

  // 2. Enrich with account data
  {
    bulkExpand: {
      account: { account: "accountId" }
    }
  },

  // 3. Enrich with visitor data
  {
    bulkExpand: {
      visitor: { visitor: "visitorId" }
    }
  },

  // 4. Aggregate metrics
  {
    aggregate: {
      views: { sum: "numEvents" },
      uniqueVisitors: { uniqueCount: "visitorId" },
      timeOnPage: { sum: "numMinutes" }
    },
    by: ["day", "accountId"]
  },

  // 5. Sort results
  {
    sort: ["-day", "-views"]
  },

  // 6. Limit results
  {
    limit: 1000
  }
];
```

### Common Aggregation Patterns

**Page Totals:**
```typescript
const pageTotalsRequest = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [{
      source: {
        pageEvents: { pageId: pageId },
        timeSeries: { first: "now()", count: -30, period: "dayRange" }
      }
    }, {
      aggregate: {
        totalViews: { sum: "numEvents" },
        uniqueVisitors: { uniqueCount: "visitorId" },
        totalTimeOnPage: { sum: "numMinutes" }
      }
    }],
    requestId: `page_totals_${Date.now()}`
  }
};
```

**Time Series Data:**
```typescript
const timeSeriesRequest = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [{
      source: {
        pageEvents: { pageId: pageId },
        timeSeries: { first: "now()", count: -30, period: "dayRange" }
      }
    }, {
      identified: "visitorId"  // Filter anonymous visitors
    }, {
      group: {
        group: ["day"],
        fields: {
          views: { count: "visitorId" },
          uniqueVisitors: { uniqueCount: "visitorId" },
          timeOnPage: { sum: "numMinutes" }
        }
      }
    }, {
      sort: ["day"]
    }],
    requestId: `time_series_${Date.now()}`
  }
};
```

**Top Visitors:**
```typescript
const topVisitorsRequest = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [{
      source: {
        pageEvents: { pageId: pageId },
        timeSeries: { first: "now()", count: -30, period: "dayRange" }
      }
    }, {
      bulkExpand: {
        visitor: { visitor: "visitorId" }
      }
    }, {
      aggregate: {
        pageViews: { sum: "numEvents" },
        timeOnPage: { sum: "numMinutes" }
      },
      by: ["visitorId"]
    }, {
      sort: ["-pageViews"]
    }, {
      limit: 10
    }],
    requestId: `top_visitors_${Date.now()}`
  }
};
```

---

## Page API

### Response Structure

```typescript
interface PageResponse {
  id: string;
  name: string;                    // Page name/title
  kind: "Page";
  appId: number;
  appIds: number[];
  group?: {                        // Page group/folder
    id: string;
    name: string;
    description: string;
    color: string;
  };
  rules: Array<{                   // URL matching rules
    rule: string;                  // Regex pattern
    designerHint?: string;         // Example URL
    parsedRule?: string;           // Parsed regex
  }>;
  createdAt: number;               // Unix timestamp (ms)
  lastUpdatedAt: number;           // Unix timestamp (ms)
  createdByUser: string;
  lastUpdatedByUser: string;
  isSuggested: boolean;
  suggestedName?: string;
}
```

### Getting Page Information

**Single Page:**
```typescript
async getPage(pageId: string): Promise<PageResponse> {
  const response = await fetch(`${this.baseURL}/page/${pageId}`, {
    headers: {
      'x-pendo-integration-key': this.integrationKey,
      'content-type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  return response.json();
}
```

**All Pages:**
```typescript
async getAllPages(limit: number = 100): Promise<PageResponse[]> {
  const url = `${this.baseURL}/page?limit=${limit}&sort=name`;
  const response = await fetch(url, {
    headers: {
      'x-pendo-integration-key': this.integrationKey,
      'content-type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pages: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
```

### URL Pattern Extraction

```typescript
private extractUrlPattern(page: PageResponse): string {
  if (!page.rules || page.rules.length === 0) {
    return '';
  }

  // Prefer designerHint for display
  if (page.rules[0].designerHint) {
    return page.rules[0].designerHint;
  }

  // Fall back to parsedRule
  if (page.rules[0].parsedRule) {
    return page.rules[0].parsedRule;
  }

  // Finally use raw rule
  return page.rules[0].rule;
}
```

---

## Error Handling

### Comprehensive Error Handler

```typescript
class PendoAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PendoAPIError';
  }
}

async function handlePendoResponse(response: Response): Promise<any> {
  if (!response.ok) {
    const errorText = await response.text();

    switch (response.status) {
      case 401:
        throw new PendoAPIError(
          'Invalid API key or authentication failed',
          response.status,
          'AUTHENTICATION_ERROR'
        );

      case 403:
        throw new PendoAPIError(
          'Access forbidden - check API permissions',
          response.status,
          'AUTHORIZATION_ERROR'
        );

      case 404:
        throw new PendoAPIError(
          'Resource not found',
          response.status,
          'NOT_FOUND'
        );

      case 429:
        throw new PendoAPIError(
          'Rate limit exceeded - please wait before retrying',
          response.status,
          'RATE_LIMIT_ERROR'
        );

      case 500:
      case 502:
      case 503:
      case 504:
        throw new PendoAPIError(
          'Pendo service unavailable - please try again later',
          response.status,
          'SERVICE_ERROR'
        );

      default:
        throw new PendoAPIError(
          `Pendo API error: ${errorText}`,
          response.status,
          'UNKNOWN_ERROR'
        );
    }
  }

  return response.json();
}
```

### Timeout Handling

```typescript
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new PendoAPIError(
        `Request timeout after ${timeoutMs}ms`,
        undefined,
        'TIMEOUT_ERROR'
      );
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Performance Optimization

**Reduce Query Scope:**
- Use minimum time range needed (max 30 days recommended)
- Exclude today to avoid data processing delays
- Use specific pageId instead of null when possible
- Apply filters early in the pipeline

**Efficient Data Fetching:**
```typescript
// ❌ Inefficient: Gets all data then filters
const allData = await fetchPageEvents(null);
const filteredData = allData.filter(page => page.pageId === targetId);

// ✅ Efficient: Filter at source
const filteredData = await fetchPageEvents({ pageId: targetId });
```

### 2. Data Freshness

**Handle Processing Delays:**
```typescript
function getDataWithBuffer(date: Date): Date {
  const buffered = new Date(date);
  buffered.setDate(buffered.getDate() - 1);  // Go back one day
  buffered.setHours(23, 59, 59, 999);       // End of day
  return buffered;
}
```

### 3. Caching Strategy

```typescript
class PendoAPIClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  async getCachedData(key: string, fetcher: () => Promise<any>): Promise<any> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }
}
```

### 4. Rate Limiting

```typescript
class RateLimiter {
  private tokens = 100;
  private lastRefill = Date.now();
  private readonly refillRate = 100 / 60000; // 100 tokens per minute

  async waitForToken(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for refill
    const waitTime = Math.ceil((1 - this.tokens) / this.refillRate);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.tokens--;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(100, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}
```

---

## Implementation Examples

### Complete API Client

```typescript
export class PendoAPIClient {
  private baseURL = 'https://app.pendo.io/api/v1';
  private aggregationURL = 'https://app.pendo.io/api/v1/aggregation';
  private rateLimiter = new RateLimiter();

  constructor(
    private integrationKey: string,
    private timeout: number = 30000
  ) {}

  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.rateLimiter.waitForToken();

    const url = `${this.baseURL}${endpoint}`;
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'x-pendo-integration-key': this.integrationKey,
        'content-type': 'application/json',
        ...options.headers,
      },
    }, this.timeout);

    return handlePendoResponse(response);
  }

  async makeAggregationCall(request: any): Promise<any> {
    await this.rateLimiter.waitForToken();

    const response = await fetchWithTimeout(
      this.aggregationURL,
      {
        method: 'POST',
        headers: {
          'x-pendo-integration-key': this.integrationKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(request)
      },
      300000 // 5 minutes for aggregation
    );

    return handlePendoResponse(response);
  }

  // Page methods
  async getPage(pageId: string): Promise<PageResponse> {
    return this.makeRequest<PageResponse>(`/page/${pageId}`);
  }

  async getAllPages(limit: number = 100): Promise<PageResponse[]> {
    return this.makeRequest<PageResponse[]>(`/page?limit=${limit}&sort=name`);
  }

  // Aggregation methods
  async getPageTotals(pageId: string, daysBack: number = 30): Promise<PageTotals> {
    const request = {
      response: { mimeType: "application/json" },
      request: {
        pipeline: [{
          source: {
            pageEvents: { pageId },
            timeSeries: {
              first: "now()",
              count: -Math.min(daysBack, 30), // Cap at 30 days
              period: "dayRange"
            }
          }
        }, {
          aggregate: {
            totalViews: { sum: "numEvents" },
            uniqueVisitors: { uniqueCount: "visitorId" },
            totalTimeOnPage: { sum: "numMinutes" }
          }
        }],
        requestId: `page_totals_${pageId}_${Date.now()}`
      }
    };

    const response = await this.makeAggregationCall(request);

    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      return {
        viewedCount: result.totalViews || 0,
        visitorCount: result.uniqueVisitors || 0,
        uniqueVisitors: result.uniqueVisitors || 0,
        totalTimeOnPage: result.totalTimeOnPage || 0
      };
    }

    return {
      viewedCount: 0,
      visitorCount: 0,
      uniqueVisitors: 0,
      totalTimeOnPage: 0
    };
  }
}
```

### React Hook Integration

```typescript
import { useState, useEffect } from 'react';

export function usePendoPage(pageId: string) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      try {
        setLoading(true);
        setError(null);

        const pendoClient = new PendoAPIClient(process.env.REACT_APP_PENDO_API_KEY!);

        // Get page metadata
        const pageData = await pendoClient.getPage(pageId);

        // Get analytics data
        const analytics = await pendoClient.getPageTotals(pageId, 30);

        setPage({
          id: pageData.id,
          name: pageData.name,
          url: extractUrlFromRules(pageData.rules),
          viewedCount: analytics.viewedCount,
          visitorCount: analytics.visitorCount,
          uniqueVisitors: analytics.uniqueVisitors,
          createdAt: new Date(pageData.createdAt).toISOString(),
          updatedAt: new Date(pageData.lastUpdatedAt).toISOString(),
          group: pageData.group
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch page data');
      } finally {
        setLoading(false);
      }
    }

    if (pageId) {
      fetchPage();
    }
  }, [pageId]);

  return { page, loading, error };
}
```

---

## Troubleshooting

### Diagnostic Steps

**1. Verify API Connectivity:**
```bash
curl -X GET "https://app.pendo.io/api/v1/page?limit=1" \
  -H "x-pendo-integration-key: YOUR_API_KEY" \
  -H "content-type: application/json"
```

**2. Test Page Exists:**
```typescript
async function validatePage(pageId: string): Promise<boolean> {
  try {
    const pendoClient = new PendoAPIClient(apiKey);
    await pendoClient.getPage(pageId);
    return true;
  } catch (error) {
    console.error(`Page ${pageId} validation failed:`, error);
    return false;
  }
}
```

**3. Check Data Freshness:**
```typescript
async function checkDataAvailability(pageId: string): Promise<void> {
  const tests = [
    { count: -1, desc: "Yesterday" },
    { count: -7, desc: "Last week" },
    { count: -30, desc: "Last month" }
  ];

  for (const test of tests) {
    const result = await pendoClient.getPageTotals(pageId, Math.abs(test.count));
    console.log(`${test.desc}: ${result.viewedCount} views`);

    if (result.viewedCount > 0) {
      console.log(`✅ Found data in ${test.desc}`);
      break;
    }
  }
}
```

### Common Error Messages

**"missing jzb" Error:**
- **Cause:** Using wrong regional endpoint
- **Solution:** Verify you're using the correct endpoint for your subscription

**Empty Results with 200 OK:**
- **Cause:** Data processing delay or page has no events
- **Solution:** Exclude today from query and verify page has tagging rules

**Timeout after 30 seconds:**
- **Cause:** Query too large or complex
- **Solution:** Reduce time range, optimize pipeline, increase timeout

### Performance Monitoring

```typescript
class PendoPerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const durations = this.metrics.get(operation)!;
    durations.push(duration);

    // Keep only last 100 measurements
    if (durations.length > 100) {
      durations.shift();
    }
  }

  getStats(operation: string) {
    const durations = this.metrics.get(operation) || [];
    if (durations.length === 0) return null;

    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
    };
  }
}
```

---

## References

### Official Documentation
- [Pendo API Documentation](https://engageapi.pendo.io/)
- [Pendo Developers](https://developers.pendo.io/)
- [Pendo Aggregations Guide](https://developers.pendo.io/engineering/pendo-aggs-writing-your-first-aggregation/)

### Key Articles
- "Pendo data processing and visibility" - Data freshness information
- "How do I construct a timeSeries for the Aggregations API?" - Time series configuration
- "Error: Pendo API timeout" - Error handling and limits
- "Analyze Page parameters with the API" - PageEvents source usage

### Community Resources
- [GitHub: pendo-io/pendo-ETL-API-calls](https://github.com/pendo-io/pendo-ETL-API-calls)
- [Pendo Help Center - API Articles](https://support.pendo.io/hc/en-us/community/topics/360002141371-API-Developer)

---

**Last Updated:** 2025-11-11
**Version:** 1.0
**Based on:** cin7-pendo-api project analysis and implementation experience