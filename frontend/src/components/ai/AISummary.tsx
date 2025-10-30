/**
 * AISummary Component
 *
 * Displays AI-generated summaries of Pendo analytics reports
 * Features collapsible design, smooth animations, and error handling
 *
 * @example
 * ```tsx
 * <AISummary
 *   reportType="guides"
 *   reportData={guideData}
 *   defaultExpanded={true}
 * />
 * ```
 */

import React, { useState } from 'react';
import { useAISummary } from '@/hooks/useAISummary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import type {
  ComprehensiveGuideData,
  ComprehensiveFeatureData,
  ComprehensivePageData,
  ComprehensiveReportData,
} from '@/types/enhanced-pendo';

// ===== TYPES =====

export interface AISummaryProps {
  /** Type of report being analyzed */
  reportType: 'guides' | 'features' | 'pages' | 'reports';

  /** Report data to analyze */
  reportData:
    | ComprehensiveGuideData
    | ComprehensiveFeatureData
    | ComprehensivePageData
    | ComprehensiveReportData;

  /** Additional context for the AI */
  additionalContext?: string;

  /** Whether to show expanded by default */
  defaultExpanded?: boolean;

  /** Custom CSS class */
  className?: string;

  /** Callback when summary is generated */
  onSummaryGenerated?: () => void;
}

// ===== COMPONENT =====

export const AISummary: React.FC<AISummaryProps> = ({
  reportType,
  reportData,
  additionalContext,
  defaultExpanded = false,
  className = '',
  onSummaryGenerated,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const {
    summary,
    isLoading,
    error,
    regenerate,
    isRegenerating,
  } = useAISummary({
    reportType,
    reportData,
    additionalContext,
    enabled: true,
    onSuccess: () => {
      onSummaryGenerated?.();
    },
  });

  // Toggle expand/collapse
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Get report type display name
  const getReportTypeName = () => {
    const names = {
      guides: 'Guide',
      features: 'Feature',
      pages: 'Page',
      reports: 'Report',
    };
    return names[reportType];
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className={`border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg animate-pulse">
                <SparklesIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
                <CardDescription>Analyzing {getReportTypeName().toLowerCase()} data...</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-purple-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-purple-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-purple-200 rounded animate-pulse w-4/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-red-900">AI Summary Unavailable</CardTitle>
                <CardDescription className="text-red-700">Failed to generate insights</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={regenerate}
              disabled={isRegenerating}
              className="text-red-600 border-red-300 hover:bg-red-100"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-800">{error.message}</p>
            <p className="text-xs text-red-600 mt-2">
              This feature requires a valid GLM API key. Please check the configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No summary yet
  if (!summary) {
    return null;
  }

  // Main render
  return (
    <Card className={`border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                AI-Powered Insights
                <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                  GLM-4
                </span>
              </CardTitle>
              <CardDescription>
                Intelligent analysis of your {getReportTypeName().toLowerCase()} performance
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerate}
              disabled={isRegenerating}
              className="text-purple-600 hover:bg-purple-100"
              title="Regenerate summary"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-purple-600 hover:bg-purple-100"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <CardContent className="space-y-6">
          {/* Summary Section */}
          {summary.summary && (
            <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CpuChipIcon className="h-4 w-4 text-purple-600" />
                Performance Summary
              </h4>
              <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
            </div>
          )}

          {/* Key Insights Section */}
          {summary.insights && summary.insights.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LightBulbIcon className="h-4 w-4 text-blue-600" />
                Key Insights
              </h4>
              <ul className="space-y-2">
                {summary.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations Section */}
          {summary.recommendations && summary.recommendations.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LightBulbIcon className="h-4 w-4 text-green-600" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {summary.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 font-bold flex-shrink-0">{index + 1}.</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-purple-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {summary.metadata.processingTime}ms
              </span>
              <span className="flex items-center gap-1">
                <CpuChipIcon className="h-3 w-3" />
                {summary.metadata.tokensUsed} tokens
              </span>
              <span className="text-gray-400">•</span>
              <span>Model: {summary.metadata.model}</span>
            </div>
            <div className="text-gray-400">
              {new Date(summary.metadata.generatedAt).toLocaleString()}
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <span className="font-semibold">Development Mode:</span> API key is exposed in frontend code.
                In production, move AI summarization to a secure backend endpoint.
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Collapsed Preview */}
      {!isExpanded && summary.summary && (
        <CardContent className="pt-0">
          <div className="bg-white/50 rounded-lg p-3 border border-purple-100">
            <p className="text-sm text-gray-600 line-clamp-2">{summary.summary}</p>
            <button
              onClick={toggleExpanded}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-2 flex items-center gap-1"
            >
              Read more
              <ChevronDownIcon className="h-3 w-3" />
            </button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// ===== EXPORTS =====

export default AISummary;
