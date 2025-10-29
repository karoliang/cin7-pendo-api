import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Page } from '@/types/pendo';

interface PageAnalyticsChartProps {
  pages: Page[];
  className?: string;
}

export const PageAnalyticsChart: React.FC<PageAnalyticsChartProps> = ({
  pages,
  className
}) => {
  // Transform pages data for pie chart
  const chartData = React.useMemo(() => {
    return pages
      .slice(0, 6)
      .map(page => ({
        name: page.title || page.url.split('/').pop() || 'Unknown Page',
        views: page.viewedCount,
        visitors: page.visitorCount,
        avgTimePerPage: Math.floor(Math.random() * 300) + 60 // Mock data for demo
      }))
      .sort((a, b) => b.views - a.views);
  }, [pages]);

  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899'  // pink
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-blue-600">
            Views: {data.views.toLocaleString()}
          </p>
          <p className="text-sm text-green-600">
            Visitors: {data.visitors.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Avg. Time: {Math.floor(data.avgTimePerPage / 60)}m {data.avgTimePerPage % 60}s
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalViews = chartData.reduce((sum, page) => sum + page.views, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Page Views Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 min-h-[256px]">
          <ResponsiveContainer width="100%" height={256}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="views"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {entry.payload.name} ({value.toLocaleString()})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Page Details */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Top Pages Details</h4>
          <div className="grid grid-cols-1 gap-2">
            {chartData.slice(0, 3).map((page, index) => {
              const percentage = ((page.views / totalViews) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {page.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};