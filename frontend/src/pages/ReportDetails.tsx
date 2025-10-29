import React, { useState } from 'react';
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

type ReportType = 'guide' | 'feature' | 'page' | 'report';

export const ReportDetails: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Type guards
  const isValidType = (t: string): t is ReportType =>
    ['guide', 'feature', 'page', 'report'].includes(t);

  if (!type || !id || !isValidType(type)) {
    navigate('/tables');
    return null;
  }

  // Fetch data based on type
  const guideReport = type === 'guide' ? useGuideReport(id) : null;
  const featureReport = type === 'feature' ? useFeatureReport(id) : null;
  const pageReport = type === 'page' ? usePageReport(id) : null;
  const reportReport = type === 'report' ? useReportReport(id) : null;

  // Get the appropriate data and loading state
  const currentReport = guideReport || featureReport || pageReport || reportReport;
  const data = currentReport?.data;
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h2>
            <p className="text-gray-600 mb-6">The requested report could not be found or an error occurred.</p>
            <Button onClick={() => navigate('/tables')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Data Tables
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Get type-specific icon and title
  const getTypeInfo = () => {
    switch (type) {
      case 'guide':
        return { icon: DocumentTextIcon, title: 'Guide Report', color: 'blue' };
      case 'feature':
        return { icon: CubeIcon, title: 'Feature Report', color: 'green' };
      case 'page':
        return { icon: GlobeAltIcon, title: 'Page Report', color: 'purple' };
      case 'report':
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
      case 'guide':
        return [
          { label: 'Total Views', value: data.viewedCount.toLocaleString(), icon: EyeIcon, change: '+12%' },
          { label: 'Completions', value: data.completedCount.toLocaleString(), icon: CheckCircleIcon, change: '+8%' },
          { label: 'Completion Rate', value: `${data.completionRate.toFixed(1)}%`, icon: ChartBarIcon, change: '+2.1%' },
          { label: 'Engagement Rate', value: `${data.engagementRate.toFixed(1)}%`, icon: UserGroupIcon, change: '+5.3%' },
        ];
      case 'feature':
        return [
          { label: 'Usage Count', value: data.usageCount.toLocaleString(), icon: CubeIcon, change: '+18%' },
          { label: 'Unique Users', value: data.visitorCount.toLocaleString(), icon: UserGroupIcon, change: '+15%' },
          { label: 'Adoption Rate', value: `${data.adoptionRate}%`, icon: ChartBarIcon, change: '+3.2%' },
          { label: 'Usage Frequency', value: `${data.usageFrequency}x/day`, icon: ClockIcon, change: '+0.8x' },
        ];
      case 'page':
        return [
          { label: 'Page Views', value: data.viewedCount.toLocaleString(), icon: EyeIcon, change: '+22%' },
          { label: 'Unique Visitors', value: data.visitorCount.toLocaleString(), icon: UserGroupIcon, change: '+19%' },
          { label: 'Avg Time on Page', value: `${data.avgTimeOnPage}s`, icon: ClockIcon, change: '+15s' },
          { label: 'Bounce Rate', value: `${data.bounceRate}%`, icon: ChartBarIcon, change: '-3.1%' },
        ];
      case 'report':
        return [
          { label: 'Total Views', value: data.totalViews.toLocaleString(), icon: EyeIcon, change: '+28%' },
          { label: 'Unique Viewers', value: data.uniqueViewers.toLocaleString(), icon: UserGroupIcon, change: '+24%' },
          { label: 'Shares', value: data.shares.toLocaleString(), icon: ShareIcon, change: '+12%' },
          { label: 'Rating', value: `⭐ ${data.averageRating}`, icon: StarIcon, change: '+0.3' },
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
              {data.state || 'Active'}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            {data.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{data.description}</p>
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
                      type === 'guide' ? data.dailyStats :
                      type === 'feature' ? data.dailyUsage :
                      type === 'page' ? data.dailyTraffic :
                      data.dailyEngagement
                    }
                    dataKey={
                      type === 'guide' ? 'views' :
                      type === 'feature' ? 'usageCount' :
                      type === 'page' ? 'pageViews' :
                      'views'
                    }
                  />
                </CardContent>
              </Card>

              {/* Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {type === 'guide' ? 'Device Breakdown' :
                     type === 'feature' ? 'Geographic Distribution' :
                     type === 'page' ? 'Traffic Sources' :
                     'User Engagement'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportPieChart
                    data={
                      type === 'guide' ? data.deviceBreakdown :
                      type === 'feature' ? data.geographicDistribution :
                      type === 'page' ? data.trafficSources :
                      data.userEngagement
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Detailed trend analysis */}
            <Card>
              <CardHeader>
                <CardTitle>30-Day Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportLineChart
                  data={
                    type === 'guide' ? data.dailyStats :
                    type === 'feature' ? data.dailyUsage :
                    type === 'page' ? data.dailyTraffic :
                    data.dailyEngagement
                  }
                  multiLine={true}
                />
              </CardContent>
            </Card>

            {/* Usage patterns */}
            {(type === 'feature' && data.usageByTimeOfDay) && (
              <Card>
                <CardHeader>
                  <CardTitle>Usage Patterns by Time of Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReportBarChart
                    data={data.usageByTimeOfDay}
                    dataKey="usageCount"
                    xAxisKey="hour"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Advanced analytics based on type */}
            {type === 'guide' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Segment Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReportBarChart
                      data={data.segmentPerformance}
                      dataKey="completionRate"
                      xAxisKey="segment"
                    />
                  </CardContent>
                </Card>

                {data.stepAnalytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Step-by-Step Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {data.stepAnalytics.map((step: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">{step.stepName}</h4>
                              <p className="text-sm text-gray-600">
                                {step.views.toLocaleString()} views → {step.completions.toLocaleString()} completions
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{step.dropoffRate}%</p>
                              <p className="text-sm text-gray-600">dropoff</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {type === 'feature' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Cohort Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReportBarChart
                      data={data.cohortAnalysis}
                      dataKey="retentionRate"
                      xAxisKey="cohort"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Related Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.relatedFeatures.map((feature: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="font-medium">{feature.name}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                              {feature.usageCount.toLocaleString()} uses
                            </span>
                            <Badge variant="secondary">
                              {(feature.correlation * 100).toFixed(0)}% correlation
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {type === 'page' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Navigation Paths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.navigationPaths.map((path: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">
                              {path.path.join(' → ')}
                            </h4>
                            <Badge variant="secondary">
                              {path.conversionRate}% conversion
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {path.users.toLocaleString()} users followed this path
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Device Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReportBarChart
                      data={data.devicePerformance}
                      dataKey="pageViews"
                      xAxisKey="device"
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {type === 'report' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReportBarChart
                      data={data.popularSections}
                      dataKey="views"
                      xAxisKey="section"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.userFeedback.map((feedback: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-500">{'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}</span>
                            <span className="text-sm text-gray-600">
                              {feedback.count} reviews
                            </span>
                          </div>
                          <Badge variant="secondary">
                            {feedback.percentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Raw data and detailed information */}
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
                    <p className="text-gray-600 capitalize">{data.state || 'Active'}</p>
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