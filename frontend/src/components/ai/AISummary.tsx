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
import ReactMarkdown from 'react-markdown';
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
import { InlineSpinner } from '@/components/ui/Spinner';

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
  defaultExpanded = true, // Always expanded by default
  className = '',
  onSummaryGenerated,
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Always start expanded

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
          {/* Prominent spinner for AI generation */}
          <div className="flex flex-col items-center justify-center py-8">
            <InlineSpinner message="AI is generating insights..." size="md" />
            <p className="text-xs text-purple-600 mt-4">This may take a few moments</p>
          </div>

          {/* Skeleton lines */}
          <div className="space-y-3 mt-4">
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
    <Card className={`border-gray-200 bg-white transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              AI-Powered Insights
              <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                Claude 3.5 Sonnet
              </span>
            </CardTitle>
            <CardDescription>
              Strategic analysis of your {getReportTypeName().toLowerCase()} performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerate}
              disabled={isRegenerating}
              className="text-gray-600 hover:bg-gray-100"
              title="Regenerate summary"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Always Show Full Content */}
      <CardContent className="space-y-4">
        {/* Main Summary Content */}
        {summary.summary && (
          <div className="prose prose-sm prose-gray max-w-none text-gray-800 leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-900" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 text-gray-700 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 mb-3 space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-700 pl-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
              }}
            >
              {summary.summary}
            </ReactMarkdown>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {summary.metadata.processingTime}ms
            </span>
            <span className="flex items-center gap-1">
              <CpuChipIcon className="h-3 w-3" />
              {summary.metadata.tokensUsed} tokens
            </span>
            <span className="text-gray-300">•</span>
            <span>Model: {summary.metadata.model}</span>
          </div>
          <div className="text-gray-400">
            {new Date(summary.metadata.generatedAt).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ===== EXPORTS =====

export default AISummary;
