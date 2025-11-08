# Reports Implementation - Quick Reference Guide

## File Locations & Key Line Numbers

### Type Definitions
- **Report interface**: `frontend/src/types/pendo.ts:45-53`
- **ComprehensiveReportData interface**: `frontend/src/types/enhanced-pendo.ts:612-711`
- **Report-related types**: Lines 558-611 (ReportSection, UserFeedback, ReportUsagePattern, etc.)

### API Implementation
- **getReports()**: `frontend/src/lib/pendo-api.ts:630-641`
- **transformReport()**: `frontend/src/lib/pendo-api.ts:3605-3613`
- **getMockReports()**: `frontend/src/lib/pendo-api.ts:3741-3762`

### Hook Implementation
- **useReportReport hook**: `frontend/src/hooks/useReportData.ts:218-675`
  - Lines 218-240: Query setup and data generation
  - Lines 241-310: Section engagement (hard-coded)
  - Lines 312-344: User feedback (hard-coded)
  - Lines 346-375: Usage patterns (hard-coded)
  - Lines 377-399: Collaboration metrics (hard-coded)
  - Lines 401-430: Filter usage analytics (hard-coded)
  - Lines 432-446: Daily engagement time series (generated, not real)
  - Lines 448-471: Chart interactions (hard-coded)
  - Lines 473-493: Share network (hard-coded)
  - Lines 495-503: Performance metrics (random)
  - Lines 505-535: User segmentation (hard-coded)
  - Lines 537-566: Geographic distribution (hard-coded)
  - Lines 569-597: Device breakdown (hard-coded)
  - Lines 612-644: AI insights and recommendations (hard-coded)

### UI Implementation
- **DataTables Reports tab**: `frontend/src/pages/DataTables.tsx:588-598`
- **Reports summary metrics**: `frontend/src/pages/DataTables.tsx:348-357`
- **"Coming Soon" notice**: `frontend/src/pages/DataTables.tsx:937-957`
- **ReportDetails page**: `frontend/src/pages/ReportDetails.tsx:1-2141`

### Report Components
- **ReportLineChart**: `frontend/src/components/reports/ReportLineChart.tsx`
- **ReportBarChart**: `frontend/src/components/reports/ReportBarChart.tsx`
- **ReportPieChart**: `frontend/src/components/reports/ReportPieChart.tsx`
- **ReportHeatmap**: `frontend/src/components/reports/ReportHeatmap.tsx`

---

## What's Real vs Mock

### REAL (From Pendo API)
✅ `getReports()` - Fetches actual reports from Pendo `/api/v1/report` endpoint
✅ Report metadata (name, description, createdAt, updatedAt, lastSuccessRunAt)

### MOCK/GENERATED (NOT from Pendo API)
❌ All metrics in `useReportReport` hook (460 lines of mock data)
❌ Section engagement data
❌ User feedback ratings and comments
❌ Usage pattern breakdowns
❌ Collaboration metrics
❌ Filter usage analytics
❌ Time series data (generated, not real)
❌ Chart interactions
❌ Share network
❌ Performance metrics
❌ User segmentation
❌ Geographic distribution
❌ Device breakdown
❌ AI insights and recommendations

---

## Comparison: How Guides Do It (For Reference)

### getGuideAnalytics() Implementation
**Location**: `frontend/src/lib/pendo-api.ts:752-905`

1. **Fetch base data**
   ```typescript
   const guide = await this.getGuideById(id, true); // Fetch with real analytics
   ```

2. **Parallel fetch all analytics** (Promise.allSettled)
   ```typescript
   const [timeSeriesData, stepAnalytics, segmentData, deviceData, ...] 
     = await Promise.allSettled([
       this.getGuideTimeSeries(id, period),
       this.getGuideStepAnalytics(id, period),
       // ... 8 more real API calls
     ]);
   ```

3. **Handle results with fallbacks**
   ```typescript
   const analytics = {
     timeSeriesData: this.handlePromiseResult(timeSeriesData, this.generateFallbackTimeSeries(30)),
     stepAnalytics: this.handlePromiseResult(stepAnalytics, this.generateFallbackStepData()),
     // ... etc
   };
   ```

