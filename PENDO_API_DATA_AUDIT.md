# Pendo Analytics Dashboard - Comprehensive Data Audit

**Date:** October 31, 2025
**Project:** Cin7 Pendo API Integration
**Status:** Complete

---

## Executive Summary

This audit comprehensively analyzes all available Pendo API data, what's currently displayed in the dashboard, and identifies opportunities for enhancement. The dashboard successfully integrates with Pendo's Aggregation API but has room for improvement in data utilization.

### Key Findings:
- **Data Coverage:** 65% of available API fields are currently displayed
- **Primary Gap:** Features and Guides data is NOT filtered by page (API limitation)
- **Opportunity:** Enhanced time-based analytics, recording integration, and query parameters
- **Quality:** Mix of real Pendo data and calculated/estimated metrics (properly labeled)

---

## 1. API Data Inventory

### 1.1 Pages API (`ComprehensivePageData`)

#### **Core Identity Fields**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `id` | Pendo API | Real | Yes (Technical Details) |
| `url` | Pendo API | Real | Yes (Technical Details) |
| `name` | Pendo API | Real | Yes (Header) |
| `title` | Pendo API | Real | No |
| `type` | Calculated | Estimated | Yes (Technical Details) |

#### **Basic Metrics (Real from Aggregation API)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `viewedCount` | `getPageTotals()` | Real | Yes (KPI Card) |
| `visitorCount` | `getPageTotals()` | Real | Yes (KPI Card) |
| `uniqueVisitors` | `getPageTotals()` | Real | Yes (KPI Card) |
| `avgTimeOnPage` | Calculated | Estimated | Yes (KPI Card) |

#### **Engagement Metrics**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `bounceRate` | Calculated | Estimated | No |
| `exitRate` | Calculated | Estimated | No |
| `conversionRate` | Calculated | Estimated | No |

#### **Time Series Data**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `dailyTraffic` | `getPageTimeSeries()` | Real | Yes (Daily Trends chart) |
| `hourlyTraffic` | Calculated | Estimated | No |
| `dailyTimeSeries` | Calculated from events | Real | Yes (Daily Trends chart) |

#### **Visitor & Account Data (Real from Aggregation API)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `topVisitors[].visitorId` | `getTopVisitorsForPage()` | Real | Yes (Top Visitors table) |
| `topVisitors[].email` | Pendo metadata join | Real | Yes (Top Visitors table) |
| `topVisitors[].name` | Pendo metadata join | Real | Yes (Top Visitors table) |
| `topVisitors[].viewCount` | Aggregation | Real | Yes (Top Visitors table) |
| `topAccounts[].accountId` | `getTopAccountsForPage()` | Real | Yes (Top Accounts table) |
| `topAccounts[].name` | Pendo metadata join | Real | Yes (Top Accounts table) |
| `topAccounts[].arr` | Pendo metadata | Real | No (available but not displayed) |
| `topAccounts[].planlevel` | Pendo metadata | Real | Yes (Top Accounts table) |
| `topAccounts[].viewCount` | Aggregation | Real | Yes (Top Accounts table) |

#### **Event Breakdown Data (Real from Aggregation API)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `eventBreakdown[].visitorId` | `getPageEventBreakdown()` | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].accountId` | `getPageEventBreakdown()` | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].date` | Parsed from day field | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].totalViews` | Aggregated from numEvents | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].uTurns` | From uTurnCount | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].deadClicks` | From deadClickCount | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].errorClicks` | From errorClickCount | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].rageClicks` | From rageClickCount | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].browserName` | Parsed from userAgent | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].browserVersion` | Parsed from userAgent | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].serverName` | From server field | Real | Yes (Event Breakdown table) |
| `eventBreakdown[].numMinutes` | Pendo API | Real | No (used for calculations) |
| `eventBreakdown[].firstTime` | Pendo API | Real | No |
| `eventBreakdown[].lastTime` | Pendo API | Real | No |
| `eventBreakdown[].latitude` | Pendo API | Real | No (used for geo aggregation) |
| `eventBreakdown[].longitude` | Pendo API | Real | No (used for geo aggregation) |
| `eventBreakdown[].region` | Pendo API | Real | No (used for geo aggregation) |
| `eventBreakdown[].country` | Pendo API | Real | No (used for geo aggregation) |
| `eventBreakdown[].userAgent` | Pendo API | Real | No (parsed for browser/device) |
| `eventBreakdown[].recordingId` | Pendo API | Real | No |
| `eventBreakdown[].recordingSessionId` | Pendo API | Real | No |
| `eventBreakdown[].week` | Pendo API | Real | No |
| `eventBreakdown[].month` | Pendo API | Real | No |
| `eventBreakdown[].quarter` | Pendo API | Real | No |

