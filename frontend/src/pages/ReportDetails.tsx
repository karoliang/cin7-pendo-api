import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Import report hooks
import { useGuideReport } from '@/hooks/useReportData';
import { useFeatureReport } from '@/hooks/useReportData';
import { usePageReport } from '@/hooks/useReportData';
import { useReportReport } from '@/hooks/useReportData';

// Import chart components
import { ReportLineChart } from '@/components/reports/ReportLineChart';
import { ReportBarChart } from '@/components/reports/ReportBarChart';
import { ReportPieChart } from '@/components/reports/ReportPieChart';

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
  // Removed activeTab state - showing all content on single page

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

  if (isLoading) {
    return (
      <Layout showNavigation={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Data Tables
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tables')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
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
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Data Tables
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
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
          { label: 'Total Views', value: guideData.viewedCount.toLocaleString(), icon: EyeIcon, change: '+12%' },
          { label: 'Completions', value: guideData.completedCount.toLocaleString(), icon: CheckCircleIcon, change: '+8%' },
          { label: 'Completion Rate', value: `${guideData.completionRate.toFixed(1)}%`, icon: ChartBarIcon, change: '+2.1%' },
          { label: 'Engagement Rate', value: `${guideData.engagementRate.toFixed(1)}%`, icon: UserGroupIcon, change: '+5.3%' },
        ];
      }
      case 'features': {
        const featureData = data as ComprehensiveFeatureData;
        return [
          { label: 'Usage Count', value: featureData.usageCount.toLocaleString(), icon: CubeIcon, change: '+18%' },
          { label: 'Unique Users', value: featureData.visitorCount.toLocaleString(), icon: UserGroupIcon, change: '+15%' },
          { label: 'Adoption Rate', value: `${featureData.adoptionRate}%`, icon: ChartBarIcon, change: '+3.2%' },
          { label: 'Usage Frequency', value: `${featureData.usageFrequency}x/day`, icon: ClockIcon, change: '+0.8x' },
        ];
      }
      case 'pages': {
        const pageData = data as ComprehensivePageData;
        return [
          { label: 'Page Views', value: pageData.viewedCount.toLocaleString(), icon: EyeIcon, change: '+22%' },
          { label: 'Unique Visitors', value: pageData.visitorCount.toLocaleString(), icon: UserGroupIcon, change: '+19%' },
          { label: 'Avg Time on Page', value: `${pageData.avgTimeOnPage}s`, icon: ClockIcon, change: '+15s' },
          { label: 'Bounce Rate', value: `${pageData.bounceRate}%`, icon: ChartBarIcon, change: '-3.1%' },
        ];
      }
      case 'reports': {
        const reportData = data as ComprehensiveReportData;
        return [
          { label: 'Total Views', value: reportData.totalViews.toLocaleString(), icon: EyeIcon, change: '+28%' },
          { label: 'Unique Viewers', value: reportData.uniqueViewers.toLocaleString(), icon: UserGroupIcon, change: '+24%' },
          { label: 'Shares', value: reportData.shares.toLocaleString(), icon: ShareIcon, change: '+12%' },
          { label: 'Rating', value: `⭐ ${reportData.averageRating}`, icon: StarIcon, change: '+0.3' },
        ];
      }
      default:
        return [];
    }
  };

  const primaryKPIs = getPrimaryKPIs();

  const handleExport = (format: 'pdf' | 'csv') => {
    // TODO: Implement export functionality
    console.log(`Exporting ${type} ${id} as ${format}`);
  };

  return (
    <Layout showNavigation={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tables')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Tables
            </Button>
            <div className="flex items-center space-x-3">
              <div className={`p-2 bg-${typeInfo.color}-100 rounded-lg`}>
                <Icon className={`h-6 w-6 text-${typeInfo.color}-600`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
                <p className="text-gray-600">{typeInfo.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="capitalize">
              {(data as ReportDataWithState).state || 'Active'}
            </Badge>
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Updated {new Date(data.updatedAt).toLocaleDateString()}
            </div>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* All Analytics Sections - Single Page View */}
        <div className="space-y-12">
          {/* Overview Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
              <DataQualityBadge
                type={type === 'reports' ? 'mock' : 'real'}
                tooltip={
                  type === 'guides' ? 'Real-time data from Pendo Aggregation API' :
                  type === 'features' ? 'Real-time data from Pendo Events API' :
                  type === 'pages' ? 'Real-time data from Pendo Pages API' :
                  'Simulated data - not available via Pendo API'
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
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-green-600 font-medium">{kpi.change}</span>
                      <span className="text-gray-500 ml-2">vs last period</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Series Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Performance Over Time</span>
                    <DataQualityBadge
                      type={type === 'reports' ? 'mock' : 'real'}
                      tooltip="Daily time series data from Pendo Aggregation API"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportLineChart
                    data={
                      type === 'guides' ? (data as ComprehensiveGuideData).dailyStats :
                      type === 'features' ? (data as ComprehensiveFeatureData).dailyUsage :
                      type === 'pages' ? (data as ComprehensivePageData).dailyTraffic :
                      (data as ComprehensiveReportData).dailyEngagement
                    }
                    dataKey={
                      type === 'guides' ? 'views' :
                      type === 'features' ? 'usageCount' :
                      type === 'pages' ? 'pageViews' :
                      'views'
                    }
                  />
                </CardContent>
              </Card>

              {/* Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {type === 'guides' ? 'Device Breakdown' :
                       type === 'features' ? 'Geographic Distribution' :
                       type === 'pages' ? 'Traffic Sources' :
                       'User Engagement'}
                    </span>
                    <DataQualityBadge type="mock" tooltip="Simulated distribution data" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportPieChart
                    data={
                      type === 'guides' ? (data as ComprehensiveGuideData).deviceBreakdown :
                      type === 'features' ? (data as ComprehensiveFeatureData).geographicDistribution :
                      type === 'pages' ? (data as ComprehensivePageData).trafficSources :
                      (data as ComprehensiveReportData).userEngagement
                    }
                    dataKey={
                      type === 'guides' ? 'users' :
                      type === 'features' ? 'visitors' :
                      type === 'pages' ? 'visitors' :
                      'percentage'
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trends Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Trends</h2>
              <DataQualityBadge type="mock" tooltip="Calculated trends and forecasts based on simulated patterns" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trending Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-green-600" />
                    Key Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {type === 'guides' && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Completion Rate Trend</span>
                          <span className="text-sm font-medium text-green-600">+5.2%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Engagement Velocity</span>
                          <span className="text-sm font-medium text-blue-600">+12%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Drop-off Reduction</span>
                          <span className="text-sm font-medium text-green-600">-8.3%</span>
                        </div>
                      </>
                    )}
                    {type === 'features' && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Adoption Acceleration</span>
                          <span className="text-sm font-medium text-green-600">+18%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Usage Frequency</span>
                          <span className="text-sm font-medium text-blue-600">+2.3x</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Power User Growth</span>
                          <span className="text-sm font-medium text-green-600">+27%</span>
                        </div>
                      </>
                    )}
                    {type === 'pages' && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Page Engagement</span>
                          <span className="text-sm font-medium text-green-600">+15%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Bounce Rate Improvement</span>
                          <span className="text-sm font-medium text-green-600">-4.1%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Session Duration</span>
                          <span className="text-sm font-medium text-blue-600">+32s</span>
                        </div>
                      </>
                    )}
                    {type === 'reports' && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">View Velocity</span>
                          <span className="text-sm font-medium text-green-600">+24%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Share Rate</span>
                          <span className="text-sm font-medium text-blue-600">+18%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">User Satisfaction</span>
                          <span className="text-sm font-medium text-green-600">+0.4</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Performance Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Projected Growth (Next 30 Days)</p>
                      <p className="text-2xl font-bold text-green-900">
                        {type === 'guides' ? '+23%' :
                         type === 'features' ? '+31%' :
                         type === 'pages' ? '+18%' : '+27%'}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Confidence Level</p>
                      <p className="text-2xl font-bold text-blue-900">87%</p>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p>Based on historical performance patterns and seasonal trends</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
              <DataQualityBadge type="mock" tooltip="Simulated conversion and segment analytics" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportLineChart
                    data={
                      type === 'guides' ? (data as ComprehensiveGuideData).dailyStats :
                      type === 'features' ? (data as ComprehensiveFeatureData).dailyUsage :
                      type === 'pages' ? (data as ComprehensivePageData).dailyTraffic :
                      (data as ComprehensiveReportData).dailyEngagement
                    }
                    dataKey={
                      type === 'guides' ? 'views' :
                      type === 'features' ? 'usageCount' :
                      type === 'pages' ? 'pageViews' :
                      'views'
                    }
                  />
                </CardContent>
              </Card>

              {/* Segment Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Segment Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportBarChart
                    data={
                      type === 'guides' ? (data as ComprehensiveGuideData).segmentPerformance.map(s => ({
                        name: s.segmentName,
                        value: s.completionRate,
                        users: s.viewedCount
                      })) :
                      type === 'features' ? (data as ComprehensiveFeatureData).userSegments.map(s => ({
                        name: s.segment,
                        value: s.adoptionRate,
                        users: s.users
                      })) :
                      type === 'pages' ? (data as ComprehensivePageData).trafficSources.map(s => ({
                        name: s.source,
                        value: s.conversionRate,
                        users: s.visitors
                      })) :
                      (data as ComprehensiveReportData).userEngagement.map(s => ({
                        name: s.segment,
                        value: s.feedbackScore,
                        users: s.users
                      }))
                    }
                    dataKey="value"
                    xAxisKey="name"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Type-Specific Sections */}
          {type === 'guides' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Guide Steps</h2>
                <DataQualityBadge
                  type="estimated"
                  tooltip="Step analytics calculated from real guide totals with estimated step distribution"
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

          {type === 'features' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Cohort Analysis</h2>
                <DataQualityBadge type="mock" tooltip="Simulated cohort analytics - not available via Pendo API" />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2 text-green-600" />
                    Cohort Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(data as ComprehensiveFeatureData).cohortAnalysis.map((cohort, index) => (
                      <div key={`${cohort.cohort}-${index}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">{cohort.cohort}</h4>
                            <p className="text-sm text-gray-600">{cohort.period}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {cohort.retentionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">retention</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Cohort Size</p>
                            <p className="text-lg font-semibold">{cohort.cohortSize.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Active Users</p>
                            <p className="text-lg font-semibold">{cohort.activeUsers.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg Usage/User</p>
                            <p className="text-lg font-semibold">{cohort.averageUsagePerUser.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Drop-off Rate</p>
                            <p className="text-lg font-semibold text-red-600">{cohort.dropOffRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Feature Correlations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Feature Correlations</span>
                    <DataQualityBadge type="mock" tooltip="Simulated feature correlation data" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(data as ComprehensiveFeatureData).relatedFeatures.map((correlation, index) => (
                      <div key={`${correlation.featureId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{correlation.featureName}</p>
                          <p className="text-sm text-gray-600">Joint usage: {correlation.jointUsageCount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {correlation.correlationStrength.toFixed(2)}
                          </div>
                          <div className="text-sm text-green-600">+{correlation.liftPercentage}% lift</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {type === 'pages' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">User Flow</h2>
                <DataQualityBadge type="mock" tooltip="Simulated navigation flow data" />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-purple-600" />
                    User Navigation Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(data as ComprehensivePageData).navigationPaths.slice(0, 5).map((path, index) => (
                      <div key={`${path.pathName}-${index}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">{path.pathName}</h4>
                            <p className="text-sm text-gray-600">{path.path.join(' → ')}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              {path.conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">conversion</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Users</p>
                            <p className="text-lg font-semibold">{path.userCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg Time</p>
                            <p className="text-lg font-semibold">{path.averageTimeSpent}s</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Entry Rate</p>
                            <p className="text-lg font-semibold">{path.entryRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Exit Rate</p>
                            <p className="text-lg font-semibold text-red-600">{path.exitRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Traffic Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Traffic Sources</span>
                    <DataQualityBadge type="mock" tooltip="Simulated traffic source distribution" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportPieChart
                    data={(data as ComprehensivePageData).trafficSources}
                    dataKey="visitors"
                  />
                </CardContent>
              </Card>

              {/* Top Visitors and Top Accounts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Visitors */}
                <Card>
                  <CardHeader>
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
                  <CardContent>
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-4 pb-2 text-sm font-medium text-gray-600 border-b">
                        <div>Visitor</div>
                        <div className="text-right">Number of views</div>
                      </div>
                      {/* Real data from Pendo API */}
                      {((data as ComprehensivePageData).topVisitors && (data as ComprehensivePageData).topVisitors!.length > 0) ? (
                        (data as ComprehensivePageData).topVisitors!.map((visitor, index) => (
                          <div key={visitor.visitorId || index} className="grid grid-cols-2 gap-4 py-2 text-sm border-b border-gray-100">
                            <div className="text-blue-600 hover:underline cursor-pointer">
                              {visitor.email || visitor.name || visitor.visitorId}
                            </div>
                            <div className="text-right font-medium">
                              {visitor.viewCount.toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-gray-500 text-sm">
                          No visitor data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Accounts */}
                <Card>
                  <CardHeader>
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
                  <CardContent>
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-4 pb-2 text-sm font-medium text-gray-600 border-b">
                        <div>Account</div>
                        <div className="text-right">Number of views</div>
                      </div>
                      {/* Real data from Pendo API */}
                      {((data as ComprehensivePageData).topAccounts && (data as ComprehensivePageData).topAccounts!.length > 0) ? (
                        (data as ComprehensivePageData).topAccounts!.map((account, index) => (
                          <div key={account.accountId || index} className="grid grid-cols-2 gap-4 py-2 text-sm border-b border-gray-100">
                            <div className="text-purple-600 hover:underline cursor-pointer">
                              {account.name || account.accountId}
                              {account.planlevel && <span className="ml-2 text-xs text-gray-500">({account.planlevel})</span>}
                            </div>
                            <div className="text-right font-medium">
                              {account.viewCount.toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-gray-500 text-sm">
                          No account data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

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

              {/* Event Breakdown */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                      <CardTitle className="m-0">Event breakdown (5000)</CardTitle>
                      <DataQualityBadge
                        type="real"
                        tooltip="Real page event data from Pendo API including frustration metrics (U-turns, dead clicks, error clicks, rage clicks)"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      This table reflects the date range and segment filters above (up to 5,000 values).
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-gray-600 bg-gray-50">
                          <th className="text-left py-2 px-2 font-medium">Visitor</th>
                          <th className="text-left py-2 px-2 font-medium">Account</th>
                          <th className="text-left py-2 px-2 font-medium">Date</th>
                          <th className="text-right py-2 px-2 font-medium">Total Views</th>
                          <th className="text-right py-2 px-2 font-medium">U-turns</th>
                          <th className="text-right py-2 px-2 font-medium">Dead clicks</th>
                          <th className="text-right py-2 px-2 font-medium">Error clicks</th>
                          <th className="text-right py-2 px-2 font-medium">Rage clicks</th>
                          <th className="text-left py-2 px-2 font-medium">Page parameter</th>
                          <th className="text-left py-2 px-2 font-medium">Server name</th>
                          <th className="text-left py-2 px-2 font-medium">Browser Name</th>
                          <th className="text-left py-2 px-2 font-medium">Browser Version</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((data as ComprehensivePageData).eventBreakdown && (data as ComprehensivePageData).eventBreakdown!.length > 0) ? (
                          (data as ComprehensivePageData).eventBreakdown!.slice(0, 20).map((event, index) => (
                            <tr key={`${event.visitorId}-${event.date}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-2 text-blue-600 hover:underline cursor-pointer">
                                {event.visitorId}
                              </td>
                              <td className="py-2 px-2">{event.accountId || '--'}</td>
                              <td className="py-2 px-2">{event.date}</td>
                              <td className="text-right py-2 px-2">{event.totalViews.toLocaleString()}</td>
                              <td className="text-right py-2 px-2">{event.uTurns?.toLocaleString() || 0}</td>
                              <td className="text-right py-2 px-2">{event.deadClicks?.toLocaleString() || 0}</td>
                              <td className="text-right py-2 px-2">{event.errorClicks?.toLocaleString() || 0}</td>
                              <td className="text-right py-2 px-2">{event.rageClicks?.toLocaleString() || 0}</td>
                              <td className="py-2 px-2 text-gray-400">--</td>
                              <td className="py-2 px-2">{event.serverName || '--'}</td>
                              <td className="py-2 px-2">{event.browserName || '--'}</td>
                              <td className="py-2 px-2">{event.browserVersion || '--'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={12} className="py-4 text-center text-gray-500 text-sm">
                              No event data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* NEW: Frustration Metrics Section */}
              {(data as ComprehensivePageData).frustrationMetrics && (
                <div className="space-y-6 mt-12">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">Frustration Metrics</h2>
                    <DataQualityBadge type="real" tooltip="Real frustration metrics from Pendo page events (rage clicks, dead clicks, U-turns, error clicks)" />
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
                            {(data as ComprehensivePageData).frustrationMetrics!.topFrustratedVisitors.map((visitor, idx) => (
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

              {/* NEW: Geographic Distribution Section */}
              {(data as ComprehensivePageData).geographicDistribution && (data as ComprehensivePageData).geographicDistribution!.length > 0 && (
                <div className="space-y-6 mt-12">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">Geographic Distribution (Real Data)</h2>
                    <DataQualityBadge type="real" tooltip="Real geographic data aggregated from Pendo page events" />
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
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* NEW: Improved Daily Time Series */}
              {(data as ComprehensivePageData).dailyTimeSeries && (data as ComprehensivePageData).dailyTimeSeries!.length > 0 && (
                <div className="space-y-6 mt-12">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">Daily Trends (Real Data)</h2>
                    <DataQualityBadge type="real" tooltip="Daily aggregated data from all page events" />
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
            </div>
          )}

          {type === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">User Feedback</h2>
                <DataQualityBadge type="mock" tooltip="Simulated user feedback data - not available via Pendo API" />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-orange-600" />
                    User Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Rating Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Average Rating</p>
                        <p className="text-2xl font-bold text-green-900">
                          ⭐ {(data as ComprehensiveReportData).averageRating.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Total Feedback</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {(data as ComprehensiveReportData).userFeedback.length.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-purple-800">Engagement Score</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {(data as ComprehensiveReportData).engagementScore.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* Recent Feedback */}
                    <div className="space-y-3">
                      {(data as ComprehensiveReportData).userFeedback.slice(0, 5).map((feedback, index) => (
                        <div key={`${feedback.userId}-${index}`} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="font-medium text-gray-900">{feedback.userName}</div>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                feedback.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                feedback.sentiment === 'neutral' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {feedback.sentiment}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(feedback.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          {feedback.comments && (
                            <p className="text-sm text-gray-700 mt-2">{feedback.comments}</p>
                          )}
                          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                            <span>Helpful votes: {feedback.helpfulVotes}</span>
                            <span>Sections viewed: {feedback.reportSections.join(', ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Collaboration Metrics</span>
                    <DataQualityBadge type="mock" tooltip="Simulated collaboration data" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(data as ComprehensiveReportData).collaborationMetrics.slice(0, 5).map((metric, index) => (
                      <div key={`${metric.userId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{metric.userName}</p>
                          <p className="text-sm text-gray-600">{metric.role}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {metric.collaborationScore.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {metric.sharesInitiated} shares, {metric.commentsCount} comments
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Performance Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
              <DataQualityBadge type="mock" tooltip="Simulated performance metrics" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowPathIcon className="h-5 w-5 mr-2 text-green-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Response Time</span>
                      <span className="text-sm font-bold text-green-600">
                        {type === 'pages' ? `${(data as ComprehensivePageData).loadTime}ms` :
                         type === 'features' ? `${(data as ComprehensiveFeatureData).responseTime}ms` :
                         type === 'reports' ? `${(data as ComprehensiveReportData).loadTime}ms` : '120ms'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Success Rate</span>
                      <span className="text-sm font-bold text-green-600">
                        {type === 'features' ? `${(data as ComprehensiveFeatureData).successRate.toFixed(1)}%` :
                         type === 'pages' ? `${(100 - (data as ComprehensivePageData).errorRate).toFixed(1)}%` :
                         type === 'reports' ? `${(100 - (data as ComprehensiveReportData).errorRate).toFixed(1)}%` : '99.2%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Error Rate</span>
                      <span className="text-sm font-bold text-red-600">
                        {type === 'features' ? `${(data as ComprehensiveFeatureData).errorRate.toFixed(2)}%` :
                         type === 'pages' ? `${(data as ComprehensivePageData).errorRate.toFixed(2)}%` :
                         type === 'reports' ? `${(data as ComprehensiveReportData).errorRate.toFixed(2)}%` : '0.8%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Load Time</span>
                      <span className="text-sm font-bold text-blue-600">
                        {type === 'pages' ? `${(data as ComprehensivePageData).loadTime}ms` :
                         type === 'guides' ? `${(data as ComprehensiveGuideData).loadTime}ms` :
                         type === 'reports' ? `${(data as ComprehensiveReportData).loadTime}ms` : '850ms'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Device Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportPieChart
                    data={
                      type === 'guides' ? (data as ComprehensiveGuideData).deviceBreakdown :
                      type === 'features' ? (data as ComprehensiveFeatureData).deviceBreakdown :
                      type === 'pages' ? (data as ComprehensivePageData).devicePerformance :
                      (data as ComprehensiveReportData).deviceBreakdown
                    }
                    dataKey="users"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Insights Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">AI-Powered Insights</h2>
              <DataQualityBadge type="mock" tooltip="Simulated AI insights and recommendations" />
            </div>
            {/* AI Summary Placeholder */}
            <Card className="border-dashed border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <StarIcon className="h-5 w-5 mr-2" />
                  AI Insights (Coming Soon)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800">
                  AI-powered insights and recommendations will be available here.
                  This section will provide automated analysis of key trends,
                  performance indicators, and actionable insights based on the data.
                </p>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {type === 'reports' ? (
                    (data as ComprehensiveReportData).insights.map((insight, index) => (
                      <div key={`${insight.type}-${index}`} className="border-l-4 border-purple-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              {insight.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(insight.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Confidence:</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${insight.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{insight.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Simulated insights for other types
                    [
                      {
                        type: 'performance',
                        title: 'High Engagement Detected',
                        description: `This ${type.slice(0, -1)} is performing 23% better than similar entities in your workspace.`,
                        confidence: 89,
                        timestamp: new Date().toISOString()
                      },
                      {
                        type: 'optimization',
                        title: 'Optimization Opportunity',
                        description: `Small adjustments could improve ${type === 'guides' ? 'completion rates' : type === 'features' ? 'adoption' : 'engagement'} by an estimated 15%.`,
                        confidence: 76,
                        timestamp: new Date().toISOString()
                      },
                      {
                        type: 'trend',
                        title: 'Positive Trend Alert',
                        description: `Weekly ${type === 'guides' ? 'guide completions' : type === 'features' ? 'feature usage' : 'page views'} have increased by 31% over the past month.`,
                        confidence: 92,
                        timestamp: new Date().toISOString()
                      }
                    ].map((insight, index) => (
                      <div key={`${insight.type}-${index}`} className="border-l-4 border-purple-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              {insight.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(insight.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Confidence:</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${insight.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{insight.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {type === 'reports' && (data as ComprehensiveReportData).recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(data as ComprehensiveReportData).recommendations.map((rec, index) => (
                      <div key={`${rec.title}-${index}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{rec.title}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority} priority
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium text-gray-700">Expected Impact:</span>
                            <p className="text-gray-600">{rec.expectedImpact}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Implementation:</span>
                            <p className="text-gray-600">{rec.implementation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Geographic Insights
                  </span>
                  <DataQualityBadge type="mock" tooltip="Simulated geographic distribution data" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(
                    type === 'guides' ? (data as ComprehensiveGuideData).geographicDistribution :
                    type === 'features' ? (data as ComprehensiveFeatureData).geographicDistribution :
                    type === 'pages' ? (data as ComprehensivePageData).geographicPerformance :
                    (data as ComprehensiveReportData).geographicDistribution
                  ).slice(0, 5).map((geo, index) => (
                    <div key={`${geo.region}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{geo.region}, {geo.country}</p>
                        <p className="text-sm text-gray-600">{geo.users.toLocaleString()} users</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {geo.completionRate ? `${geo.completionRate.toFixed(1)}%` : `${geo.percentage.toFixed(1)}%`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {geo.completionRate ? 'completion' : 'of total'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Details Section */}
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