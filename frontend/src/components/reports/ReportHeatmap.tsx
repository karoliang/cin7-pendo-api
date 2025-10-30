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

interface HeatmapDataPoint {
  hour: number;
  usageCount?: number;
  value?: number;
}

interface ReportHeatmapProps {
  data: HeatmapDataPoint[];
  height?: number;
}

// Simple heatmap implementation using bars with color gradients
export const ReportHeatmap: React.FC<ReportHeatmapProps> = ({
  data,
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  const getHeatmapColor = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity > 0.8) return '#DC2626'; // red-600
    if (intensity > 0.6) return '#F97316'; // orange-500
    if (intensity > 0.4) return '#F59E0B'; // yellow-500
    if (intensity > 0.2) return '#84CC16'; // lime-500
    return '#22C55E'; // green-500
  };

  const maxValue = Math.max(...data.map(d => d.usageCount || d.value || 0));

  // Recharts v3 TooltipProps doesn't properly expose all properties in the type
  // Using explicit any here with proper runtime checks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const hour = typeof label === 'number' ? label : parseInt(String(label || '0'), 10);

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">
            {hour}:00 {hour < 12 ? 'AM' : 'PM'}
          </p>
          <p className="text-sm text-gray-600">
            Usage: {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
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
            dataKey="hour"
            className="text-xs"
            tickFormatter={(value) => `${value}:00`}
          />
          <YAxis className="text-xs" />
          <Tooltip content={<CustomTooltip />} />

          <Bar dataKey="usageCount" radius={[0, 0, 0, 0]}>
            {data.map((entry, index) => {
              const usageValue = entry.usageCount ?? entry.value ?? 0;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={getHeatmapColor(usageValue, maxValue)}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};