# Pendo API Limitations

This document outlines the known limitations of the Pendo API that affect the Cin7 Pendo API Dashboard, along with workarounds and recommendations.

## Table of Contents
1. [General API Limitations](#general-api-limitations)
2. [Guides API Limitations](#guides-api-limitations)
3. [Features API Limitations](#features-api-limitations)
4. [Pages API Limitations](#pages-api-limitations)
5. [Reports API Limitations](#reports-api-limitations)
6. [Aggregation API Limitations](#aggregation-api-limitations)
7. [Workarounds & Recommendations](#workarounds--recommendations)

---

## General API Limitations

### Data Processing Delays
- **Limitation**: Events are processed in bulk every hour at the top of the hour
- **Impact**: New usage data may take up to 15 minutes to appear in API responses
- **Workaround**: None - inherent to Pendo's data processing architecture
- **Dashboard Implementation**: Display "data may be delayed" notes on real-time views

### Data Retention
- **Limitation**: Raw event data retained for maximum 7 years (84 months)
- **Impact**: Historical analytics beyond 84 months not available
- **Workaround**: Use Pendo Data Sync to export and archive data externally
- **Dashboard Implementation**: Date range pickers limited to available data range

### Rate Limiting
- **Limitation**: API rate limits vary by subscription tier (not publicly documented)
- **Impact**: Excessive requests may be throttled or rejected
- **Workaround**: Implement caching, request batching, exponential backoff
- **Dashboard Implementation**:
  - 5-minute cache on all queries
  - React Query automatic retry with backoff
  - Graceful error handling for rate limit errors

### Authentication
- **Limitation**: Requires integration key with appropriate permissions
- **Impact**: Cannot access data without proper credentials
- **Workaround**: Store credentials securely, use environment variables
- **Dashboard Implementation**: Backend proxy handles authentication

---

## Guides API Limitations

### 1. No Per-Step Analytics
**Limitation**: Aggregation API returns guide-level totals only, not individual step metrics

**What's NOT Available**:
- Individual step completion rates
- Step-specific view counts
- Time spent on each step
- Drop-off rates per step
- Step interaction details

**Impact**: Cannot show accurate step-by-step funnel analysis

**Workaround**:
- Estimate step distribution from guide totals using decay patterns
- Implement custom track events for step-level tracking
- Use Pendo's built-in step tracking (if enabled)

**Dashboard Implementation**:
- Display step analytics with `estimated` badge
- Clear tooltip explaining estimation methodology
- Note that individual step metrics are approximations

### 2. Limited Segment Analytics
**Limitation**: Aggregation queries for specific segments require complex filtering

**What's Limited**:
- Segment-specific performance comparison
- Audience targeting effectiveness
- Segment conversion rates

**Impact**: Difficult to analyze guide performance by user segment

**Workaround**:
- Implement custom segmentation logic
- Use visitor/account metadata for grouping
- Query aggregation API with visitor/account filters

**Dashboard Implementation**: Basic segment data from guide metadata only

### 3. No A/B Testing Data
**Limitation**: A/B test results not exposed via API

**What's NOT Available**:
- Variant performance comparison
- Statistical significance of tests
- Winner determination data

**Impact**: Cannot programmatically analyze guide experiments

**Workaround**: View A/B test results in Pendo UI only

**Dashboard Implementation**: Not implemented

---

## Features API Limitations

### 1. Basic Metrics Only
**Limitation**: Features API returns only visitor, account, and usage counts

**What's NOT Available**:
- Time-series usage data
- Retention/cohort analysis
- Usage frequency patterns
- Feature correlation
- Geographic distribution
- Device breakdown
- User segmentation

**Impact**: Cannot provide advanced feature analytics

**Workaround**:
- Use Aggregation API with custom event queries
- Implement Track Events for detailed feature tracking
- Use Data Sync for external analytics

**Dashboard Implementation**:
- Show real basic counts
- Simulate advanced analytics with `mock` badge
- Provide warning that advanced metrics are not real

### 2. No Feature-to-Page Association
**Limitation**: API cannot filter features by page or show which pages contain features

**What's NOT Available**:
- Features used on a specific page
- Page-specific feature usage counts
- Feature placement analytics

**Impact**: Cannot show page-contextual feature usage

**Workaround**:
- Manually tag features with page metadata
- Implement custom tracking with page context
- Parse feature elementPath (if available)

**Dashboard Implementation**:
- Page detail view shows ALL features (not page-specific)
- Clear note explaining API limitation

### 3. No Performance Metrics
**Limitation**: Feature API doesn't provide error rates, response times, or success metrics

**What's NOT Available**:
- Feature error rates
- Load times
- Success/failure tracking
- Performance benchmarks

**Impact**: Cannot monitor feature health

**Workaround**: Implement custom error tracking via Track Events

**Dashboard Implementation**: Not implemented

---

## Pages API Limitations

### 1. No Navigation Paths
**Limitation**: API doesn't provide session flow or navigation path data

**What's NOT Available**:
- User journey flows
- Entry/exit page analysis
- Navigation patterns
- Funnel visualization
- Path analysis

**Impact**: Cannot visualize user journeys

**Workaround**:
- Use Pendo Paths feature in UI (not available via API)
- Implement custom session tracking
- Use Google Analytics or similar for path analysis

**Dashboard Implementation**: Not implemented

### 2. No Traffic Sources
**Limitation**: API doesn't include referrer or campaign data

**What's NOT Available**:
- Referral sources
- Campaign attribution
- UTM parameter tracking
- Channel analysis

**Impact**: Cannot analyze traffic acquisition

**Workaround**: Integrate with external analytics platforms

**Dashboard Implementation**: Not implemented

### 3. Limited Guide/Feature Associations
**Limitation**: Cannot filter guides or features shown on a specific page

**What's NOT Available**:
- Page-specific guide list
- Page-specific feature list
- Contextual engagement data

**Impact**: Shows all guides/features, not page-specific ones

**Workaround**: Manual tagging or custom metadata

**Dashboard Implementation**:
- Show ALL guides and features
- Clear API limitation note displayed
- User understands data is not filtered by page

### 4. Bounce Rate Not Direct
**Limitation**: Bounce rate not directly provided

**What's Available**: Raw event data can be used to calculate

**Workaround**: Calculate from event data (numMinutes = 0 or very low)

**Dashboard Implementation**: Not currently calculated

---

## Reports API Limitations

### 1. NO ANALYTICS DATA AVAILABLE
**Limitation**: Reports API provides **only metadata**, zero analytics

**What's NOT Available**:
- View counts
- Unique viewers
- Engagement metrics
- Shares
- Downloads
- Comments
- Ratings
- Section analytics
- User interactions
- Time spent
- Any usage data whatsoever

**Impact**: **Cannot track report usage via API**

**Workaround**:
1. Implement custom Track Events:
   ```javascript
   pendo.track('ReportViewed', {
     reportId: 'abc123',
     reportName: 'Monthly Analytics',
     section: 'Executive Summary'
   });
   ```
2. Query custom events via Aggregation API
3. Use Data Sync to export to external BI tools
4. View reports within Pendo UI only

**Dashboard Implementation**:
- Prominent orange warning banner on all report pages
- Clear explanation of limitation
- Implementation guide for custom tracking
- ALL report analytics marked with `mock` badge
- Simulated data shown for demonstration only

### 2. Limited Report Types via API
**Limitation**: Paths, Funnels, and Data Explorer reports not exportable via API

**What's NOT Available**:
- Path report data
- Funnel report data
- Data Explorer query results
- Retention report data
- Workflow report data

**Impact**: Some report types cannot be programmatically accessed

**Workaround**: Use Pendo Data Sync for these report types

**Dashboard Implementation**: Only visitor/account reports shown

---

## Aggregation API Limitations

### 1. Complex Query Syntax
**Limitation**: Requires pipeline-based query structure, can be complex

**Impact**: Steep learning curve, difficult to construct queries

**Workaround**:
- Use query builder helper functions
- Test queries in Pendo API console
- Reference Pendo documentation examples

**Dashboard Implementation**: Pre-built query templates in `pendo-api.ts`

### 2. Performance with Large Datasets
**Limitation**: Large aggregations can be slow or timeout

**Impact**: Queries over many months or high-volume data may fail

**Workaround**:
- Limit date ranges (30-90 days recommended)
- Use `first` parameter to limit results
- Implement pagination where possible

**Dashboard Implementation**:
- Default to 30-day lookback
- Timeout handling with 30s limit
- Comprehensive diagnostics on failures

### 3. No Real-Time Updates
**Limitation**: Aggregations reflect batch-processed data (hourly updates)

**Impact**: Cannot show live, real-time analytics

**Workaround**: Set user expectations, show last updated timestamp

**Dashboard Implementation**: Cache strategy aligns with data freshness

### 4. Limited Grouping Options
**Limitation**: Some group-by operations not supported or limited

**Impact**: Cannot always aggregate by desired dimensions

**Workaround**: Post-process data client-side or use Data Sync

**Dashboard Implementation**: Client-side aggregation for complex groupings

---

## Workarounds & Recommendations

### For Missing Step Analytics

```javascript
// Implement custom step tracking
pendo.track('GuideStepViewed', {
  guideId: guide.id,
  guideName: guide.name,
  stepNumber: step.order,
  stepName: step.name
});

pendo.track('GuideStepCompleted', {
  guideId: guide.id,
  stepNumber: step.order,
  timeSpent: duration
});
```

### For Feature Analytics

```javascript
// Track feature usage with context
pendo.track('FeatureUsed', {
  featureId: feature.id,
  featureName: feature.name,
  pageId: page.id,
  pageUrl: window.location.href,
  context: 'user_action'
});
```

### For Report Analytics

```javascript
// Track report views
pendo.track('ReportViewed', {
  reportId: report.id,
  reportName: report.name,
  section: sectionName,
  timestamp: Date.now()
});

// Track report interactions
pendo.track('ReportInteraction', {
  reportId: report.id,
  action: 'download' | 'share' | 'comment',
  details: {}
});
```

### For Navigation Paths

**Option 1**: Use Google Analytics
```javascript
// Send page views to GA
gtag('event', 'page_view', {
  page_title: document.title,
  page_location: window.location.href,
  page_path: window.location.pathname
});
```

**Option 2**: Use Pendo Data Sync
- Configure Data Sync to export to data warehouse
- Build custom path analysis in BI tool
- Query historical session data

### For Advanced Feature Analytics

**Use Aggregation API with Custom Events**:
```javascript
// Query custom events
const aggregationQuery = {
  response: { mimeType: "application/json" },
  request: {
    pipeline: [
      {
        source: { events: null }
      },
      {
        filter: `type == "track" && event == "FeatureUsed"`
      },
      {
        timeSeries: {
          period: "dayRange",
          first: 30
        }
      }
    ],
    requestId: `feature_analytics_${Date.now()}`
  }
};
```

---

## API Capability Matrix

| Feature | Guides | Features | Pages | Reports | Aggregation |
|---------|--------|----------|-------|---------|-------------|
| Basic Metadata | ✅ | ✅ | ✅ | ✅ | N/A |
| View/Usage Counts | ✅ | ✅ | ✅ | ❌ | ✅ |
| Visitor/Account Lists | ✅ | ✅ | ✅ | ❌ | ✅ |
| Time Series Data | ⚠️ | ❌ | ✅ | ❌ | ✅ |
| Segmentation | ⚠️ | ❌ | ⚠️ | ❌ | ✅ |
| Geographic Data | ❌ | ❌ | ✅ | ❌ | ✅ |
| Device Breakdown | ❌ | ❌ | ✅ | ❌ | ✅ |
| Navigation Paths | ❌ | ❌ | ❌ | ❌ | ❌ |
| A/B Testing Results | ❌ | N/A | N/A | N/A | ❌ |
| Real-time Data | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend**:
- ✅ Fully Available
- ⚠️ Partially Available / Limited
- ❌ Not Available
- N/A Not Applicable

---

## Impact on Dashboard Features

### Fully Functional (Real Data)
- ✅ Guide overview metrics
- ✅ Feature basic metrics
- ✅ Page analytics and events
- ✅ Visitor and account lists
- ✅ Frustration metrics
- ✅ Geographic distribution (pages)
- ✅ Device/browser breakdown (pages)
- ✅ Daily time series (pages)

### Partially Functional (Estimated Data)
- ⚠️ Guide step analytics (estimated from totals)
- ⚠️ Feature relationships (basic)

### Demonstration Only (Mock Data)
- 🎭 Report analytics (all metrics)
- 🎭 Feature cohort analysis
- 🎭 Feature correlation analysis
- 🎭 Advanced feature segmentation
- 🎭 Navigation paths
- 🎭 Traffic sources

### Not Implemented (API Limitation)
- ❌ A/B test results
- ❌ Real-time updates
- ❌ Funnel analysis
- ❌ Workflow reports
- ❌ Campaign attribution

---

## Future API Improvements Needed

### High Priority
1. **Report Analytics Endpoint**: View counts, engagement, shares for reports
2. **Step-Level Analytics**: Individual guide step metrics
3. **Feature-to-Page Mapping**: Associate features with pages
4. **Guide-to-Page Mapping**: Associate guides with pages

### Medium Priority
5. **Navigation Paths API**: Session flows and user journeys
6. **Traffic Source Data**: Referrers and campaign attribution
7. **A/B Testing API**: Programmatic access to experiment results
8. **Real-time Event Streaming**: WebSocket or SSE for live updates

### Low Priority
9. **Bulk Operations**: Batch create/update for metadata
10. **Advanced Filtering**: More complex query capabilities
11. **Custom Metrics**: User-defined calculated fields

---

## Getting Help

### Pendo Resources
- [Pendo API Documentation](https://engageapi.pendo.io/)
- [Pendo Support Portal](https://support.pendo.io/)
- [Pendo Community](https://community.pendo.io/)
- [Pendo Academy](https://academy.pendo.io/)

### For This Dashboard
- Check `DATA_SOURCES.md` for what data is available
- Review `IMPLEMENTATION_STATUS.md` for feature completeness
- Create GitHub issues for bugs or feature requests

---

**Last Updated**: 2025-10-31

**Maintained By**: Cin7 Development Team