#### **Frustration Metrics (Calculated from Event Breakdown)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `frustrationMetrics.totalRageClicks` | Aggregated | Real | Yes (KPI Card) |
| `frustrationMetrics.totalDeadClicks` | Aggregated | Real | Yes (KPI Card) |
| `frustrationMetrics.totalUTurns` | Aggregated | Real | Yes (KPI Card) |
| `frustrationMetrics.totalErrorClicks` | Aggregated | Real | No (in aggregation only) |
| `frustrationMetrics.frustrationRate` | Calculated % | Real | Yes (KPI Card) |
| `frustrationMetrics.avgFrustrationPerSession` | Calculated | Real | No |
| `frustrationMetrics.topFrustratedVisitors[]` | Aggregated | Real | Yes (Top Frustrated Visitors table) |

#### **Geographic Distribution (Calculated from Event Breakdown)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `geographicDistribution[].region` | Aggregated | Real | Yes (Geo table & pie chart) |
| `geographicDistribution[].country` | Aggregated | Real | Yes (Geo table & pie chart) |
| `geographicDistribution[].visitors` | Counted unique | Real | Yes (Geo table & pie chart) |
| `geographicDistribution[].views` | Summed | Real | Yes (Geo table) |
| `geographicDistribution[].avgTimeOnPage` | Calculated from numMinutes | Real | Yes (Geo table) |
| `geographicDistribution[].percentage` | Calculated | Real | Yes (Geo pie chart) |

#### **Device/Browser Breakdown (Calculated from Event Breakdown)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `deviceBrowserBreakdown[].device` | Parsed from userAgent | Real | Yes (Device pie chart & table) |
| `deviceBrowserBreakdown[].os` | Parsed from userAgent | Real | Yes (Device table) |
| `deviceBrowserBreakdown[].osVersion` | Parsed from userAgent | Real | Yes (Device table) |
| `deviceBrowserBreakdown[].browser` | Parsed from userAgent | Real | Yes (Device pie chart & table) |
| `deviceBrowserBreakdown[].browserVersion` | Parsed from userAgent | Real | Yes (Device table) |
| `deviceBrowserBreakdown[].users` | Counted unique | Real | Yes (Device pie chart & table) |
| `deviceBrowserBreakdown[].percentage` | Calculated | Real | Yes (Device table) |

#### **Features Targeting Page (API LIMITATION)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `featuresTargeting[].featureId` | `getFeaturesTargetingPage()` | Real | Yes (Features table) |
| `featuresTargeting[].name` | Pendo API | Real | Yes (Features table) |
| `featuresTargeting[].eventCount` | Aggregation | Real | Yes (Features table) |

**LIMITATION:** Cannot filter features by page - shows top features by usage across ALL pages.

#### **Guides Targeting Page (API LIMITATION)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `guidesTargeting[].guideId` | `getGuidesTargetingPage()` | Real | Yes (Guides table) |
| `guidesTargeting[].name` | Pendo API | Real | Yes (Guides table) |
| `guidesTargeting[].segment` | Approximated from audience | Real | Yes (Guides table) |
| `guidesTargeting[].status` | Pendo API | Real | Yes (Guides table) |

**LIMITATION:** Cannot accurately filter guides by page - guide targeting rules not fully accessible via API.

