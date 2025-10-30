import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

interface PieChartDataPoint {
  name?: string;
  segment?: string;
  source?: string;
  device?: string;
  users?: number;
  value?: number | string;
  percentage?: number;
  visitors?: number;
  region?: string;
  country?: string;
  completionRate?: number;
  [key: string]: string | number | undefined; // Index signature for Recharts compatibility
}

interface ReportPieChartProps {
  data: PieChartDataPoint[];
  height?: number;
  dataKey?: string;
}

interface LegendPayload {
  payload: PieChartDataPoint;
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

export const ReportPieChart: React.FC<ReportPieChartProps> = ({
  data,
  height = 300,
  dataKey = 'users'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  // Recharts v3 TooltipProps doesn't properly expose all properties in the type
  // Using explicit any here with proper runtime checks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as PieChartDataPoint;
      const displayName = dataPoint.name ?? dataPoint.segment ?? dataPoint.source ?? dataPoint.device ?? 'Unknown';
      const displayValue = typeof dataPoint.users === 'number'
        ? dataPoint.users.toLocaleString()
        : dataPoint.value ?? dataPoint.percentage ?? 0;

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{displayName}</p>
          <p className="text-sm text-gray-600">
            {displayValue}
            {dataPoint.percentage ? ` (${dataPoint.percentage}%)` : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

    // Type guards for required properties
    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      typeof midAngle !== 'number' ||
      typeof innerRadius !== 'number' ||
      typeof outerRadius !== 'number' ||
      typeof percent !== 'number'
    ) {
      return null;
    }

    if (percent < 0.05) return null; // Don't show label for slices less than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(_value, entry) => {
              const legendEntry = entry as unknown as LegendPayload;
              const displayName =
                legendEntry.payload.name ??
                legendEntry.payload.segment ??
                legendEntry.payload.source ??
                legendEntry.payload.device ??
                'Unknown';

              return <span className="text-xs">{displayName}</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};