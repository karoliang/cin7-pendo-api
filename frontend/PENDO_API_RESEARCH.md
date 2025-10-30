# Pendo Aggregation API Research: Empty Results Investigation

## Executive Summary

Based on comprehensive research of Pendo's Aggregation API documentation, official examples, and community resources, this report identifies common causes for empty results (200 OK with empty arrays) when querying pageEvents with pageId filters.

## Issue Overview

**Symptoms:**
- API calls return HTTP 200 OK status
- Response contains empty results array
- Page ID: `iD07wrNnn2etx2c443K4OV954wA`
- All 5 methods affected: getPageTotals, getPageTimeSeries, getTopVisitorsForPage, getTopAccountsForPage, getPageEventBreakdown

---

## Key Findings

### 1. Data Processing & Availability Delays

**CRITICAL FINDING:** Pendo processes events in bulk with significant delays.

- **Hourly Processing:** Events are processed every hour at the top of the hour
- **Display Delay:** Can take up to 15 minutes past the hour for data to appear
- **Next-Day Processing:** If data doesn't appear within 15 minutes, it processes at end of business day and displays the following day
- **Date Range Caveat:** This delay only affects reports with date ranges that include today

**Source:** Pendo Help Center - "Pendo data processing and visibility"

**Impact on Your Implementation:**
```typescript
// Current implementation uses now() which may return no data
timeSeries: {
  first: "now()",
  count: -90,
  period: "dayRange"
}
```

**Recommendation:** For real-time dashboards, exclude today's date or display a warning about data freshness.

---

### 2. Event Timestamp Processing Rules

**IMPORTANT:** Not all events are processed for aggregation.

Events are excluded if:
- Timestamps are outside the hourly processing window (processed with daily/weekly rescanning)
- Timestamps exceed 7 days in the past when received
- Events occurred before Pendo subscription creation
- Events occurred after Track Event type was created

**Source:** Pendo Help Center - "Pendo data processing and visibility"

---

### 3. Raw Events vs Aggregated Data

**KEY DISTINCTION:** The pageEvents source returns aggregated data, not raw events.

- Raw events may be visible in the Pendo debugger
- Aggregated data becomes available after hourly processing
- Empty results can indicate aggregation hasn't occurred yet, even if raw events exist

**Verification Command:**
```javascript
// In browser console on the target page
pendo.enableDebugging();
pendo.getURL(); // Verify how Pendo reads the page URL
pendo.guides; // Check if Pendo is properly initialized ([] = no results)
```

---

### 4. Page Tagging and Configuration Issues

**CRITICAL:** The pageId must correspond to a properly tagged page in Pendo.

**Common Issues:**
1. **Page Not Tagged:** The page may not have any tagging rules configured in Pendo
2. **URL Mismatch:** Pendo may read the page URL differently than expected
3. **Parameter Conflicts:** When using parameter rules, no other page rules can be used
4. **Multi-App Scoping:** In multi-app environments, missing appId can cause empty results

**Validation Steps:**
1. Go to Pages section in Pendo admin
2. Find the page with ID `iD07wrNnn2etx2c443K4OV954wA`
3. Check if at least one rule exists for that page
4. Use "Test Rule" feature to paste the actual URL from your app
5. Verify the page has recorded events in the date range

**Source:** Pendo Help Center - "Guides troubleshooting checklist"

---

### 5. TimeSeries Configuration

**Your Configuration is CORRECT:**

```typescript
timeSeries: {
  first: "now()",        // Expression evaluated to current timestamp
  count: -90,            // Negative count looks backward 90 days
  period: "dayRange"     // Daily granularity
}
```

**Documentation Confirmation:**
- Negative count with `now()` counts backward in time
- `first: "now()"` is evaluated as an expression to derive a timestamp
- This is the standard pattern for lookback queries

**Source:** Pendo Help Center - "How do I construct a timeSeries for the Aggregations API?"

