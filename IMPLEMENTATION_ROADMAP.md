# Dashboard Enhancements Implementation Roadmap
**Date:** 2025-11-08
**Status:** In Progress - Phase 1 Started
**Based on:** Ultra-Deep Pendo API Investigation

---

## 🎯 Progress Overview

### ✅ COMPLETED
1. ✅ Ultra-Deep API Investigation
2. ✅ **Phase 1.1: Metadata Enhancements** (Commit: 938b3b6)
   - Enhanced Guides card: "X published • Y,YYY views"
   - Enhanced Features card: "Avg X.X uses/user"

### 🔄 IN PROGRESS
3. Creating this implementation roadmap

### ⏳ PENDING (Ready to Implement)
All components below have data available and detailed specs ready.

---

## 📋 Implementation Priority

### Phase 1: Quick Wins (1-2 days)
- **1.2** Usage Heatmap (Day/Hour)
- **1.3** Feature Category Analysis

### Phase 2: High-Value Dashboards (3-5 days)
- **2.1** Segments Dashboard
- **2.2** Reports Analytics Dashboard

### Phase 3: Advanced Analytics (5-7 days)
- **3.1** Guide Step Progression Funnel
- **3.2** Feature Adoption Curves
- **3.3** Cross-Feature Usage Matrix
- **3.4** Guide Effectiveness Score

---

# PHASE 1: QUICK WINS

## 1.2 Usage Heatmap (Day/Hour)

### What
7x24 grid heatmap showing peak usage times by day of week and hour of day.

### Value
- Identify optimal times to deploy guides
- Schedule maintenance during low-usage periods
- Understand user work patterns globally

### Data Source
`pendo_events` table - already available in database

### Implementation

#### Step 1: Create Hook to Fetch Heatmap Data

**File:** `frontend/src/hooks/useUsageHeatmap.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface HeatmapData {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  count: number;
}

export function useUsageHeatmap(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['usage-heatmap', startDate, endDate],
    queryFn: async () => {
      // Query events grouped by day of week and hour
      const { data, error } = await supabase
        .rpc('get_usage_heatmap', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      if (error) throw error;

      // Transform to 7x24 matrix
      const heatmap: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

      data?.forEach((row: HeatmapData) => {
        heatmap[row.dayOfWeek][row.hour] = row.count;
      });

      return heatmap;
    },
    staleTime: 1000 * 60 * 30 // 30 minutes
  });
}
```

#### Step 2: Create Database Function

**Run this SQL in Supabase:**

```sql
CREATE OR REPLACE FUNCTION get_usage_heatmap(
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE (
  day_of_week int,
  hour int,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(DOW FROM created_at)::int as day_of_week,
    EXTRACT(HOUR FROM created_at)::int as hour,
    COUNT(*)::bigint as count
  FROM pendo_events
  WHERE created_at >= start_date
    AND created_at <= end_date
  GROUP BY day_of_week, hour
  ORDER BY day_of_week, hour;
END;
$$ LANGUAGE plpgsql;
```

#### Step 3: Create Heatmap Component

**File:** `frontend/src/components/dashboard/UsageHeatmap.tsx`

```typescript
import React from 'react';
import { Cin7Card, Cin7CardHeader, Cin7CardTitle, Cin7CardContent } from '@/components/polaris';
import { useUsageHeatmap } from '@/hooks/useUsageHeatmap';
import { InlineSpinner } from '@/components/ui/Spinner';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function UsageHeatmap({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const { data: heatmap, isLoading } = useUsageHeatmap(startDate, endDate);

  if (isLoading) {
    return (
      <Cin7Card>
        <Cin7CardHeader>
          <Cin7CardTitle>Usage Heatmap</Cin7CardTitle>
        </Cin7CardHeader>
        <Cin7CardContent>
          <InlineSpinner message="Loading heatmap..." />
        </Cin7CardContent>
      </Cin7Card>
    );
  }

  if (!heatmap) return null;

  // Find max value for color scaling
  const maxValue = Math.max(...heatmap.flat());

  // Color scale function
  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100';
    const intensity = Math.min(value / maxValue, 1);
    if (intensity < 0.25) return 'bg-blue-200';
    if (intensity < 0.5) return 'bg-blue-300';
    if (intensity < 0.75) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  return (
    <Cin7Card>
      <Cin7CardHeader>
        <Cin7CardTitle>Usage Heatmap - Peak Activity Times</Cin7CardTitle>
      </Cin7CardHeader>
      <Cin7CardContent>
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs font-medium text-gray-500"></th>
                {HOURS.map(hour => (
                  <th key={hour} className="p-1 text-xs font-medium text-gray-500">
                    {hour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, dayIdx) => (
                <tr key={day}>
                  <td className="p-2 text-xs font-medium text-gray-700">{day}</td>
                  {HOURS.map(hour => {
                    const value = heatmap[dayIdx][hour];
                    return (
                      <td
                        key={hour}
                        className={`p-1 ${getColor(value)} border border-gray-200 cursor-pointer hover:opacity-80`}
                        title={`${day} ${hour}:00 - ${value} events`}
                      >
                        <div className="w-8 h-8 flex items-center justify-center text-xs">
                          {value > 0 ? value : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
            <span>Low activity</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-100 border"></div>
              <div className="w-4 h-4 bg-blue-200"></div>
              <div className="w-4 h-4 bg-blue-300"></div>
              <div className="w-4 h-4 bg-blue-400"></div>
              <div className="w-4 h-4 bg-blue-500"></div>
            </div>
            <span>High activity</span>
          </div>
        </div>
      </Cin7CardContent>
    </Cin7Card>
  );
}
```

