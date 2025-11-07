import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { BreadcrumbWithHome } from '@/components/ui/breadcrumb';
import { Button } from '@/components/polaris/Cin7Button';
import { Cin7Card as Card, Cin7CardContent as CardContent, Cin7CardHeader as CardHeader, Cin7CardTitle as CardTitle } from '@/components/polaris';
import { Cin7Badge as Badge } from '@/components/polaris';
import { DataQualityBadge } from '@/components/ui/DataQualityBadge';
// Tabs removed - showing all content on single page
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  EyeIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CubeIcon,
  GlobeAltIcon,
  ShareIcon,
  StarIcon,
  UsersIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Import report hooks
import { useGuideReport } from '@/hooks/useReportData';
import { useFeatureReport } from '@/hooks/useReportData';
import { usePageReport } from '@/hooks/useReportData';
import { useReportReport } from '@/hooks/useReportData';

// Import chart components
import { ReportLineChart } from '@/components/reports/ReportLineChart';
import { ReportPieChart } from '@/components/reports/ReportPieChart';
import { GeographicMap } from '@/components/reports/GeographicMap';
import type { GeographicMapData } from '@/components/reports/GeographicMap';
import { SessionTimingDistribution } from '@/components/reports/SessionTimingDistribution';
import { CompletionFunnel } from '@/components/charts/CompletionFunnel';
import { AIInsightsDisplay } from '@/components/reports/AIInsightsDisplay';
import { RecommendationsPanel } from '@/components/reports/RecommendationsPanel';
import { SectionEngagementChart } from '@/components/reports/SectionEngagementChart';

// Import AI Summary component
import { AISummary } from '@/components/ai/AISummary';

// Import Guide-specific components
import { AudienceTargetingDisplay } from '@/components/guides/AudienceTargetingDisplay';

// Import Spinner component
import { InlineSpinner } from '@/components/ui/Spinner';

// Import page title hook
import { usePageTitle, PAGE_TITLES, PAGE_DESCRIPTIONS } from '@/hooks/usePageTitle';

// Import Revenue Impact component
import { RevenueImpact } from '@/components/dashboard/RevenueImpact';

// Import comprehensive types
import type {
  ComprehensiveGuideData,
  ComprehensiveFeatureData,
  ComprehensivePageData,
  ComprehensiveReportData
} from '@/types/enhanced-pendo';

type ReportDataType = ComprehensiveGuideData | ComprehensiveFeatureData | ComprehensivePageData | ComprehensiveReportData;
type ReportType = 'guides' | 'features' | 'pages' | 'reports';

// Type helper to extract common properties across all report types
interface ReportDataWithState {
  state?: string;
  description?: string;
  type?: string;
  eventType?: string;
  url?: string;
}

