import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/polaris';
import { Badge } from '@/components/polaris';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartBarIcon, EyeIcon, ClockIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import type { ReportSection } from '@/types/enhanced-pendo';

interface SectionEngagementChartProps {
  sections: ReportSection[];
  className?: string;
}

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export const SectionEngagementChart: React.FC<SectionEngagementChartProps> = ({
  sections,
  className = '',
}) => {
  if (!sections || sections.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-gray-500 py-8">
            <ChartBarIcon className="h-8 w-8 mr-2" />
            <p>No section engagement data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort sections by views (descending)
  const sortedSections = [...sections].sort((a, b) => b.views - a.views);

  // Prepare data for the bar chart
  const chartData = sortedSections.map(section => ({
    name: section.sectionName.length > 20
      ? section.sectionName.substring(0, 18) + '...'
      : section.sectionName,
    fullName: section.sectionName,
    views: section.views,
    interactions: section.interactionCount,
    timeSpent: Math.round(section.averageTimeSpent / 60), // Convert to minutes
    completionRate: Math.round(section.completionRate * 100),
  }));

  // Calculate totals
  const totalViews = sections.reduce((sum, s) => sum + s.views, 0);
  const totalInteractions = sections.reduce((sum, s) => sum + s.interactionCount, 0);
  const avgTimeSpent = Math.round(
    sections.reduce((sum, s) => sum + s.averageTimeSpent, 0) / sections.length / 60
  );
  const avgCompletionRate = Math.round(
    sections.reduce((sum, s) => sum + s.completionRate, 0) / sections.length * 100
  );

  // Custom tooltip
  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-3">{data.fullName}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <EyeIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700">
                <strong>{data.views.toLocaleString()}</strong> views
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CursorArrowRaysIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">
                <strong>{data.interactions.toLocaleString()}</strong> interactions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-gray-700">
                <strong>{data.timeSpent}</strong> min avg time
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-700">
                <strong>{data.completionRate}%</strong> completion
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Section Engagement Breakdown</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Analyze which report sections receive the most attention
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <EyeIcon className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Total Views</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{totalViews.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CursorArrowRaysIcon className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Total Interactions</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {totalInteractions.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ClockIcon className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Avg Time</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{avgTimeSpent}m</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ChartBarIcon className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Avg Completion</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{avgCompletionRate}%</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Views by Section</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" className="text-xs" />
                <YAxis
                  dataKey="name"
                  type="category"
                  className="text-xs"
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="views" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Table */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Metrics</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-700">Section</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Views</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Interactions</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Avg Time</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSections.map((section, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{section.sectionName}</td>
                      <td className="p-3 text-right text-gray-700">
                        {section.views.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {section.interactionCount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {Math.round(section.averageTimeSpent / 60)}m
                      </td>
                      <td className="p-3 text-right">
                        <Badge
                          variant={
                            section.completionRate >= 0.8
                              ? 'success'
                              : section.completionRate >= 0.5
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {`${Math.round(section.completionRate * 100)}%`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
