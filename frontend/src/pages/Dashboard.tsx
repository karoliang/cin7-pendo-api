import React, { useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { KPICard } from '@/components/dashboard/KPICard';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { AdvancedSearch } from '@/components/filters/AdvancedSearch';
import { GuidePerformanceChart } from '@/components/charts/GuidePerformanceChart';
import { FeatureAdoptionChart } from '@/components/charts/FeatureAdoptionChart';
import { PageAnalyticsChart } from '@/components/charts/PageAnalyticsChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardOverview } from '@/hooks/usePendoData';
import { useFilterStore } from '@/stores/filterStore';
import type { Guide, Feature, Page, Report } from '@/types/pendo';

export const Dashboard: React.FC = () => {
  const { guides, features, pages, reports, isLoading, error, refetch } = useDashboardOverview();
  const { filters, updateFilters, resetFilters } = useFilterStore();

  const handleAdvancedSearch = (query: string, searchFilters?: Record<string, string | string[]>) => {
    // Update the search query in filters
    updateFilters({
      ...filters,
      searchQuery: query,
      ...(searchFilters?.type && searchFilters.type !== 'all' && {
        // If searching within a specific type, add additional filters
        [`${searchFilters.type}Types`]: ['true'] // This would be implemented based on actual data structure
      })
    });
  };

  // Apply filters to data
  const filteredData = useMemo(() => {
    type FilterableItem = Guide | Feature | Page | Report;

    const filterArray = <T extends FilterableItem>(array: T[], filterFn: (item: T) => boolean): T[] => {
      return array.filter(filterFn);
    };

    const createFilterFn = (item: FilterableItem): boolean => {
      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        if (!item.name?.toLowerCase().includes(searchLower) &&
            !item.description?.toLowerCase().includes(searchLower) &&
            !item.title?.toLowerCase().includes(searchLower) &&
            !item.url?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(item.state)) {
          return false;
        }
      }

      // Guide types filter
      if (filters.guideTypes && filters.guideTypes.length > 0) {
        if (!filters.guideTypes.includes(item.type)) {
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

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!filters.sortBy) return filteredData;

    type SortableValue = string | number | undefined;

    const sortFn = (a: Guide | Feature | Page | Report, b: Guide | Feature | Page | Report): number => {
      const aValue = a[filters.sortBy! as keyof typeof a] as SortableValue;
      const bValue = b[filters.sortBy! as keyof typeof b] as SortableValue;

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aLower = aValue.toLowerCase();
        const bLower = bValue.toLowerCase();
        if (filters.sortOrder === 'desc') {
          return aLower > bLower ? -1 : aLower < bLower ? 1 : 0;
        }
        return aLower < bLower ? -1 : aLower > bLower ? 1 : 0;
      }

      // Handle numeric comparison
      if (filters.sortOrder === 'desc') {
        return (aValue as number) > (bValue as number) ? -1 : (aValue as number) < (bValue as number) ? 1 : 0;
      }
      return (aValue as number) < (bValue as number) ? -1 : (aValue as number) > (bValue as number) ? 1 : 0;
    };

    return {
      guides: [...filteredData.guides].sort(sortFn),
      features: [...filteredData.features].sort(sortFn),
      pages: [...filteredData.pages].sort(sortFn),
      reports: [...filteredData.reports].sort(sortFn)
    };
  }, [filteredData, filters.sortBy, filters.sortOrder]);

  // Calculate KPI data from filtered data
  const kpiData = [
    {
      title: 'Total Guides',
      value: sortedData.guides.length.toString(),
      change: 12,
      changeType: 'increase' as const,
      description: `${sortedData.guides.filter(g => g.state === 'published').length} published`
    },
    {
      title: 'Features',
      value: sortedData.features.length.toString(),
      change: 8,
      changeType: 'increase' as const,
      description: 'Tracked features'
    },
    {
      title: 'Pages',
      value: sortedData.pages.length.toString(),
      change: -2,
      changeType: 'decrease' as const,
      description: 'Monitored pages'
    },
    {
      title: 'Reports',
      value: sortedData.reports.length.toString(),
      change: 15,
      changeType: 'increase' as const,
      description: 'Generated reports'
    }
  ];

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
    <Layout showNavigation={true}>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Analytics Overview
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Real-time insights from your Pendo data
            {Object.keys(filters).length > 0 && (
              <span className="ml-2 text-blue-600">
                ({Object.keys(filters).length} filter{Object.keys(filters).length > 1 ? 's' : ''} applied)
              </span>
            )}
          </p>
        </div>

        {/* Advanced Search */}
        <AdvancedSearch
          onSearch={handleAdvancedSearch}
        />

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={updateFilters}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={isLoading ? '...' : kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
              description={kpi.description}
              loading={isLoading}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GuidePerformanceChart
            guides={sortedData.guides}
          />

          <FeatureAdoptionChart
            features={sortedData.features}
          />
        </div>

        {/* Additional Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PageAnalyticsChart
            pages={sortedData.pages}
          />

          {/* Placeholder for future charts */}
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="mb-2">📊</p>
                  <p>Coming Soon: User engagement patterns</p>
                  <p className="text-sm">Time-based activity analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recent Activity
              {Object.keys(filters).length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Filtered Results)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedData.guides.slice(0, 2).map((guide) => (
                <div key={guide.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Guide "{guide.name}" {guide.state}</p>
                    <p className="text-sm text-gray-500">
                      Last updated: {new Date(guide.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    guide.state === 'published' || guide.state === 'public' || guide.state === 'active'
                      ? 'bg-green-100 text-green-800'
                      : guide.state === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : guide.state === '_pendingReview_'
                      ? 'bg-orange-100 text-orange-800'
                      : guide.state === 'paused' || guide.state === 'inactive'
                      ? 'bg-red-100 text-red-800'
                      : guide.state === 'archived' || guide.state === 'private'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {guide.state.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
              {sortedData.features.slice(0, 1).map((feature) => (
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
              {sortedData.reports.slice(0, 1).map((report) => (
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
                  <p>No data matches the current filters.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};