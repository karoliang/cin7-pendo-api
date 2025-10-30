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
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface ChartDataPoint {
  [key: string]: string | number | undefined;
}

interface ReportBarChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
}

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export const ReportBarChart: React.FC<ReportBarChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  height = 300,
  color = '#3B82F6'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  const formatTooltipValue = (value: number, name: string) => {
    return [value.toLocaleString(), name];
  };

  // Recharts v3 TooltipProps doesn't properly expose all properties in the type
  // Using explicit any here with proper runtime checks
  const CustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{String(label || '')}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              {entry.name && (String(entry.name).includes('Rate') || String(entry.name).includes('rate')) ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatXAxis = (tickItem: string) => {
    // Truncate long labels
    if (tickItem.length > 15) {
      return tickItem.substring(0, 12) + '...';
    }
    return tickItem;
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
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxis}
            className="text-xs"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis className="text-xs" />
          <Tooltip content={<CustomTooltip />} formatter={formatTooltipValue} />

          <Bar dataKey={dataKey} radius={[8, 8, 0, 0]}>
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={color || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};