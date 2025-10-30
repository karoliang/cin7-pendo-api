import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Brush
} from 'recharts';

interface LineChartDataPoint {
  date: string;
  views?: number;
  completions?: number;
  uniqueVisitors?: number;
  frustrationCount?: number;
  [key: string]: string | number | undefined; // Index signature for flexible data access
}

interface ReportLineChartProps {
  data: LineChartDataPoint[];
  dataKey: string;
  multiLine?: boolean;
  height?: number;
  showGridlines?: boolean;
  showBrush?: boolean;
  showAverage?: boolean;
  colors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export const ReportLineChart: React.FC<ReportLineChartProps> = ({
  data,
  dataKey,
  multiLine = false,
  height = 300,
  showGridlines = true,
  showBrush = false,
  showAverage = true,
  colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#F59E0B',
  }
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="font-medium">No data available</p>
          <p className="text-sm mt-1">Chart will appear when data is loaded</p>
        </div>
      </div>
    );
  }

  // Calculate average for reference line
  const average = React.useMemo(() => {
    if (!showAverage) return 0;
    const values = data.map(d => {
      const value = d[dataKey];
      return typeof value === 'number' ? value : 0;
    });
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }, [data, dataKey, showAverage]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  // Recharts v3 TooltipProps doesn't properly expose all properties in the type
  // Using explicit any here with proper runtime checks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      const dateLabel = typeof label === 'string' ? label : String(label || '');

      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl">
          <p className="font-semibold text-gray-900 mb-2 border-b pb-2">
            {new Date(dateLabel).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold" style={{ color: entry.color }}>
                  {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: showBrush ? height + 50 : height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: showBrush ? 20 : 10,
          }}
        >
          {showGridlines && (
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#E5E7EB" />
          )}

          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            className="text-xs"
            stroke="#9CA3AF"
            tick={{ fill: '#6B7280' }}
          />

          <YAxis
            className="text-xs"
            tickFormatter={formatYAxis}
            stroke="#9CA3AF"
            tick={{ fill: '#6B7280' }}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 1 }} />

          {multiLine && (
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
              iconSize={16}
            />
          )}

          {/* Average reference line */}
          {showAverage && !multiLine && average > 0 && (
            <ReferenceLine
              y={average}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Avg: ${average.toFixed(0)}`,
                fill: '#F59E0B',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          )}

          {multiLine ? (
            <>
              <Line
                type="monotone"
                dataKey="views"
                stroke={colors.primary}
                strokeWidth={2}
                dot={{ fill: colors.primary, r: 3 }}
                activeDot={{ r: 6 }}
                name="Views"
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke={colors.secondary}
                strokeWidth={2}
                dot={{ fill: colors.secondary, r: 3 }}
                activeDot={{ r: 6 }}
                name="Completions"
              />
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                stroke={colors.tertiary}
                strokeWidth={2}
                dot={{ fill: colors.tertiary, r: 3 }}
                activeDot={{ r: 6 }}
                name="Unique Visitors"
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors.primary}
              strokeWidth={2}
              dot={{ fill: colors.primary, r: 4 }}
              activeDot={{ r: 8, fill: colors.primary, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={800}
            />
          )}

          {/* Brush for zoom/pan */}
          {showBrush && data.length > 10 && (
            <Brush
              dataKey="date"
              height={30}
              stroke={colors.primary}
              tickFormatter={formatXAxis}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};