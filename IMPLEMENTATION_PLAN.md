# Missing Visualizations - Implementation Plan

## Summary
We have **9,879 page event records** with 30 fields each, but only visualizing ~15% of the data. This plan adds 4 high-priority visualization sections to increase data utilization to ~60%.

## Current vs. Proposed State

### Current Data Utilization
- Time Series: **1 data point** from 9,879 records (0.01%)
- Frustration Metrics: **Table only** (no summary/trends)
- Geographic: **Mock data** (real lat/long/region/country available)
- Device/Browser: **Mock data** (real userAgent strings available)

### After Implementation
- Time Series: **Daily aggregation** (100% utilization)
- Frustration Metrics: **Summary KPIs + Charts** (100% utilization)
- Geographic: **Real data visualizations** (100% utilization)
- Device/Browser: **Parsed real data** (100% utilization)

---

## Phase 1: Add New Data Fields to Types

### File: `/frontend/src/types/enhanced-pendo.ts`

Extend `PageEventRow` interface to include all available fields:

```typescript
export interface PageEventRow {
  // Existing fields
  visitorId: string;
  accountId?: string;
  date: string;
  totalViews: number;
  uTurns?: number;
  deadClicks?: number;
  errorClicks?: number;
  rageClicks?: number;
  serverName?: string;
  browserName?: string;
  browserVersion?: string;

  // NEW: Add all available fields from Pendo API
  numMinutes?: number;
  firstTime?: number;
  lastTime?: number;

  // Geographic
  latitude?: number;
  longitude?: number;
  region?: string;
  country?: string;

  // Device/Browser (raw)
  userAgent?: string;

  // Recording
  recordingId?: string;
  recordingSessionId?: string;

  // Time dimensions
  week?: number;
  month?: number;
  quarter?: number;
}
```

Add new summary interfaces:

```typescript
export interface FrustrationMetricsSummary {
  totalRageClicks: number;
  totalDeadClicks: number;
  totalUTurns: number;
  totalErrorClicks: number;
  frustrationRate: number; // Percentage of sessions with frustration
  avgFrustrationPerSession: number;
  topFrustratedVisitors: Array<{
    visitorId: string;
    email?: string;
    rageClicks: number;
    deadClicks: number;
    uTurns: number;
    errorClicks: number;
    totalFrustration: number;
  }>;
}

export interface GeographicDistribution {
  region: string;
  country: string;
  visitors: number;
  views: number;
  avgTimeOnPage: number;
  percentage: number;
}

export interface DeviceBrowserBreakdown {
  device: string; // Desktop, Mobile, Tablet
  deviceType: string; // Specific model if available
  os: string; // Windows, macOS, iOS, Android
  osVersion: string;
  browser: string; // Chrome, Safari, Firefox, Edge
  browserVersion: string;
  users: number;
  percentage: number;
}

export interface DailyTimeSeries {
  date: string; // YYYY-MM-DD
  views: number;
  visitors: number;
  avgTimeOnPage: number;
  frustr ationCount: number;
}
```

Update `ComprehensivePageData` to include new summaries:

```typescript
export interface ComprehensivePageData {
  // ... existing fields ...

  // NEW: Add calculated summaries
  frustrationMetrics?: FrustrationMetricsSummary;
  geographicDistribution?: GeographicDistribution[];
  deviceBrowserBreakdown?: DeviceBrowserBreakdown[];
  dailyTimeSeries?: DailyTimeSeries[];
}
```

---

## Phase 2: Update Data Processing Hook

### File: `/frontend/src/lib/pendo-api.ts`

In the `getPageEventBreakdown()` function, ensure all 30 fields are returned:

