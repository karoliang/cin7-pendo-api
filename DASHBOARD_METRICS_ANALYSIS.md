# Dashboard Metrics Analysis & Optimization Plan
**Date:** 2025-11-08
**Status:** Analysis Complete - Ready for Implementation

---

## Executive Summary

After deep investigation of Pendo API capabilities and database content, we identified which metrics have real data and which are always empty. This document provides recommendations for dashboard optimization.

---

## Data Availability Analysis

### ✅ METRICS WITH REAL DATA

| Metric | Data Source | Coverage | Status |
|--------|-------------|----------|--------|
| **Total Guides** | pendo_guides table | 548 total, 92 with views (16.8%) | ✅ KEEP |
| **Features** | pendo_features table | Usage count & unique users | ✅ KEEP |
| **Pages** | pendo_pages table | Views data available | ✅ KEEP |
| **Reports** | pendo_reports table | Full data | ✅ KEEP |
| **Period Activity** | pendo_events table | Calculable from events | ✅ KEEP |
| **NPS Survey Data** | "Omni NPS Survey" guide | 199 views | ✅ IMPLEMENT |

### ❌ METRICS WITH NO DATA

| Metric | Reason | API Test Result | Recommendation |
|--------|--------|-----------------|----------------|
| **Avg. Completion Rate** | No completion tracking | 0% for all 548 guides | ❌ REMOVE |
| **Frustration Score** | Pendo API doesn't support | rageClick, deadClick, errorClick all return 404 | ❌ REMOVE |
| **Total ARR** | No Account API access | Account endpoint returns 404 | ❌ REMOVE |
| **Avg. Bounce Rate** | Not populated in database | bounce_rate always 0 in pages table | ❌ REMOVE |
| **Geographic Data** | Not populated | geographic_data always empty object | ❌ REMOVE COMPONENT |

---

## API Investigation Results

### Test 1: NPS Data
**Status:** ✅ AVAILABLE (via Aggregation API)

```
Found 3 NPS/Poll guides:
- Omni NPS Survey: 199 views ← ACTIVE
- 23Jan_OmniNPS: 0 views
- Test_NewReleasePoll: 0 views
```

**Implementation Path:**
- Use Pendo Aggregation API with pipeline structure
- Fetch quantitative (0-10 rating) and qualitative (text feedback) separately
- Merge on visitorId
- Calculate NPS score: (% Promoters) - (% Detractors)
- Categorize: Promoters (9-10), Passives (7-8), Detractors (0-6)

### Test 2: Frustration Metrics
**Status:** ❌ NOT AVAILABLE

```
Tested endpoints:
- rageClick: 404 Not Found
- deadClick: 404 Not Found
- errorClick: 404 Not Found
- thrashing: 404 Not Found
```

**Reason:** Pendo API does not expose frustration/track events via Aggregation API. These may be Pendo Behavior features requiring separate license.

### Test 3: Guide Completion Data
**Status:** ❌ NOT TRACKED

```
Database analysis:
- Total guides: 548
- Guides with views: 92 (16.8%)
- Guides with completions: 0 (0.0%)
- Average completion rate: 0.0%
```

**Event Structure:**
- All guide events stored as type: "guideEvents"
- No subdivision into guideSeen/guideAdvanced/guideCompleted
- Cannot calculate completion metrics with current data

### Test 4: ARR/Account Data
**Status:** ❌ NOT AVAILABLE

```
Account API test: 404 Not Found
Pages table top_accounts field: {} (empty object)
```

**Reason:** Account API requires additional permissions or enterprise tier access.

### Test 5: Geographic & Bounce Rate Data
**Status:** ❌ NOT POPULATED

```
Pages table schema:
- bounce_rate: exists but always 0
- geographic_data: exists but always empty {}
- avg_time_on_page: exists but always 0
```

**Reason:** These fields exist in schema but are not populated by current sync process. Would require additional Aggregation API calls to populate.

---

## Current Dashboard State

### KPI Cards (9 total)

| # | Card | Has Data | Action |
|---|------|----------|--------|
| 1 | Total Guides | ✅ Yes (92/548) | KEEP |
| 2 | Features | ✅ Yes (71 features) | KEEP |
| 3 | Pages | ✅ Yes (31 pages) | KEEP |
| 4 | Reports | ✅ Yes (485 reports) | KEEP |
| 5 | Avg. Completion Rate | ❌ Always 0.0% | **REMOVE** |
| 6 | Period Activity | ✅ Yes (calculable) | KEEP |
| 7 | Avg. Bounce Rate | ❌ Always 0% | **REMOVE** |
| 8 | Frustration Score | ❌ Always N/A | **REMOVE** |
| 9 | Total ARR | ❌ Always $0 | **REMOVE** |