4. **Build comprehensive response**
   ```typescript
   return {
     id: guide.id,
     name: guide.name,
     viewedCount: guide.viewedCount, // REAL DATA
     completedCount: guide.completedCount, // REAL DATA
     completionRate: guide.viewedCount > 0 ? (guide.completedCount / guide.viewedCount) * 100 : 0, // CALCULATED
     steps: analytics.stepAnalytics, // FROM REAL API OR FALLBACK
     dailyStats: analytics.timeSeriesData, // FROM REAL API OR FALLBACK
     // ... all fields populated with real or fallback data
   };
   ```

---

## Missing Reports Analytics Methods

Copy this pattern for Reports implementation:

```typescript
// In pendo-api.ts, after getFeatureAnalytics() around line 2345

async getReportAnalytics(id: string, period: { start: string; end: string }): Promise<ComprehensiveReportData> {
  try {
    // 1. Get report metadata
    const report = await this.getReports().then(reports => 
      reports.find(r => r.id === id)
    );
    
    if (!report) {
      throw new Error(`Report ${id} not found`);
    }

    // 2. Fetch all real analytics in parallel
    const [
      timeSeriesData,
      sectionEngagement,
      userFeedback,
      usagePatterns,
      collaborationMetrics,
      filterUsage,
      deviceData,
      geographicData,
      performanceMetrics
    ] = await Promise.allSettled([
      this.getReportTimeSeries(id, period),
      this.getReportSectionEngagement(id, period),
      this.getReportUserFeedback(id),
      this.getReportUsagePatterns(id, period),
      this.getReportCollaborationMetrics(id),
      this.getReportFilterUsage(id),
      this.getReportDeviceBreakdown(id, period),
      this.getReportGeographicData(id, period),
      this.getReportPerformanceMetrics(id, period),
    ]);

    // 3. Build response with real or fallback data
    return {
      // Core Identity - REAL
      id: report.id,
      name: report.name,
      description: report.description,
      
      // Basic Metrics - REAL FROM API
      totalViews: this.handlePromiseResult(timeSeriesData, [])
        .reduce((sum, day) => sum + day.views, 0),
      uniqueViewers: this.handlePromiseResult(timeSeriesData, [])
        .reduce((sum, day) => sum + day.uniqueVisitors, 0),
      shares: 0, // Would come from event data
      downloads: 0, // Would come from event data
      averageRating: null, // Not available from Pendo API
      
      // Advanced Analytics - FROM API OR FALLBACK
      sectionEngagement: this.handlePromiseResult(
        sectionEngagement, 
        this.generateFallbackSectionEngagement()
      ),
      userFeedback: this.handlePromiseResult(
        userFeedback, 
        this.generateFallbackUserFeedback()
      ),
      usagePatterns: this.handlePromiseResult(
        usagePatterns,
        this.generateFallbackUsagePatterns()
      ),
      
      // ... continue for all fields
    };
  } catch (error) {
    console.error('Error fetching report analytics:', error);
    throw error;
  }
}

// Supporting methods to implement:
private async getReportTimeSeries(id: string, period: { start: string; end: string }) {
  // Query Pendo aggregation API for daily report views/interactions
}

private async getReportTotals(id: string) {
  // Get total views, interactions, shares, downloads
}

private async getReportSectionEngagement(id: string, period: { start: string; end: string }) {
  // Get breakdown of engagement by report section
}

private async getReportUserFeedback(id: string) {
  // Get user ratings and comments (from Supabase if not in Pendo)
}

private async getReportUsagePatterns(id: string, period: { start: string; end: string }) {
  // Analyze viewing patterns (quick glance vs deep dive)
}

private async getReportCollaborationMetrics(id: string) {
  // Get sharing and collaboration metrics
}

private async getReportFilterUsage(id: string) {
  // Analyze which filters users apply and impact
}

private async getReportDeviceBreakdown(id: string, period: { start: string; end: string }) {
  // Get device/browser breakdown (reuse from features pattern)
}

private async getReportGeographicData(id: string, period: { start: string; end: string }) {
  // Get geographic distribution (reuse from features pattern)
}

private async getReportPerformanceMetrics(id: string, period: { start: string; end: string }) {
  // Get client-side performance data
}
```

---

## How to Update the Hook

