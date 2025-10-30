# Data Sources Documentation

This document provides a complete reference for where each piece of data in the Cin7 Pendo API Dashboard comes from - either real Pendo API endpoints or calculated/simulated data.

## Overview

The dashboard integrates with multiple Pendo API endpoints to provide real-time analytics. Where Pendo API limitations exist, we clearly mark data as estimated or simulated.

---

## Guides Analytics

### Real Data (from Pendo Aggregation API)

**Endpoint:** `POST /api/v1/aggregation`

#### Core Metrics
- **viewedCount**: Real count from `guideEvents` with `type: 'guideActivity'`
- **completedCount**: Real count from `guideEvents` with `type: 'guideSeen'` and all steps completed
- **lastShownCount**: Real count from `guideEvents` with `type: 'guideActivity'`
- **Guide Metadata**: Name, ID, state, created/updated timestamps from `/api/v1/guide/:id`

#### Calculated from Real Data
- **completionRate**: `(completedCount / viewedCount) * 100`
- **engagementRate**: Calculated from real event data
- **averageTimeToComplete**: Averaged from event timestamps

### Estimated Data

#### Guide Steps
- **Step analytics**: Estimated distribution based on real guide totals
- Individual step completion rates are calculated using decay patterns
- **Why Estimated**: Pendo Aggregation API returns guide-level totals, not per-step breakdowns
- **Accuracy**: High correlation with real patterns, but individual step metrics are approximated

**Badge Type:** `estimated`

---

## Features Analytics

### Real Data (from Pendo Events API)

**Endpoint:** `GET /api/v1/feature`

#### Core Metrics
- **visitorCount**: Real unique visitor count from Pendo
- **accountCount**: Real unique account count from Pendo
- **usageCount**: Real total usage/event count from Pendo
- **Feature Metadata**: Name, ID, elementId, eventType, created/updated timestamps

### Simulated Data

#### Advanced Analytics
All of the following are **simulated** due to Pendo API limitations:

- **Cohort Analysis**: User retention patterns over time
- **Related Features**: Feature correlation analysis
- **Usage Patterns**: Power users, regular users, occasional users
- **Adoption Metrics**: Time-series adoption data
- **Daily/Hourly Usage**: Granular time-based analytics
- **User Segmentation**: Enterprise vs. Business vs. Trial users
- **Geographic Distribution**: Location-based usage data
- **Device Breakdown**: Desktop, mobile, tablet usage patterns
- **Performance Metrics**: Error rates, response times, success rates

**Why Simulated**: Pendo Features API only returns basic counts. Advanced analytics require custom event tracking and aggregation queries that are not currently implemented.

**Badge Type:** `mock` (for advanced analytics)

---

## Pages Analytics

### Real Data (from Pendo Aggregation API)

**Endpoint:** `POST /api/v1/aggregation` with `pageEvents` source

#### Core Metrics
- **viewedCount**: Real page view count from aggregated events
- **visitorCount**: Real unique visitor count from aggregated events
- **uniqueVisitors**: Real count from visitor ID aggregation
- **avgTimeOnPage**: Calculated from real `numMinutes` field in page events

#### Top Visitors & Accounts
- **topVisitors**: Real data from aggregation with visitor email, name, viewCount
- **topAccounts**: Real data with account name, ARR, plan level, viewCount

#### Event Breakdown Table
- **visitorId, accountId, date**: Real from page events
- **totalViews**: Real view counts per visitor/day
- **Frustration Metrics**: Real data
  - uTurns (U-turns)
  - deadClicks (dead clicks)
  - errorClicks (error clicks)
  - rageClicks (rage clicks)
- **serverName, browserName, browserVersion**: Real from events

#### Frustration Metrics Summary
All calculated from real page event data:
- **totalRageClicks**: Summed from all events
- **totalDeadClicks**: Summed from all events
- **totalUTurns**: Summed from all events
- **totalErrorClicks**: Summed from all events
- **frustrationRate**: Calculated as % of sessions with frustration
- **topFrustratedVisitors**: Aggregated from real event data

#### Geographic Distribution
Calculated from real page event fields:
- **region, country**: Real from page events
- **visitors, views**: Aggregated from real data
- **avgTimeOnPage**: Averaged from real `numMinutes` field
- **percentage**: Calculated from totals

#### Device & Browser Breakdown
Parsed from real userAgent strings in page events:
- **device**: Desktop, Mobile, Tablet (parsed)
- **os, osVersion**: Operating system details (parsed)
- **browser, browserVersion**: Browser details (parsed)
- **users, percentage**: Aggregated from real data

#### Daily Time Series
Aggregated from all page events by date:
- **date, views, visitors**: Real from events
- **avgTimeOnPage**: Averaged from real data
- **frustrationCount**: Summed frustration events per day

### Data Not Available from Pendo API