### Dashboard Components

| Component | Has Data | Action |
|-----------|----------|--------|
| KPI Cards | Partial | Remove 4 empty cards |
| FrustrationMetrics | ❌ No data | **REMOVE COMPONENT** |
| GeographicMap | ❌ No data | **REMOVE COMPONENT** |
| FeatureAdoptionChart | ✅ Has data | KEEP |
| PageAnalyticsChart | ✅ Has data | KEEP |
| Recent Activity | ✅ Has data | KEEP |

---

## Optimization Recommendations

### Phase 1: Remove Empty Metrics (Immediate)

**Remove KPI Cards:**
1. Avg. Completion Rate → Dashboard.tsx:486-492
2. Avg. Bounce Rate → Dashboard.tsx:502-508
3. Frustration Score → Dashboard.tsx:510-516
4. Total ARR → Dashboard.tsx:518-524

**Remove Components:**
1. FrustrationMetrics component → Dashboard.tsx:581-585
2. GeographicMap component → Dashboard.tsx:587-591

**Expected Result:**
- Dashboard reduced from 9 KPIs to 5 KPIs
- 2 components removed
- Cleaner, data-focused dashboard

### Phase 2: Simplify Date Range Selector (Immediate)

**Current Issue:**
- Entire card/div displayed with verbose UI
- Takes too much space

**Solution:**
- Simplify to single dropdown only
- Remove card wrapper
- Make it inline in header

**Default Date Range:**
- Change from "Last 7 days" to "All time"
- Gives better overview of all available data
- Users can narrow down as needed

### Phase 3: Implement NPS Dashboard (Week 3)

**What Product Leadership Wants:**
> "Product leadership interest if we can pull the NPS details to the dashboard"

**Implementation:**
1. Create NPSDashboard component
2. Use Pendo Aggregation API to fetch poll responses
3. Display:
   - Current NPS Score (-100 to +100)
   - Promoters/Passives/Detractors breakdown
   - Trend over time
   - Recent qualitative feedback
4. Add to main dashboard as prominent widget

**Data Available:**
- Omni NPS Survey has 199 responses
- Can fetch via Aggregation API (per PENDO_LISTEN_RESEARCH_REPORT.md)

---

## Implementation Plan

### Step 1: Simplify DateRangeSelector
```typescript
// Change DateRangeSelector to show only dropdown
// Remove card wrapper
// Set default to "all" instead of "7days"
```

### Step 2: Remove Empty KPI Cards
```typescript
// In Dashboard.tsx kpiData array (lines 452-526)
// Remove indices: 4 (completion rate), 6 (bounce rate), 7 (frustration), 8 (ARR)
// Keep: Total Guides, Features, Pages, Reports, Period Activity
```

### Step 3: Remove Empty Components
```typescript
// Remove FrustrationMetrics component (lines 581-585)
// Remove GeographicMap component (lines 587-591)
// Remove unused imports
```

### Step 4: Update Default Date Range
```typescript
// In filterStore.ts
// Change initial dateRange from 7 days to all time
```

### Step 5: Create NPS Dashboard (Future)
```typescript
// Create components/dashboard/NPSDashboard.tsx
// Implement Aggregation API integration
// Add to main Dashboard
```

---

## Benefits

### User Experience
- ✅ Cleaner dashboard with only relevant metrics
- ✅ No more confusing "N/A" or "0%" metrics
- ✅ Simplified date range selector
- ✅ Better default view (all data instead of 7 days)

### Product Leadership Value
- ✅ Focus on metrics that matter
- ✅ NPS data prominently displayed (requested feature)
- ✅ Clear, actionable insights

### Performance
- ✅ Fewer components = faster page load
- ✅ Reduced calculation overhead
- ✅ Less API/database queries

---

## Metrics After Optimization

### Before
- 9 KPI Cards (4 always empty)
- 5 Dashboard Components (2 with no data)
- Cluttered UI with misleading zeros

### After
- 5 KPI Cards (all with real data)
- 3 Dashboard Components (all functional) + NPS widget
- Clean, data-driven dashboard

---

## Next Steps

1. ✅ Complete this analysis
2. ⏳ Simplify DateRangeSelector UI
3. ⏳ Change default date range to "All"
4. ⏳ Remove empty KPI cards from Dashboard
5. ⏳ Remove FrustrationMetrics component
6. ⏳ Remove GeographicMap component
7. ⏳ Test and commit changes
8. 📅 Week 3: Implement NPS Dashboard widget

---

**Report Generated:** 2025-11-08
**Analysis By:** Claude Code Deep Investigation
**Status:** Ready for Implementation
