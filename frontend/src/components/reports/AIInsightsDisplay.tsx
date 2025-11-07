import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/polaris';
import { Badge } from '@/components/polaris';
import {
  LightBulbIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Insight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
}

interface AIInsightsDisplayProps {
  insights: Insight[];
  className?: string;
}

// Map insight types to icons and colors
const insightTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, bgColor: string, badgeVariant: 'default' | 'success' | 'warning' | 'destructive' | 'info' }> = {
  'trend': { icon: ArrowTrendingUpIcon, color: 'text-blue-600', bgColor: 'bg-blue-50', badgeVariant: 'info' },
  'pattern': { icon: ChartBarIcon, color: 'text-green-600', bgColor: 'bg-green-50', badgeVariant: 'success' },
  'opportunity': { icon: LightBulbIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-50', badgeVariant: 'warning' },
  'risk': { icon: ExclamationTriangleIcon, color: 'text-red-600', bgColor: 'bg-red-50', badgeVariant: 'destructive' },
  'user_behavior': { icon: UserGroupIcon, color: 'text-purple-600', bgColor: 'bg-purple-50', badgeVariant: 'default' },
  'ai_generated': { icon: SparklesIcon, color: 'text-indigo-600', bgColor: 'bg-indigo-50', badgeVariant: 'info' },
};

const getInsightConfig = (type: string) => {
  return insightTypeConfig[type.toLowerCase()] || {
    icon: LightBulbIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    badgeVariant: 'default' as const
  };
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {
    return timestamp;
  }
};

const ConfidenceMeter: React.FC<{ confidence: number }> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-right">
        {percentage}%
      </span>
    </div>
  );
};

export const AIInsightsDisplay: React.FC<AIInsightsDisplayProps> = ({ insights, className = '' }) => {
  if (!insights || insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-gray-500 py-8">
            <SparklesIcon className="h-8 w-8 mr-2" />
            <p>No AI insights available for this report</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const config = getInsightConfig(insight.type);
          const Icon = config.icon;

          return (
            <Card key={index} className={`border-l-4 ${config.color.replace('text-', 'border-')}`}>
              <CardHeader className={`${config.bgColor} pb-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 ${config.bgColor} rounded-lg`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={config.badgeVariant}>
                          {insight.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {insight.title}
                      </CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  {insight.description}
                </p>

                <div className="space-y-3">
                  {/* Confidence Meter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Confidence</span>
                    </div>
                    <ConfidenceMeter confidence={insight.confidence} />
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <span>Generated {formatTimestamp(insight.timestamp)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
