/**
 * React Hooks for Enhanced Pendo API Integration
 * Provides seamless integration with React Query and error boundaries
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { enhancedPendoAPI, PendoApiError, RateLimitError, CircuitBreakerError } from '@/lib/enhanced-pendo-api';
import type { Guide, Feature, Page, Report } from '@/types/pendo';

// Query key factory for consistent caching
export const pendoQueryKeys = {
  all: ['pendo'] as const,
  guides: () => [...pendoQueryKeys.all, 'guides'] as const,
  guide: (id: string) => [...pendoQueryKeys.guides(), id] as const,
  features: () => [...pendoQueryKeys.all, 'features'] as const,
  feature: (id: string) => [...pendoQueryKeys.features(), id] as const,
  pages: () => [...pendoQueryKeys.all, 'pages'] as const,
  page: (id: string) => [...pendoQueryKeys.pages(), id] as const,
  reports: () => [...pendoQueryKeys.all, 'reports'] as const,
  report: (id: string) => [...pendoQueryKeys.reports(), id] as const,
  aggregation: () => [...pendoQueryKeys.all, 'aggregation'] as const,
  health: () => [...pendoQueryKeys.all, 'health'] as const,
  metrics: () => [...pendoQueryKeys.all, 'metrics'] as const,
} as const;

// Default query options with optimized settings
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  retry: (failureCount: number, error: Error) => {
    // Don't retry on non-retryable errors
    if (error instanceof PendoApiError && !error.retryable) {
      return false;
    }
    // Allow React Query to retry up to 2 times for network issues
    return failureCount < 2;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} satisfies Partial<UseQueryOptions>;

/**
 * Hook for fetching all guides with enhanced error handling
 */
