import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FunnelIcon,
  UsersIcon,
  MapPinIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
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
import { ReportHeatmap } from '@/components/reports/ReportHeatmap';

// Import comprehensive types
import type {
  ComprehensiveGuideData,
  ComprehensiveFeatureData,
  ComprehensivePageData,
  ComprehensiveReportData
} from '@/types/enhanced-pendo';

type ReportDataType = ComprehensiveGuideData | ComprehensiveFeatureData | ComprehensivePageData | ComprehensiveReportData;
type ReportType = 'guides' | 'features' | 'pages' | 'reports';

export const ReportDetails: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Type guards
  const isValidType = (t: string): t is ReportType =>
    ['guides', 'features', 'pages', 'reports'].includes(t);

  useEffect(() => {
    console.log('ReportDetails route accessed:', { type, id, isValid: type ? isValidType(type) : false });
    if (!type || !id || !isValidType(type)) {
      console.log('Invalid route params, navigating to tables');
      navigate('/tables');
    }
  }, [type, id, navigate]);

  if (!type || !id || !isValidType(type)) {
    return null;
  }

  // Fetch data based on type
  const guideReport = type === 'guides' ? useGuideReport(id) : null;
  const featureReport = type === 'features' ? useFeatureReport(id) : null;
  const pageReport = type === 'pages' ? usePageReport(id) : null;
  const reportReport = type === 'reports' ? useReportReport(id) : null;

  // Get the appropriate data and loading state
  const currentReport = guideReport || featureReport || pageReport || reportReport;
  const data = currentReport?.data as ReportDataType;
  const isLoading = currentReport?.isLoading ?? false;
  const error = currentReport?.error;

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

  if (error || !data) {
    return (
      <Layout showNavigation={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pendo Data Not Available</h2>
            <p className="text-gray-600 mb-6">
              {error?.message?.includes('not found')
                ? `The ${type} with ID "${id}" was not found in your Pendo system. This dashboard only displays real Pendo data.`
                : 'Unable to load data from Pendo. Please check your API connection.'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">📋 To Get Real Pendo Guide IDs:</h3>
              <ol className="list-decimal list-inside text-blue-800 space-y-1">
                <li>Open your browser's Developer Tools (F12)</li>
                <li>Go to the Console tab</li>
                <li>Navigate to the Data Tables page</li>
                <li>Look for the "📋 Available Pendo Guides:" message</li>
                <li>Copy any real guide ID and use it in the URL: /report/guides/{`{REAL_ID}`}</li>
              </ol>
            </div>
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
      case 'guides':
        const guideData = data as ComprehensiveGuideData;
        return [
          { label: 'Total Views', value: guideData.viewedCount.toLocaleString(), icon: EyeIcon, change: '+12%' },
          { label: 'Completions', value: guideData.completedCount.toLocaleString(), icon: CheckCircleIcon, change: '+8%' },
          { label: 'Completion Rate', value: `${guideData.completionRate.toFixed(1)}%`, icon: ChartBarIcon, change: '+2.1%' },
          { label: 'Engagement Rate', value: `${guideData.engagementRate.toFixed(1)}%`, icon: UserGroupIcon, change: '+5.3%' },
        ];
      case 'features':
        const featureData = data as ComprehensiveFeatureData;
        return [
          { label: 'Usage Count', value: featureData.usageCount.toLocaleString(), icon: CubeIcon, change: '+18%' },
          { label: 'Unique Users', value: featureData.visitorCount.toLocaleString(), icon: UserGroupIcon, change: '+15%' },
          { label: 'Adoption Rate', value: `${featureData.adoptionRate}%`, icon: ChartBarIcon, change: '+3.2%' },
          { label: 'Usage Frequency', value: `${featureData.usageFrequency}x/day`, icon: ClockIcon, change: '+0.8x' },
        ];
      case 'pages':
        const pageData = data as ComprehensivePageData;
        return [
          { label: 'Page Views', value: pageData.viewedCount.toLocaleString(), icon: EyeIcon, change: '+22%' },
          { label: 'Unique Visitors', value: pageData.visitorCount.toLocaleString(), icon: UserGroupIcon, change: '+19%' },
          { label: 'Avg Time on Page', value: `${pageData.avgTimeOnPage}s`, icon: ClockIcon, change: '+15s' },
          { label: 'Bounce Rate', value: `${pageData.bounceRate}%`, icon: ChartBarIcon, change: '-3.1%' },
        ];
      case 'reports':
        const reportData = data as ComprehensiveReportData;
        return [
          { label: 'Total Views', value: reportData.totalViews.toLocaleString(), icon: EyeIcon, change: '+28%' },
          { label: 'Unique Viewers', value: reportData.uniqueViewers.toLocaleString(), icon: UserGroupIcon, change: '+24%' },
          { label: 'Shares', value: reportData.shares.toLocaleString(), icon: ShareIcon, change: '+12%' },
          { label: 'Rating', value: `⭐ ${reportData.averageRating}`, icon: StarIcon, change: '+0.3' },
        ];
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
              {(data as any).state || 'Active'}
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

        {/* Tabs for Different Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {type === 'guides' && <TabsTrigger value="steps">Steps</TabsTrigger>}
            {type === 'features' && <TabsTrigger value="cohort">Cohort</TabsTrigger>}
            {type === 'pages' && <TabsTrigger value="flow">User Flow</TabsTrigger>}
            {type === 'reports' && <TabsTrigger value="feedback">Feedback</TabsTrigger>}
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            {(data as any).description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{(data as any).description}</p>
                </CardContent>
              </Card>
            )}

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Series Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
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
                  <CardTitle>
                    {type === 'guides' ? 'Device Breakdown' :
                     type === 'features' ? 'Geographic Distribution' :
                     type === 'pages' ? 'Traffic Sources' :
                     'User Engagement'}
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
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
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
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
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
          </TabsContent>

          {/* Type-Specific Tabs */}
          {type === 'guides' && (
            <TabsContent value="steps" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Step-by-Step Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(data as ComprehensiveGuideData).steps.map((step, index) => (
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
            </TabsContent>
          )}

          {type === 'features' && (
            <TabsContent value="cohort" className="space-y-6">
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
                  <CardTitle>Feature Correlations</CardTitle>
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
            </TabsContent>
          )}

          {type === 'pages' && (
            <TabsContent value="flow" className="space-y-6">
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
                  <CardTitle>Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportPieChart
                    data={(data as ComprehensivePageData).trafficSources}
                    dataKey="visitors"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {type === 'reports' && (
            <TabsContent value="feedback" className="space-y-6">
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
                  <CardTitle>Collaboration Metrics</CardTitle>
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
            </TabsContent>
          )}

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
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
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
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
                <CardTitle className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Geographic Insights
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
          </TabsContent>

          {/* Technical Details */}
          <TabsContent value="details" className="space-y-6">
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
                    <p className="text-gray-600 capitalize">{(data as any).state || 'Active'}</p>
                  </div>
                  {(data as any).type && (
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-600 capitalize">{(data as any).type}</p>
                    </div>
                  )}
                  {(data as any).eventType && (
                    <div>
                      <span className="font-medium text-gray-700">Event Type:</span>
                      <p className="text-gray-600">{(data as any).eventType}</p>
                    </div>
                  )}
                  {(data as any).url && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">URL:</span>
                      <p className="text-gray-600">{(data as any).url}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};