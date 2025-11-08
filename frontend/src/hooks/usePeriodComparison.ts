import { useMemo } from 'react';
import { subDays, differenceInDays } from 'date-fns';
import type { DateRangeValue } from '@/components/filters/DateRangeSelector';
import { useSupabaseDashboard } from '@/hooks/useSupabaseData';

export interface PeriodComparisonMetrics {
  current: {
    totalGuides: number;
    totalFeatures: number;
    totalPages: number;
    totalReports: number;
    avgCompletionRate: number;
    totalActivity: number;
  };
  previous: {
    totalGuides: number;
    totalFeatures: number;
    totalPages: number;
    totalReports: number;
    avgCompletionRate: number;
    totalActivity: number;
  };
  deltas: {
    guides: number;
    features: number;
    pages: number;
    reports: number;
    completionRate: number;
    activity: number;
  };
}

/**
 * Hook to fetch and calculate period-over-period comparison metrics
 */
export const usePeriodComparison = (dateRange: DateRangeValue) => {
  // Calculate previous period dates
  const { previousStart, previousEnd } = useMemo(() => {
    const periodLength = differenceInDays(dateRange.end, dateRange.start);
    const previousEnd = subDays(dateRange.start, 1);
    const previousStart = subDays(previousEnd, periodLength);

    return { previousStart, previousEnd };
  }, [dateRange.start, dateRange.end]);

  // Fetch current period data
  const currentPeriod = useSupabaseDashboard(dateRange.start, dateRange.end);

  // Fetch previous period data only if comparison is enabled
  const previousPeriod = useSupabaseDashboard(
    dateRange.comparison ? previousStart : undefined,
    dateRange.comparison ? previousEnd : undefined
  );

  // Calculate metrics
  const metrics = useMemo((): PeriodComparisonMetrics | null => {
    if (!currentPeriod.guides || !dateRange.comparison) {
      return null;
    }

    // Current period metrics
    const currentGuides = currentPeriod.guides || [];
    const currentFeatures = currentPeriod.features || [];
    const currentPages = currentPeriod.pages || [];
    const currentReports = currentPeriod.reports || [];

    const currentAvgCompletionRate = currentGuides.length > 0
      ? currentGuides.reduce((sum: number, g: any) => {
          const rate = g.completedCount && g.viewedCount ? (g.completedCount / g.viewedCount) * 100 : 0;
          return sum + rate;
        }, 0) / currentGuides.length
      : 0;

    const currentTotalActivity = currentGuides.reduce((sum: number, g: any) => {
      return sum + (g.viewedCount || 0) + (g.completedCount || 0);
    }, 0);

    // Previous period metrics
    const previousGuides = previousPeriod.guides || [];
    const previousFeatures = previousPeriod.features || [];
    const previousPages = previousPeriod.pages || [];
    const previousReports = previousPeriod.reports || [];

    const previousAvgCompletionRate = previousGuides.length > 0
      ? previousGuides.reduce((sum: number, g: any) => {
          const rate = g.completedCount && g.viewedCount ? (g.completedCount / g.viewedCount) * 100 : 0;
          return sum + rate;
        }, 0) / previousGuides.length
      : 0;

    const previousTotalActivity = previousGuides.reduce((sum: number, g: any) => {
      return sum + (g.viewedCount || 0) + (g.completedCount || 0);
    }, 0);

    // Calculate deltas
    const calculateDelta = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      current: {
        totalGuides: currentGuides.length,
        totalFeatures: currentFeatures.length,
        totalPages: currentPages.length,
        totalReports: currentReports.length,
        avgCompletionRate: currentAvgCompletionRate,
        totalActivity: currentTotalActivity,
      },
      previous: {
        totalGuides: previousGuides.length,
        totalFeatures: previousFeatures.length,
        totalPages: previousPages.length,
        totalReports: previousReports.length,
        avgCompletionRate: previousAvgCompletionRate,
        totalActivity: previousTotalActivity,
      },
      deltas: {
        guides: calculateDelta(currentGuides.length, previousGuides.length),
        features: calculateDelta(currentFeatures.length, previousFeatures.length),
        pages: calculateDelta(currentPages.length, previousPages.length),
        reports: calculateDelta(currentReports.length, previousReports.length),
        completionRate: calculateDelta(currentAvgCompletionRate, previousAvgCompletionRate),
        activity: calculateDelta(currentTotalActivity, previousTotalActivity),
      },
    };
  }, [
    currentPeriod.guides,
    currentPeriod.features,
    currentPeriod.pages,
    currentPeriod.reports,
    previousPeriod.guides,
    previousPeriod.features,
    previousPeriod.pages,
    previousPeriod.reports,
    dateRange.comparison,
  ]);

  return {
    metrics,
    isLoading: currentPeriod.isLoading || (dateRange.comparison && previousPeriod.isLoading),
    error: currentPeriod.error || previousPeriod.error,
  };
};
