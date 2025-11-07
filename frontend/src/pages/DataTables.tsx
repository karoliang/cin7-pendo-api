import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Cin7DataTable } from '@/components/polaris/Cin7DataTable';
import { DetailModal } from '@/components/tables/DetailModal';
import { Button } from '@/components/ui/button';
import { FilterPanel } from '@/components/filters/FilterPanel';
// import { useDashboardOverview } from '@/hooks/usePendoData'; // Using Pendo API (causes browser crash with 368k+ events)
import { useSupabaseDashboard as useDashboardOverview } from '@/hooks/useSupabaseData'; // Using Supabase synced data (300 records)
import { useFilterStore } from '@/stores/filterStore';
import type { Guide, Feature, Page, Report, Event } from '@/types/pendo';
import { Cin7Card as Card, Cin7CardContent as CardContent, Cin7CardHeader as CardHeader, Cin7CardTitle as CardTitle } from '@/components/polaris';
import {
  DocumentTextIcon,
  CubeIcon,
  GlobeAltIcon,
  ChartBarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { usePageTitle, PAGE_TITLES, PAGE_DESCRIPTIONS } from '@/hooks/usePageTitle';

type TabType = 'guides' | 'features' | 'pages' | 'reports' | 'events';

interface TableState {
  guides: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasPrevious: boolean;
      hasNext: boolean;
    };
  };
  features: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasPrevious: boolean;
      hasNext: boolean;
    };
  };
  pages: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasPrevious: boolean;
      hasNext: boolean;
    };
  };
  reports: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasPrevious: boolean;
      hasNext: boolean;
    };
  };
  events: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasPrevious: boolean;
      hasNext: boolean;
    };
  };
}

