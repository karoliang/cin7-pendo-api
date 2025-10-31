/**
 * useAISummary Hook
 *
 * React hook for generating AI-powered summaries of Pendo analytics data
 * Uses React Query for caching, error handling, and retry logic
 *
 * @example
 * ```tsx
 * const { summary, isLoading, error, regenerate } = useAISummary({
 *   reportType: 'guides',
 *   reportData: guideData,
 * });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openRouterAPI } from '@/services/openrouter-api';
import type { AISummaryRequest, AISummaryResponse } from '@/types/openrouter';
import type {
  ComprehensiveGuideData,
  ComprehensiveFeatureData,
  ComprehensivePageData,
  ComprehensiveReportData,
} from '@/types/enhanced-pendo';

// ===== TYPES =====

export interface UseAISummaryOptions {
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

  /** Enable automatic summary generation on mount */
  enabled?: boolean;

  /** Callback when summary is generated */
  onSuccess?: (summary: AISummaryResponse) => void;

  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

export interface UseAISummaryReturn {
  /** Generated summary data */
  summary: AISummaryResponse | undefined;

  /** Whether summary is currently being generated */
  isLoading: boolean;

  /** Error if generation failed */
  error: Error | null;

  /** Manually trigger summary regeneration */
  regenerate: () => void;

  /** Cancel ongoing generation */
  cancel: () => void;

  /** Whether regeneration is in progress */
  isRegenerating: boolean;
}

// ===== HOOK IMPLEMENTATION =====

export function useAISummary(options: UseAISummaryOptions): UseAISummaryReturn {
  const {
    reportType,
    reportData,
    additionalContext,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const queryClient = useQueryClient();

  // Generate cache key based on report ID and type
  const cacheKey = ['ai-summary', reportType, reportData.id];

  // Main query for initial summary generation
  const query = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      console.log(`🤖 Generating AI summary for ${reportType}:`, reportData.id);

      const request: AISummaryRequest = {
        reportType,
        reportData: reportData as any,
        additionalContext,
        stream: false,
      };

      const response = await openRouterAPI.generateSummary(request);

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('✅ AI summary generated:', {
        insights: response.insights.length,
        recommendations: response.recommendations?.length || 0,
        tokens: response.metadata.tokensUsed,
        time: `${response.metadata.processingTime}ms`,
      });

      return response;
    },
    enabled: enabled && !!reportData.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - summaries don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry on API key errors or invalid data
      if (error instanceof Error) {
        if (
          error.message.includes('API key') ||
          error.message.includes('invalid') ||
          error.message.includes('401') ||
          error.message.includes('403')
        ) {
          return false;
        }
      }
      // Retry up to 2 times for network/timeout errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component remounts
    refetchOnReconnect: true, // Do refetch on reconnect
  });

  // Mutation for manual regeneration
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      console.log(`🔄 Regenerating AI summary for ${reportType}:`, reportData.id);

      const request: AISummaryRequest = {
        reportType,
        reportData: reportData as any,
        additionalContext,
        stream: false,
      };

      const response = await openRouterAPI.generateSummary(request);

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    },
    onSuccess: (data) => {
      // Update cache with new summary
      queryClient.setQueryData(cacheKey, data);

      console.log('✅ AI summary regenerated');

      // Call user-provided callback
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      console.error('❌ Failed to regenerate AI summary:', error);

      // Call user-provided callback
      if (onError) {
        onError(error);
      }
    },
  });

  // Cancel function
  const cancel = () => {
    queryClient.cancelQueries({ queryKey: cacheKey });
  };

  return {
    summary: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    regenerate: () => regenerateMutation.mutate(),
    cancel,
    isRegenerating: regenerateMutation.isPending,
  };
}

// ===== STREAMING HOOK (Optional Advanced Feature) =====

export interface UseAISummaryStreamOptions extends Omit<UseAISummaryOptions, 'enabled'> {
  /** Enable automatic streaming on mount */
  autoStart?: boolean;
}

export interface UseAISummaryStreamReturn {
  /** Current partial summary content */
  content: string;

  /** Whether streaming is active */
  isStreaming: boolean;

  /** Whether streaming is complete */
  isDone: boolean;

  /** Error if streaming failed */
  error: Error | null;

  /** Start streaming */
  start: () => void;

  /** Stop streaming */
  stop: () => void;
}

/**
 * Hook for streaming AI summaries (real-time generation)
 * Useful for showing progressive results to users
 */
export function useAISummaryStream(
  options: UseAISummaryStreamOptions
): UseAISummaryStreamReturn {
  const [content, setContent] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isDone, setIsDone] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const { reportType, reportData, additionalContext, autoStart = false } = options;

  const startStreaming = React.useCallback(async () => {
    setContent('');
    setIsStreaming(true);
    setIsDone(false);
    setError(null);

    // Create new abort controller for this stream
    abortControllerRef.current = new AbortController();

    try {
      const request: AISummaryRequest = {
        reportType,
        reportData: reportData as any,
        additionalContext,
        stream: true,
      };

      for await (const chunk of openRouterAPI.generateSummaryStream(request)) {
        // Check if streaming was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        setContent(chunk.content);

        if (chunk.done) {
          setIsDone(true);
          setIsStreaming(false);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Streaming failed'));
      setIsStreaming(false);
    }
  }, [reportType, reportData, additionalContext]);

  const stopStreaming = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  // Auto-start if enabled
  React.useEffect(() => {
    if (autoStart && reportData.id) {
      startStreaming();
    }
  }, [autoStart, reportData.id, startStreaming]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    content,
    isStreaming,
    isDone,
    error,
    start: startStreaming,
    stop: stopStreaming,
  };
}

// Import React for streaming hook
import React from 'react';