export const ReportDetails: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  // Set page title
  usePageTitle({
    title: PAGE_TITLES.REPORT_DETAILS,
    description: PAGE_DESCRIPTIONS.REPORT_DETAILS
  });

  // Removed activeTab state - showing all content on single page

  // State for time series view toggle (daily, weekly, monthly)
  const [timeSeriesView, setTimeSeriesView] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Pagination state for event breakdown
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  // Sorting state for event breakdown
  const [sortColumn, setSortColumn] = React.useState<string>('date');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  // Helper function to generate Pendo recording URL
  const getPendoRecordingUrl = (recordingId: string) => {
    return `https://app.pendo.io/recordings/${recordingId}`;
  };

  // Type guards
  const isValidType = (t: string): t is ReportType =>
    ['guides', 'features', 'pages', 'reports'].includes(t);

  // CRITICAL: All hooks MUST be called unconditionally before any early returns
  // Call hooks with safe defaults when type/id are invalid
  const safeId = id || '';
  const validatedType = type && isValidType(type) ? type : 'guides';

  // Fetch data based on type - hooks MUST be called unconditionally
  // BUT we enable/disable them based on the actual type needed
  const guideReport = useGuideReport(safeId, { enabled: validatedType === 'guides' && !!id });
  const featureReport = useFeatureReport(safeId, { enabled: validatedType === 'features' && !!id });
  const pageReport = usePageReport(safeId, { enabled: validatedType === 'pages' && !!id });
  const reportReport = useReportReport(safeId, { enabled: validatedType === 'reports' && !!id });

  // Helper functions need to be defined before early return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aggregateByWeek = React.useCallback((dailyData: any[]) => {
    if (!dailyData || dailyData.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weeklyMap = new Map<string, any>();

    dailyData.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          date: weekKey,
          views: 0,
          visitors: 0,
          avgTimeOnPage: 0,
          frustrationCount: 0,
          _count: 0,
          _totalTime: 0
        });
      }

      const weekData = weeklyMap.get(weekKey)!;
      weekData.views += day.views || 0;
      weekData.visitors += day.visitors || 0;
      weekData.frustrationCount += day.frustrationCount || 0;
      weekData._totalTime += day.avgTimeOnPage || 0;
      weekData._count++;
    });

    return Array.from(weeklyMap.values()).map(week => ({
      ...week,
      avgTimeOnPage: week._count > 0 ? week._totalTime / week._count : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  // Helper function to aggregate time series data by month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aggregateByMonth = React.useCallback((dailyData: any[]) => {
    if (!dailyData || dailyData.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monthlyMap = new Map<string, any>();

    dailyData.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          date: monthKey,
          views: 0,
          visitors: 0,
          avgTimeOnPage: 0,
          frustrationCount: 0,
          _count: 0,
          _totalTime: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.views += day.views || 0;
      monthData.visitors += day.visitors || 0;
      monthData.frustrationCount += day.frustrationCount || 0;
      monthData._totalTime += day.avgTimeOnPage || 0;
      monthData._count++;
    });

    return Array.from(monthlyMap.values()).map(month => ({
      ...month,
      avgTimeOnPage: month._count > 0 ? month._totalTime / month._count : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  // Get aggregated time series data based on selected view
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTimeSeriesData = React.useCallback((dailyData: any[]) => {
    switch (timeSeriesView) {
      case 'weekly':
        return aggregateByWeek(dailyData);
      case 'monthly':
        return aggregateByMonth(dailyData);
      default:
        return dailyData;
    }
  }, [timeSeriesView, aggregateByWeek, aggregateByMonth]);

  useEffect(() => {
    console.log('ReportDetails route accessed:', { type, id, isValid: type ? isValidType(type) : false });
    if (!type || !id || !isValidType(type)) {
      console.log('Invalid route params, navigating to tables');
      navigate('/tables');
    }
  }, [type, id, navigate]);

  // Now safe to do early return - all hooks have been called
  if (!type || !id || !isValidType(type)) {
    return null;
  }

  // Get the appropriate data and loading state based on validated type
  const currentReport =
    type === 'guides' ? guideReport :
    type === 'features' ? featureReport :
    type === 'pages' ? pageReport :
    reportReport;

  const data = currentReport?.data as ReportDataType;
  const isLoading = currentReport?.isLoading ?? false;
  const error = currentReport?.error;

  // Check if this is a "no data" scenario vs "not found"
  // DISABLED: User wants to see charts with 0 values, not a "no data" screen
  const hasZeroData = false; // data &&
    // type === 'guides' &&
    // (data as ComprehensiveGuideData).viewedCount === 0;

  // Pagination helper functions (must be after data declaration)
  const getPaginatedEvents = React.useCallback(() => {
    if (!data || type !== 'pages') return [];
    let events = [...((data as ComprehensivePageData).eventBreakdown || [])];

    // Sort events
    events.sort((a, b) => {
      let aValue: any = a[sortColumn as keyof typeof a];
      let bValue: any = b[sortColumn as keyof typeof b];

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Numeric comparison
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return events.slice(startIndex, endIndex);
  }, [data, type, currentPage, pageSize, sortColumn, sortDirection]);

  const paginationMeta = React.useMemo(() => {
    if (!data || type !== 'pages') return { totalItems: 0, totalPages: 0, startIndex: 0, endIndex: 0 };
    const events = (data as ComprehensivePageData).eventBreakdown || [];
    const totalItems = events.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems);
    return { totalItems, totalPages, startIndex, endIndex };
  }, [data, type, currentPage, pageSize]);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Render sort indicator
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <span className="text-gray-300 ml-1">⇅</span>;
    }
    return sortDirection === 'asc' ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  if (isLoading) {
    return (
      <Layout showNavigation={true}>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <BreadcrumbWithHome
            items={[
              { label: 'Data Tables', href: '/tables' },
              { label: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Loading...', href: '/tables' },
              { label: 'Loading...' }
            ]}
            className="mb-6"
          />

          {/* Spinner overlay */}
          <div className="flex justify-center items-center py-12">
            <InlineSpinner message="Loading report data..." size="lg" />
          </div>

          {/* Skeleton loading state */}
          <div className="animate-pulse mt-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle errors - but distinguish between "not found" and actual errors
  if (error || !data) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFoundError = errorMessage.includes('not found') || errorMessage.includes('404');

    return (
      <Layout showNavigation={true}>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <BreadcrumbWithHome
            items={[
              { label: 'Data Tables', href: '/tables' },
              { label: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Error', href: '/tables' },
              { label: 'Error' }
            ]}
            className="mb-6"
          />

          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isNotFoundError ? 'Pendo Data Not Found' : 'Pendo Data Not Available'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isNotFoundError
                ? `The ${type.slice(0, -1)} with ID "${id}" was not found in your Pendo system. This dashboard only displays real Pendo data.`
                : `Unable to load data from Pendo. ${errorMessage}`}
            </p>
            {type === 'guides' && isNotFoundError && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">To Get Real Pendo Guide IDs:</h3>
                <ol className="list-decimal list-inside text-blue-800 space-y-1">
                  <li>Open your browser's Developer Tools (F12)</li>
                  <li>Go to the Console tab</li>
                  <li>Navigate to the Data Tables page</li>
                  <li>Look for the "Available Pendo Guides:" message</li>
                  <li>Copy any real guide ID and use it in the URL: /report/guides/REAL_ID</li>
                </ol>
              </div>
            )}
            <div className="space-x-4">
              <Button onClick={() => navigate('/tables')}>
                Back to Data Tables
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle zero-data scenario for guides (guide exists but has no views)
  if (hasZeroData) {
    return (
      <Layout showNavigation={true}>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <BreadcrumbWithHome
            items={[
              { label: 'Data Tables', href: '/tables' },
              { label: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Data', href: '/tables' },
              { label: data.name }
            ]}
            className="mb-6"
          />

          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tables')}
              className="text-gray-500 hover:text-gray-700"
            >
              Back to Tables
            </Button>
          </div>

          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{data.name}</h2>
            <p className="text-gray-600 mb-8">This guide has not been viewed yet</p>

            <Card className="max-w-2xl mx-auto text-left">
              <CardHeader>
                <CardTitle>No Analytics Data Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    This guide exists in your Pendo system but has not received any views during the selected time period (last 30 days).
                  </p>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">Possible Reasons:</h4>
                    <ul className="list-disc list-inside text-yellow-800 space-y-1 text-sm">
                      <li>The guide is disabled or not published</li>
                      <li>The guide targeting rules are not matching any users</li>
                      <li>The guide was recently created and hasn't been triggered yet</li>
                      <li>The selected time period doesn't include any guide activity</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Views</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">0%</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Guide Details:</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="text-gray-900 font-mono">{data.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">State:</span>
                        <Badge variant="secondary" className="capitalize">
                          {(data as ComprehensiveGuideData).state || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-900">{new Date(data.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 space-x-4">
              <Button onClick={() => navigate('/tables')}>
                Back to Data Tables
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Get type-specific icon and title
  const getTypeInfo = () => {
    switch (type) {
      case 'guides':
        return { icon: DocumentTextIcon, title: 'Guide Report', color: 'blue' };
      case 'features':
        return { icon: CubeIcon, title: 'Feature Report', color: 'green' };
      case 'pages':
        return { icon: GlobeAltIcon, title: 'Page Report', color: 'purple' };
      case 'reports':
        return { icon: ChartBarIcon, title: 'Analytics Report', color: 'orange' };
      default:
        return { icon: DocumentTextIcon, title: 'Report', color: 'gray' };
    }
  };

  const typeInfo = getTypeInfo();
  const Icon = typeInfo.icon;

  // Calculate primary KPIs based on type
  const getPrimaryKPIs = () => {
    switch (type) {
      case 'guides': {
        const guideData = data as ComprehensiveGuideData;
        return [
          { label: 'Total Views', value: guideData.viewedCount.toLocaleString(), icon: EyeIcon },
          { label: 'Completions', value: guideData.completedCount.toLocaleString(), icon: CheckCircleIcon },
          { label: 'Completion Rate', value: `${guideData.completionRate.toFixed(1)}%`, icon: ChartBarIcon },
          { label: 'Engagement Rate', value: `${guideData.engagementRate.toFixed(1)}%`, icon: UserGroupIcon },
        ];
      }
      case 'features': {
        const featureData = data as ComprehensiveFeatureData;
        return [
          { label: 'Usage Count', value: featureData.usageCount.toLocaleString(), icon: CubeIcon },
          { label: 'Unique Users', value: featureData.visitorCount.toLocaleString(), icon: UserGroupIcon },
          { label: 'Adoption Rate', value: `${featureData.adoptionRate}%`, icon: ChartBarIcon },
          { label: 'Usage Frequency', value: `${featureData.usageFrequency}x/day`, icon: ClockIcon },
        ];
      }
      case 'pages': {
        const pageData = data as ComprehensivePageData;
        return [
          { label: 'Page Views', value: pageData.viewedCount.toLocaleString(), icon: EyeIcon },
          { label: 'Unique Visitors', value: pageData.visitorCount.toLocaleString(), icon: UserGroupIcon },
          { label: 'Avg Time on Page', value: `${pageData.avgTimeOnPage}s`, icon: ClockIcon },
        ];
      }
      case 'reports': {
        const reportData = data as ComprehensiveReportData;
        return [
          { label: 'Total Views', value: reportData.totalViews.toLocaleString(), icon: EyeIcon },
          { label: 'Unique Viewers', value: reportData.uniqueViewers.toLocaleString(), icon: UserGroupIcon },
          { label: 'Shares', value: reportData.shares.toLocaleString(), icon: ShareIcon },
          { label: 'Rating', value: `⭐ ${reportData.averageRating}`, icon: StarIcon },
        ];
      }
      default:
        return [];
    }
  };

  const primaryKPIs = getPrimaryKPIs();

  const handleExport = (format: 'pdf' | 'csv') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    const csvRows: string[] = [];

    // Add header information
    csvRows.push(`Report Type,${type.toUpperCase()}`);
    csvRows.push(`ID,${id}`);
    csvRows.push(`Name,${data.name}`);
    csvRows.push(`Generated,${new Date().toLocaleString()}`);
    csvRows.push(''); // Empty row

    // Add KPIs section
    csvRows.push('KEY PERFORMANCE INDICATORS');
    csvRows.push('Metric,Value');
    primaryKPIs.forEach(kpi => {
      csvRows.push(`${kpi.label},${kpi.value}`);
    });
    csvRows.push(''); // Empty row

    // Add type-specific data
    if (type === 'guides') {
      const guideData = data as ComprehensiveGuideData;
      csvRows.push('GUIDE DETAILS');
      csvRows.push('Field,Value');
      csvRows.push(`State,${guideData.state}`);
      csvRows.push(`Type,${guideData.type}`);
      csvRows.push(`Kind,${guideData.kind}`);
      csvRows.push(`Created At,${new Date(guideData.createdAt).toLocaleString()}`);
      csvRows.push(`Updated At,${new Date(guideData.updatedAt).toLocaleString()}`);
      csvRows.push(`Last Shown Count,${guideData.lastShownCount}`);
      csvRows.push(`Viewed Count,${guideData.viewedCount}`);
      csvRows.push(`Completed Count,${guideData.completedCount}`);
      csvRows.push(`Completion Rate,${guideData.completionRate.toFixed(2)}%`);
      csvRows.push(`Engagement Rate,${guideData.engagementRate.toFixed(2)}%`);
      csvRows.push(`Average Time to Complete,${guideData.averageTimeToComplete} seconds`);
      csvRows.push(`Drop Off Rate,${guideData.dropOffRate.toFixed(2)}%`);
      csvRows.push(''); // Empty row

      // Add steps if available
      if (guideData.steps && guideData.steps.length > 0) {
        csvRows.push('GUIDE STEPS');
        csvRows.push('Step Number,Step Name,Viewed Count,Completed Count,Time Spent (s),Drop Off Count,Drop Off Rate');
        guideData.steps.forEach(step => {
          csvRows.push(`${step.order},"${step.name.replace(/"/g, '""')}",${step.viewedCount},${step.completedCount},${step.timeSpent},${step.dropOffCount},${step.dropOffRate.toFixed(2)}%`);
        });
      }
    } else if (type === 'features') {
      const featureData = data as ComprehensiveFeatureData;
      csvRows.push('FEATURE DETAILS');
      csvRows.push('Field,Value');
      csvRows.push(`Type,${featureData.type}`);
      csvRows.push(`Event Type,${featureData.eventType}`);
      csvRows.push(`Visitor Count,${featureData.visitorCount}`);
      csvRows.push(`Account Count,${featureData.accountCount}`);
      csvRows.push(`Usage Count,${featureData.usageCount}`);
      csvRows.push(`Unique Users,${featureData.uniqueUsers}`);
      csvRows.push(`Adoption Rate,${featureData.adoptionRate}%`);
      csvRows.push(`Usage Frequency,${featureData.usageFrequency}x/day`);
      csvRows.push(`Retention Rate,${featureData.retentionRate}%`);
      csvRows.push(`Stickiness Index,${featureData.stickinessIndex}`);
      csvRows.push(`Power User Percentage,${featureData.powerUserPercentage}%`);
      csvRows.push(`Created At,${new Date(featureData.createdAt).toLocaleString()}`);
      csvRows.push(`Updated At,${new Date(featureData.updatedAt).toLocaleString()}`);
    } else if (type === 'pages') {
      const pageData = data as ComprehensivePageData;
      csvRows.push('PAGE DETAILS');
      csvRows.push('Field,Value');
      csvRows.push(`URL,${pageData.url}`);
      csvRows.push(`Title,${pageData.title || 'N/A'}`);
      csvRows.push(`Type,${pageData.type}`);
      csvRows.push(`Viewed Count,${pageData.viewedCount}`);
      csvRows.push(`Visitor Count,${pageData.visitorCount}`);
      csvRows.push(`Unique Visitors,${pageData.uniqueVisitors}`);
      csvRows.push(`Average Time on Page,${pageData.avgTimeOnPage} seconds`);
      csvRows.push(`Load Time,${pageData.loadTime} ms`);
      csvRows.push(`Interaction Latency,${pageData.interactionLatency} ms`);
      csvRows.push(`Error Rate,${pageData.errorRate}%`);
      csvRows.push(`Created At,${new Date(pageData.createdAt).toLocaleString()}`);
      csvRows.push(`Updated At,${new Date(pageData.updatedAt).toLocaleString()}`);
      csvRows.push(''); // Empty row

      // Add event breakdown if available
      if (pageData.eventBreakdown && pageData.eventBreakdown.length > 0) {
        csvRows.push('EVENT BREAKDOWN');
        csvRows.push('Visitor ID,Account ID,Date,Total Views,U-turns,Dead Clicks,Error Clicks,Rage Clicks,Server Name,Browser Name,Browser Version');
        pageData.eventBreakdown.forEach(event => {
          csvRows.push(`${event.visitorId},${event.accountId || ''},${event.date},${event.totalViews},${event.uTurns || 0},${event.deadClicks || 0},${event.errorClicks || 0},${event.rageClicks || 0},${event.serverName || ''},${event.browserName || ''},${event.browserVersion || ''}`);
        });
      }
    } else if (type === 'reports') {
      const reportData = data as ComprehensiveReportData;
      csvRows.push('REPORT DETAILS');
      csvRows.push('Field,Value');
      csvRows.push(`Type,${reportData.type}`);
      csvRows.push(`Kind,${reportData.kind}`);
      csvRows.push(`Level,${reportData.level}`);
      csvRows.push(`Total Views,${reportData.totalViews}`);
      csvRows.push(`Unique Viewers,${reportData.uniqueViewers}`);
      csvRows.push(`Shares,${reportData.shares}`);
      csvRows.push(`Downloads,${reportData.downloads}`);
      csvRows.push(`Average Rating,${reportData.averageRating}`);
      csvRows.push(`Average Time Spent,${reportData.averageTimeSpent} seconds`);
      csvRows.push(`Engagement Score,${reportData.engagementScore}`);
      csvRows.push(`Return Visitor Rate,${reportData.returnVisitorRate}%`);
      csvRows.push(`Created At,${new Date(reportData.createdAt).toLocaleString()}`);
      csvRows.push(`Updated At,${new Date(reportData.updatedAt).toLocaleString()}`);
    }

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_${id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Use browser's print functionality which allows saving as PDF
    window.print();
  };

  // Helper function to check if geographic data contains only zeros
  const hasValidGeographicData = (): boolean => {
    if (type === 'pages') {
      const geoData = (data as ComprehensivePageData).geographicDistribution;
      if (!geoData || geoData.length === 0) return false;
      // Check if all visitors and views are 0
      return geoData.some(geo => geo.visitors > 0 || geo.views > 0);
    } else if (type === 'guides') {
      const geoData = (data as ComprehensiveGuideData).geographicDistribution;
      if (!geoData || geoData.length === 0) return false;
      // Check if all users are 0
      return geoData.some(geo => geo.users > 0);
    } else if (type === 'features') {
      const geoData = (data as ComprehensiveFeatureData).geographicDistribution;
      if (!geoData || geoData.length === 0) return false;
      // Check if all users are 0
      return geoData.some(geo => geo.users > 0);
    }
    return false;
  };

  // Helper function to check if device/browser data contains only zeros
  const hasValidDeviceData = (): boolean => {
    if (type === 'pages') {
      const deviceData = (data as ComprehensivePageData).deviceBrowserBreakdown;
      if (!deviceData || deviceData.length === 0) return false;
      // Check if all users are 0
      return deviceData.some(device => device.users > 0);
    } else if (type === 'guides') {
      const deviceData = (data as ComprehensiveGuideData).deviceBreakdown;
      if (!deviceData || deviceData.length === 0) return false;
      // Check if all users are 0
      return deviceData.some(device => device.users > 0);
    } else if (type === 'features') {
      const deviceData = (data as ComprehensiveFeatureData).deviceBreakdown;
      if (!deviceData || deviceData.length === 0) return false;
      // Check if all users are 0
      return deviceData.some(device => device.users > 0);
    }
    return false;
  };

  // Helper to get tab label from type
  const getTabLabel = () => {
    switch (type) {
      case 'guides': return 'Guides';
      case 'features': return 'Features';
      case 'pages': return 'Pages';
      case 'reports': return 'Reports';
      default: return 'Data';
    }
  };

  return (
    <Layout showNavigation={true}>
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbWithHome
          items={[
            { label: 'Data Tables', href: '/tables' },
            { label: getTabLabel(), href: '/tables' },
            { label: data.name }
          ]}
        />

        {/* Header - Redesigned for better UX */}
        <div className="space-y-4">
          {/* Row 1: Navigation and Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tables')}
              className="text-gray-500 hover:text-gray-700"
            >
              Back to Tables
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentReport?.refetch) {
                  currentReport.refetch();
                }
              }}
              disabled={isLoading}
            >
              Refresh Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
          </div>

          {/* Row 2: Page Title - Full Width */}
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-${typeInfo.color}-100 rounded-lg`}>
              <Icon className={`h-8 w-8 text-${typeInfo.color}-600`} />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">{data.name}</h1>
            </div>
          </div>

          {/* Row 3: Metadata */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">{typeInfo.title}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <Badge variant="secondary" className="capitalize">
              {(data as ReportDataWithState).state || 'Active'}
            </Badge>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center text-gray-500">
              <CalendarIcon className="h-4 w-4 mr-1.5" />
              Updated {new Date(data.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* AI-Powered Summary Section */}
        <AISummary
          reportType={type}
          reportData={data}
          defaultExpanded={true}
          className="mb-8"
        />


        {/* All Analytics Sections - Single Page View */}
        <div className="space-y-12">
          {/* POSITION 3: Overview Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
              <DataQualityBadge
                type="real"
                tooltip={
                  type === 'guides' ? 'Real-time data from Pendo Aggregation API' :
                  type === 'features' ? 'Real-time data from Pendo Events API' :
                  type === 'pages' ? 'Real-time data from Pendo Pages API' :
                  'AI-powered analytics generated from report configuration and metadata'
                }
              />
            </div>
            {/* Primary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {primaryKPIs.map((kpi, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      </div>
                      <div className={`p-3 bg-gray-100 rounded-lg`}>
                        <kpi.icon className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Description */}
            {(data as ReportDataWithState).description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{(data as ReportDataWithState).description}</p>
                </CardContent>
              </Card>
            )}

            {/* Performance Overview */}
          </div>

          {/* POSITION 3.5: Audience Targeting Section (for guides type) */}
          {type === 'guides' && (data as ComprehensiveGuideData).audience && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Audience Targeting</h2>
                <DataQualityBadge type="real" tooltip="Target audience configuration from guide metadata" />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Who Sees This Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AudienceTargetingDisplay audience={(data as ComprehensiveGuideData).audience} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 3.6: Launch Configuration Section (for guides type) */}
          {type === 'guides' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Launch Configuration</h2>
                <DataQualityBadge type="real" tooltip="Guide launch settings from metadata" />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlayIcon className="h-5 w-5 mr-2 text-purple-600" />
                    How This Guide is Triggered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 bg-purple-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Launch Method</h4>
                      <p className="text-lg font-semibold text-purple-900 capitalize">
                        {(data as ComprehensiveGuideData).launchMethod || 'auto'}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Multi-Step Guide</h4>
                      <p className="text-lg font-semibold text-blue-900">
                        {(data as ComprehensiveGuideData).isMultiStep ? 'Yes' : 'No'}
                        {(data as ComprehensiveGuideData).isMultiStep && ` (${(data as ComprehensiveGuideData).stepCount} steps)`}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4 bg-green-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Auto-Advance</h4>
                      <p className="text-lg font-semibold text-green-900">
                        {(data as ComprehensiveGuideData).autoAdvance ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600 space-y-2">
                    <p><strong>Launch Method:</strong> {
                      (data as ComprehensiveGuideData).launchMethod === 'auto' ? 'Automatically triggers when conditions are met' :
                      (data as ComprehensiveGuideData).launchMethod === 'manual' ? 'Triggered manually by users' :
                      (data as ComprehensiveGuideData).launchMethod === 'badge' ? 'Triggered via badge click' :
                      'Custom trigger configuration'
                    }</p>
                    {(data as ComprehensiveGuideData).autoAdvance && (
                      <p><strong>Auto-Advance:</strong> Steps automatically progress without user interaction</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 3.7: AI Insights Section (for reports type) */}
          {type === 'reports' && (data as ComprehensiveReportData).insights && (data as ComprehensiveReportData).insights.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">AI-Generated Insights</h2>
                <DataQualityBadge type="real" tooltip="AI-powered insights generated from report configuration and metadata" />
              </div>
              <AIInsightsDisplay insights={(data as ComprehensiveReportData).insights} />
            </div>
          )}

          {/* POSITION 3.8: Recommendations Section (for reports type) */}
          {type === 'reports' && (data as ComprehensiveReportData).recommendations && (data as ComprehensiveReportData).recommendations.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Recommendations</h2>
                <DataQualityBadge type="real" tooltip="AI-powered recommendations based on report analytics" />
              </div>
              <RecommendationsPanel recommendations={(data as ComprehensiveReportData).recommendations} />
            </div>
          )}

          {/* POSITION 3.9: Section Engagement Section (for reports type) */}
          {type === 'reports' && (data as ComprehensiveReportData).sectionEngagement && (data as ComprehensiveReportData).sectionEngagement.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Section Engagement Analysis</h2>
                <DataQualityBadge type="real" tooltip="Detailed breakdown of engagement by report section" />
              </div>
              <SectionEngagementChart sections={(data as ComprehensiveReportData).sectionEngagement} />
            </div>
          )}

          {/* POSITION 4: Time Series Trends Section (MOVED UP) */}
          {((type === 'pages' && (data as ComprehensivePageData).dailyTimeSeries && (data as ComprehensivePageData).dailyTimeSeries!.length > 0) ||
            (type === 'guides' && (data as ComprehensiveGuideData).dailyStats && (data as ComprehensiveGuideData).dailyStats.length > 0) ||
            (type === 'features' && (data as ComprehensiveFeatureData).dailyUsage && (data as ComprehensiveFeatureData).dailyUsage.length > 0)) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">Time Series Trends</h2>
                  <DataQualityBadge type="real" tooltip={
                    type === 'pages' ? "Daily aggregated data from all page events" :
                    type === 'guides' ? "Daily aggregated data from all guide events" :
                    "Daily aggregated data from all feature events"
                  } />
                </div>

                {/* View Toggle Buttons */}
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant={timeSeriesView === 'daily' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeSeriesView('daily')}
                    className={timeSeriesView === 'daily' ? 'shadow-sm' : ''}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={timeSeriesView === 'weekly' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeSeriesView('weekly')}
                    className={timeSeriesView === 'weekly' ? 'shadow-sm' : ''}
                  >
                    Weekly
                  </Button>
                  <Button
                    variant={timeSeriesView === 'monthly' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeSeriesView('monthly')}
                    className={timeSeriesView === 'monthly' ? 'shadow-sm' : ''}
                  >
                    Monthly
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {timeSeriesView === 'daily' ? 'Daily' : timeSeriesView === 'weekly' ? 'Weekly' : 'Monthly'} {
                        type === 'pages' ? 'Page Views & Visitors' :
                        type === 'guides' ? 'Guide Views & Completions' :
                        'Feature Usage & Users'
                      }
                    </CardTitle>
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date().toLocaleString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ReportLineChart
                    data={getTimeSeriesData(
                      type === 'pages'
                        ? (data as ComprehensivePageData).dailyTimeSeries!
                        : type === 'guides'
                        ? (data as ComprehensiveGuideData).dailyStats
                        : (data as ComprehensiveFeatureData).dailyUsage
                    )}
                    dataKey="views"
                    showBrush={timeSeriesView === 'daily'}
                    showAverage={true}
                    height={350}
                  />
                </CardContent>
              </Card>

              {type === 'pages' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {timeSeriesView === 'daily' ? 'Daily' : timeSeriesView === 'weekly' ? 'Weekly' : 'Monthly'} Frustration Events
                      </CardTitle>
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date().toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ReportLineChart
                      data={getTimeSeriesData((data as ComprehensivePageData).dailyTimeSeries!)}
                      dataKey="frustrationCount"
                      showBrush={timeSeriesView === 'daily'}
                      showAverage={true}
                      height={350}
                      colors={{
                        primary: '#EF4444',
                        secondary: '#F59E0B',
                        tertiary: '#10B981'
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* POSITION 5: Frustration Metrics Section (MOVED UP) */}
          {type === 'pages' && (data as ComprehensivePageData).frustrationMetrics && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Frustration Metrics</h2>
                <DataQualityBadge type="real" tooltip="Real frustration metrics from Pendo page events (rage clicks, dead clicks, U-turns, error clicks)" />
              </div>

              {/* Summary KPI Cards - Equal Height */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
                <Card className="h-full">
                  <CardContent className="p-6 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
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

                <Card className="h-full">
                  <CardContent className="p-6 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
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

                <Card className="h-full">
                  <CardContent className="p-6 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
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

                <Card className="h-full">
                  <CardContent className="p-6 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Error Clicks</p>
                        <p className="text-2xl font-bold text-red-900">
                          {(data as ComprehensivePageData).frustrationMetrics!.totalErrorClicks.toLocaleString()}
                        </p>
                      </div>
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardContent className="p-6 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
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
                  <div className="overflow-x-auto">
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
                        {(data as ComprehensivePageData).frustrationMetrics!.topFrustratedVisitors.map((visitor) => (
                          <tr key={visitor.visitorId} className="border-b border-gray-100">
                            <td className="py-2 text-blue-600 hover:underline cursor-pointer">{visitor.email || visitor.visitorId}</td>
                            <td className="text-right py-2">{visitor.rageClicks.toLocaleString()}</td>
                            <td className="text-right py-2">{visitor.deadClicks.toLocaleString()}</td>
                            <td className="text-right py-2">{visitor.uTurns.toLocaleString()}</td>
                            <td className="text-right py-2">{visitor.errorClicks.toLocaleString()}</td>
                            <td className="text-right py-2 font-bold">{visitor.totalFrustration.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 6: Top Visitors & Top Accounts Tables - Full Width Stacked */}
          {type === 'pages' && (
            <div className="grid grid-cols-1 gap-6 items-stretch">
              {/* Top Visitors */}
              <Card className="flex flex-col h-full">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="m-0">Top Visitors (10)</CardTitle>
                      <DataQualityBadge type="real" tooltip="Real visitor data from Pendo Aggregation API" />
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      View all Visitors →
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex flex-col h-full">
                    <div className="grid grid-cols-2 gap-4 pb-2 text-sm font-medium text-gray-600 border-b flex-shrink-0">
                      <div>Visitor</div>
                      <div className="text-right">Number of views</div>
                    </div>
                    <div className="flex-1 min-h-0">
                      {/* Real data from Pendo API */}
                      {((data as ComprehensivePageData).topVisitors && (data as ComprehensivePageData).topVisitors!.length > 0) ? (
                        <div className="space-y-1">
                          {(data as ComprehensivePageData).topVisitors!.map((visitor, index) => {
                            // Try to show the most user-friendly identifier
                            const displayName = visitor.email || visitor.name || `Visitor ${visitor.visitorId}`;
                            const isIdOnly = !visitor.email && !visitor.name;

                            return (
                              <div key={visitor.visitorId || index} className="grid grid-cols-2 gap-4 py-2 text-sm border-b border-gray-100">
                                <div className={`hover:underline cursor-pointer ${isIdOnly ? 'text-gray-600 font-mono text-xs' : 'text-blue-600'}`}>
                                  {displayName}
                                </div>
                                <div className="text-right font-medium">
                                  {visitor.viewCount.toLocaleString()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-gray-500 text-sm">
                          No visitor data available
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Accounts */}
              <Card className="flex flex-col h-full">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="h-5 w-5 text-purple-600" />
                      <CardTitle className="m-0">Top Accounts (10)</CardTitle>
                      <DataQualityBadge type="real" tooltip="Real account data from Pendo Aggregation API" />
                    </div>
                    <Button variant="ghost" size="sm" className="text-purple-600">
                      View all Accounts →
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex flex-col h-full">
                    <div className="grid grid-cols-4 gap-4 pb-2 text-sm font-medium text-gray-600 border-b flex-shrink-0">
                      <div>Account</div>
                      <div>Plan</div>
                      <div className="text-right">ARR</div>
                      <div className="text-right">Number of views</div>
                    </div>
                    <div className="flex-1 min-h-0">
                      {/* Real data from Pendo API */}
                      {((data as ComprehensivePageData).topAccounts && (data as ComprehensivePageData).topAccounts!.length > 0) ? (
                        <div className="space-y-1">
                          {(data as ComprehensivePageData).topAccounts!.map((account, index) => {
                            // Try to show the most user-friendly identifier
                            const displayName = account.name || `Account ${account.accountId}`;
                            const isIdOnly = !account.name;

                            return (
                              <div key={account.accountId || index} className="grid grid-cols-4 gap-4 py-2 text-sm border-b border-gray-100 items-center">
                                <div className={`hover:underline cursor-pointer ${isIdOnly ? 'text-gray-600 font-mono text-xs' : 'text-purple-600'}`}>
                                  {displayName}
                                </div>
                              <div>
                                {account.planlevel ? (
                                  <Badge
                                    variant="secondary"
                                    className={
                                      account.planlevel.toLowerCase().includes('enterprise') ? 'bg-purple-100 text-purple-800' :
                                      account.planlevel.toLowerCase().includes('professional') || account.planlevel.toLowerCase().includes('pro') ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {account.planlevel}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">--</span>
                                )}
                              </div>
                              <div className="text-right font-medium">
                                {account.arr ? (
                                  account.arr >= 1000000 ? `$${(account.arr / 1000000).toFixed(1)}M` :
                                  account.arr >= 1000 ? `$${(account.arr / 1000).toFixed(0)}K` :
                                  `$${account.arr.toLocaleString()}`
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </div>
                              <div className="text-right font-medium">
                                {account.viewCount.toLocaleString()}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-gray-500 text-sm">
                          No account data available
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 6.5: Revenue Impact Section */}
          {type === 'pages' && (data as ComprehensivePageData).topAccounts && (data as ComprehensivePageData).topAccounts!.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Revenue Impact</h2>
                <DataQualityBadge type="real" tooltip="ARR metrics from top accounts viewing this page" />
              </div>
              <RevenueImpact
                accounts={(data as ComprehensivePageData).topAccounts!}
                loading={isLoading}
              />
            </div>
          )}

          {/* POSITION 7: Geographic Distribution Section (MOVED UP) */}
          {hasValidGeographicData() && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Geographic Distribution (Real Data)</h2>
                <DataQualityBadge type="real" tooltip={
                  type === 'pages' ? "Real geographic data aggregated from Pendo page events" :
                  type === 'guides' ? "Real geographic data aggregated from Pendo guide events" :
                  "Real geographic data aggregated from Pendo feature events"
                } />
              </div>

              {/* Interactive Map - NEW */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-blue-600" />
                    Interactive Geographic Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GeographicMap
                    data={(() => {
                      if (type === 'pages') {
                        const eventBreakdown = (data as ComprehensivePageData).eventBreakdown || [];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const geoMap = eventBreakdown
                          .filter(e => e.latitude !== undefined && e.longitude !== undefined && e.region && e.country)
                          .reduce((acc, event) => {
                            const key = `${event.region}-${event.country}`;
                            if (!acc[key]) {
                              acc[key] = {
                                lat: event.latitude!,
                                lon: event.longitude!,
                                visitors: 0,
                                views: 0,
                                name: `${event.region}, ${event.country}`,
                                region: event.region!,
                                country: event.country!,
                                avgTimeOnPage: 0,
                                _totalTime: 0,
                                _count: 0
                              };
                            }
                            acc[key].visitors++;
                            acc[key].views += event.totalViews || 0;
                            acc[key]._totalTime += (event.numMinutes || 0) * 60; // Convert to seconds
                            acc[key]._count++;
                            acc[key].avgTimeOnPage = acc[key]._totalTime / acc[key]._count;
                            return acc;
                          }, {} as Record<string, any>);
                        return Object.values(geoMap) as GeographicMapData[];
                      } else {
                        // For guides, use the geographicDistribution directly
                        const guideGeo = (data as ComprehensiveGuideData).geographicDistribution || [];
                        // Note: GuideGeographic doesn't have lat/lon, so we return empty array for map
                        // The pie chart and table below will still work with the data
                        return [] as GeographicMapData[];
                      }
                    })()}
                    height={450}
                  />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Pie Chart */}
                <Card className="flex flex-col h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Visitors by Region</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ReportPieChart
                      data={(() => {
                        if (type === 'pages') {
                          const geoData = (data as ComprehensivePageData).geographicDistribution!;
                          return geoData.slice(0, 8).map(geo => ({
                            name: `${geo.region}, ${geo.country}`,
                            users: geo.visitors,
                            percentage: geo.percentage || 0
                          }));
                        } else {
                          const geoData = (data as ComprehensiveGuideData).geographicDistribution;
                          return geoData.slice(0, 8).map(geo => ({
                            name: `${geo.region}, ${geo.country}`,
                            users: geo.users,
                            percentage: geo.percentage || 0
                          }));
                        }
                      })()}
                      dataKey="users"
                    />
                  </CardContent>
                </Card>

                {/* Table */}
                <Card className="flex flex-col h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Top Regions by Engagement</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="overflow-x-auto">
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
                          {(() => {
                            if (type === 'pages') {
                              const geoData = (data as ComprehensivePageData).geographicDistribution!;
                              return geoData.slice(0, 10).map((geo, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="py-2">{geo.region}, {geo.country}</td>
                                  <td className="text-right py-2">{geo.visitors.toLocaleString()}</td>
                                  <td className="text-right py-2">{geo.views.toLocaleString()}</td>
                                  <td className="text-right py-2">{geo.avgTimeOnPage.toFixed(0)}s</td>
                                </tr>
                              ));
                            } else {
                              const geoData = (data as ComprehensiveGuideData).geographicDistribution;
                              return geoData.slice(0, 10).map((geo, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="py-2">{geo.region}, {geo.country}</td>
                                  <td className="text-right py-2">{geo.users.toLocaleString()}</td>
                                  <td className="text-right py-2">-</td>
                                  <td className="text-right py-2">-</td>
                                </tr>
                              ));
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* POSITION 8: Device & Browser Breakdown Section */}
          {hasValidDeviceData() && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Device & Browser Breakdown (Real Data)</h2>
                <DataQualityBadge type="real" tooltip={
                  type === 'pages' ? "Real device, OS, and browser data parsed from userAgent strings" :
                  type === 'guides' ? "Real device, platform, and browser data from guide analytics" :
                  "Real device, platform, and browser data from feature analytics"
                } />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Device Type Pie Chart */}
                <Card className="flex flex-col h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Users by Device Type</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ReportPieChart
                      data={(() => {
                        const deviceGroups = new Map();
                        if (type === 'pages') {
                          (data as ComprehensivePageData).deviceBrowserBreakdown!.forEach(item => {
                            const existing = deviceGroups.get(item.device) || {name: item.device, users: 0, percentage: 0};
                            existing.users += item.users;
                            existing.percentage += item.percentage;
                            deviceGroups.set(item.device, existing);
                          });
                        } else {
                          (data as ComprehensiveGuideData).deviceBreakdown.forEach(item => {
                            const existing = deviceGroups.get(item.device) || {name: item.device, users: 0, percentage: 0};
                            existing.users += item.users;
                            existing.percentage += item.percentage;
                            deviceGroups.set(item.device, existing);
                          });
                        }
                        return Array.from(deviceGroups.values());
                      })()}
                      dataKey="users"
                    />
                  </CardContent>
                </Card>

                {/* Browser Pie Chart */}
                <Card className="flex flex-col h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle>Users by Browser</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ReportPieChart
                      data={(() => {
                        const browserGroups = new Map();
                        if (type === 'pages') {
                          (data as ComprehensivePageData).deviceBrowserBreakdown!.forEach(item => {
                            const existing = browserGroups.get(item.browser) || {name: item.browser, users: 0, percentage: 0};
                            existing.users += item.users;
                            existing.percentage += item.percentage;
                            browserGroups.set(item.browser, existing);
                          });
                        } else {
                          (data as ComprehensiveGuideData).deviceBreakdown.forEach(item => {
                            const existing = browserGroups.get(item.browser) || {name: item.browser, users: 0, percentage: 0};
                            existing.users += item.users;
                            existing.percentage += item.percentage;
                            browserGroups.set(item.browser, existing);
                          });
                        }
                        return Array.from(browserGroups.values()).sort((a, b) => b.users - a.users);
                      })()}
                      dataKey="users"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Breakdown Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Device, {type === 'pages' ? 'OS' : 'Platform'} & Browser Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-600">
                          <th className="text-left py-2">Device</th>
                          <th className="text-left py-2">{type === 'pages' ? 'Operating System' : 'Platform'}</th>
                          <th className="text-left py-2">Browser</th>
                          <th className="text-right py-2">Users</th>
                          <th className="text-right py-2">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          if (type === 'pages') {
                            return (data as ComprehensivePageData).deviceBrowserBreakdown!.slice(0, 15).map((item, idx) => (
                              <tr key={idx} className="border-b border-gray-100">
                                <td className="py-2">{item.device}</td>
                                <td className="py-2">{item.os} {item.osVersion && `(${item.osVersion})`}</td>
                                <td className="py-2">{item.browser} {item.browserVersion && `(${item.browserVersion})`}</td>
                                <td className="text-right py-2">{item.users.toLocaleString()}</td>
                                <td className="text-right py-2">{item.percentage.toFixed(1)}%</td>
                              </tr>
                            ));
                          } else {
                            return (data as ComprehensiveGuideData).deviceBreakdown.slice(0, 15).map((item, idx) => (
                              <tr key={idx} className="border-b border-gray-100">
                                <td className="py-2">{item.device}</td>
                                <td className="py-2">{item.platform}</td>
                                <td className="py-2">{item.browser}</td>
                                <td className="text-right py-2">{item.users.toLocaleString()}</td>
                                <td className="text-right py-2">{item.percentage.toFixed(1)}%</td>
                              </tr>
                            ));
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 9: Session Duration Analysis (MOVED UP) */}
          {type === 'pages' && (data as ComprehensivePageData).eventBreakdown && (data as ComprehensivePageData).eventBreakdown!.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Session Duration Analysis</h2>
                <DataQualityBadge type="real" tooltip="Real session timing data from Pendo page events" />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-purple-600" />
                    Session Timing Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SessionTimingDistribution
                    events={(data as ComprehensivePageData).eventBreakdown!}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 10: Event Breakdown Table (MOVED DOWN) */}
          {type === 'pages' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="m-0">
                      Event breakdown (Showing {paginationMeta.startIndex}-{paginationMeta.endIndex} of {paginationMeta.totalItems.toLocaleString()})
                    </CardTitle>
                    <DataQualityBadge
                      type="real"
                      tooltip="Real page event data from Pendo API including frustration metrics"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="page-size" className="text-xs text-gray-600">Rows per page:</label>
                    <select
                      id="page-size"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-gray-600 bg-gray-50">
                        <th
                          className="text-left py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('visitorId')}
                        >
                          Visitor <SortIndicator column="visitorId" />
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('accountId')}
                        >
                          Account <SortIndicator column="accountId" />
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('date')}
                        >
                          Date <SortIndicator column="date" />
                        </th>
                        <th
                          className="text-right py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('totalViews')}
                        >
                          Total Views <SortIndicator column="totalViews" />
                        </th>
                        <th
                          className="text-right py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('uTurns')}
                        >
                          U-turns <SortIndicator column="uTurns" />
                        </th>
                        <th
                          className="text-right py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('deadClicks')}
                        >
                          Dead clicks <SortIndicator column="deadClicks" />
                        </th>
                        <th
                          className="text-right py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('errorClicks')}
                        >
                          Error clicks <SortIndicator column="errorClicks" />
                        </th>
                        <th
                          className="text-right py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('rageClicks')}
                        >
                          Rage clicks <SortIndicator column="rageClicks" />
                        </th>
                        <th className="text-center py-2 px-2 font-medium whitespace-nowrap">Recording</th>
                        <th className="text-left py-2 px-2 font-medium whitespace-nowrap">Page parameter</th>
                        <th
                          className="text-left py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('serverName')}
                        >
                          Server name <SortIndicator column="serverName" />
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('browserName')}
                        >
                          Browser Name <SortIndicator column="browserName" />
                        </th>
                        <th
                          className="text-left py-2 px-2 font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                          onClick={() => handleSort('browserVersion')}
                        >
                          Browser Version <SortIndicator column="browserVersion" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedEvents().length > 0 ? (
                        getPaginatedEvents().map((event, index) => (
                          <tr key={`${event.visitorId}-${event.date}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-2 text-blue-600 hover:underline cursor-pointer whitespace-nowrap">
                              {event.visitorId}
                            </td>
                            <td className="py-2 px-2 whitespace-nowrap">{event.accountId || '--'}</td>
                            <td className="py-2 px-2 whitespace-nowrap">{event.date}</td>
                            <td className="text-right py-2 px-2 whitespace-nowrap">{event.totalViews.toLocaleString()}</td>
                            <td className="text-right py-2 px-2 whitespace-nowrap">{event.uTurns?.toLocaleString() || 0}</td>
                            <td className="text-right py-2 px-2 whitespace-nowrap">{event.deadClicks?.toLocaleString() || 0}</td>
                            <td className="text-right py-2 px-2 whitespace-nowrap">{event.errorClicks?.toLocaleString() || 0}</td>
                            <td className="text-right py-2 px-2 whitespace-nowrap">{event.rageClicks?.toLocaleString() || 0}</td>
                            <td className="text-center py-2 px-2 whitespace-nowrap">
                              {event.recordingId ? (
                                <a
                                  href={getPendoRecordingUrl(event.recordingId!)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Watch session replay in Pendo"
                                  className="text-blue-600 hover:text-blue-800 hover:underline text-xs cursor-pointer"
                                >
                                  View Recording
                                </a>
                              ) : (
                                <span className="text-gray-400 text-xs">No recording</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-gray-400 whitespace-nowrap">--</td>
                            <td className="py-2 px-2 whitespace-nowrap">{event.serverName || '--'}</td>
                            <td className="py-2 px-2 whitespace-nowrap">{event.browserName || '--'}</td>
                            <td className="py-2 px-2 whitespace-nowrap">{event.browserVersion || '--'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={13} className="py-4 text-center text-gray-500 text-sm">
                            No event data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {paginationMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-xs text-gray-600">
                      Showing {paginationMeta.startIndex}-{paginationMeta.endIndex} of {paginationMeta.totalItems.toLocaleString()} events
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <ChevronLeftIcon className="h-3 w-3" />
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, paginationMeta.totalPages) }, (_, i) => {
                          let pageNum;
                          if (paginationMeta.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= paginationMeta.totalPages - 2) {
                            pageNum = paginationMeta.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 text-xs border rounded transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(paginationMeta.totalPages, currentPage + 1))}
                        disabled={currentPage === paginationMeta.totalPages}
                        className="px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        Next
                        <ChevronRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* POSITION 11: Completion Funnel Section (for guides type) */}
          {type === 'guides' && (data as ComprehensiveGuideData).stepCount > 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Completion Funnel</h2>
                <DataQualityBadge
                  type={(data as ComprehensiveGuideData).steps && (data as ComprehensiveGuideData).steps.length > 0 ? "real" : "mock"}
                  tooltip={(data as ComprehensiveGuideData).steps && (data as ComprehensiveGuideData).steps.length > 0
                    ? "Real step-level analytics from Pendo guideEvents API"
                    : "Estimated funnel based on total views and completions"}
                />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Step-by-Step Completion Funnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CompletionFunnel
                    guide={data as ComprehensiveGuideData}
                    loading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 12: Guide Steps Section (for guides type) */}
          {type === 'guides' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Guide Steps</h2>
                <DataQualityBadge
                  type="real"
                  tooltip="Step analytics from guideEvents API when available, otherwise estimated from guide totals"
                />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Step-by-Step Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(data as ComprehensiveGuideData).steps.map((step) => (
                      <div key={step.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {step.order}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{step.name}</h4>
                              <p className="text-sm text-gray-600">{step.elementType}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {((step.completedCount / step.viewedCount) * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">completion</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Views</p>
                            <p className="text-lg font-semibold">{step.viewedCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Completions</p>
                            <p className="text-lg font-semibold">{step.completedCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg Time</p>
                            <p className="text-lg font-semibold">{step.timeSpent}s</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Drop-off</p>
                            <p className="text-lg font-semibold text-red-600">{step.dropOffRate.toFixed(1)}%</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(step.completedCount / step.viewedCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 13: Features Targeting Section (for pages type) */}
          {type === 'pages' && (
            <div className="space-y-6">
              {/* Features - All (API Limitation) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CubeIcon className="h-5 w-5 text-green-600" />
                      <CardTitle className="m-0">Top Features by Usage (7)</CardTitle>
                      <DataQualityBadge
                        type="real"
                        tooltip="Real feature event counts from Pendo API (all features, not page-specific)"
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="text-green-600">
                      View in Data Explorer →
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Pendo API does not support filtering features by page. Showing top features by usage across all pages.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-600">
                          <th className="text-left py-2 font-medium">Feature name</th>
                          <th className="text-right py-2 font-medium">Number of events</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((data as ComprehensivePageData).featuresTargeting && (data as ComprehensivePageData).featuresTargeting!.length > 0) ? (
                          (data as ComprehensivePageData).featuresTargeting!.slice(0, 7).map((feature, index) => (
                            <tr key={feature.featureId || index} className="border-b border-gray-100">
                              <td className="py-2 text-blue-600 hover:underline cursor-pointer">
                                {feature.name}
                              </td>
                              <td className="text-right py-2">{feature.eventCount.toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-4 text-center text-gray-500 text-sm">
                              No feature data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Guides - All (API Limitation) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5 text-orange-600" />
                      <CardTitle className="m-0">Active Guides (175)</CardTitle>
                      <DataQualityBadge
                        type="real"
                        tooltip="Real guide data from Pendo API (all guides, not page-specific)"
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="text-orange-600">
                      View in Data Explorer →
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Pendo API does not support filtering guides by page. Showing all active guides across the system.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-600">
                          <th className="text-left py-2 font-medium">Guide Name</th>
                          <th className="text-left py-2 font-medium">Segment</th>
                          <th className="text-left py-2 font-medium">Guide Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((data as ComprehensivePageData).guidesTargeting && (data as ComprehensivePageData).guidesTargeting!.length > 0) ? (
                          (data as ComprehensivePageData).guidesTargeting!.slice(0, 10).map((guide, index) => (
                            <tr key={guide.guideId || index} className="border-b border-gray-100">
                              <td className="py-2 text-blue-600 hover:underline cursor-pointer">
                                {guide.name}
                              </td>
                              <td className="py-2">{guide.segment || '--'}</td>
                              <td className="py-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  guide.status === 'published' || guide.status === 'Public' ? 'bg-green-100 text-green-800' :
                                  guide.status === 'disabled' || guide.status === 'Disabled' ? 'bg-gray-100 text-gray-800' :
                                  guide.status === 'draft' || guide.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {guide.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-gray-500 text-sm">
                              No guide data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* POSITION 14: Guides Targeting Section (for pages type) - REMOVED DUPLICATES */}
          {/* The Guides Targeting section already appears above after Features */}

          {/* POSITION 15: Technical Details Section (keep at bottom) */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Technical Details</h2>
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">ID:</span>
                    <p className="text-gray-600">{data.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <p className="text-gray-600">{new Date(data.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <p className="text-gray-600">{new Date(data.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-600 capitalize">{(data as ReportDataWithState).state || 'Active'}</p>
                  </div>
                  {(data as ReportDataWithState).type && (
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-600 capitalize">{(data as ReportDataWithState).type}</p>
                    </div>
                  )}
                  {(data as ReportDataWithState).eventType && (
                    <div>
                      <span className="font-medium text-gray-700">Event Type:</span>
                      <p className="text-gray-600">{(data as ReportDataWithState).eventType}</p>
                    </div>
                  )}
                  {(data as ReportDataWithState).url && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">URL:</span>
                      <p className="text-gray-600">{(data as ReportDataWithState).url}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
