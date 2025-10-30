import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface LineChartDataPoint {
  date: string;
  views?: number;
  completions?: number;
  uniqueVisitors?: number;
  [key: string]: string | number | undefined; // Index signature for flexible data access
}

interface ReportLineChartProps {
  data: LineChartDataPoint[];
  dataKey: string;
  multiLine?: boolean;
  height?: number;
}

export const ReportLineChart: React.FC<ReportLineChartProps> = ({
  data,
  dataKey,
  multiLine = false,
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Recharts v3 TooltipProps doesn't properly expose all properties in the type
  // Using explicit any here with proper runtime checks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      const dateLabel = typeof label === 'string' ? label : String(label || '');

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {new Date(dateLabel).toLocaleDateString()}
          </p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            className="text-xs"
          />
          <YAxis className="text-xs" />
          <Tooltip content={<CustomTooltip />} />
          {multiLine && <Legend />}

          {multiLine ? (
            <>
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Views"
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Completions"
              />
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                name="Unique Visitors"
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};