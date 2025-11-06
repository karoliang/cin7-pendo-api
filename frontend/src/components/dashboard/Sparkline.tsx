import React from 'react';

interface SparklineProps {
  data: number[];
  color?: 'success' | 'critical' | 'subdued';
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color = 'subdued' }) => {
  if (!data || data.length < 2) {
    return null;
  }

  // Normalize data to 0-24 range (height of sparkline)
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  // Handle case where all values are the same
  if (range === 0) {
    const points = data.map((_, idx) => ({
      x: (idx / (data.length - 1)) * 60,
      y: 12, // Middle of the chart
    }));
    const path = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    return (
      <svg width="60" height="24" className="inline-block ml-2 transition-opacity hover:opacity-80">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
      </svg>
    );
  }

  // Create points with normalized y values (inverted for SVG coordinates)
  const points = data.map((val, idx) => ({
    x: (idx / (data.length - 1)) * 60,
    y: 24 - ((val - min) / range) * 24,
  }));

  // Create smooth curve using quadratic bezier curves
  const path = points
    .map((p, i) => {
      if (i === 0) {
        return `M ${p.x} ${p.y}`;
      }
      // Calculate control point for smooth curve
      const prevPoint = points[i - 1];
      const controlX = (prevPoint.x + p.x) / 2;
      return `Q ${controlX} ${prevPoint.y}, ${p.x} ${p.y}`;
    })
    .join(' ');

  // Map color prop to CSS color classes
  const colorClass = {
    success: 'text-green-600',
    critical: 'text-red-600',
    subdued: 'text-gray-400',
  }[color];

  return (
    <svg width="60" height="24" className="inline-block ml-2 transition-opacity hover:opacity-80">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className={colorClass} />
    </svg>
  );
};