```typescript
// Around line 2238, update the mapping
const processedRows: PageEventRow[] = response.results.slice(0, limit).map((event: any) => ({
  visitorId: event.visitorId,
  accountId: event.accountId,
  date: new Date(event.day).toLocaleDateString(),
  totalViews: event.numEvents || 0,
  uTurns: event.uTurnCount || 0,
  deadClicks: event.deadClickCount || 0,
  errorClicks: event.errorClickCount || 0,
  rageClicks: event.rageClickCount || 0,
  serverName: event.server,
  browserName: extractBrowserName(event.userAgent),
  browserVersion: extractBrowserVersion(event.userAgent),

  // NEW: Add all available fields
  numMinutes: event.numMinutes,
  firstTime: event.firstTime,
  lastTime: event.lastTime,
  latitude: event.latitude,
  longitude: event.longitude,
  region: event.region,
  country: event.country,
  userAgent: event.userAgent,
  recordingId: event.recordingId,
  recordingSessionId: event.recordingSessionId,
  week: event.week,
  month: event.month,
  quarter: event.quarter,
}));
```

Add helper functions to parse userAgent:

```typescript
function extractBrowserName(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

function extractBrowserVersion(userAgent: string): string {
  // Simple regex extraction
  const match = userAgent.match(/(?:Chrome|Safari|Firefox|Edge)\/([0-9.]+)/);
  return match ? match[1] : 'Unknown';
}
```

Add aggregation functions:

```typescript
function calculateFrustrationMetrics(events: PageEventRow[]): FrustrationMetricsSummary {
  const totalRageClicks = events.reduce((sum, e) => sum + (e.rageClicks || 0), 0);
  const totalDeadClicks = events.reduce((sum, e) => sum + (e.deadClicks || 0), 0);
  const totalUTurns = events.reduce((sum, e) => sum + (e.uTurns || 0), 0);
  const totalErrorClicks = events.reduce((sum, e) => sum + (e.errorClicks || 0), 0);

  const sessionsWithFrustration = events.filter(e =>
    (e.rageClicks || 0) > 0 || (e.deadClicks || 0) > 0 ||
    (e.uTurns || 0) > 0 || (e.errorClicks || 0) > 0
  ).length;

  const frustrationRate = (sessionsWithFrustration / events.length) * 100;
  const totalFrustrationEvents = totalRageClicks + totalDeadClicks + totalUTurns + totalErrorClicks;

  // Group by visitor and sum frustration
  const visitorFrustration = new Map();
  events.forEach(event => {
    const existing = visitorFrustration.get(event.visitorId) || {
      visitorId: event.visitorId,
      rageClicks: 0,
      deadClicks: 0,
      uTurns: 0,
      errorClicks: 0,
      totalFrustration: 0
    };

    existing.rageClicks += (event.rageClicks || 0);
    existing.deadClicks += (event.deadClicks || 0);
    existing.uTurns += (event.uTurns || 0);
    existing.errorClicks += (event.errorClicks || 0);
    existing.totalFrustration = existing.rageClicks + existing.deadClicks + existing.uTurns + existing.errorClicks;

    visitorFrustration.set(event.visitorId, existing);
  });

  const topFrustratedVisitors = Array.from(visitorFrustration.values())
    .sort((a, b) => b.totalFrustration - a.totalFrustration)
    .slice(0, 10);

  return {
    totalRageClicks,
    totalDeadClicks,
    totalUTurns,
    totalErrorClicks,
    frustrationRate,
    avgFrustrationPerSession: totalFrustrationEvents / events.length,
    topFrustratedVisitors
  };
}

function aggregateGeographicData(events: PageEventRow[]): GeographicDistribution[] {
  const geoMap = new Map();

  events.forEach(event => {
    if (!event.region || !event.country) return;

    const key = `${event.region}|${event.country}`;
    const existing = geoMap.get(key) || {
      region: event.region,
      country: event.country,
      visitors: new Set(),
      views: 0,
      totalMinutes: 0
    };

    existing.visitors.add(event.visitorId);
    existing.views += event.totalViews;
    existing.totalMinutes += (event.numMinutes || 0);

    geoMap.set(key, existing);
  });

  const totalVisitors = new Set(events.map(e => e.visitorId)).size;

  return Array.from(geoMap.values())
    .map(geo => ({
      region: geo.region,
      country: geo.country,
      visitors: geo.visitors.size,
      views: geo.views,
      avgTimeOnPage: geo.totalMinutes / geo.views,
      percentage: (geo.visitors.size / totalVisitors) * 100
    }))
    .sort((a, b) => b.visitors - a.visitors);
}

function aggregateDailyTimeSeries(events: PageEventRow[]): DailyTimeSeries[] {
  const dailyMap = new Map();

  events.forEach(event => {
    const existing = dailyMap.get(event.date) || {
      date: event.date,
      views: 0,
      visitors: new Set(),
      totalMinutes: 0,
      frustrationCount: 0
    };

    existing.views += event.totalViews;
    existing.visitors.add(event.visitorId);
    existing.totalMinutes += (event.numMinutes || 0);

    if ((event.rageClicks || 0) > 0 || (event.deadClicks || 0) > 0 ||
        (event.uTurns || 0) > 0 || (event.errorClicks || 0) > 0) {
      existing.frustrationCount++;
    }

    dailyMap.set(event.date, existing);
  });

  return Array.from(dailyMap.values())
    .map(day => ({
      date: day.date,
      views: day.views,
      visitors: day.visitors.size,
      avgTimeOnPage: day.totalMinutes / day.views,
      frustrationCount: day.frustrationCount
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
```

