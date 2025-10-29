import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { KPICard } from '@/components/dashboard/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardOverview } from '@/hooks/usePendoData';

export const Dashboard: React.FC = () => {
  const { guides, features, pages, reports, isLoading, error, refetch } = useDashboardOverview();

  // Calculate KPI data from real data
  const kpiData = [
    {
      title: 'Total Guides',
      value: guides.length.toString(),
      change: 12,
      changeType: 'increase' as const,
      description: `${guides.filter(g => g.state === 'published').length} published`
    },
    {
      title: 'Features',
      value: features.length.toString(),
      change: 8,
      changeType: 'increase' as const,
      description: 'Tracked features'
    },
    {
      title: 'Pages',
      value: pages.length.toString(),
      change: -2,
      changeType: 'decrease' as const,
      description: 'Monitored pages'
    },
    {
      title: 'Reports',
      value: reports.length.toString(),
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
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Analytics Overview
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Real-time insights from your Pendo data
          </p>
        </div>

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
          <Card>
            <CardHeader>
              <CardTitle>Guide Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Chart placeholder - Guide views and completions over time
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Adoption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Chart placeholder - Feature usage trends
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {guides.slice(0, 2).map((guide) => (
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
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {guide.state}
                  </span>
                </div>
              ))}
              {features.slice(0, 1).map((feature) => (
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
              {reports.slice(0, 1).map((report) => (
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
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};