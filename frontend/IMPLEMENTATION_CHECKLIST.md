# Pendo API Fixes - Implementation Checklist

## CRITICAL FIXES (Do First - 2-4 hours)

### 1. Fix `getPageTimeSeries()` Count Direction
**File:** `src/lib/pendo-api.ts` at line 1721

- [ ] Change `count: days` to `count: -days`
- [ ] Test with a real page ID
- [ ] Verify console shows multiple days of data
- [ ] Confirm chart displays multiple points

**Code Change:**
```typescript
timeSeries: {
  first: "now()",
  count: -days,  // CHANGE THIS LINE
  period: "dayRange"
}
```

### 2. Fix `getPageEventBreakdown()` Count Direction
**File:** `src/lib/pendo-api.ts` at line 2495

- [ ] Change `count: days` to `count: -30`
- [ ] Add GROUP aggregation to pipeline (see below)
- [ ] Add limit: 500 to pipeline
- [ ] Test timeout is resolved
- [ ] Verify data loads within 10 seconds

**Code Change:**
```typescript
{
  source: {
    pageEvents: null,
    timeSeries: {
      first: "now()",
      count: -30,  // CHANGE THIS LINE
      period: "dayRange"
    }
  }
},
{ filter: `pageId == "${pageId}"` },
{ identified: "visitorId" },
{
  group: {  // ADD THIS BLOCK
    group: ["visitorId", "day"],
    fields: {
      totalViews: { sum: "numEvents" },
      numMinutes: { sum: "numMinutes" },
      rageClicks: { sum: "rageClickCount" },
      deadClicks: { sum: "deadClickCount" },
      uTurns: { sum: "uTurnCount" },
      errorClicks: { sum: "errorClickCount" }
    }
  }
},
{ sort: ["-day", "-totalViews"] },
{ limit: 500 }  // ADD THIS LINE
```

### 3. Increase Timeout (Temporary Safety Net)
**File:** `src/lib/pendo-api.ts` at line 524

- [ ] Change 30000 to 60000
- [ ] Add comment explaining this is temporary
- [ ] Plan to reduce back to 30000 after optimizations

**Code Change:**
```typescript
}, 60000); // 60 second timeout - temporary until query optimization complete
```

---

## HIGH PRIORITY FIXES (Do Second - 4-6 hours)

### 4. Fix Frustration Metrics Warning
**File:** `src/lib/pendo-api.ts` at line 3334

- [ ] Remove misleading warning
- [ ] Add accurate clarification

**Code Change:**
```typescript
// REMOVE
console.warn(`⚠️ API LIMITATION: Frustration metrics not available - would require separate 'events' source query`);

// REPLACE WITH
console.log(`✅ Frustration metrics available for pages: rageClicks, deadClicks, uTurns, errorClicks`);
console.warn(`⚠️ API LIMITATION: Frustration metrics NOT available for individual features (featureEvents limitation)`);
```

### 5. Calculate Real avgTimeOnPage
**File:** `src/lib/pendo-api.ts` at line 1815

- [ ] Replace random estimate with calculation from eventBreakdown
- [ ] Test shows real average time
- [ ] Verify calculation logic is correct

**Code Change:**
```typescript
// MOVE THIS CALCULATION TO AFTER eventBreakdown is fetched (around line 1960)
const avgTimeOnPage = (() => {
  if (!comprehensiveData.eventBreakdown || comprehensiveData.eventBreakdown.length === 0) {
    return 0;
  }
  const totalMinutes = comprehensiveData.eventBreakdown.reduce((sum, event) => sum + (event.numMinutes || 0), 0);
  const totalViews = comprehensiveData.eventBreakdown.reduce((sum, event) => sum + event.totalViews, 0);
  return totalViews > 0 ? Math.floor((totalMinutes / totalViews) * 60) : 0; // Convert to seconds
})();
```

### 6. Populate Real Device Performance
**File:** `src/lib/pendo-api.ts` at line 1884

- [ ] Map deviceBrowserBreakdown to devicePerformance format
- [ ] Remove empty array placeholder
- [ ] Test device breakdown displays correctly

**Code Change:**
```typescript
// AFTER line 1967 where deviceBrowserBreakdown is calculated
devicePerformance: comprehensiveData.deviceBrowserBreakdown?.map(d => ({
  device: d.device,
  platform: d.os,
  browser: d.browser,
  users: d.users,
  percentage: d.percentage,
  completionRate: 0, // Not available
  averageTimeSpent: avgTimeOnPage, // Use calculated average
})) || [],
```

### 7. Populate Real Geographic Performance
**File:** `src/lib/pendo-api.ts` at line 1885

- [ ] Map geographicDistribution to geographicPerformance format
- [ ] Remove empty array placeholder
- [ ] Test geographic data displays correctly

**Code Change:**
```typescript
// AFTER line 1965 where geographicDistribution is calculated
geographicPerformance: comprehensiveData.geographicDistribution?.map(g => ({
  region: g.region,
  country: g.country,
  city: undefined,
  users: g.visitors,
  percentage: g.percentage,
  completionRate: 0, // Not available
  language: 'en', // Default, not available from API
})) || [],
```

---

## MEDIUM PRIORITY (Do Third - 2-3 hours)

### 8. Add Data Quality Badges
**File:** `src/pages/ReportDetails.tsx`

- [ ] Import DataQualityBadge component (already exists)
- [ ] Add badge to all metric displays
- [ ] Legend: REAL DATA, CALCULATED, ESTIMATED, NOT AVAILABLE

