import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Guide } from '@/types/pendo';

interface GuidePerformanceChartProps {
  guides: Guide[];
  className?: string;
}

export const GuidePerformanceChart: React.FC<GuidePerformanceChartProps> = ({
  guides,
  className
}) => {
  // Transform guides data for chart
  const chartData = React.useMemo(() => {
    // Create mock time series data for demonstration
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayViews = Math.floor(Math.random() * 500) + 100;
      const dayCompletions = Math.floor(dayViews * (Math.random() * 0.6 + 0.2));

      return {
        date,
        views: dayViews,
        completions: dayCompletions,
        uniqueVisitors: Math.floor(dayViews * (Math.random() * 0.8 + 0.3))
      };
    });
  }, [guides]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
          <p className="text-sm font-medium">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Guide Performance - Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 min-h-[256px]">
          <ResponsiveContainer width="100%" height={256}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Total Views"
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Completions"
              />
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Unique Visitors"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Views</p>
            <p className="text-lg font-semibold text-blue-600">
              {chartData.reduce((sum, day) => sum + day.views, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completions</p>
            <p className="text-lg font-semibold text-green-600">
              {chartData.reduce((sum, day) => sum + day.completions, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg. Completion Rate</p>
            <p className="text-lg font-semibold text-orange-600">
              {Math.round(
                (chartData.reduce((sum, day) => sum + day.completions, 0) /
                chartData.reduce((sum, day) => sum + day.views, 0)) * 100
              )}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};