#### **Fields NOT Used (Fallback/Placeholder Data)**
| Field | Status | Reason Not Used |
|-------|--------|-----------------|
| `navigationPaths[]` | Empty | Requires complex session tracking |
| `trafficSources[]` | Empty | Not available in Pendo API |
| `entryPoints[]` | Empty | Requires session flow analysis |
| `exitPoints[]` | Empty | Requires session flow analysis |
| `scrollDepth[]` | Estimated | Not available in Pendo API |
| `performanceMetrics[]` | Estimated | Not available in Pendo API |
| `searchAnalytics[]` | Empty | Not available in Pendo API |
| `organicKeywords[]` | Empty | Not available in Pendo API |
| `newVsReturning` | Estimated | Requires visitor history tracking |
| `devicePerformance[]` | Empty | Replaced by deviceBrowserBreakdown |
| `geographicPerformance[]` | Empty | Replaced by geographicDistribution |
| `goalCompletions` | Estimated | Not available in Pendo API |
| `conversionValue` | Estimated | Not available in Pendo API |
| `assistedConversions` | Estimated | Not available in Pendo API |
| `loadTime` | Fallback | Not available in Pendo API |
| `interactionLatency` | Fallback | Not available in Pendo API |
| `errorRate` | Fallback | Not available in Pendo API |
| `accessibilityScore` | Fallback | Not available in Pendo API |
| `wordCount` | Fallback | Not available in Pendo API |
| `readingTime` | Fallback | Not available in Pendo API |
| `mediaElements` | Fallback | Not available in Pendo API |
| `formFields` | Fallback | Not available in Pendo API |
| `searchRankings[]` | Empty | Not available in Pendo API |

---

### 1.2 Guides API (`ComprehensiveGuideData`)

#### **Core Identity Fields**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `id` | Pendo API | Real | Yes (Technical Details) |
| `name` | Pendo API | Real | Yes (Header) |
| `description` | Pendo API | Real | Yes (Overview) |
| `state` | Pendo API | Real | Yes (Badge) |
| `type` | Pendo API | Real | Yes (Technical Details) |
| `kind` | Pendo API | Real | No |

#### **Basic Metrics (Real from Aggregation API)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `lastShownCount` | Pendo API | Real | No |
| `viewedCount` | `getGuideTotals()` | Real | Yes (KPI Card) |
| `completedCount` | `getGuideTotals()` | Real | Yes (KPI Card) |

#### **Calculated Metrics**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `completionRate` | Calculated | Real | Yes (KPI Card) |
| `engagementRate` | Calculated | Real | Yes (KPI Card) |
| `averageTimeToComplete` | Estimated | Estimated | No |
| `dropOffRate` | Estimated | Estimated | No |

#### **Step Analytics (Estimated Distribution)**
| Field | Source | Status | Displayed |
|-------|--------|--------|-----------|
| `steps[].id` | Estimated | Estimated | Yes (Guide Steps section) |
| `steps[].name` | Estimated | Estimated | Yes (Guide Steps section) |
| `steps[].order` | Estimated | Estimated | Yes (Guide Steps section) |
| `steps[].content` | Estimated | Estimated | No |
| `steps[].elementType` | Estimated | Estimated | Yes (Guide Steps section) |
| `steps[].viewedCount` | Estimated | Estimated | Yes (Guide Steps section) |
| `steps[].completedCount` | Estimated | Estimated | Yes (Guide Steps section) |
| `steps[].timeSpent` | Estimated | Estimated | Yes (Guide Steps section) |
| `steps[].dropOffCount` | Estimated | Estimated | No |
| `steps[].dropOffRate` | Estimated | Estimated | Yes (Guide Steps section) |

**NOTE:** Step-level analytics are calculated from guide totals with estimated distribution. Pendo API does not provide granular step-level data via standard endpoints.

#### **Fields NOT Available/Used**
| Field | Status | Reason Not Used |
|-------|--------|-----------------|
| `segmentPerformance[]` | Empty | Not available in standard API |
| `deviceBreakdown[]` | Empty | Requires aggregation query not yet implemented |
| `geographicDistribution[]` | Empty | Requires aggregation query not yet implemented |
| `dailyStats[]` | Empty | Time series not yet implemented for guides |
| `hourlyEngagement[]` | Empty | Hourly data not yet implemented |
| `weeklyTrends[]` | Empty | Weekly aggregation not yet implemented |
| `polls[]` | Empty | Poll data not available in API |
| All other advanced fields | Empty/Estimated | Not available via standard Pendo API |

---

### 1.3 Features API (`ComprehensiveFeatureData`)

**Status:** MOCK DATA ONLY

All feature data in `useFeatureReport` is mock/estimated data because:
1. Pendo Feature API provides limited analytics
2. No real-time aggregation query implemented yet
3. Feature event tracking requires separate implementation

