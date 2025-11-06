# Aggregation API Debugging Guide

## Overview

This document explains the comprehensive debugging system implemented to investigate and fix the aggregation API returning empty results (all analytics showing 0).

## What Was Implemented

### 1. Extensive Logging in Analytics Methods

Three core methods now have comprehensive debugging:

- `getAllGuidesWithAnalytics()` - Line 4190 in `pendo-api.ts`
- `getAllFeaturesWithAnalytics()` - Line 4400 in `pendo-api.ts`
- `getAllPagesWithAnalytics()` - Line 4601 in `pendo-api.ts`

**Each method now:**
- Logs the time range being queried (start/end dates in ISO format)
- Tries 4 different aggregation request structures:
  1. Standard pipeline with timeSeries
  2. Direct source with filter
  3. Events source filtered by event type
  4. Simple source format (legacy)
- Logs each request structure being tried
- Logs detailed response analysis (has results, count, sample data)
- Shows sample events (first 3) to verify field structure
- Reports which approach succeeded
- Provides diagnostic hints if all approaches fail

### 2. Increased Time Range

Changed default from 90 days to **365 days** to capture older analytics data that may exist outside the previous window.

### 3. API Test Method

Added `testAggregationAPI()` method (line 4812 in `pendo-api.ts`) that:
- Tests if the aggregation API endpoint is accessible
- Tries multiple request formats
- Identifies permission or structural issues
- Available via console: `window.testPendoAggregation()`

### 4. Enhanced React Query Hooks

Updated hooks in `usePendoData.ts` to:
- Use 365-day default time range
- Add useEffect logging for query state tracking
- Show loading, fetching, error states
- Display sample data when available

### 5. Console Test Helper

Exposed `window.testPendoAggregation()` in `main.tsx` for easy debugging from browser console.

## How to Use the Debugging

### Step 1: Open Browser Console

1. Navigate to your dashboard
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the Console tab

### Step 2: Watch the Logs

Look for these key log messages:

```
🎯 Fetching enriched guides with analytics (last 365 days)
✅ Fetched 547 guides from metadata API
📅 Time range: 2024-01-07T... to 2025-11-07T...
🔍 Requesting aggregation data for all guides (trying 4 different approaches)
```

### Step 3: Identify Which Approach Works

Watch for success messages:

```
✅ Success with approach: Standard pipeline with timeSeries - Got 1234 results
```

Or failure messages:

```
⚠️ Approach "Standard pipeline with timeSeries" returned empty results
❌ Approach "Direct source with filter" failed: Error...
```

### Step 4: Examine Sample Events

If data is returned, you'll see sample events:

```
🔍 Sample event 1: {
  guideId: "abc123",
  visitorId: "visitor_xyz",
  action: "view",
  browserTime: 1699234567890
}
```

### Step 5: Check Final Results

Look for summary messages:

```
✅ Aggregated analytics for 42 guides
📊 12 guides have analytics data
✅ Returning 547 guides with enriched analytics
```

### Step 6: Test API Accessibility

If all approaches fail, run the test helper:

```javascript
window.testPendoAggregation()
```

This will try basic API calls and report if the aggregation endpoint is accessible at all.

## Diagnostic Scenarios

### Scenario 1: All Approaches Return Empty Results

**Console will show:**
```
⚠️ All aggregation API approaches returned empty results for guides
📋 This could mean:
   1. No guide events exist in the specified time range
   2. API permissions do not allow access to guideEvents
   3. The aggregation API endpoint structure has changed
   4. Time range is outside available data
```

**Next Steps:**
1. Run `window.testPendoAggregation()` to verify API access
2. Check Pendo account for actual guide views in their dashboard
3. Verify the integration key has aggregation API permissions
4. Try increasing time range to 730 days (2 years)

### Scenario 2: API Returns Data But No Analytics Appear

**Console will show:**
```
✅ Processing 1234 guide events
⚠️ Event 1 missing guideId: { ... }
```

**Next Steps:**
1. Examine the sample events to verify field names
2. Check if events use different field names (e.g., `guide_id` vs `guideId`)
3. Update field mapping in the processing code

### Scenario 3: One Approach Works

**Console will show:**
```
✅ Success with approach: Events source filtered by guideEvent - Got 5678 results
```

**Next Steps:**
1. Note which approach worked
2. Update the method to use only that approach (remove others)
3. This indicates the API requires a specific format

### Scenario 4: API Test Fails Completely