export const useGuides = (params?: Record<string, unknown>, options?: Partial<UseQueryOptions<Guide[], PendoApiError>>) => {
  return useQuery({
    queryKey: [...pendoQueryKeys.guides(), params],
    queryFn: () => enhancedPendoAPI.getGuides(params),
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for fetching a specific guide by ID
 */
export const useGuide = (id: string, includeAnalytics: boolean = false, options?: Partial<UseQueryOptions<Guide | null, PendoApiError>>) => {
  return useQuery({
    queryKey: [...pendoQueryKeys.guide(id), { includeAnalytics }],
    queryFn: () => enhancedPendoAPI.getGuideById(id, includeAnalytics),
    enabled: !!id, // Only run query if ID is provided
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for fetching all features
 */
export const useFeatures = (params?: Record<string, unknown>, options?: Partial<UseQueryOptions<Feature[], PendoApiError>>) => {
  return useQuery({
    queryKey: [...pendoQueryKeys.features(), params],
    queryFn: () => enhancedPendoAPI.getFeatures(params),
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for fetching a specific feature by ID
 */
export const useFeature = (id: string, options?: Partial<UseQueryOptions<Feature | null, PendoApiError>>) => {
  return useQuery({
    queryKey: pendoQueryKeys.feature(id),
    queryFn: async () => {
      const features = await enhancedPendoAPI.getFeatures();
      return features.find(feature => feature.id === id) || null;
    },
    enabled: !!id,
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for fetching all pages
 */
export const usePages = (params?: Record<string, unknown>, options?: Partial<UseQueryOptions<Page[], PendoApiError>>) => {
  return useQuery({
    queryKey: [...pendoQueryKeys.pages(), params],
    queryFn: () => enhancedPendoAPI.getPages(params),
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for fetching a specific page by ID
 */
export const usePage = (id: string, options?: Partial<UseQueryOptions<Page | null, PendoApiError>>) => {
  return useQuery({
    queryKey: pendoQueryKeys.page(id),
    queryFn: async () => {
      const pages = await enhancedPendoAPI.getPages();
      return pages.find(page => page.id === id) || null;
    },
    enabled: !!id,
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for fetching all reports
 */
export const useReports = (params?: Record<string, unknown>, options?: Partial<UseQueryOptions<Report[], PendoApiError>>) => {
  return useQuery({
    queryKey: [...pendoQueryKeys.reports(), params],
    queryFn: () => enhancedPendoAPI.getReports(params),
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for fetching a specific report by ID
 */
export const useReport = (id: string, options?: Partial<UseQueryOptions<Report | null, PendoApiError>>) => {
  return useQuery({
    queryKey: pendoQueryKeys.report(id),
    queryFn: async () => {
      const reports = await enhancedPendoAPI.getReports();
      return reports.find(report => report.id === id) || null;
    },
    enabled: !!id,
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for fetching aggregation data
 */
export const useAggregationData = (params: Record<string, unknown>, options?: Partial<UseQueryOptions<unknown, PendoApiError>>) => {
  return useQuery({
    queryKey: [...pendoQueryKeys.aggregation(), params],
    queryFn: () => enhancedPendoAPI.getAggregationData(params),
    staleTime: 2 * 60 * 1000, // 2 minutes for aggregation data
    ...defaultQueryOptions,
    ...options,
  });
};

/**
 * Hook for API health status
 */
export const usePendoHealth = (refetchInterval: number = 30000) => {
  return useQuery({
    queryKey: pendoQueryKeys.health(),
    queryFn: () => enhancedPendoAPI.healthCheck(),
    staleTime: 10 * 1000, // 10 seconds for health data
    refetchInterval,
    ...defaultQueryOptions,
  });
};

/**
 * Hook for API metrics
 */
export const usePendoMetrics = (refetchInterval: number = 60000) => {
  return useQuery({
    queryKey: pendoQueryKeys.metrics(),
    queryFn: () => enhancedPendoAPI.getMetrics(),
    staleTime: 30 * 1000, // 30 seconds for metrics
    refetchInterval,
    ...defaultQueryOptions,
  });
};

/**
 * Hook for cache management
 */
export const usePendoCache = () => {
  const queryClient = useQueryClient();

  const clearCache = useCallback(() => {
    enhancedPendoAPI.clearCache();
    // Also clear React Query cache for Pendo queries
    queryClient.invalidateQueries({ queryKey: pendoQueryKeys.all });
  }, [queryClient]);

  const getCacheStats = useCallback(() => {
    return enhancedPendoAPI.getCacheStats();
  }, []);

  const invalidateGuides = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: pendoQueryKeys.guides() });
  }, [queryClient]);

  const invalidateFeatures = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: pendoQueryKeys.features() });
  }, [queryClient]);

  const invalidatePages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: pendoQueryKeys.pages() });
  }, [queryClient]);

  const invalidateReports = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: pendoQueryKeys.reports() });
  }, [queryClient]);

  return useMemo(() => ({
    clearCache,
    getCacheStats,
    invalidateGuides,
    invalidateFeatures,
    invalidatePages,
    invalidateReports,
  }), [clearCache, getCacheStats, invalidateGuides, invalidateFeatures, invalidatePages, invalidateReports]);
};

/**
 * Hook for batch operations
 */
export const usePendoBatchOperations = () => {
  const queryClient = useQueryClient();

  const prefetchGuides = useCallback((params?: Record<string, unknown>) => {
    queryClient.prefetchQuery({
      queryKey: [...pendoQueryKeys.guides(), params],
      queryFn: () => enhancedPendoAPI.getGuides(params),
      ...defaultQueryOptions,
    });
  }, [queryClient]);

  const prefetchFeatures = useCallback((params?: Record<string, unknown>) => {
    queryClient.prefetchQuery({
      queryKey: [...pendoQueryKeys.features(), params],
      queryFn: () => enhancedPendoAPI.getFeatures(params),
      ...defaultQueryOptions,
    });
  }, [queryClient]);

  const prefetchPages = useCallback((params?: Record<string, unknown>) => {
    queryClient.prefetchQuery({
      queryKey: [...pendoQueryKeys.pages(), params],
      queryFn: () => enhancedPendoAPI.getPages(params),
      ...defaultQueryOptions,
    });
  }, [queryClient]);

  return useMemo(() => ({
    prefetchGuides,
    prefetchFeatures,
    prefetchPages,
  }), [prefetchGuides, prefetchFeatures, prefetchPages]);
};

/**
 * Hook for error handling utilities
 */
export const usePendoErrorHandler = () => {
  const handleError = useCallback((error: Error): { type: string; message: string; retryable: boolean } => {
    if (error instanceof CircuitBreakerError) {
      return {
        type: 'circuit-breaker',
        message: 'Pendo API is temporarily unavailable. Please try again later.',
        retryable: false,
      };
    }

    if (error instanceof RateLimitError) {
      const retryAfter = error.retryAfter ? ` Retry after ${Math.ceil(error.retryAfter / 1000)} seconds.` : '';
      return {
        type: 'rate-limit',
        message: `Rate limit exceeded.${retryAfter}`,
        retryable: true,
      };
    }

    if (error instanceof PendoApiError) {
      return {
        type: 'api-error',
        message: `API Error: ${error.message}`,
        retryable: error.retryable,
      };
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred.',
      retryable: false,
    };
  }, []);

  const isRetryableError = useCallback((error: Error): boolean => {
    return handleError(error).retryable;
  }, [handleError]);

  return useMemo(() => ({
    handleError,
    isRetryableError,
  }), [handleError, isRetryableError]);
};

/**
 * Hook for optimistic updates
 */
export const usePendoOptimisticUpdates = () => {
  const queryClient = useQueryClient();

  const updateGuideOptimistically = useCallback((guideId: string, updates: Partial<Guide>) => {
    // Update cache immediately
    queryClient.setQueryData(
      [...pendoQueryKeys.guide(guideId), {}],
      (oldGuide: Guide | undefined) => oldGuide ? { ...oldGuide, ...updates } : oldGuide
    );

    // Update guides list
    queryClient.setQueryData(
      pendoQueryKeys.guides(),
      (oldGuides: Guide[] | undefined) =>
        oldGuides?.map(guide =>
          guide.id === guideId ? { ...guide, ...updates } : guide
        )
    );

    return async () => {
      try {
        // In a real implementation, this would call the API
        // await enhancedPendoAPI.updateGuide(guideId, updates);
        console.log('Optimistic update for guide:', guideId, updates);
      } catch (error) {
        // Rollback on error
        queryClient.invalidateQueries({ queryKey: pendoQueryKeys.guide(guideId) });
        queryClient.invalidateQueries({ queryKey: pendoQueryKeys.guides() });
        throw error;
      }
    };
  }, [queryClient]);

  return useMemo(() => ({
    updateGuideOptimistically,
  }), [updateGuideOptimistically]);
};

/**
 * Hook for real-time health monitoring
 */
export const usePendoHealthMonitor = (interval: number = 30000) => {
  const healthQuery = usePendoHealth(interval);
  const metricsQuery = usePendoMetrics(interval * 2);

  const healthStatus = useMemo(() => {
    if (!healthQuery.data) return { status: 'unknown' as const, issues: [] };

    const health = healthQuery.data;
    const issues: string[] = [];

    if (!health.healthy) {
      issues.push('API health check failed');
    }

    const successRate = typeof health.details.successRate === 'number' ? health.details.successRate : 0;
    const avgResponseTime = typeof health.details.averageResponseTime === 'number' ? health.details.averageResponseTime : 0;
    const availableTokens = typeof health.details.availableTokens === 'number' ? health.details.availableTokens : 0;

    if (successRate < 0.95) {
      issues.push(`Low success rate: ${(successRate * 100).toFixed(1)}%`);
    }

    if (avgResponseTime > 5000) {
      issues.push(`High response time: ${avgResponseTime}ms`);
    }

    if (health.details.circuitBreakerState !== 'CLOSED') {
      issues.push(`Circuit breaker ${health.details.circuitBreakerState}`);
    }

    if (availableTokens < 5) {
      issues.push(`Low available tokens: ${availableTokens}`);
    }

    const status = issues.length === 0 ? 'healthy' :
                   issues.length <= 2 ? 'degraded' : 'unhealthy';

    return { status, issues };
  }, [healthQuery.data]);

  return {
    healthQuery,
    metricsQuery,
    healthStatus,
    isHealthy: healthStatus.status === 'healthy',
    isDegraded: healthStatus.status === 'degraded',
    isUnhealthy: healthStatus.status === 'unhealthy',
  };
};

/**
 * Export all hooks for easy importing
 */
export {
  enhancedPendoAPI,
  PendoApiError,
  RateLimitError,
  CircuitBreakerError,
};

// Export types for external use
export type {
  Guide,
  Feature,
  Page,
  Report,
};