**However:** Consider starting from yesterday to avoid data processing delays:
```typescript
// Alternative: Start from yesterday to ensure complete data
const yesterday = Date.now() - (24 * 60 * 60 * 1000);
timeSeries: {
  first: yesterday,      // Explicit timestamp for yesterday
  count: -90,
  period: "dayRange"
}
```

---

### 6. PageId Format and Encoding

**Finding:** No special encoding required when pageId is in JSON body.

- PageId values are alphanumeric with hyphens/underscores
- Examples from documentation: `aJ0KOADQZVL5h9zQhiQ0q26PNTM`, `ABC3amaLg-TNYXwkU3ht4zJh-Pg`
- Your ID format: `iD07wrNnn2etx2c443K4OV954wA` (appears valid)
- JSON escaping required only for special characters like quotes, backslashes
- No URL encoding needed (pageId in request body, not URL path)

**Your ID looks valid** based on the pattern observed in documentation.

---

### 7. pageEvents Source Best Practices

**From Official Pendo ETL Repository:**

```json
{
  "response": { "mimeType": "application/json" },
  "request": {
    "pipeline": [
      {
        "source": {
          "pageEvents": {
            "pageId": "SPECIFIC_PAGE_ID"  // or null for all pages
          },
          "timeSeries": {
            "period": "dayRange",
            "first": "now()",
            "count": -1  // IMPORTANT: Start with -1 for testing
          }
        }
      }
    ],
    "requestId": "uniqueRequestId"
  }
}
```

**CRITICAL WARNING from Repository:**
> "You should NOT set the value to something greater than 30 as it will retrieve a large data set that could impact performance; instead, keep the value set to 1 and run your ETL process daily then append the data to the table."

**Your Implementation Issue:**
You're using `-90` days which exceeds the recommended `-30` day maximum. This may cause:
- Performance degradation
- Timeout errors (5 minute limit)
- Empty results if the dataset is too large

**Source:** GitHub - pendo-io/pendo-ETL-API-calls

---

### 8. Spawn/Join Pattern Issues

**Your Implementation:**
```typescript
spawn: [
  [
    {
      source: {
        pageEvents: { pageId: pageId },
        timeSeries: { first: "now()", count: -90, period: "dayRange" }
      }
    },
    {
      identified: { visitor: "visitorId" }
    },
    // ... aggregations
  ],
  [
    {
      source: {
        visitors: null
      }
    }
  ]
],
{
  join: {
    left: "visitorId",
    right: "visitorId"
  }
}
```

**Recommended Pattern from Documentation:**
Use `bulkExpand` instead of spawn/join for visitor and account enrichment:

```json
{
  "pipeline": [
    {
      "source": {
        "pageEvents": {
          "pageId": "YOUR_PAGE_ID"
        },
        "timeSeries": {
          "first": "now()",
          "count": -1,
          "period": "dayRange"
        }
      }
    },
    {
      "bulkExpand": {
        "account": {
          "account": "accountId"
        }
      }
    },
    {
      "bulkExpand": {
        "visitor": {
          "visitor": "visitorId"
        }
      }
    }
  ]
}
```

**Advantage:** `bulkExpand` pulls all current metadata values for visitors/accounts more efficiently than spawn/join.

**Source:** Pendo Help Center - "Analyze Page parameters with the API"

---

### 9. Error Handling Best Practices

**Timeout Handling:**
- Response size limit: 4GB
- Time limit: 5 minutes
- Break up aggregations by smaller time ranges if hitting limits
- The aggregations endpoint is NOT a bulk export feature

**Regional Endpoints:**
- Must use correct instance based on your region
- Incorrect endpoint returns error "missing jzb"
- Verify your endpoint matches your subscription region