**Example:**
```tsx
<div className="flex items-center justify-between">
  <span>Page Views</span>
  <div className="flex items-center gap-2">
    <span className="font-bold">{data.viewedCount.toLocaleString()}</span>
    <DataQualityBadge quality="real" />
  </div>
</div>
```

### 9. Remove Unavailable Data Sections
**File:** `src/lib/pendo-api.ts`

- [ ] Remove scrollDepth (lines 1862-1867) OR show "Not Available"
- [ ] Remove searchAnalytics (lines 1875-1877)
- [ ] Remove/replace performanceMetrics (lines 1869-1873)
- [ ] Update UI to handle missing sections gracefully

### 10. Document Changes
**Files:** Code comments, README updates

- [ ] Add comments explaining each fix
- [ ] Update README with Pendo API capabilities
- [ ] Document what data is real vs calculated
- [ ] Add troubleshooting guide

---

## TESTING CHECKLIST

### After CRITICAL Fixes:
- [ ] Open browser console (F12)
- [ ] Navigate to Reports > Pages > Select any page
- [ ] Verify NO timeout errors in console
- [ ] Verify charts show 7-30 data points (not just 1)
- [ ] Verify page loads within 10 seconds
- [ ] Test with 3 different page IDs

### After HIGH PRIORITY Fixes:
- [ ] Verify Device/Browser breakdown shows real data
- [ ] Verify Geographic distribution shows real countries/regions
- [ ] Verify Time on Page shows reasonable value (not random)
- [ ] Check console for frustration metrics - should see actual counts
- [ ] Verify no "API LIMITATION" warnings are incorrect

### After MEDIUM PRIORITY Fixes:
- [ ] All metrics have quality badges
- [ ] No confusing mock data displayed
- [ ] UI looks professional and trustworthy
- [ ] Data quality legend is clear

---

## ROLLBACK PLAN

If any change causes issues:

1. **Quick Rollback:**
   ```bash
   git stash  # Save current changes
   git checkout HEAD~1  # Go back one commit
   npm run dev  # Test if working
   ```

2. **Identify Problem:**
   - Check browser console for errors
   - Check network tab for failed API calls
   - Check terminal for build errors

3. **Selective Fix:**
   ```bash
   git stash pop  # Restore changes
   # Revert specific lines that caused issue
   git diff  # Review what changed
   ```

---

## VALIDATION

Before considering complete:

- [ ] No timeout errors in console
- [ ] All charts display multiple data points
- [ ] Page analytics loads consistently under 15 seconds
- [ ] Device/Browser/Geographic data is REAL (not mock)
- [ ] Time on Page calculated from real sessions
- [ ] Frustration metrics display actual values
- [ ] All displayed data clearly marked as REAL, CALCULATED, or ESTIMATED
- [ ] No misleading "API LIMITATION" warnings
- [ ] Documentation updated
- [ ] Tested on multiple pages (at least 5 different page IDs)

---

## COMMIT STRATEGY

### Commit 1: Critical Fixes
```bash
git add src/lib/pendo-api.ts
git commit -m "🐛 CRITICAL FIX: Correct timeSeries count direction to prevent timeouts

- Change count from positive to negative in getPageTimeSeries (line 1721)
- Change count from positive to negative in getPageEventBreakdown (line 2495)
- Add GROUP aggregation to eventBreakdown pipeline
- Add limit to prevent excessive data fetching
- Increase timeout to 60s as temporary safety measure

This fixes the root cause of 30-second timeout errors and single-point chart data."
```

### Commit 2: Real Data Integration
```bash
git add src/lib/pendo-api.ts
git commit -m "✨ Replace mock data with real Pendo API data

- Calculate real avgTimeOnPage from numMinutes field
- Populate devicePerformance from deviceBrowserBreakdown
- Populate geographicPerformance from geographicDistribution
- Fix frustration metrics warning (metrics ARE available for pages)
- Remove misleading API limitation warnings

Increases real data utilization from ~60% to ~85%."
```

### Commit 3: UI Polish
```bash
git add src/pages/ReportDetails.tsx src/lib/pendo-api.ts
git commit -m "💄 Add data quality indicators and remove unavailable sections

- Add DataQualityBadge to all metrics (REAL, CALCULATED, ESTIMATED)
- Remove scroll depth (not available in Pendo)
- Remove search analytics (not available in Pendo)
- Update documentation with accurate API capabilities

Users can now clearly distinguish real vs estimated data."
```

---

## ESTIMATED TIME

- **CRITICAL Fixes:** 2-4 hours
- **HIGH PRIORITY Fixes:** 4-6 hours
- **MEDIUM PRIORITY:** 2-3 hours
- **Testing & Documentation:** 2 hours

**Total:** 10-15 hours

---

## QUESTIONS TO RESOLVE

1. **Guide Step Data:** Can we get real step data from `/api/v1/guide/{id}`?
   - Action: Test API endpoint and examine response
   - If yes: Replace generateFallbackStepData()

2. **Hourly Breakdown:** Is hourly data available by changing period to "hourRange"?
   - Action: Test timeSeries with period: "hourRange"
   - If yes: Add real hourly traffic data

3. **Account Metadata:** Can we get account names/ARR from `/api/v1/account`?
   - Action: Test accounts endpoint
   - If yes: Enrich account data with real names

---

**READY TO IMPLEMENT**

See `PENDO_API_ANALYSIS.md` for detailed explanations and context.
