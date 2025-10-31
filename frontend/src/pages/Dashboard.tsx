import React, { useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { KPICard } from '@/components/dashboard/KPICard';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { AdvancedSearch } from '@/components/filters/AdvancedSearch';
import { GuidePerformanceChart } from '@/components/charts/GuidePerformanceChart';
import { FeatureAdoptionChart } from '@/components/charts/FeatureAdoptionChart';
import { PageAnalyticsChart } from '@/components/charts/PageAnalyticsChart';
import { Cin7Card as Card, Cin7CardContent as CardContent, Cin7CardHeader as CardHeader, Cin7CardTitle as CardTitle } from '@/components/polaris';
import { Cin7Button as Button } from '@/components/polaris';
import { useDashboardOverview } from '@/hooks/usePendoData';
import { useFilterStore } from '@/stores/filterStore';
import type { Guide, Feature, Page, Report } from '@/types/pendo';

// Define SearchFilters interface to match AdvancedSearch component
interface SearchFilters {
  type: 'all' | 'guide' | 'feature' | 'page' | 'report';
}

export const Dashboard: React.FC = () => {
  const { guides, features, pages, reports, isLoading, error, refetch } = useDashboardOverview();
  const { filters, updateFilters, resetFilters } = useFilterStore();

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

  const handleAdvancedSearch = (query: string, searchFilters?: SearchFilters) => {
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

  // Calculate KPI data from filtered data
  const kpiData = [
    {
      title: 'Total Guides',
      value: sortedData.guides.length.toString(),
      change: 12,
      changeType: 'increase' as const,
      description: `${(sortedData.guides as Guide[]).filter(g => g.state === 'published').length} published`
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

  const subtitle = Object.keys(filters).length > 0
    ? `Real-time insights from your Pendo data (${Object.keys(filters).length} filter${Object.keys(filters).length > 1 ? 's' : ''} applied)`
    : 'Real-time insights from your Pendo data';

  return (
    <Layout
      showNavigation={true}
      title="Analytics Overview"
      subtitle={subtitle}
      primaryAction={{
        content: 'Refresh',
        onAction: () => refetch()
      }}
    >
      <div className="space-y-8">

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
            guides={sortedData.guides as Guide[]}
          />

          <FeatureAdoptionChart
            features={sortedData.features as Feature[]}
          />
        </div>

        {/* Additional Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PageAnalyticsChart
            pages={sortedData.pages as Page[]}
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