Update `getPageAnalytics()` to call these functions:

```typescript
// After fetching eventBreakdown
const [eventBreakdown, ...] = await Promise.allSettled([...]);

if (eventBreakdown.status === 'fulfilled' && eventBreakdown.value.length > 0) {
  analytics.eventBreakdown = eventBreakdown.value;

  // NEW: Calculate summaries
  analytics.frustrationMetrics = calculateFrustrationMetrics(eventBreakdown.value);
  analytics.geographicDistribution = aggregateGeographicData(eventBreakdown.value);
  analytics.dailyTimeSeries = aggregateDailyTimeSeries(eventBreakdown.value);
}
```

---

## Phase 3: Add Visualizations to ReportDetails Page

### File: `/frontend/src/pages/ReportDetails.tsx`

Add new sections after the Event Breakdown section (around line 1180):

```tsx
{/* Frustration Metrics Section */}
{type === 'pages' && (data as ComprehensivePageData).frustrationMetrics && (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <h2 className="text-2xl font-bold text-gray-900">Frustration Metrics</h2>
      <DataQualityBadge type="real" tooltip="Real frustration metrics from Pendo page events" />
    </div>

    {/* Summary KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rage Clicks</p>
              <p className="text-2xl font-bold text-red-900">
                {(data as ComprehensivePageData).frustrationMetrics!.totalRageClicks.toLocaleString()}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dead Clicks</p>
              <p className="text-2xl font-bold text-orange-900">
                {(data as ComprehensivePageData).frustrationMetrics!.totalDeadClicks.toLocaleString()}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">U-Turns</p>
              <p className="text-2xl font-bold text-yellow-900">
                {(data as ComprehensivePageData).frustrationMetrics!.totalUTurns.toLocaleString()}
              </p>
            </div>
            <ArrowPathIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Frustration Rate</p>
              <p className="text-2xl font-bold text-purple-900">
                {(data as ComprehensivePageData).frustrationMetrics!.frustrationRate.toFixed(1)}%
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Top Frustrated Visitors */}
    <Card>
      <CardHeader>
        <CardTitle>Top Frustrated Visitors</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="text-left py-2">Visitor</th>
              <th className="text-right py-2">Rage Clicks</th>
              <th className="text-right py-2">Dead Clicks</th>
              <th className="text-right py-2">U-Turns</th>
              <th className="text-right py-2">Error Clicks</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {(data as ComprehensivePageData).frustrationMetrics!.topFrustratedVisitors.map((visitor, idx) => (
              <tr key={visitor.visitorId} className="border-b border-gray-100">
                <td className="py-2 text-blue-600">{visitor.email || visitor.visitorId}</td>
                <td className="text-right py-2">{visitor.rageClicks}</td>
                <td className="text-right py-2">{visitor.deadClicks}</td>
                <td className="text-right py-2">{visitor.uTurns}</td>
                <td className="text-right py-2">{visitor.errorClicks}</td>
                <td className="text-right py-2 font-bold">{visitor.totalFrustration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>
)}

{/* Geographic Distribution Section */}
{type === 'pages' && (data as ComprehensivePageData).geographicDistribution && (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <h2 className="text-2xl font-bold text-gray-900">Geographic Distribution (Real Data)</h2>
      <DataQualityBadge type="real" tooltip="Real geographic data from Pendo page events" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitors by Region</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportPieChart
            data={(data as ComprehensivePageData).geographicDistribution!.slice(0, 8).map(geo => ({
              name: `${geo.region}, ${geo.country}`,
              users: geo.visitors,
              percentage: geo.percentage
            }))}
            dataKey="users"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Regions by Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-left py-2">Location</th>
                <th className="text-right py-2">Visitors</th>
                <th className="text-right py-2">Views</th>
                <th className="text-right py-2">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {(data as ComprehensivePageData).geographicDistribution!.slice(0, 10).map((geo, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2">{geo.region}, {geo.country}</td>
                  <td className="text-right py-2">{geo.visitors.toLocaleString()}</td>
                  <td className="text-right py-2">{geo.views.toLocaleString()}</td>
                  <td className="text-right py-2">{geo.avgTimeOnPage.toFixed(0)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  </div>
)}

{/* Improved Daily Time Series */}
{type === 'pages' && (data as ComprehensivePageData).dailyTimeSeries && (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <h2 className="text-2xl font-bold text-gray-900">Daily Trends (Real Data)</h2>
      <DataQualityBadge type="real" tooltip="Daily aggregated data from 9,879 page events" />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Daily Page Views & Visitors</CardTitle>
      </CardHeader>
      <CardContent>
        <ReportLineChart
          data={(data as ComprehensivePageData).dailyTimeSeries!}
          dataKey="views"
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Daily Frustration Events</CardTitle>
      </CardHeader>
      <CardContent>
        <ReportLineChart
          data={(data as ComprehensivePageData).dailyTimeSeries!}
          dataKey="frustrationCount"
        />
      </CardContent>
    </Card>
  </div>
)}
```