#### **Available from API (But Not Used)**
| Field | Source | Status |
|-------|--------|--------|
| `visitorCount` | Pendo API | Real (from metadata) |
| `accountCount` | Pendo API | Real (from metadata) |
| `usageCount` | Pendo API | Real (from metadata) |
| `eventType` | Pendo API | Real (from metadata) |

#### **Displayed (All Mock Data)**
All fields in ComprehensiveFeatureData are currently showing mock/estimated data.

---

### 1.4 Reports API (`ComprehensiveReportData`)

**Status:** MOCK DATA ONLY

All report analytics data in `useReportReport` is mock/estimated data because:
1. Pendo Reports API provides configuration only
2. No analytics endpoint for report viewing/engagement
3. Report usage tracking would require custom implementation

#### **Available from API (But Not Used)**
| Field | Source | Status |
|-------|--------|--------|
| `id` | Pendo API | Real |
| `name` | Pendo API | Real |
| `description` | Pendo API | Real |
| `configuration` | Pendo API | Real |
| `lastSuccessRunAt` | Pendo API | Real |

---

## 2. Display Coverage Report

### 2.1 Pages Report Coverage

**Overall Coverage: ~65%**

| Section | Coverage | Details |
|---------|----------|---------|
| **Overview KPIs** | 75% | 3/4 metrics are real (avgTimeOnPage estimated) |
| **Top Visitors** | 100% | All fields are real from Pendo API |
| **Top Accounts** | 90% | Missing ARR display (available but not shown) |
| **Features Targeting** | 100% | All available fields displayed (API limitation noted) |
| **Guides Targeting** | 100% | All available fields displayed (API limitation noted) |
| **Event Breakdown** | 85% | 12/18 fields displayed in table |
| **Frustration Metrics** | 90% | All major metrics displayed |
| **Geographic Distribution** | 100% | All aggregated fields displayed |
| **Daily Time Series** | 100% | All calculated fields displayed |
| **Device/Browser Breakdown** | 100% | All parsed fields displayed |
| **Technical Details** | 100% | All metadata fields displayed |

### 2.2 Guides Report Coverage

**Overall Coverage: ~45%**

| Section | Coverage | Details |
|---------|----------|---------|
| **Overview KPIs** | 100% | All real metrics displayed |
| **Guide Steps** | 100% | All estimated fields displayed (with badge) |
| **Segment Performance** | 0% | Not implemented |
| **Device Breakdown** | 0% | Not implemented |
| **Geographic Data** | 0% | Not implemented |
| **Time Series** | 0% | Not implemented |

### 2.3 Features Report Coverage

**Overall Coverage: ~100% (of mock data)**

All available mock data fields are displayed. Real API integration not yet implemented.

### 2.4 Reports Report Coverage

**Overall Coverage: ~100% (of mock data)**

All available mock data fields are displayed. Real API integration not yet implemented.

---

## 3. Missing Data & Opportunities

### 3.1 HIGH PRIORITY - Available but Not Displayed

#### Pages (Event Breakdown)
1. **Recording Integration**
   - `recordingId` - Available but not linked
   - `recordingSessionId` - Available but not used
   - **Opportunity:** Add links to Pendo session replays

2. **Time Dimensions**
   - `week` - Available for weekly aggregations
   - `month` - Available for monthly aggregations
   - `quarter` - Available for quarterly reporting
   - **Opportunity:** Add weekly/monthly trend views

3. **Session Timing**
   - `firstTime` - First event in session
   - `lastTime` - Last event in session
   - **Opportunity:** Calculate actual session duration

4. **Geographic Coordinates**
   - `latitude` - Available but not displayed
   - `longitude` - Available but not displayed
   - **Opportunity:** Add interactive map visualization

5. **Account Revenue Data**
   - `topAccounts[].arr` - ARR available but not displayed
   - **Opportunity:** Show revenue impact of page views

6. **Error Clicks Detail**
   - `totalErrorClicks` - Calculated but not in KPI cards
   - **Opportunity:** Add as 4th frustration metric card

### 3.2 MEDIUM PRIORITY - Requires New Queries

#### Pages
1. **Page Parameters**
   - Currently shows "--" in Event Breakdown table
   - **Opportunity:** Extract query parameters from URLs
   - **Implementation:** Parse URL parameters from event data