**Console will show:**
```
❌ All aggregation API test approaches failed
📋 This indicates:
   1. The integration key may not have aggregation API permissions
   2. The aggregation endpoint may not be available for this account
   3. Network or authentication issues
```

**Next Steps:**
1. Contact Pendo support to verify aggregation API access
2. Check if your Pendo plan includes aggregation API
3. Verify integration key has correct permissions in Pendo settings

## Request Structures Being Tried

### 1. Standard Pipeline with timeSeries
```json
{
  "response": { "mimeType": "application/json" },
  "request": {
    "pipeline": [
      {
        "source": {
          "guideEvents": null,
          "timeSeries": {
            "first": 1699234567890,
            "count": 365,
            "period": "dayRange"
          }
        }
      },
      { "identified": "visitorId" }
    ],
    "requestId": "all_guides_analytics_1234567890"
  }
}
```

### 2. Direct Source with Filter
```json
{
  "response": { "mimeType": "application/json" },
  "request": {
    "pipeline": [
      { "source": { "guideEvents": null } },
      { "filter": "browserTime >= 1699234567890 && browserTime <= 1730770567890" },
      { "identified": "visitorId" }
    ],
    "requestId": "all_guides_analytics_filter_1234567890"
  }
}
```

### 3. Events Source Filtered by Type
```json
{
  "response": { "mimeType": "application/json" },
  "request": {
    "pipeline": [
      { "source": { "events": null } },
      { "filter": "type == \"guideEvent\" && browserTime >= 1699234567890 && browserTime <= 1730770567890" },
      { "identified": "visitorId" }
    ],
    "requestId": "all_guides_analytics_events_1234567890"
  }
}
```

### 4. Simple Source (Legacy Format)
```json
{
  "source": {
    "guideEvents": null,
    "timeSeries": {
      "first": 1699234567890,
      "count": 365,
      "period": "dayRange"
    }
  },
  "requestId": "all_guides_analytics_simple_1234567890"
}
```

## Files Modified

1. `/frontend/src/lib/pendo-api.ts` - Core API client with debugging
2. `/frontend/src/hooks/usePendoData.ts` - React Query hooks with logging
3. `/frontend/src/main.tsx` - Added console test helper

## Expected Console Output

When dashboard loads, you should see approximately:

```
💡 Debug helper available: Run window.testPendoAggregation() in console to test aggregation API
📊 Dashboard queries status: { guides: {...}, features: {...}, pages: {...}, reports: {...} }
🎯 Fetching enriched guides with analytics (last 365 days)
✅ Fetched 547 guides from metadata API
📅 Time range: 2024-01-07T10:15:30.000Z to 2025-11-07T10:15:30.000Z
🔍 Requesting aggregation data for all guides (trying 4 different approaches)
🔄 Trying aggregation approach: Standard pipeline with timeSeries
📋 Request structure: { ... }
🔬 Making aggregation POST call to: https://app.pendo.io/api/v1/aggregation
📋 Request params: { ... }
✅ Aggregation response: { ... }
📊 Aggregation response: { hasResults: true, resultCount: 1234, ... }
✅ Success with approach: Standard pipeline with timeSeries - Got 1234 results
✅ Processing 1234 guide events
🔍 Sample event 1: { ... }
✅ Aggregated analytics for 42 guides
📊 Sample analytics: [ ... ]
✅ Returning 547 guides with enriched analytics
📊 12 guides have analytics data
```

Repeat for features and pages.

## Troubleshooting Tips

1. **Clear browser cache** if you don't see new logs
2. **Check Network tab** in DevTools to see actual API calls
3. **Look for CORS errors** which might indicate domain issues
4. **Verify API credentials** in `.env` file
5. **Check Pendo account directly** to confirm data exists
6. **Try different time ranges** by modifying the hook calls

## Next Steps Based on Results

After running with this debugging:

1. **If one approach works consistently:**
   - Update code to use only that approach
   - Remove the other attempts to speed up loading

2. **If all approaches fail:**
   - The issue is likely API permissions or data availability
   - May need to use alternative Pendo APIs or fallback methods

3. **If data structure is different:**
   - Update field mappings based on sample event structure
   - Adjust aggregation logic accordingly

4. **If data exists but is sparse:**
   - Consider whether 365 days is sufficient
   - May need to query all-time data or use Pendo's saved reports

## Support

For issues or questions about this debugging system, refer to:
- Pendo API documentation: https://developers.pendo.io/
- This commit: 6fe88f2
- Related files: `pendo-api.ts`, `usePendoData.ts`, `main.tsx`
