import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { PageEventRow } from '@/types/enhanced-pendo';

interface SessionTimingDistributionProps {
  events: PageEventRow[];
  height?: number;
}

interface TimingBucket {
  range: string;
  count: number;
  percentage: number;
  avgTime: number;
}

export const SessionTimingDistribution: React.FC<SessionTimingDistributionProps> = ({
  events,
  height = 300
}) => {
  // Calculate timing distribution
  const distribution = React.useMemo(() => {
    if (!events || events.length === 0) return null;

    // Filter events with valid numMinutes
    const validEvents = events.filter(e => e.numMinutes !== undefined && e.numMinutes !== null);

    if (validEvents.length === 0) return null;

    // Define buckets (in seconds)
    const buckets = [
      { label: '0-30s', min: 0, max: 0.5, count: 0, totalTime: 0 },
      { label: '30s-1m', min: 0.5, max: 1, count: 0, totalTime: 0 },
      { label: '1-2m', min: 1, max: 2, count: 0, totalTime: 0 },
      { label: '2-5m', min: 2, max: 5, count: 0, totalTime: 0 },
      { label: '5-10m', min: 5, max: 10, count: 0, totalTime: 0 },
      { label: '10m+', min: 10, max: Infinity, count: 0, totalTime: 0 },
    ];

    // Fill buckets
    validEvents.forEach(event => {
      const minutes = event.numMinutes!;
      const bucket = buckets.find(b => minutes >= b.min && minutes < b.max);
      if (bucket) {
        bucket.count++;
        bucket.totalTime += minutes;
      }
    });

    // Calculate statistics
    const total = validEvents.length;
    const times = validEvents.map(e => e.numMinutes!);
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

    // Calculate median
    const sortedTimes = [...times].sort((a, b) => a - b);
    const median = sortedTimes.length % 2 === 0
      ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
      : sortedTimes[Math.floor(sortedTimes.length / 2)];

    const data: TimingBucket[] = buckets.map(bucket => ({
      range: bucket.label,
      count: bucket.count,
      percentage: (bucket.count / total) * 100,
      avgTime: bucket.count > 0 ? bucket.totalTime / bucket.count : 0
    }));

    return {
      data,
      avgTime,
      median,
      total
    };
  }, [events]);

  if (!distribution || distribution.data.every(d => d.count === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="font-medium">No session timing data available</p>
          <p className="text-sm mt-1">Session duration data will appear when available</p>
        </div>
      </div>
    );
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload as TimingBucket;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl">
          <p className="font-semibold text-gray-900 mb-2 border-b pb-2">
            {data.range}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600">Sessions:</span>
              <span className="text-sm font-bold text-blue-600">
                {data.count.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600">Percentage:</span>
              <span className="text-sm font-bold text-gray-900">
                {data.percentage.toFixed(1)}%
              </span>
            </div>
            {data.avgTime > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-600">Avg Time:</span>
                <span className="text-sm font-bold text-green-600">
                  {data.avgTime.toFixed(1)}m
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
          <p className="text-xs text-blue-600 font-medium mb-1">Average Session</p>
          <p className="text-xl font-bold text-blue-900">
            {distribution.avgTime < 1
              ? `${(distribution.avgTime * 60).toFixed(0)}s`
              : `${distribution.avgTime.toFixed(1)}m`
            }
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
          <p className="text-xs text-green-600 font-medium mb-1">Median Session</p>
          <p className="text-xl font-bold text-green-900">
            {distribution.median < 1
              ? `${(distribution.median * 60).toFixed(0)}s`
              : `${distribution.median.toFixed(1)}m`
            }
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
          <p className="text-xs text-purple-600 font-medium mb-1">Total Sessions</p>
          <p className="text-xl font-bold text-purple-900">
            {distribution.total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Distribution Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={distribution.data}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#E5E7EB" />
            <XAxis
              dataKey="range"
              className="text-xs"
              stroke="#9CA3AF"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              className="text-xs"
              tickFormatter={formatYAxis}
              stroke="#9CA3AF"
              tick={{ fill: '#6B7280' }}
              label={{ value: 'Sessions', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />

            {/* Average line indicator (approximate position) */}
            <ReferenceLine
              y={distribution.data.reduce((max, d) => Math.max(max, d.count), 0) * 0.7}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              strokeWidth={0}
            />

            <Bar
              dataKey="count"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Percentage breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        {distribution.data.map((bucket, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded p-2 border border-gray-200"
          >
            <div className="font-medium text-gray-700">{bucket.range}</div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">{bucket.count}</span>
              <span className="font-bold text-blue-600">{bucket.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