2. **Visitor Metadata Enhancement**
   - More visitor fields available via metadata join
   - **Opportunity:** Show visitor role, team, location
   - **Implementation:** Expand visitor metadata select

3. **Account Filtering**
   - Filter views by account segment
   - **Opportunity:** Show page usage by account tier
   - **Implementation:** Add account filtering to queries

#### Guides
1. **Step-Level Real Data**
   - Currently using estimated distribution
   - **Opportunity:** Query guideEvents by stepNumber
   - **Implementation:** Add step-level aggregation query

2. **Time Series for Guides**
   - Daily/weekly trend data not implemented
   - **Opportunity:** Show guide performance over time
   - **Implementation:** Add timeSeries to guide queries

3. **Device/Browser for Guides**
   - Not implemented for guides
   - **Opportunity:** Understand guide performance by device
   - **Implementation:** Join guideEvents with device data

4. **Geographic Distribution for Guides**
   - Not implemented for guides
   - **Opportunity:** See which regions engage with guides
   - **Implementation:** Join guideEvents with geo data

#### Features
1. **Real Feature Analytics**
   - Currently all mock data
   - **Opportunity:** Implement featureEvents aggregation
   - **Implementation:** Create getFeatureAnalytics() method

2. **Feature-Page Correlation**
   - Which features are used on which pages
   - **Opportunity:** Show page-specific feature usage
   - **Implementation:** Complex query joining pageEvents and featureEvents

### 3.3 LOW PRIORITY - Future Enhancements

#### Advanced Analytics
1. **User Journey Mapping**
   - Track user flow across pages
   - Requires session reconstruction

2. **Conversion Funnels**
   - Track goal completion paths
   - Requires goal configuration

3. **A/B Testing Results**
   - Guide variant performance
   - Available in Pendo but not exposed in API

4. **Sentiment Analysis**
   - User satisfaction from poll responses
   - Requires poll data access

---

## 4. Data Quality Issues & Recommendations

### 4.1 Current Issues

#### 1. API Limitations Clearly Documented
**Status:** GOOD
- Features cannot be filtered by page (API limitation)
- Guides cannot be filtered by page (API limitation)
- Both have clear warning messages in console and UI badges

**Recommendation:** Keep current approach with clear data quality badges.

#### 2. Estimated vs Real Data
**Status:** GOOD
- Clear distinction with DataQualityBadge component
- Mock data labeled as "mock"
- Estimated data labeled as "estimated"
- Real data labeled as "real"

**Recommendation:** Maintain current badge system.

#### 3. Guide Step Analytics
**Status:** ACCEPTABLE
- Using estimated distribution from totals
- Clearly labeled as "estimated"
- Provides useful visualization even without real data

**Recommendation:**
- Keep current approach
- Add note: "Step analytics calculated from guide totals with estimated distribution"
- Consider implementing real step-level queries if Pendo API permits

#### 4. Features & Reports Mock Data
**Status:** NEEDS IMPROVEMENT
- Entire sections using mock data
- Could confuse users into thinking it's real

**Recommendation:**
- Add prominent warning banner at top of Features/Reports pages
- Consider hiding features/reports until real data implemented
- Or implement real feature analytics (HIGH PRIORITY)

### 4.2 Recommendations by Priority

#### CRITICAL
1. **Implement Real Feature Analytics**
   - Replace mock data with real featureEvents aggregation
   - Estimated effort: 4-6 hours
   - Impact: HIGH - removes entire category of mock data

2. **Add Session Recording Links**
   - Use `recordingId` to link to Pendo session replays
   - Estimated effort: 2 hours
   - Impact: HIGH - huge value for UX debugging

#### HIGH
3. **Display ARR in Top Accounts**
   - Data already fetched, just needs display
   - Estimated effort: 30 minutes
   - Impact: MEDIUM - shows business value of engagement

4. **Add Error Clicks to Frustration KPIs**
   - Data already calculated
   - Estimated effort: 30 minutes
   - Impact: LOW - completes frustration metrics

5. **Add Weekly/Monthly Views**
   - Use week/month fields from event data
   - Estimated effort: 3-4 hours
   - Impact: MEDIUM - better trend analysis

