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
import { useGuidePerformance } from '@/hooks/usePendoData';

interface GuidePerformanceChartProps {
  guides?: unknown[]; // Not used, kept for backwards compatibility
  className?: string;
}

export const GuidePerformanceChart: React.FC<GuidePerformanceChartProps> = ({
  className
}) => {
  // Fetch real guide performance data
  const { data: performanceData, isLoading, error } = useGuidePerformance(30);

  // Transform API data to chart format
  const chartData = React.useMemo(() => {
    if (!performanceData || performanceData.length === 0) {
      // Return empty array while loading or if no data
      return [];
    }

    return performanceData.map(item => ({
      date: item.date,
      views: item.views,
      completions: item.completions,
      uniqueVisitors: item.visitors
    }));
  }, [performanceData]);

  interface TooltipPayload {
    name: string;
    value: number;
    color: string;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
          <p className="text-sm font-medium">{`Date: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Guide Performance - Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 min-h-[256px] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading performance data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Guide Performance - Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 min-h-[256px] flex items-center justify-center">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading performance data</p>
              <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!chartData || chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Guide Performance - Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 min-h-[256px] flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="font-medium">No performance data available</p>
              <p className="text-sm mt-1">Guide analytics will appear here once guides are viewed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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