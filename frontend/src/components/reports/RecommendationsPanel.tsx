import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/polaris';
import { Badge } from '@/components/polaris';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  LightBulbIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string;
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  className?: string;
}

const priorityConfig = {
  high: {
    variant: 'destructive' as const,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'HIGH PRIORITY',
  },
  medium: {
    variant: 'warning' as const,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'MEDIUM PRIORITY',
  },
  low: {
    variant: 'info' as const,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'LOW PRIORITY',
  },
};

const RecommendationCard: React.FC<{ recommendation: Recommendation; index: number }> = ({
  recommendation,
  index,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = priorityConfig[recommendation.priority];

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <CardHeader className={config.bgColor}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={config.variant}>
                {config.label}
              </Badge>
              <span className="text-xs text-gray-500">#{index + 1}</span>
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {recommendation.title}
            </CardTitle>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Description */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {recommendation.description}
          </p>
        </div>

        {/* Expected Impact */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <RocketLaunchIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-green-900 mb-1">Expected Impact</h4>
              <p className="text-sm text-green-800">{recommendation.expectedImpact}</p>
            </div>
          </div>
        </div>

        {/* Implementation Details (Expandable) */}
        {isExpanded && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <h4 className="text-sm font-semibold text-gray-900">Implementation Steps</h4>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed pl-7">
              {recommendation.implementation}
            </div>
          </div>
        )}

        {/* Toggle Hint */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 py-2 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <span>View implementation steps</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  className = '',
}) => {
  const [sortBy, setSortBy] = useState<'priority' | 'default'>('priority');

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-gray-500 py-8">
            <LightBulbIcon className="h-8 w-8 mr-2" />
            <p>No recommendations available for this report</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort recommendations by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  const highCount = recommendations.filter(r => r.priority === 'high').length;
  const mediumCount = recommendations.filter(r => r.priority === 'medium').length;
  const lowCount = recommendations.filter(r => r.priority === 'low').length;

  return (
    <div className={className}>
      {/* Header Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <LightBulbIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              AI-Powered Recommendations
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Based on report analytics and configuration, we've identified {recommendations.length} actionable{' '}
              {recommendations.length === 1 ? 'recommendation' : 'recommendations'} to improve report effectiveness.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {highCount > 0 && (
                <Badge variant="destructive">
                  {`${highCount} High Priority`}
                </Badge>
              )}
              {mediumCount > 0 && (
                <Badge variant="warning">
                  {`${mediumCount} Medium Priority`}
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge variant="info">
                  {`${lowCount} Low Priority`}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Showing {sortedRecommendations.length} {sortedRecommendations.length === 1 ? 'recommendation' : 'recommendations'}
        </h4>
        <button
          onClick={() => setSortBy(sortBy === 'priority' ? 'default' : 'priority')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {sortBy === 'priority' ? 'Show original order' : 'Sort by priority'}
        </button>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {sortedRecommendations.map((recommendation, index) => (
          <RecommendationCard
            key={index}
            recommendation={recommendation}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};