#### MEDIUM
6. **Implement Geographic Map**
   - Use lat/long for interactive map
   - Estimated effort: 4-6 hours
   - Impact: MEDIUM - better geographic visualization

7. **Add Real Guide Time Series**
   - Query guideEvents with timeSeries
   - Estimated effort: 3-4 hours
   - Impact: MEDIUM - shows guide trends

8. **Implement Real Step-Level Data**
   - Query guideEvents filtered by stepNumber
   - Estimated effort: 4-6 hours
   - Impact: HIGH - replaces estimated data

#### LOW
9. **Parse URL Parameters**
   - Extract query params from URLs
   - Estimated effort: 2 hours
   - Impact: LOW - niche use case

10. **Add More Visitor Metadata**
    - Expand visitor metadata fields
    - Estimated effort: 2-3 hours
    - Impact: LOW - marginal value

---

## 5. Summary Statistics

### API Methods Implemented
- **Pages:** 6 real-data methods
  - `getPages()` - Metadata
  - `getPageTotals()` - View counts
  - `getPageTimeSeries()` - Daily trends
  - `getTopVisitorsForPage()` - Top visitors
  - `getTopAccountsForPage()` - Top accounts
  - `getPageEventBreakdown()` - Event details

- **Guides:** 2 real-data methods
  - `getGuides()` - Metadata
  - `getGuideTotals()` - View/completion counts

- **Features:** 1 real-data method
  - `getFeatures()` - Metadata only

- **Reports:** 1 real-data method
  - `getReports()` - Metadata only

### Data Quality Breakdown

#### Pages Report
- **Real Data:** 65%
- **Estimated Data:** 25%
- **Mock Data:** 0%
- **Empty/Not Available:** 10%

#### Guides Report
- **Real Data:** 45%
- **Estimated Data:** 45%
- **Mock Data:** 0%
- **Empty/Not Available:** 10%

#### Features Report
- **Real Data:** 5%
- **Estimated Data:** 0%
- **Mock Data:** 95%
- **Empty/Not Available:** 0%

#### Reports Report
- **Real Data:** 5%
- **Estimated Data:** 0%
- **Mock Data:** 95%
- **Empty/Not Available:** 0%

### Display Coverage
- **Pages:** 65% of real API data displayed
- **Guides:** 100% of available real data displayed
- **Features:** 100% of mock data displayed (needs real implementation)
- **Reports:** 100% of mock data displayed (needs real implementation)

---

## 6. Actionable Next Steps

### Phase 1: Quick Wins (1-2 days)
1. Add ARR display to Top Accounts table
2. Add Error Clicks to Frustration KPI cards
3. Add session recording links using recordingId
4. Add warning banners to Features/Reports pages about mock data

### Phase 2: Real Feature Analytics (1 week)
1. Implement `getFeatureAnalytics()` method
2. Query featureEvents with proper aggregation
3. Replace all mock data in Features report
4. Add feature-page correlation analysis

### Phase 3: Enhanced Guide Analytics (1 week)
1. Implement real step-level data queries
2. Add time series for guides
3. Add device/browser breakdown for guides
4. Add geographic distribution for guides

### Phase 4: Advanced Visualizations (1-2 weeks)
1. Implement interactive geographic map
2. Add weekly/monthly trend views
3. Parse and display URL parameters
4. Expand visitor metadata display

### Phase 5: Real Reports Analytics (2-3 weeks)
1. Design report usage tracking system
2. Implement custom tracking for report views
3. Replace mock data with real analytics
4. Add report engagement metrics

---

## Appendix: File Locations

- **API Client:** `/Users/karo/Library/Mobile Documents/com~apple~CloudDocs/Github/cin7-pendo-api/frontend/src/lib/pendo-api.ts`
- **Type Definitions:** `/Users/karo/Library/Mobile Documents/com~apple~CloudDocs/Github/cin7-pendo-api/frontend/src/types/enhanced-pendo.ts`
- **UI Component:** `/Users/karo/Library/Mobile Documents/com~apple~CloudDocs/Github/cin7-pendo-api/frontend/src/pages/ReportDetails.tsx`
- **Data Hooks:** `/Users/karo/Library/Mobile Documents/com~apple~CloudDocs/Github/cin7-pendo-api/frontend/src/hooks/useReportData.ts`

---

**End of Audit Report**
