import React from 'react';
import { Cin7Card, Cin7CardHeader, Cin7CardTitle, Cin7CardContent } from '@/components/polaris';
import { useUsageHeatmap } from '@/hooks/useUsageHeatmap';
import { InlineSpinner } from '@/components/ui/Spinner';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface UsageHeatmapProps {
  startDate: Date;
  endDate: Date;
}

export function UsageHeatmap({ startDate, endDate }: UsageHeatmapProps) {
  const { data: heatmap, isLoading, error } = useUsageHeatmap(startDate, endDate);

  if (isLoading) {
    return (
      <Cin7Card>
        <Cin7CardHeader>
          <Cin7CardTitle>Usage Heatmap</Cin7CardTitle>
        </Cin7CardHeader>
        <Cin7CardContent>
          <InlineSpinner message="Loading heatmap..." />
        </Cin7CardContent>
      </Cin7Card>
    );
  }

  if (error) {
    return (
      <Cin7Card>
        <Cin7CardHeader>
          <Cin7CardTitle>Usage Heatmap</Cin7CardTitle>
        </Cin7CardHeader>
        <Cin7CardContent>
          <p className="text-red-600">Error loading heatmap data</p>
        </Cin7CardContent>
      </Cin7Card>
    );
  }

  if (!heatmap) return null;

  // Find max value for color scaling
  const maxValue = Math.max(...heatmap.flat(), 1);

  // Color scale function
  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100 text-gray-400';
    const intensity = value / maxValue;
    if (intensity < 0.2) return 'bg-blue-100 text-blue-700';
    if (intensity < 0.4) return 'bg-blue-200 text-blue-800';
    if (intensity < 0.6) return 'bg-blue-300 text-blue-900';
    if (intensity < 0.8) return 'bg-blue-400 text-white';
    return 'bg-blue-500 text-white font-semibold';
  };

  return (
    <Cin7Card>
      <Cin7CardHeader>
        <Cin7CardTitle>Usage Heatmap - Peak Activity Times</Cin7CardTitle>
      </Cin7CardHeader>
      <Cin7CardContent>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className="p-2 text-xs font-medium text-gray-500 sticky left-0 bg-white z-10"></th>
                {HOURS.map(hour => (
                  <th key={hour} className="p-1 text-xs font-medium text-gray-500 text-center min-w-[40px]">
                    {hour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, dayIdx) => (
                <tr key={day}>
                  <td className="p-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 border-r">
                    {day}
                  </td>
                  {HOURS.map(hour => {
                    const value = heatmap[dayIdx][hour];
                    return (
                      <td
                        key={hour}
                        className="p-0 border border-gray-200"
                      >
                        <div
                          className={`w-full h-10 flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition-opacity ${getColor(value)}`}
                          title={`${day} ${hour}:00 - ${value.toLocaleString()} events`}
                        >
                          {value > 0 ? (value > 999 ? `${(value / 1000).toFixed(1)}k` : value) : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Low activity</span>
              <div className="flex gap-1">
                <div className="w-6 h-6 bg-gray-100 border"></div>
                <div className="w-6 h-6 bg-blue-100 border"></div>
                <div className="w-6 h-6 bg-blue-200 border"></div>
                <div className="w-6 h-6 bg-blue-300 border"></div>
                <div className="w-6 h-6 bg-blue-400 border"></div>
                <div className="w-6 h-6 bg-blue-500 border"></div>
              </div>
              <span>High activity</span>
            </div>
            <div className="text-xs text-gray-500">
              Total events: {heatmap.flat().reduce((sum, val) => sum + val, 0).toLocaleString()}
            </div>
          </div>

          {/* Insights */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">📊 Quick Insights</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Use this heatmap to schedule guide deployments during peak hours</li>
              <li>• Plan maintenance during low-activity periods (darker cells)</li>
              <li>• Understand global user work patterns across time zones</li>
            </ul>
          </div>
        </div>
      </Cin7CardContent>
    </Cin7Card>
  );
}
