import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Feature } from '@/types/pendo';

interface FeatureAdoptionChartProps {
  features: Feature[];
  className?: string;
}

export const FeatureAdoptionChart: React.FC<FeatureAdoptionChartProps> = ({
  features,
  className
}) => {
  // Transform features data for chart - top 10 features by usage
  const chartData = React.useMemo(() => {
    return features
      .slice(0, 10)
      .map(feature => ({
        name: feature.name.length > 20 ? feature.name.substring(0, 20) + '...' : feature.name,
        fullName: feature.name,
        usage: feature.usageCount,
        visitors: feature.visitorCount,
        accounts: feature.accountCount,
        avgUsagePerVisitor: feature.visitorCount > 0 ? Math.round(feature.usageCount / feature.visitorCount) : 0
      }))
      .sort((a, b) => b.usage - a.usage);
  }, [features]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg max-w-xs">
          <p className="text-sm font-medium mb-2">{data.fullName}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-1">
            Avg: {data.avgUsagePerVisitor} uses per visitor
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Top Feature Adoption</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 min-h-[256px]">
          <ResponsiveContainer width="100%" height={256}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usage" name="Total Usage" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Usage</p>
            <p className="text-lg font-semibold text-blue-600">
              {chartData.reduce((sum, feature) => sum + feature.usage, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unique Users</p>
            <p className="text-lg font-semibold text-green-600">
              {chartData.reduce((sum, feature) => sum + feature.visitors, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg. Usage Rate</p>
            <p className="text-lg font-semibold text-orange-600">
              {chartData.length > 0
                ? Math.round(
                    chartData.reduce((sum, feature) => sum + feature.avgUsagePerVisitor, 0) / chartData.length
                  )
                : 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};