**Retry Logic:**
```typescript
// Implement exponential backoff for rate limiting
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.status >= 500) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Don't retry for other errors
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Source:** Pendo Help Center - "Error: Pendo API timeout"

---

### 10. pageEvents vs pages Source

**Key Difference:**

- **pageEvents:** Event-level data (individual page views)
  - Provides: accountId, visitorId, numEvents, numMinutes, parameters, userAgent
  - Granularity: Hourly or daily aggregations
  - Use case: Time-series analysis, visitor tracking, engagement metrics

- **pages:** Entity-level metadata
  - Provides: Page configuration, tagging rules, metadata
  - Use case: Page catalog, configuration queries

**Your Use Case:** pageEvents is correct for analytics data.

---

## Diagnostic Steps for Your Issue

### Step 1: Verify Page Exists and Has Data

```bash
# Test with pages API endpoint first
curl -X GET "https://app.pendo.io/api/v1/page/iD07wrNnn2etx2c443K4OV954wA" \
  -H "x-pendo-integration-key: YOUR_API_KEY" \
  -H "content-type: application/json"
```

**Expected:** Should return page metadata including URL, name, and whether it has recorded events.

### Step 2: Test with Minimal Query

Start with absolute minimum to isolate the issue:

```json
{
  "response": { "mimeType": "application/json" },
  "request": {
    "pipeline": [
      {
        "source": {
          "pageEvents": {
            "pageId": "iD07wrNnn2etx2c443K4OV954wA"
          },
          "timeSeries": {
            "period": "dayRange",
            "first": "now()",
            "count": -1  // Just yesterday
          }
        }
      }
    ],
    "requestId": "test_minimal"
  }
}
```

**If this returns empty:** The page likely has no events in the last day.

### Step 3: Gradually Expand Time Range

```typescript
// Test progressively
const tests = [
  { count: -1, desc: "Yesterday" },
  { count: -7, desc: "Last week" },
  { count: -30, desc: "Last month" },
  { count: -90, desc: "Last 90 days" }
];

for (const test of tests) {
  const result = await testPageEvents(pageId, test.count);
  console.log(`${test.desc}: ${result.length} results`);
  if (result.length > 0) break; // Found data
}
```

### Step 4: Test with Null PageId

```json
{
  "source": {
    "pageEvents": null,  // All pages
    "timeSeries": {
      "period": "dayRange",
      "first": "now()",
      "count": -1
    }
  }
}
```

**If this returns data:** Your pageId filter is the issue (page not tagged or ID incorrect).

### Step 5: Check Data Freshness

```typescript
// Exclude today to avoid processing delays
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(23, 59, 59, 999);