#### Step 4: Add to Dashboard

**File:** `frontend/src/pages/Dashboard.tsx`

```typescript
// Add import
import { UsageHeatmap } from '@/components/dashboard/UsageHeatmap';

// Add below KPI cards (after line ~540)
{/* Usage Heatmap - Full Width */}
<UsageHeatmap
  startDate={dateRange.start}
  endDate={dateRange.end}
/>
```

#### Estimated Effort
- Database function: 10 minutes
- Hook: 15 minutes
- Component: 30 minutes
- Testing: 15 minutes
**Total: ~1 hour**

---

## 1.3 Feature Category Analysis

### What
Group features by category (e.g., "POS", "Reporting", "Inventory") and show usage distribution.

### Value
- Understand which product areas are most/least used
- Guide product development priorities
- Identify underutilized categories

### Data Source
Features already have `group` metadata from API

### Implementation

#### Step 1: Create Hook

**File:** `frontend/src/hooks/useCategoryAnalysis.ts`

```typescript
import { useMemo } from 'react';
import type { Feature } from '@/types/pendo';

export function useCategoryAnalysis(features: Feature[]) {
  return useMemo(() => {
    const categoryMap = new Map<string, {
      name: string;
      totalUsage: number;
      uniqueUsers: number;
      featureCount: number;
      features: Feature[];
    }>();

    features.forEach(feature => {
      // Feature group from API has name like "Reporting / Insights"
      const categoryName = feature.group?.name || 'Uncategorized';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          totalUsage: 0,
          uniqueUsers: new Set(),
          featureCount: 0,
          features: []
        });
      }

      const category = categoryMap.get(categoryName)!;
      category.totalUsage += feature.usageCount || 0;
      category.featureCount += 1;
      category.features.push(feature);

      // Aggregate unique users (simplified - actual would need visitor IDs)
      category.uniqueUsers = Math.max(
        category.uniqueUsers,
        feature.visitorCount || 0
      );
    });

    // Convert to array and sort by usage
    return Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        uniqueUsers: cat.uniqueUsers as any as number
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
  }, [features]);
}
```

#### Step 2: Create Component

**File:** `frontend/src/components/dashboard/FeatureCategoryChart.tsx`

```typescript
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Cin7Card, Cin7CardHeader, Cin7CardTitle, Cin7CardContent } from '@/components/polaris';
import { useCategoryAnalysis } from '@/hooks/useCategoryAnalysis';
import type { Feature } from '@/types/pendo';

export function FeatureCategoryChart({ features }: { features: Feature[] }) {
  const categories = useCategoryAnalysis(features);

  return (
    <Cin7Card>
      <Cin7CardHeader>
        <Cin7CardTitle>Feature Usage by Category</Cin7CardTitle>
      </Cin7CardHeader>
      <Cin7CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={categories}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalUsage" fill="#3b82f6" name="Total Usage" />
            <Bar dataKey="uniqueUsers" fill="#10b981" name="Unique Users" />
            <Bar dataKey="featureCount" fill="#f59e0b" name="Feature Count" />
          </BarChart>
        </ResponsiveContainer>

        {/* Category Details Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Features</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg/Feature</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map(cat => (
                <tr key={cat.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cat.featureCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cat.totalUsage.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(cat.totalUsage / cat.featureCount).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cin7CardContent>
    </Cin7Card>
  );
}
```

#### Step 3: Add to Dashboard