In `frontend/src/hooks/useReportData.ts`, replace the entire `useReportReport` function (lines 218-675):

```typescript
export const useReportReport = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['report-report', id],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      try {
        console.log(`🚀 useReportReport: Fetching analytics for report ${id}`);

        // Calculate date range for analytics (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const period = {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };

        // Fetch REAL comprehensive analytics data from Pendo API
        // (Instead of: const analyticsData: ComprehensiveReportData = { ... 460 lines of mock ... })
        const analyticsData = await pendoAPI.getReportAnalytics(id, period);

        if (!analyticsData) {
          throw new Error('Report analytics not found');
        }

        console.log(`✅ useReportReport: Successfully fetched analytics for ${analyticsData.name}`);
        console.log(`📊 Summary: ${analyticsData.totalViews} views, ${analyticsData.uniqueViewers} unique viewers`);

        return analyticsData;
      } catch (error) {
        console.error('❌ useReportReport: Error fetching report:', error);

        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            throw new Error(`Report "${id}" not found. Please verify the report ID.`);
          }
        }

        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
```

---

## How to Update DataTables Display

In `frontend/src/pages/DataTables.tsx`:

1. **Add more report metrics** (replace lines 348-357):
   ```typescript
   const reportsData = sortedData.reports as Report[];
   const reportsWithRuns = reportsData.filter(r => r.lastSuccessRunAt).length;
   const reportsNeverRun = reportsData.length - reportsWithRuns;
   const recentReports = reportsData.filter(r => {
     if (!r.lastSuccessRunAt) return false;
     const lastRun = new Date(r.lastSuccessRunAt);
     const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
     return lastRun >= weekAgo;
   }).length;
   
   // ADD THESE:
   const avgViewsPerReport = reportsData.length > 0 
     ? Math.round(totalReportViews / reportsData.length) 
     : 0;
   const mostViewedReport = reportsData
     .sort((a, b) => (b.lastSuccessRunAt ? 1 : 0) - (a.lastSuccessRunAt ? 1 : 0))
     .slice(0, 1)[0];
   ```

2. **Add more columns to reports table** (after line 598):
   ```typescript
   case 'reports':
     return [
       { key: 'name', header: 'Name', sortable: true },
       { key: 'description', header: 'Description', sortable: false },
       { key: 'lastSuccessRunAt', header: 'Last Run', sortable: true, render: (value: unknown) => (
         value ? new Date(value as string).toLocaleDateString() : 'Never'
       )},
       // ADD THESE:
       { key: 'configuration', header: 'Type', sortable: true, render: (value: unknown) => {
         const config = value as Record<string, any>;
         return config?.reportType ? String(config.reportType) : 'Standard';
       }},
       { key: 'createdAt', header: 'Created', sortable: true, render: (value: unknown) => (
         new Date(value as string).toLocaleDateString()
       )},
     ];
   ```

3. **Remove or update "Coming Soon" notice** (lines 937-957):
   - Replace with actual metrics cards similar to Features/Pages tabs

---

## Implementation Checklist

- [ ] Create `getReportAnalytics()` method in pendo-api.ts
- [ ] Create 9 supporting API methods (timeSeries, totals, sections, etc.)
- [ ] Update `useReportReport` hook to call real API instead of generating mock data
- [ ] Add report categorization logic to identify report types
- [ ] Enhance DataTables columns for reports
- [ ] Expand summary metrics for reports tab
- [ ] Update ReportDetails page to use real data
- [ ] Add error handling and fallback data
- [ ] Test with real Pendo API
- [ ] Remove or repurpose "Coming Soon" notice
- [ ] Document report API endpoints
- [ ] Consider Supabase integration for user feedback/ratings
- [ ] Implement performance tracking for report load times

---

## Testing Commands

```bash
# View current structure
grep -n "useReportReport\|getReportAnalytics\|getMockReports" frontend/src/**/*.ts*

# Count mock data lines
wc -l frontend/src/hooks/useReportData.ts  # Should go from 675 to ~150 after update

# Check for TODO comments related to reports
grep -r "TODO.*report\|FIXME.*report" frontend/src --include="*.ts*"

# Search for report-related types
grep -r "ComprehensiveReportData\|Report" frontend/src/types --include="*.ts"
```