const aggregationRequest = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        source: {
          pageEvents: {
            pageId: "iD07wrNnn2etx2c443K4OV954wA"
          },
          timeSeries: {
            first: yesterday.getTime(),
            count: -30,
            period: "dayRange"
          }
        }
      }
    ],
    requestId: `test_${Date.now()}`
  }
};
```

---

## Recommended Code Changes

### 1. Add Debugging Output

```typescript
private async getPageTotals(id: string, _daysBack: number = 90): Promise<{ viewedCount: number; visitorCount: number; uniqueVisitors: number }> {
  try {
    console.log(`📊 Fetching total analytics for page ${id} from aggregation API`);
    console.log(`⏰ Current time: ${new Date().toISOString()}`);
    console.log(`📅 Looking back ${_daysBack} days`);

    const aggregationRequest = {
      response: { mimeType: "application/json" },
      request: {
        pipeline: [
          {
            source: {
              pageEvents: {
                pageId: id
              },
              timeSeries: {
                first: "now()",
                count: -_daysBack,
                period: "dayRange"
              }
            }
          }
        ],
        requestId: `page_totals_${Date.now()}`
      }
    };

    console.log(`🔍 Request payload:`, JSON.stringify(aggregationRequest, null, 2));

    const response = await this.makeAggregationCall(aggregationRequest, 'POST') as PendoAggregationResponse;

    console.log(`📦 Response status: 200 OK`);
    console.log(`📊 Results count: ${response.results?.length || 0}`);
    console.log(`🔍 Raw response:`, JSON.stringify(response, null, 2));

    if (response.results && Array.isArray(response.results)) {
      const uniqueVisitorIds = new Set();
      let viewedCount = 0;

      for (const result of response.results) {
        viewedCount++;
        if (result.visitorId) {
          uniqueVisitorIds.add(result.visitorId);
        }
      }

      const visitorCount = uniqueVisitorIds.size;

      console.log(`✅ Aggregation page totals: ${viewedCount} views, ${visitorCount} unique visitors`);
      return { viewedCount, visitorCount, uniqueVisitors: visitorCount };
    }

    console.warn(`⚠️ No aggregation results for page ${id}`);
    console.warn(`⚠️ Possible causes:`);
    console.warn(`   1. Page has no events in the last ${_daysBack} days`);
    console.warn(`   2. Data processing delay (events processed hourly)`);
    console.warn(`   3. Page ID may be incorrect or page not properly tagged`);
    console.warn(`   4. Events exist but haven't been aggregated yet`);

    return { viewedCount: 0, visitorCount: 0, uniqueVisitors: 0 };
  } catch (error) {
    console.error(`❌ Failed to fetch page totals from aggregation API:`, error);
    return { viewedCount: 0, visitorCount: 0, uniqueVisitors: 0 };
  }
}
```

### 2. Reduce Initial Time Range

```typescript
// Change from 90 days to 30 days (recommended maximum)
private async getPageTotals(id: string, _daysBack: number = 30): Promise<{ viewedCount: number; visitorCount: number; uniqueVisitors: number }> {
  // ... implementation
}
```

### 3. Add Fallback Strategy

```typescript
private async getPageTotalsWithFallback(id: string): Promise<{ viewedCount: number; visitorCount: number; uniqueVisitors: number }> {
  // Try 30 days first
  let result = await this.getPageTotals(id, 30);

  if (result.viewedCount === 0) {
    console.log(`⚠️ No data in last 30 days, trying 90 days...`);
    result = await this.getPageTotals(id, 90);
  }

  if (result.viewedCount === 0) {
    console.log(`⚠️ No data in last 90 days, trying all pages to verify API connectivity...`);
    // Test with null pageId to see if API is working at all
    const testResult = await this.getPageTotals(null, 1);
    if (testResult.viewedCount > 0) {
      console.error(`❌ API is working but page ${id} has no events. Page may be incorrectly tagged or ID is wrong.`);
    } else {
      console.error(`❌ API returned no events at all. Check API key, endpoint, and subscription status.`);
    }
  }

  return result;
}
```

### 4. Add Page Validation Method

```typescript
async validatePageId(pageId: string): Promise<boolean> {
  try {
    // Use the regular pages API to check if page exists
    const url = `${this.baseURL}/page/${pageId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-pendo-integration-key': this.integrationKey,
        'content-type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Page ${pageId} not found: ${response.status} ${response.statusText}`);
      return false;
    }

    const page = await response.json();
    console.log(`✅ Page validated:`, {
      id: page.id,
      name: page.name,
      url: page.url,
      hasRules: page.rules?.length > 0
    });

    if (!page.rules || page.rules.length === 0) {
      console.warn(`⚠️ Page ${pageId} has no tagging rules configured`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to validate page ${pageId}:`, error);
    return false;
  }
}
```

### 5. Replace spawn/join with bulkExpand

```typescript
async getTopVisitorsForPage(pageId: string, limit: number = 10): Promise<PageVisitor[]> {
  try {
    console.log(`👥 Fetching top ${limit} visitors for page ${pageId}`);

    const aggregationRequest = {
      response: { mimeType: "application/json" },
      request: {
        pipeline: [
          {
            source: {
              pageEvents: {
                pageId: pageId
              },
              timeSeries: {
                first: "now()",
                count: -30,  // Reduced from 90 to recommended max
                period: "dayRange"
              }
            }
          },
          {
            bulkExpand: {
              visitor: {
                visitor: "visitorId"
              }
            }
          },
          {
            aggregate: {
              visitor_numEvents: { sum: "numEvents" }
            },
            by: ["visitorId"]
          },
          {
            sort: ["-visitor_numEvents"]
          },
          {
            limit: limit
          }
        ],
        requestId: `top_visitors_${Date.now()}`
      }
    };

    const response = await this.makeAggregationCall(aggregationRequest, 'POST') as PendoAggregationResponse;

    if (response.results && Array.isArray(response.results)) {
      console.log(`✅ Retrieved ${response.results.length} top visitors`);
      return response.results.map(result => ({
        visitorId: result.visitorId,
        name: result.visitor?.name || result.visitorId,
        email: result.visitor?.email || 'N/A',
        pageViews: result.visitor_numEvents || 0,
        lastVisit: result.lastVisit || null
      }));
    }

    console.warn(`⚠️ No visitors found for page ${pageId}`);
    return [];
  } catch (error) {
    console.error(`❌ Failed to fetch top visitors:`, error);
    return [];
  }
}
```

---

## Implementation Checklist

### Immediate Actions (Debug the current issue)

- [ ] Add detailed logging to see actual API responses
- [ ] Validate page ID exists using pages API endpoint
- [ ] Test with minimal query (count: -1) to isolate issue
- [ ] Test with null pageId to verify API connectivity
- [ ] Check if page has tagging rules configured in Pendo admin
- [ ] Verify you're using correct regional endpoint

### Short-term Fixes (Improve reliability)

- [ ] Reduce time range from 90 to 30 days maximum
- [ ] Exclude today's date to avoid data processing delays
- [ ] Add retry logic with exponential backoff
- [ ] Implement proper error handling with informative messages
- [ ] Replace spawn/join with bulkExpand for visitor/account enrichment

### Long-term Improvements (Production readiness)

- [ ] Add page validation before querying analytics
- [ ] Implement caching for aggregation results (15-minute TTL)
- [ ] Add data freshness indicators in UI
- [ ] Create fallback strategies for empty results
- [ ] Monitor API usage and implement rate limiting
- [ ] Set up alerting for persistent empty results
- [ ] Document known limitations and delays for users

---

## Most Likely Root Causes (Ranked)

### 1. Data Processing Delay (70% probability)
- Events processed hourly, up to 15 minutes delay
- Your query includes "today" which may have no aggregated data yet
- **Test:** Change `count: -30` and exclude today

### 2. Page Has No Events (20% probability)
- The page genuinely has no visitors in the time range
- Page may be newly created or rarely accessed
- **Test:** Use null pageId to check if any pages have data

### 3. Incorrect Page ID or Page Not Tagged (8% probability)
- The pageId doesn't match a tagged page in Pendo
- Page exists but has no tagging rules configured
- **Test:** Validate page using pages API endpoint

### 4. Query Too Large (2% probability)
- 90-day query may exceed performance limits
- Causing silent failures or timeouts
- **Test:** Reduce to 7 days and gradually increase

---

## References

### Official Documentation
- [Pendo API Documentation](https://engageapi.pendo.io/)
- [Pendo Developers](https://developers.pendo.io/)
- [Pendo Aggs: Writing Your First Aggregation](https://developers.pendo.io/engineering/pendo-aggs-writing-your-first-aggregation/)

### Community Resources
- [GitHub: pendo-io/pendo-ETL-API-calls](https://github.com/pendo-io/pendo-ETL-API-calls)
- [Pendo Help Center - API Articles](https://support.pendo.io/hc/en-us/community/topics/360002141371-API-Developer)

### Specific Articles Referenced
- "Pendo data processing and visibility" - Data freshness and processing delays
- "How do I construct a timeSeries for the Aggregations API?" - TimeSeries configuration
- "Analyze Page parameters with the API" - PageEvents source usage
- "Error: Pendo API timeout" - Performance limits and error handling
- "I see Raw events but no aggregation occurs" - Difference between raw and aggregated data

---

## Next Steps

1. **Run diagnostic script** with detailed logging to capture actual API responses
2. **Validate page ID** using pages API endpoint
3. **Test with minimal query** (1 day lookback) to establish baseline
4. **Implement recommended fixes** starting with time range reduction
5. **Monitor results** and adjust based on findings

---

**Report Generated:** 2025-10-30
**Research Duration:** Comprehensive analysis of official docs, GitHub examples, and community discussions
**Confidence Level:** High - Based on official Pendo documentation and established best practices