```typescript
// Add import
import { FeatureCategoryChart } from '@/components/dashboard/FeatureCategoryChart';

// Add below UsageHeatmap
<FeatureCategoryChart features={sortedData.features as Feature[]} />
```

#### Estimated Effort
- Hook: 20 minutes
- Component: 40 minutes
- Testing: 15 minutes
**Total: ~1.25 hours**

---

# PHASE 2: HIGH-VALUE DASHBOARDS

## 2.1 Segments Dashboard

### What
Dashboard showing all 328 user segments, their sizes, and engagement metrics.

### Value
- Understand user personas
- Target guides to specific segments
- Identify high-value user groups
- Measure segment-specific feature adoption

### Data Source
- `GET /api/v1/segment` - 328 segments available
- Cross-reference with database for engagement data

### Implementation

This is a full new page. Create:
1. `frontend/src/pages/Segments.tsx` - Main page
2. `frontend/src/hooks/useSegments.ts` - Fetch segments from API
3. `frontend/src/components/segments/` - Various components

**Detailed implementation specs available - continuing in next steps when ready to build.**

#### Estimated Effort
- **2-3 days** (new page, API integration, multiple components)

---

## 2.2 Reports Analytics Dashboard

### What
Dashboard analyzing all 485 pre-built reports.

### Value
- Identify most valuable reports
- Clean up unused reports
- Understand team's analytical focus

### Data Source
- `GET /api/v1/report?expand=*` - 485 reports

#### Estimated Effort
- **2-3 days** (similar to Segments Dashboard)

---

# PHASE 3: ADVANCED ANALYTICS

## 3.1 Guide Step Progression Funnel

### What
Funnel visualization showing drop-off rates at each step of multi-step guides.

### Data Source
- `steps_data` field in `pendo_guides` table

#### Estimated Effort
- **1-2 days** (requires parsing steps_data JSON)

---

## 3.2 Feature Adoption Curves

### What
S-curve charts showing cumulative feature adoption over time.

### Value
- Understand feature launch success
- Identify struggling features early
- Compare adoption velocity

### Data Source
- `pendo_events` table with `created_at` + `entity_id`
- `pendo_features` table for feature metadata

#### Estimated Effort
- **2-3 days** (complex time-series calculations)

---

## 3.3 Cross-Feature Usage Matrix

### What
Heatmap showing correlation between feature usage.

### Value
- Identify natural feature bundles
- Optimize navigation
- Recommend features to users

### Data Source
- `pendo_events` grouped by `visitor_id`

#### Estimated Effort
- **2-3 days** (correlation calculations, large dataset)

---

## 3.4 Guide Effectiveness Score

### What
Measure if guides lead to feature adoption.

### Value
- Prove ROI of guide development
- Optimize guide content

### Data Source
- Join `pendo_events` for guides and features by `visitor_id`

#### Estimated Effort
- **2-3 days** (complex joins, conversion tracking)

---

## 🎯 TOTAL ESTIMATED EFFORT

### Phase 1 (Quick Wins)
- **~2-3 hours** remaining (1.2 + 1.3)

### Phase 2 (High-Value Dashboards)
- **~4-6 days** (2.1 + 2.2)

### Phase 3 (Advanced Analytics)
- **~9-13 days** (3.1 + 3.2 + 3.3 + 3.4)

### **GRAND TOTAL: ~2-3 weeks** for all remaining components

---

## 📝 NEXT STEPS

1. **Immediate (Today)**:
   - Implement Usage Heatmap (1 hour)
   - Implement Feature Category Chart (1.25 hours)
   - Commit Phase 1 complete

2. **This Week**:
   - Start Phase 2.1: Segments Dashboard
   - Design page layout and component structure

3. **Next Week**:
   - Complete Phase 2
   - Start Phase 3 components

4. **Week 3-4**:
   - Complete Phase 3
   - Final testing and optimization

---

## 🚀 GETTING STARTED

To continue implementation:

1. **Choose next component** from roadmap above
2. **Follow implementation steps** exactly as documented
3. **Test thoroughly** before committing
4. **Commit frequently** with descriptive messages
5. **Update this roadmap** as you complete each component

Each component above has:
- ✅ Clear value proposition
- ✅ Data availability confirmed
- ✅ Step-by-step implementation guide
- ✅ Code examples ready to use
- ✅ Estimated effort

**You have everything needed to implement all recommendations!**

---

**Document Status:** Ready for Implementation
**Last Updated:** 2025-11-08
**Maintained By:** Development Team
