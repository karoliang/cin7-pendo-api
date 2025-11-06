import React, { useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { KPICard } from '@/components/dashboard/KPICard';
import { TopPerformers } from '@/components/dashboard/TopPerformers';
import { FrustrationMetrics } from '@/components/dashboard/FrustrationMetrics';
import { GeographicMap } from '@/components/dashboard/GeographicMap';
import { GuidePerformanceChart } from '@/components/charts/GuidePerformanceChart';
import { FeatureAdoptionChart } from '@/components/charts/FeatureAdoptionChart';
import { PageAnalyticsChart } from '@/components/charts/PageAnalyticsChart';
import { Cin7Card as Card, Cin7CardContent as CardContent, Cin7CardHeader as CardHeader, Cin7CardTitle as CardTitle } from '@/components/polaris';
import { Cin7Button as Button } from '@/components/polaris';
import { useDashboardOverview } from '@/hooks/usePendoData';
import { useFilterStore } from '@/stores/filterStore';
import type { Guide, Feature, Page, Report } from '@/types/pendo';
import { InlineSpinner } from '@/components/ui/Spinner';

export const Dashboard: React.FC = () => {
  const { guides, features, pages, reports, isLoading, error, refetch } = useDashboardOverview();
  const { filters } = useFilterStore();

  // Debug logging
  console.log('Dashboard render:', {
    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    dataLengths: {
      guides: guides?.length,
      features: features?.length,
      pages: pages?.length,
      reports: reports?.length
    }
  });

  // Log the raw query states for debugging
  console.log('Raw query states:', {
    guidesLoading: useDashboardOverview === undefined,
    guidesData: guides !== undefined ? `${guides.length} items` : 'undefined',
    featuresData: features !== undefined ? `${features.length} items` : 'undefined',
    pagesData: pages !== undefined ? `${pages.length} items` : 'undefined',
    reportsData: reports !== undefined ? `${reports.length} items` : 'undefined'
  });

  // Apply filters to data
  const filteredData = useMemo(() => {
    type FilterableItem = Guide | Feature | Page | Report;

    // Type guards for union type
    const isGuide = (item: FilterableItem): item is Guide => 'state' in item && 'viewedCount' in item && 'completedCount' in item;
    const isPage = (item: FilterableItem): item is Page => 'url' in item && 'title' in item;

    const filterArray = <T extends FilterableItem>(array: T[], filterFn: (item: T) => boolean): T[] => {
      return array.filter(filterFn);
    };

    const createFilterFn = (item: FilterableItem): boolean => {
      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const nameMatch = 'name' in item && item.name?.toLowerCase().includes(searchLower);
        const descMatch = 'description' in item && item.description?.toLowerCase().includes(searchLower);
        const urlMatch = isPage(item) && item.url?.toLowerCase().includes(searchLower);

        if (!nameMatch && !descMatch && !urlMatch) {
          return false;
        }
      }

      // Status filter (only applies to Guides)
      if (filters.status && filters.status.length > 0) {
        if (isGuide(item) && !filters.status.includes(item.state)) {
          return false;
        }
      }

      // Guide types filter (only applies to Guides)
      if (filters.guideTypes && filters.guideTypes.length > 0) {
        if (isGuide(item) && item.type && !filters.guideTypes.includes(item.type)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const itemDate = new Date(item.createdAt || item.updatedAt);
        if (filters.dateRange.start && itemDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && itemDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    };

    return {
      guides: filterArray(guides || [], createFilterFn),
      features: filterArray(features || [], createFilterFn),
      pages: filterArray(pages || [], createFilterFn),
      reports: filterArray(reports || [], createFilterFn)
    };
  }, [guides, features, pages, reports, filters]);

  // Apply sorting - maintaining proper types
  const sortedData = useMemo(() => {
    if (!filters.sortBy) return filteredData;

    type SortableValue = string | number | undefined;

    const sortGuides = (a: Guide, b: Guide): number => {
      const aValue = a[filters.sortBy! as keyof Guide] as SortableValue;
      const bValue = b[filters.sortBy! as keyof Guide] as SortableValue;

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      }

      const numComparison = (aValue as number) - (bValue as number);
      return filters.sortOrder === 'desc' ? -numComparison : numComparison;
    };

    const sortFeatures = (a: Feature, b: Feature): number => {
      const aValue = a[filters.sortBy! as keyof Feature] as SortableValue;
      const bValue = b[filters.sortBy! as keyof Feature] as SortableValue;

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      }

      const numComparison = (aValue as number) - (bValue as number);
      return filters.sortOrder === 'desc' ? -numComparison : numComparison;
    };

    const sortPages = (a: Page, b: Page): number => {
      const aValue = a[filters.sortBy! as keyof Page] as SortableValue;
      const bValue = b[filters.sortBy! as keyof Page] as SortableValue;

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      }

      const numComparison = (aValue as number) - (bValue as number);
      return filters.sortOrder === 'desc' ? -numComparison : numComparison;
    };

    const sortReports = (a: Report, b: Report): number => {
      const aValue = a[filters.sortBy! as keyof Report] as SortableValue;
      const bValue = b[filters.sortBy! as keyof Report] as SortableValue;

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      }

      const numComparison = (aValue as number) - (bValue as number);
      return filters.sortOrder === 'desc' ? -numComparison : numComparison;
    };

    return {
      guides: [...filteredData.guides].sort(sortGuides),
      features: [...filteredData.features].sort(sortFeatures),
      pages: [...filteredData.pages].sort(sortPages),
      reports: [...filteredData.reports].sort(sortReports)
    };
  }, [filteredData, filters.sortBy, filters.sortOrder]);

  // Helper function to calculate sparkline data for count-based metrics
  const calculateSparklineData = (items: any[], dateField: string, days: number = 7): number[] => {
    const now = new Date();
    const sparklineData: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dayCount = items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= startOfDay && itemDate <= endOfDay;
      }).length;

      sparklineData.push(dayCount);
    }

    return sparklineData;
  };

  // Helper function to calculate sparkline data for completion rate
  const calculateCompletionRateSparkline = (guides: Guide[], days: number = 7): number[] => {
    const now = new Date();
    const sparklineData: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dayGuides = guides.filter(g => {
        const guideDate = new Date(g.createdAt);
        return guideDate >= startOfDay && guideDate <= endOfDay && g.viewedCount > 0;
      });

      if (dayGuides.length === 0) {
        sparklineData.push(0);
      } else {
        const avgRate = dayGuides.reduce((sum, g) =>
          sum + (g.completedCount / g.viewedCount) * 100, 0
        ) / dayGuides.length;
        sparklineData.push(Math.round(avgRate));
      }
    }

    return sparklineData;
  };

  // Helper function to calculate sparkline data for activity
  const calculateActivitySparkline = (guides: Guide[], days: number = 7): number[] => {
    const now = new Date();
    const sparklineData: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dayGuides = guides.filter(g => {
        const guideDate = new Date(g.updatedAt);
        return guideDate >= startOfDay && guideDate <= endOfDay;
      });

      const dayActivity = dayGuides.reduce((sum, g) =>
        sum + g.viewedCount + g.completedCount, 0
      );

      sparklineData.push(dayActivity);
    }

    return sparklineData;
  };

  // Helper function to calculate sparkline data for bounce rate
  const calculateBounceRateSparkline = (pages: Page[], days: number = 7): number[] => {
    const now = new Date();
    const sparklineData: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const dayPages = pages.filter(p => {
        const pageDate = new Date(p.createdAt || p.updatedAt);
        return pageDate >= startOfDay && pageDate <= endOfDay;
      });

      if (dayPages.length === 0) {
        sparklineData.push(0);
      } else {
        const lowEngagementPages = dayPages.filter(p => p.visitorCount <= 2);
        const bounceRate = Math.round((lowEngagementPages.length / dayPages.length) * 100);
        sparklineData.push(bounceRate);
      }
    }

    return sparklineData;
  };

  // Calculate KPI data from filtered data
  const kpiData = useMemo(() => {
    const guides = sortedData.guides as Guide[];
    const pages = sortedData.pages as Page[];

    // 1. Average Completion Rate - Calculate from guides data
    const calculateAvgCompletionRate = (): { value: string; change: number; description: string } => {
      const guidesWithViews = guides.filter(g => g.viewedCount > 0);

      if (guidesWithViews.length === 0) {
        return { value: '0%', change: 0, description: 'No guides with views' };
      }

      const completionRates = guidesWithViews.map(g =>
        (g.completedCount / g.viewedCount) * 100
      );

      const avgRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;

      return {
        value: `${avgRate.toFixed(1)}%`,
        change: 0, // Would need historical data to calculate trend
        description: `Across ${guidesWithViews.length} guides`
      };
    };

    // 2. 7-Day Trend - Compare last 7 days vs previous 7 days
    const calculate7DayTrend = (): { value: string; change: number; changeType: 'increase' | 'decrease'; description: string } => {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Filter guides by date ranges
      const recentGuides = guides.filter(g => {
        const updateDate = new Date(g.updatedAt);
        return updateDate >= last7Days && updateDate <= now;
      });

      const previousGuides = guides.filter(g => {
        const updateDate = new Date(g.updatedAt);
        return updateDate >= previous7Days && updateDate < last7Days;
      });

      // Sum views and completions
      const recentTotal = recentGuides.reduce((sum, g) => sum + g.viewedCount + g.completedCount, 0);
      const previousTotal = previousGuides.reduce((sum, g) => sum + g.viewedCount + g.completedCount, 0);

      // Calculate percentage change
      let change = 0;
      let changeType: 'increase' | 'decrease' = 'increase';

      if (previousTotal > 0) {
        change = ((recentTotal - previousTotal) / previousTotal) * 100;
        changeType = change >= 0 ? 'increase' : 'decrease';
      }

      return {
        value: recentTotal.toString(),
        change: Math.abs(Math.round(change)),
        changeType,
        description: 'vs previous 7 days'
      };
    };

    // 3. Average Bounce Rate - Calculate from pages data
    const calculateAvgBounceRate = (): { value: string; description: string } => {
      if (pages.length === 0) {
        return { value: '0%', description: 'No pages tracked' };
      }

      // Estimate bounce rate: pages with only 1 visitor (high likelihood of single-page sessions)
      // This is an estimation since we don't have direct bounce rate data
      const lowEngagementPages = pages.filter(p => p.visitorCount <= 2);
      const bounceRate = (lowEngagementPages.length / pages.length) * 100;

      return {
        value: `${bounceRate.toFixed(1)}%`,
        description: 'Estimated from page data'
      };
    };

    // 4. Total Frustration Score - Sum from pages data
    // Note: The Page type doesn't include frustration metrics in the base interface
    // This would require aggregation API calls to get rage clicks, dead clicks, error clicks
    const calculateFrustrationScore = (): { value: string; description: string } => {
      // Check if pages have frustration data (this would be from extended API calls)
      // For now, we'll return a placeholder indicating the feature needs aggregation API
      return {
        value: 'N/A',
        description: 'Requires aggregation API'
      };
    };

    // 5. Total ARR - Calculate from top accounts across all pages
    const calculateTotalARR = (): { value: string; description: string } => {
      let totalARR = 0;
      const accountsSet = new Set<string>();

      pages.forEach((page: any) => {
        if (page.topAccounts && Array.isArray(page.topAccounts)) {
          page.topAccounts.forEach((account: any) => {
            if (account.accountId && !accountsSet.has(account.accountId) && account.arr) {
              accountsSet.add(account.accountId);
              totalARR += account.arr;
            }
          });
        }
      });

      if (totalARR === 0) {
        return {
          value: '$0',
          description: 'No ARR data available'
        };
      }

      // Format as currency
      const formattedARR = totalARR >= 1000000
        ? `$${(totalARR / 1000000).toFixed(1)}M`
        : totalARR >= 1000
        ? `$${(totalARR / 1000).toFixed(0)}K`
        : `$${totalARR.toFixed(0)}`;

      return {
        value: formattedARR,
        description: `From ${accountsSet.size} accounts`
      };
    };

    const avgCompletionRate = calculateAvgCompletionRate();
    const sevenDayTrend = calculate7DayTrend();
    const avgBounceRate = calculateAvgBounceRate();
    const frustrationScore = calculateFrustrationScore();
    const totalARR = calculateTotalARR();

    // Calculate sparkline data for each KPI
    const guidesSparkline = calculateSparklineData(sortedData.guides, 'createdAt');
    const featuresSparkline = calculateSparklineData(sortedData.features, 'createdAt');
    const pagesSparkline = calculateSparklineData(sortedData.pages, 'createdAt');
    const reportsSparkline = calculateSparklineData(sortedData.reports, 'createdAt');
    const completionRateSparkline = calculateCompletionRateSparkline(guides);
    const activitySparkline = calculateActivitySparkline(guides);
    const bounceRateSparkline = calculateBounceRateSparkline(pages);
    const frustrationSparkline = [0, 0, 0, 0, 0, 0, 0]; // Placeholder until aggregation API available

    return [
      {
        title: 'Total Guides',
        value: sortedData.guides.length.toString(),
        change: 12,
        changeType: 'increase' as const,
        description: `${guides.filter(g => g.state === 'published').length} published`,
        trendData: guidesSparkline
      },
      {
        title: 'Features',
        value: sortedData.features.length.toString(),
        change: 8,
        changeType: 'increase' as const,
        description: 'Tracked features',
        trendData: featuresSparkline
      },
      {
        title: 'Pages',
        value: sortedData.pages.length.toString(),
        change: -2,
        changeType: 'decrease' as const,
        description: 'Monitored pages',
        trendData: pagesSparkline
      },
      {
        title: 'Reports',
        value: sortedData.reports.length.toString(),
        change: 15,
        changeType: 'increase' as const,
        description: 'Generated reports',
        trendData: reportsSparkline
      },
      {
        title: 'Avg. Completion Rate',
        value: avgCompletionRate.value,
        change: avgCompletionRate.change,
        changeType: 'increase' as const,
        description: avgCompletionRate.description,
        trendData: completionRateSparkline
      },
      {
        title: '7-Day Activity',
        value: sevenDayTrend.value,
        change: sevenDayTrend.change,
        changeType: sevenDayTrend.changeType,
        description: sevenDayTrend.description,
        trendData: activitySparkline
      },
      {
        title: 'Avg. Bounce Rate',
        value: avgBounceRate.value,
        change: 0,
        changeType: 'increase' as const,
        description: avgBounceRate.description,
        trendData: bounceRateSparkline
      },
      {
        title: 'Frustration Score',
        value: frustrationScore.value,
        change: 0,
        changeType: 'increase' as const,
        description: frustrationScore.description,
        trendData: frustrationSparkline
      },
      {
        title: 'Total ARR',
        value: totalARR.value,
        change: 0,
        changeType: 'increase' as const,
        description: totalARR.description,
        trendData: [0, 0, 0, 0, 0, 0, 0] // Placeholder - would need historical data
      }
    ];
  }, [sortedData]);

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-600 mb-4">Error loading dashboard data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      showNavigation={true}
      title="Analytics Overview"
      subtitle="Real-time insights from your Pendo data"
      primaryAction={{
        content: 'Refresh',
        onAction: () => refetch()
      }}
    >
      <div className="space-y-8">
        {/* Loading Spinner - show on initial load */}
        {isLoading && !guides && !features && !pages && !reports && (
          <div className="flex justify-center items-center py-20">
            <InlineSpinner message="Loading dashboard data..." size="lg" />
          </div>
        )}

        {/* KPI Cards - 9 cards in responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={isLoading ? '...' : kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
              description={kpi.description}
              loading={isLoading}
              trendData={kpi.trendData}
            />
          ))}
        </div>

        {/* Guide Performance Chart - Full Width */}
        <GuidePerformanceChart
          guides={sortedData.guides as Guide[]}
        />

        {/* Top Performers - Full Width */}
        <TopPerformers
          guides={sortedData.guides as Guide[]}
          features={sortedData.features as Feature[]}
          pages={sortedData.pages as Page[]}
          loading={isLoading}
        />

        {/* Frustration Metrics - Full Width */}
        <FrustrationMetrics
          pages={sortedData.pages as any}
          loading={isLoading}
        />

        {/* Geographic Distribution Map - Full Width */}
        <GeographicMap
          pages={sortedData.pages as any}
          loading={isLoading}
        />

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureAdoptionChart
            features={sortedData.features as Feature[]}
          />

          <PageAnalyticsChart
            pages={sortedData.pages as Page[]}
          />
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(sortedData.guides as Guide[]).slice(0, 2).map((guide) => (
                <div key={guide.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Guide "{guide.name}" {guide.state}</p>
                    <p className="text-sm text-gray-500">
                      Last updated: {new Date(guide.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    guide.state === 'published'
                      ? 'bg-green-100 text-green-800'
                      : guide.state === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : guide.state === '_pendingReview_'
                      ? 'bg-orange-100 text-orange-800'
                      : guide.state === 'archived'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {guide.state.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
              {(sortedData.features as Feature[]).slice(0, 1).map((feature) => (
                <div key={feature.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Feature "{feature.name}" used</p>
                    <p className="text-sm text-gray-500">
                      {feature.usageCount} times by {feature.visitorCount} visitors
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    Feature
                  </span>
                </div>
              ))}
              {(sortedData.reports as Report[]).slice(0, 1).map((report) => (
                <div key={report.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      {report.lastSuccessRunAt
                        ? `Last run: ${new Date(report.lastSuccessRunAt).toLocaleDateString()}`
                        : 'Not yet run'
                      }
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    Report
                  </span>
                </div>
              ))}
              {sortedData.guides.length === 0 && sortedData.features.length === 0 && sortedData.reports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity to display.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};