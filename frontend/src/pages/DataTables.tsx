import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { DataTable } from '@/components/tables/DataTable';
import { DetailModal } from '@/components/tables/DetailModal';
import { Button } from '@/components/ui/button';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { useDashboardOverview } from '@/hooks/usePendoData';
import { useFilterStore } from '@/stores/filterStore';
import type { Guide, Feature, Page, Report } from '@/types/pendo';
import {
  DocumentTextIcon,
  CubeIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

type TabType = 'guides' | 'features' | 'pages' | 'reports';

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
}

export const DataTables: React.FC = () => {
  const navigate = useNavigate();
  const { guides, features, pages, reports, isLoading, error, refetch } = useDashboardOverview();
  const { filters, updateFilters, resetFilters } = useFilterStore();

  const [activeTab, setActiveTab] = useState<TabType>('guides');
  const [selectedItem, setSelectedItem] = useState<Guide | Feature | Page | Report | null>(null);
  const [detailModalType, setDetailModalType] = useState<'guide' | 'feature' | 'page' | 'report' | null>(null);
  const [tableState, setTableState] = useState<TableState>({
    guides: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } },
    features: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } },
    pages: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } },
    reports: { pagination: { page: 1, limit: 25, total: 0, hasPrevious: false, hasNext: false } }
  });

  // Apply filters to data (same logic as Dashboard)
  const filteredData = React.useMemo(() => {
    const filterArray = (array: any[], filterFn: (item: any) => boolean) => {
      return array.filter(filterFn);
    };

    const createFilterFn = (item: any) => {
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

  // Update pagination state when filtered data changes
  React.useEffect(() => {
    setTableState(prev => ({
      ...prev,
      guides: {
        ...prev.guides,
        pagination: {
          ...prev.guides.pagination,
          total: filteredData.guides.length,
          hasPrevious: prev.guides.pagination.page > 1,
          hasNext: prev.guides.pagination.page * prev.guides.pagination.limit < filteredData.guides.length
        }
      },
      features: {
        ...prev.features,
        pagination: {
          ...prev.features.pagination,
          total: filteredData.features.length,
          hasPrevious: prev.features.pagination.page > 1,
          hasNext: prev.features.pagination.page * prev.features.pagination.limit < filteredData.features.length
        }
      },
      pages: {
        ...prev.pages,
        pagination: {
          ...prev.pages.pagination,
          total: filteredData.pages.length,
          hasPrevious: prev.pages.pagination.page > 1,
          hasNext: prev.pages.pagination.page * prev.pages.pagination.limit < filteredData.pages.length
        }
      },
      reports: {
        ...prev.reports,
        pagination: {
          ...prev.reports.pagination,
          total: filteredData.reports.length,
          hasPrevious: prev.reports.pagination.page > 1,
          hasNext: prev.reports.pagination.page * prev.reports.pagination.limit < filteredData.reports.length
        }
      }
    }));
  }, [filteredData]);

  const tabs = [
    {
      id: 'guides' as TabType,
      label: 'Guides',
      icon: DocumentTextIcon,
      count: filteredData.guides.length,
      data: filteredData.guides,
      pagination: tableState.guides.pagination
    },
    {
      id: 'features' as TabType,
      label: 'Features',
      icon: CubeIcon,
      count: filteredData.features.length,
      data: filteredData.features,
      pagination: tableState.features.pagination
    },
    {
      id: 'pages' as TabType,
      label: 'Pages',
      icon: GlobeAltIcon,
      count: filteredData.pages.length,
      data: filteredData.pages,
      pagination: tableState.pages.pagination
    },
    {
      id: 'reports' as TabType,
      label: 'Reports',
      icon: ChartBarIcon,
      count: filteredData.reports.length,
      data: filteredData.reports,
      pagination: tableState.reports.pagination
    }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab)!;

  const getColumns = () => {
    switch (activeTab) {
      case 'guides':
        return [
          { key: 'name' as keyof Guide, header: 'Name', sortable: true },
          { key: 'state' as keyof Guide, header: 'Status', sortable: true, render: (value: string) => (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              value === 'published' || value === 'public' || value === 'active'
                ? 'bg-green-100 text-green-800'
                : value === 'draft'
                ? 'bg-yellow-100 text-yellow-800'
                : value === '_pendingReview_'
                ? 'bg-orange-100 text-orange-800'
                : value === 'paused' || value === 'inactive'
                ? 'bg-red-100 text-red-800'
                : value === 'archived' || value === 'private'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )},
          { key: 'viewedCount' as keyof Guide, header: 'Views', sortable: true },
          { key: 'completedCount' as keyof Guide, header: 'Completions', sortable: true },
          { key: 'createdAt' as keyof Guide, header: 'Created', sortable: true, render: (value: string) => (
            new Date(value).toLocaleDateString()
          )},
        ];
      case 'features':
        return [
          { key: 'name' as keyof Feature, header: 'Name', sortable: true },
          { key: 'eventType' as keyof Feature, header: 'Type', sortable: true },
          { key: 'visitorCount' as keyof Feature, header: 'Visitors', sortable: true },
          { key: 'usageCount' as keyof Feature, header: 'Usage', sortable: true },
          { key: 'createdAt' as keyof Feature, header: 'Created', sortable: true, render: (value: string) => (
            new Date(value).toLocaleDateString()
          )},
        ];
      case 'pages':
        return [
          { key: 'title' as keyof Page, header: 'Title', sortable: true, render: (value: string, item: Page) => (
            <div>
              <div className="font-medium">{value || 'Untitled'}</div>
              <div className="text-xs text-gray-500 font-mono">{item.url}</div>
            </div>
          )},
          { key: 'viewedCount' as keyof Page, header: 'Views', sortable: true },
          { key: 'visitorCount' as keyof Page, header: 'Visitors', sortable: true },
          { key: 'createdAt' as keyof Page, header: 'Created', sortable: true, render: (value: string) => (
            new Date(value).toLocaleDateString()
          )},
        ];
      case 'reports':
        return [
          { key: 'name' as keyof Report, header: 'Name', sortable: true },
          { key: 'description' as keyof Report, header: 'Description', sortable: false },
          { key: 'lastSuccessRunAt' as keyof Report, header: 'Last Run', sortable: true, render: (value: string) => (
            value ? new Date(value).toLocaleDateString() : 'Never'
          )},
          { key: 'createdAt' as keyof Report, header: 'Created', sortable: true, render: (value: string) => (
            new Date(value).toLocaleDateString()
          )},
        ];
      default:
        return [];
    }
  };

  const handleRowClick = (item: Guide | Feature | Page | Report) => {
    // Navigate to detailed report page instead of showing modal
    navigate(`/report/${activeTab}/${item.id}`);
  };

  const handlePaginationChange = (pagination: any) => {
    setTableState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        pagination: {
          ...prev[activeTab].pagination,
          ...pagination
        }
      }
    }));
  };

  const handleSort = (sortBy: any, sortOrder: 'asc' | 'desc') => {
    // This would typically trigger an API call with sort parameters
    console.log(`Sort by ${sortBy} in ${sortOrder} order`);
  };

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-600 mb-4">Error loading data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={true}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Data Tables
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Detailed view of all Pendo data with search, filtering, and export capabilities
          </p>
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
                        activeTab.id === tab.id
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
            <DataTable
              data={currentTab.data}
              columns={getColumns()}
              loading={isLoading}
              pagination={currentTab.pagination}
              onPaginationChange={handlePaginationChange}
              onSort={handleSort}
              onRowClick={handleRowClick}
              onRefresh={refetch}
              title={`${currentTab.label} Overview`}
              searchPlaceholder={`Search ${currentTab.label.toLowerCase()}...`}
            />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DetailModal
        item={selectedItem}
        type={detailModalType!}
        isOpen={!!selectedItem && !!detailModalType}
        onClose={() => {
          setSelectedItem(null);
          setDetailModalType(null);
        }}
      />
    </Layout>
  );
};