import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export type DataQuality = 'real' | 'estimated' | 'mock';

export interface DataQualityBadgeProps {
  type: DataQuality;
  tooltip?: string;
  className?: string;
}

const QUALITY_CONFIG: Record<DataQuality, {
  label: string;
  bgColor: string;
  textColor: string;
  defaultTooltip: string;
}> = {
  real: {
    label: 'Real-time Data',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    defaultTooltip: 'Real-time data from Pendo API'
  },
  estimated: {
    label: 'Estimated',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    defaultTooltip: 'Calculated from real data using estimation algorithms'
  },
  mock: {
    label: 'Mock Data',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    defaultTooltip: 'Simulated data - not available via Pendo API'
  }
};

export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
  type,
  tooltip,
  className = ''
}) => {
  const config = QUALITY_CONFIG[type];
  const displayTooltip = tooltip || config.defaultTooltip;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full cursor-help ${config.bgColor} ${config.textColor} ${className}`}
      title={displayTooltip}
    >
      {config.label}
      <InformationCircleIcon className="h-3 w-3" />
    </span>
  );
};
