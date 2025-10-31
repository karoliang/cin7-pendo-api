import React from 'react';
import { Cin7Card, Cin7CardContent, Cin7CardHeader, Cin7CardTitle } from '@/components/polaris';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  description?: string;
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  description,
  loading = false
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeSymbol = () => {
    switch (changeType) {
      case 'increase':
        return '↑';
      case 'decrease':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <Cin7Card>
      <Cin7CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Cin7CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </Cin7CardTitle>
      </Cin7CardHeader>
      <Cin7CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {loading ? '...' : value}
        </div>
        {(change !== undefined || description) && (
          <div className="flex items-center mt-2 space-x-2">
            {change !== undefined && (
              <p className={`text-xs font-medium ${getChangeColor()}`}>
                {getChangeSymbol()} {Math.abs(change)}%
              </p>
            )}
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        )}
      </Cin7CardContent>
    </Cin7Card>
  );
};