These page analytics features are **not available** via Pendo API:
- **Features targeting this page**: API cannot filter features by page (shows all features)
- **Guides targeting this page**: API cannot filter guides by page (shows all guides)
- **Navigation paths**: Requires session tracking not available
- **Traffic sources**: Not provided by Pendo API
- **Bounce rate**: Not directly available (would require custom calculation)
- **Exit rate**: Not directly available

**Badge Type:** `real` for available data, with notes about API limitations

---

## Reports Analytics

### Real Data (from Pendo Reports API)

**Endpoint:** `GET /api/v1/report`

#### Available Fields
- **id**: Report unique identifier
- **name**: Report name
- **description**: Report description
- **configuration**: Report configuration object
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp
- **lastSuccessRunAt**: Last successful run timestamp

### No Analytics Available

**Important**: The Pendo Reports API **does not provide any analytics data**. Only metadata is available.

#### Not Available
- View counts
- User engagement metrics
- Shares
- Downloads
- Ratings
- Section engagement
- Any usage analytics

**Why**: Pendo's Reports endpoint is designed for report management, not analytics. Reports are typically viewed within the Pendo UI, and view tracking would require custom Track Events.

**Implementation Recommendation**:
To track report analytics:
1. Use `pendo.track('ReportViewed', { reportId, reportName })` when reports are accessed
2. Create custom events for report interactions (shares, downloads, etc.)
3. Query these custom events via Aggregation API
4. Alternatively, use Pendo Data Sync to export to external analytics platforms

**Badge Type:** `mock` - All analytics are simulated for demonstration

**Warning Banner**: Prominent orange warning displayed on all Report detail pages explaining the limitation.

---

## Dashboard KPIs

### Real Data
- **Total Guides**: Real count from `/api/v1/guide`
- **Active Guides**: Filtered by `state: 'published'`
- **Total Features**: Real count from `/api/v1/feature`
- **Total Pages**: Real count from `/api/v1/page`
- **Total Reports**: Real count from `/api/v1/report`

### Calculated Metrics
- **Completion Rate**: Averaged from real guide completion rates
- **Active Users**: Aggregated from visitor counts across all entities
- **Engagement Score**: Calculated from real engagement rates

---

## Data Tables

### Guides Table
**Source:** `GET /api/v1/guide`
- All columns show real API data
- Published/draft status is real
- View/completion counts are real

### Features Table
**Source:** `GET /api/v1/feature`
- All columns show real API data
- Usage counts are real
- Visitor/account counts are real

### Pages Table
**Source:** `GET /api/v1/page`
- All columns show real API data
- View counts are real
- Visitor counts are real

### Reports Table
**Source:** `GET /api/v1/report`
- Only metadata available
- No analytics columns shown

---

## Data Refresh & Caching

### Cache Strategy
- **Guide Analytics**: 5-minute cache (staleTime: 5min, gcTime: 10min)
- **Feature Data**: 5-minute cache
- **Page Analytics**: 5-minute cache
- **Report Metadata**: 5-minute cache

### Data Freshness
- Pendo processes events in bulk every hour (top of the hour)
- New usage data may take up to 15 minutes to appear
- Historical data is retained for 7 years (84 months)

---

## API Rate Limits

### Considerations
- Pendo API has rate limits (specific limits depend on subscription)
- Dashboard implements:
  - Request caching to minimize API calls
  - Query retry logic with exponential backoff
  - Graceful degradation on rate limit errors

---

## Data Quality Badges

### Badge Types

#### Real (`type="real"`)
- Data comes directly from Pendo API
- No simulation or estimation
- Refreshed according to cache strategy
- Example: Guide view counts, Page visitor counts

#### Estimated (`type="estimated"`)
- Based on real data with calculations applied
- Approximations follow known patterns
- Clearly explained what's estimated and why
- Example: Guide step analytics (distribution from totals)

#### Mock (`type="mock"`)
- Simulated data for demonstration
- Not backed by Pendo API
- Used when API doesn't provide the data
- Example: Report analytics, Feature cohort analysis

---

## Future Enhancements

### Planned Improvements
1. **Custom Track Events**: Implement custom event tracking for reports
2. **Advanced Aggregations**: Add more complex aggregation queries for features
3. **Data Sync Integration**: Connect to Pendo Data Sync for extended analytics
4. **Real-time Updates**: WebSocket integration for live data updates
5. **Historical Trends**: Extend time-series data with configurable date ranges

### API Limitations to Address
1. Feature-to-Page associations (requires custom tracking)
2. Guide-to-Page associations (requires custom tracking)
3. Step-level analytics (requires individual step tracking)
4. Navigation paths (requires session tracking)
5. Traffic sources (requires integration with analytics platforms)

---

## References

- [Pendo API Documentation](https://engageapi.pendo.io/)
- [Pendo Aggregation API Guide](https://www.pendo.io/pendo-blog/pendo-data-using-aggregations/)
- [Pendo Data Processing](https://support.pendo.io/hc/en-us/articles/10508118459035-Pendo-data-processing-and-visibility)

---

**Last Updated**: 2025-10-31