---

## Expected Outcomes

### Before Implementation
- Data utilization: ~15%
- Time series: 1 data point
- Frustration: Table only
- Geographic: Mock data
- Device: Mock data

### After Implementation
- Data utilization: ~60%
- Time series: Full daily aggregation
- Frustration: 4 KPI cards + top frustrated users table
- Geographic: Real pie chart + table with 10 regions
- Device: Ready for implementation (userAgent parsing)

### Visual Impact
- **+4 new KPI cards** (frustration metrics)
- **+2 new charts** (geographic pie + daily frustration line)
- **+2 new tables** (top frustrated visitors + geographic table)
- **Improved time series** (from 1 to N daily points)

### Data Quality Improvement
- Frustration metrics: ❌ Missing → ✅ **Real**
- Geographic: ❌ Mock → ✅ **Real**
- Time series: ⚠️ Underutilized → ✅ **Fully utilized**

---

## Estimated Implementation Time

- Phase 1 (Types): ~30 minutes
- Phase 2 (Data Processing): ~2 hours
- Phase 3 (UI Components): ~2 hours
- Testing: ~1 hour

**Total**: ~5-6 hours

## Testing Checklist

- [ ] Types compile without errors
- [ ] Frustration metrics calculate correctly
- [ ] Geographic data aggregates properly
- [ ] Daily time series shows all dates
- [ ] Charts render with real data
- [ ] Tables display correctly
- [ ] No console errors
- [ ] Data quality badges show "real" status
- [ ] Page load performance remains < 10s