export const DataTables: React.FC = () => {
  usePageTitle({
    title: PAGE_TITLES.DATA_TABLES,
    description: PAGE_DESCRIPTIONS.DATA_TABLES
  });

  const navigate = useNavigate();
  const { guides, features, pages, reports, events, isLoading, error, refetch } = useDashboardOverview();
  const { filters, updateFilters } = useFilterStore();

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Data fetched from Supabase:');
    console.log('  Guides:', guides.length);
    console.log('  Features:', features.length);
    console.log('  Pages:', pages.length);
    console.log('  Reports:', reports.length);
    console.log('  Events:', events.length);
  }, [guides.length, features.length, pages.length, reports.length, events.length]);

  const [activeTab, setActiveTab] = useState<TabType>('pages');
  const [selectedItem, setSelectedItem] = useState<Guide | Feature | Page | Report | Event | null>(null);
  const [detailModalType, setDetailModalType] = useState<'guide' | 'feature' | 'page' | 'report' | 'event' | null>(null);
  const [tableState, setTableState] = useState<TableState>({
    guides: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } },
    features: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } },
    pages: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } },
    reports: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } },
    events: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } }
  });

  // Apply filters to data (same logic as Dashboard)
  const filteredData = React.useMemo(() => {
    type FilterableItem = Guide | Feature | Page | Report;

    // Type guards for union type
    const isGuide = (item: FilterableItem): item is Guide => 'state' in item && 'viewedCount' in item && 'completedCount' in item;
    const isPage = (item: FilterableItem): item is Page => 'url' in item && 'name' in item;

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

    // Separate filter for events (simpler logic)
    const filterEvents = (eventsList: Event[]): Event[] => {
      return eventsList.filter(event => {
        if (filters.searchQuery) {
          const searchLower = filters.searchQuery.toLowerCase();
          const typeMatch = event.event_type?.toLowerCase().includes(searchLower);
          const entityMatch = event.entity_type?.toLowerCase().includes(searchLower);
          const countryMatch = event.country?.toLowerCase().includes(searchLower);
          if (!typeMatch && !entityMatch && !countryMatch) {
            return false;
          }
        }

        if (filters.dateRange?.start || filters.dateRange?.end) {
          const eventDate = new Date(event.browser_time);
          if (filters.dateRange.start && eventDate < filters.dateRange.start) {
            return false;
          }
          if (filters.dateRange.end && eventDate > filters.dateRange.end) {
            return false;
          }
        }

        return true;
      });
    };

    return {
      guides: filterArray(guides || [], createFilterFn),
      features: filterArray(features || [], createFilterFn),
      pages: filterArray(pages || [], createFilterFn),
      reports: filterArray(reports || [], createFilterFn),
      events: filterEvents(events || [])
    };
  }, [guides, features, pages, reports, events, filters]);

  // Sort data by most recent (default sorting)
  const sortedData = React.useMemo(() => {
    return {
      // Guides: Sort by updatedAt (most recently updated first)
      guides: [...filteredData.guides].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      }),
      // Features: Sort by createdAt (most recently created first)
      features: [...filteredData.features].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      }),
      // Pages: Sort by createdAt (most recently created first)
      pages: [...filteredData.pages].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      }),
      // Reports: Sort by createdAt (most recently created first)
      reports: [...filteredData.reports].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      }),
      // Events: Sort by browser_time (most recent first)
      events: [...filteredData.events].sort((a, b) => {
        const dateA = new Date(a.browser_time).getTime();
        const dateB = new Date(b.browser_time).getTime();
        return dateB - dateA; // Descending order (newest first)
      })
    };
  }, [filteredData]);

  // Update pagination state when sorted data changes
  React.useEffect(() => {
    const guidesTotal = sortedData.guides.length;
    const featuresTotal = sortedData.features.length;
    const pagesTotal = sortedData.pages.length;
    const reportsTotal = sortedData.reports.length;
    const eventsTotal = sortedData.events.length;

    setTableState(prev => {
      const newGuidesTotal = prev.guides.pagination.total !== guidesTotal;
      const newFeaturesTotal = prev.features.pagination.total !== featuresTotal;
      const newPagesTotal = prev.pages.pagination.total !== pagesTotal;
      const newReportsTotal = prev.reports.pagination.total !== reportsTotal;
      const newEventsTotal = prev.events.pagination.total !== eventsTotal;

      // Only update if totals actually changed
      if (!newGuidesTotal && !newFeaturesTotal && !newPagesTotal && !newReportsTotal && !newEventsTotal) {
        return prev;
      }

      return {
        ...prev,
        guides: {
          ...prev.guides,
          pagination: {
            ...prev.guides.pagination,
            total: guidesTotal,
            hasPrevious: prev.guides.pagination.page > 1,
            hasNext: prev.guides.pagination.page * prev.guides.pagination.limit < guidesTotal
          }
        },
        features: {
          ...prev.features,
          pagination: {
            ...prev.features.pagination,
            total: featuresTotal,
            hasPrevious: prev.features.pagination.page > 1,
            hasNext: prev.features.pagination.page * prev.features.pagination.limit < featuresTotal
          }
        },
        pages: {
          ...prev.pages,
          pagination: {
            ...prev.pages.pagination,
            total: pagesTotal,
            hasPrevious: prev.pages.pagination.page > 1,
            hasNext: prev.pages.pagination.page * prev.pages.pagination.limit < pagesTotal
          }
        },
        reports: {
          ...prev.reports,
          pagination: {
            ...prev.reports.pagination,
            total: reportsTotal,
            hasPrevious: prev.reports.pagination.page > 1,
            hasNext: prev.reports.pagination.page * prev.reports.pagination.limit < reportsTotal
          }
        },
        events: {
          ...prev.events,
          pagination: {
            ...prev.events.pagination,
            total: eventsTotal,
            hasPrevious: prev.events.pagination.page > 1,
            hasNext: prev.events.pagination.page * prev.events.pagination.limit < eventsTotal
          }
        }
      };
    });
  }, [sortedData.guides.length, sortedData.features.length, sortedData.pages.length, sortedData.reports.length, sortedData.events.length]);

  // Calculate summary metrics for each tab
  const summaryMetrics = React.useMemo(() => {
    // Guides metrics
    const guidesData = sortedData.guides as Guide[];
    const publishedGuides = guidesData.filter(g => g.state === 'published' || g.state === 'public').length;
    const draftGuides = guidesData.filter(g => g.state === 'draft').length;
    const archivedGuides = guidesData.filter(g => g.state === 'archived').length;
    const totalGuidesViewed = guidesData.reduce((sum, g) => sum + g.viewedCount, 0);
    const totalGuidesCompleted = guidesData.reduce((sum, g) => sum + g.completedCount, 0);
    const avgCompletionRate = totalGuidesViewed > 0
      ? ((totalGuidesCompleted / totalGuidesViewed) * 100).toFixed(1)
      : '0';

    // Get guide creation trend for last 30 days
    const now = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      return {
        date,
        count: guidesData.filter(g => {
          const guideDate = new Date(g.createdAt);
          return guideDate.toDateString() === date.toDateString();
        }).length
      };
    });
    const recentGuidesCount = last30Days.slice(-7).reduce((sum, day) => sum + day.count, 0);

    // Features metrics
    const featuresData = sortedData.features as Feature[];
    const topFeatures = [...featuresData]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);
    const totalFeatureUsage = featuresData.reduce((sum, f) => sum + f.usageCount, 0);
    const activeFeatures = featuresData.filter(f => f.usageCount > 0).length;
    const avgFeatureUsage = featuresData.length > 0
      ? Math.round(totalFeatureUsage / featuresData.length)
      : 0;

    // Pages metrics
    const pagesData = sortedData.pages as Page[];
    const topPages = [...pagesData]
      .sort((a, b) => b.viewedCount - a.viewedCount)
      .slice(0, 5);
    const totalPageViews = pagesData.reduce((sum, p) => sum + p.viewedCount, 0);
    const totalPageVisitors = pagesData.reduce((sum, p) => sum + p.visitorCount, 0);
    const avgViewsPerPage = pagesData.length > 0
      ? Math.round(totalPageViews / pagesData.length)
      : 0;

    // Reports metrics
    const reportsData = sortedData.reports as Report[];
    const reportsWithRuns = reportsData.filter(r => r.lastSuccessRunAt).length;
    const reportsNeverRun = reportsData.length - reportsWithRuns;
    const recentReports = reportsData.filter(r => {
      if (!r.lastSuccessRunAt) return false;
      const lastRun = new Date(r.lastSuccessRunAt);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return lastRun >= weekAgo;
    }).length;

    return {
      guides: {
        published: publishedGuides,
        draft: draftGuides,
        archived: archivedGuides,
        avgCompletionRate,
        recentCount: recentGuidesCount,
        totalViewed: totalGuidesViewed,
        totalCompleted: totalGuidesCompleted
      },
      features: {
        topFeatures,
        totalUsage: totalFeatureUsage,
        activeCount: activeFeatures,
        avgUsage: avgFeatureUsage
      },
      pages: {
        topPages,
        totalViews: totalPageViews,
        totalVisitors: totalPageVisitors,
        avgViewsPerPage
      },
      reports: {
        withRuns: reportsWithRuns,
        neverRun: reportsNeverRun,
        recentRuns: recentReports
      }
    };
  }, [sortedData]);

  const tabs = [
    {
      id: 'pages' as TabType,
      label: 'Pages',
      icon: GlobeAltIcon,
      count: filteredData.pages.length,
      data: sortedData.pages,
      pagination: tableState.pages.pagination
    },
    {
      id: 'guides' as TabType,
      label: 'Guides',
      icon: DocumentTextIcon,
      count: filteredData.guides.length,
      data: sortedData.guides,
      pagination: tableState.guides.pagination
    },
    {
      id: 'features' as TabType,
      label: 'Features',
      icon: CubeIcon,
      count: filteredData.features.length,
      data: sortedData.features,
      pagination: tableState.features.pagination
    },
    {
      id: 'reports' as TabType,
      label: 'Reports',
      icon: ChartBarIcon,
      count: filteredData.reports.length,
      data: sortedData.reports,
      pagination: tableState.reports.pagination
    },
    {
      id: 'events' as TabType,
      label: 'Events',
      icon: BoltIcon,
      count: filteredData.events.length,
      data: sortedData.events,
      pagination: tableState.events.pagination
    }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab)!;

  type TableItem = Guide | Feature | Page | Report | Event;

  const getColumns = (): Array<{
    key: string;
    header: string;
    render?: (value: unknown, item: TableItem) => React.ReactNode;
    sortable?: boolean;
    width?: string;
  }> => {
    switch (activeTab) {
      case 'guides':
        return [
          { key: 'name', header: 'Name', sortable: true, width: '40%' },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          { key: 'state', header: 'Status', sortable: true, render: (value: unknown, _item: TableItem) => {
            const state = value as string;
            return (
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  state === 'published' || state === 'public' || state === 'active'
                    ? 'bg-green-100 text-green-800'
                    : state === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : state === '_pendingReview_'
                    ? 'bg-orange-100 text-orange-800'
                    : state === 'paused' || state === 'inactive'
                    ? 'bg-red-100 text-red-800'
                    : state === 'archived' || state === 'private'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {state.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {(state === 'published' || state === 'public') && (
                  <span className="text-xs text-gray-500">
                    (Click for analytics)
                  </span>
                )}
              </div>
            );
          }},
          { key: 'type', header: 'Type', sortable: true, render: (value: unknown) => {
            return value ? (
              <span className="text-sm text-gray-600 capitalize">{value as string}</span>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            );
          }},
          { key: 'updatedAt', header: 'Last Updated', sortable: true, render: (value: unknown) => (
            new Date(value as string).toLocaleDateString()
          )},
          { key: 'createdAt', header: 'Created', sortable: true, render: (value: unknown) => (
            new Date(value as string).toLocaleDateString()
          )},
        ];
      case 'features':
        return [
          { key: 'name', header: 'Name', sortable: true, render: (value: unknown, item: TableItem) => {
            const feature = item as Feature;
            const hasActivity = feature.usageCount > 0 || feature.visitorCount > 0;
            return (
              <div className="flex items-center gap-2">
                <span className="font-medium">{value as string}</span>
                {hasActivity && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓
                  </span>
                )}
                {!hasActivity && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    No data
                  </span>
                )}
              </div>
            );
          }},
          { key: 'eventType', header: 'Type', sortable: true },
          { key: 'visitorCount', header: 'Visitors', sortable: true, render: (value: unknown) => {
            const count = (value as number) || 0;
            return (
              <span className={`font-semibold ${count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                {count.toLocaleString()}
              </span>
            );
          }},
          { key: 'usageCount', header: 'Usage', sortable: true, render: (value: unknown) => {
            const count = (value as number) || 0;
            return (
              <span className={`font-semibold ${count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {count.toLocaleString()}
              </span>
            );
          }},
          { key: 'createdAt', header: 'Created', sortable: true, render: (value: unknown) => (
            new Date(value as string).toLocaleDateString()
          )},
        ];
      case 'pages':
        return [
          { key: 'name', header: 'Page Name', sortable: true, render: (value: unknown, item: TableItem) => {
            const page = item as Page;
            return (
              <div>
                <div className="font-medium">{value as string}</div>
                <div className="text-xs text-gray-500 font-mono">{page.url}</div>
              </div>
            );
          }},
          { key: 'createdAt', header: 'Created', sortable: true, render: (value: unknown) => (
            new Date(value as string).toLocaleDateString()
          )},
        ];
      case 'reports':
        return [
          { key: 'name', header: 'Name', sortable: true },
          { key: 'description', header: 'Description', sortable: false },
          { key: 'lastSuccessRunAt', header: 'Last Run', sortable: true, render: (value: unknown) => (
            value ? new Date(value as string).toLocaleDateString() : 'Never'
          )},
          { key: 'createdAt', header: 'Created', sortable: true, render: (value: unknown) => (
            new Date(value as string).toLocaleDateString()
          )},
        ];
      case 'events':
        return [
          { key: 'event_type', header: 'Event Type', sortable: true, render: (value: unknown) => (
            <span className="font-medium text-blue-600">{value as string}</span>
          )},
          { key: 'entity_type', header: 'Entity', sortable: true, render: (value: unknown) => {
            const type = value as string | null;
            return type ? (
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                type === 'guide' ? 'bg-purple-100 text-purple-800' :
                type === 'feature' ? 'bg-blue-100 text-blue-800' :
                type === 'page' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {type}
              </span>
            ) : <span className="text-gray-400">—</span>;
          }},
          { key: 'visitor_id', header: 'Visitor ID', sortable: false, render: (value: unknown) => (
            value ? <span className="font-mono text-xs text-gray-600">{(value as string).substring(0, 8)}...</span> : <span className="text-gray-400">—</span>
          )},
          { key: 'country', header: 'Location', sortable: true, render: (value: unknown, item: TableItem) => {
            const event = item as Event;
            const location = [event.city, event.region, event.country].filter(Boolean).join(', ');
            return location || <span className="text-gray-400">—</span>;
          }},
          { key: 'browser_time', header: 'Time', sortable: true, render: (value: unknown) => {
            const date = new Date(value as string);
            return (
              <div>
                <div className="text-sm">{date.toLocaleDateString()}</div>
                <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
              </div>
            );
          }},
        ];
      default:
        return [];
    }
  };

  const handleRowClick = (item: Guide | Feature | Page | Report | Event) => {
    // Navigate to detailed report page instead of showing modal
    console.log('Navigating to:', `/report/${activeTab}/${item.id}`, {
      activeTab,
      itemId: item.id,
      itemName: 'name' in item ? item.name : 'event_type' in item ? item.event_type : 'Unknown'
    });
    navigate(`/report/${activeTab}/${item.id}`);
  };

  const handlePaginationChange = (pagination: { page?: number; limit?: number }) => {
    setTableState(prev => {
      const currentTab = prev[activeTab];
      const newPage = pagination.page ?? currentTab.pagination.page;
      const newLimit = pagination.limit ?? currentTab.pagination.limit;
      const total = currentTab.pagination.total;

      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          pagination: {
            ...currentTab.pagination,
            page: newPage,
            limit: newLimit,
            hasPrevious: newPage > 1,
            hasNext: newPage * newLimit < total
          }
        }
      };
    });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    // This would typically trigger an API call with sort parameters
    console.log(`Sort by ${sortBy} in ${sortOrder} order`);
  };

  if (error) {
    return (
      <Layout showNavigation={true}>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Data Tables</h1>
            <p className="mt-1 text-sm text-red-600">Error loading data</p>
          </div>
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-600 mb-4">Error loading data</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      showNavigation={true}
      title="Data Tables"
      subtitle="Detailed view of all Pendo data with search, filtering, and export capabilities"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                About Analytics Data
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                <strong>Note:</strong> Pendo's guide list API does not include view/completion counts. These fields show <strong>0</strong> in the table by default.
                Click on any guide to view detailed analytics with real aggregation API data.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterPanel
          filters={filters}
          onFiltersChange={updateFilters}
        />

        {/* Data Tables */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group relative min-w-0 flex-1 py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                      <span className="bg-gray-100 text-gray-900 group-hover:bg-gray-200 ml-2 py-0.5 px-2 rounded-full text-xs font-medium">
                        {tab.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Table Content */}
          <div className="p-6">

            {activeTab === 'features' && (
              <div className="mb-6">
                {summaryMetrics.features.topFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Top 5 Features by Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {summaryMetrics.features.topFeatures.map((feature, index) => (
                          <div key={feature.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-400 w-6">{index + 1}.</span>
                              <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                            </div>
                            <span className="text-sm font-bold text-blue-600">{feature.usageCount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'pages' && (
              <div className="mb-6">
                {/* Only show top pages if they have actual view data */}
                {summaryMetrics.pages.topPages.length > 0 && summaryMetrics.pages.topPages.some(page => page.viewedCount > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Top 5 Pages by Views</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {summaryMetrics.pages.topPages.map((page, index) => (
                          <div key={page.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-sm font-semibold text-gray-400 w-6">{index + 1}.</span>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-700 truncate">{page.name}</div>
                                <div className="text-xs text-gray-500 font-mono truncate">{page.url}</div>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-sm font-bold text-blue-600">{page.viewedCount.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">{page.visitorCount.toLocaleString()} visitors</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}


            {/* Coming Soon Notice for Guides, Features, and Reports */}
            {(activeTab === 'guides' || activeTab === 'features' || activeTab === 'reports') && (
              <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-800">
                      Coming Soon - Limited Data Available
                    </h3>
                    <p className="mt-1 text-sm text-amber-700">
                      This dataset is currently being enhanced. While you can view and search through existing {currentTab.label.toLowerCase()},
                      full analytics and aggregation data will be available soon. The <strong>Pages</strong> tab contains complete data with full analytics capabilities.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Cin7DataTable
              data={currentTab.data as any}
              columns={getColumns() as any}
              loading={isLoading}
              pagination={currentTab.pagination}
              onPaginationChange={handlePaginationChange}
              onSort={handleSort}
              onRowClick={handleRowClick as any}
              onRefresh={refetch}
              title={currentTab.label}
              searchPlaceholder={`Search ${currentTab.label.toLowerCase()}...`}
            />
          </div>
        </div>
      </div>

      {/* Detail Modal - Only for non-Event types */}
      {selectedItem && detailModalType && detailModalType !== 'event' && (
        <DetailModal
          item={selectedItem as Guide | Feature | Page | Report}
          type={detailModalType as 'guide' | 'feature' | 'page' | 'report'}
          isOpen={true}
          onClose={() => {
            setSelectedItem(null);
            setDetailModalType(null);
          }}
        />
      )}
    </Layout>
  );
};