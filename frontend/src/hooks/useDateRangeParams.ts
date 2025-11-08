import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DateRangeValue, DateRangePreset } from '@/components/filters/DateRangeSelector';
import { isValid, parseISO } from 'date-fns';

/**
 * Hook to sync date range with URL parameters for sharing/bookmarking
 */
export const useDateRangeParams = (
  dateRange: DateRangeValue,
  updateDateRange: (value: DateRangeValue) => void
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse date range from URL on mount
  useEffect(() => {
    const preset = searchParams.get('preset') as DateRangePreset | null;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const comparisonParam = searchParams.get('comparison');

    if (preset || (startParam && endParam)) {
      const start = startParam ? parseISO(startParam) : undefined;
      const end = endParam ? parseISO(endParam) : undefined;
      const comparison = comparisonParam === 'true';

      // Validate dates
      if (start && end && isValid(start) && isValid(end)) {
        updateDateRange({
          start,
          end,
          preset: preset || 'custom',
          comparison,
        });
      } else if (preset && preset !== 'custom') {
        // If preset is provided but dates are invalid, use the preset
        // The DateRangeSelector will calculate the dates
        updateDateRange({
          ...dateRange,
          preset,
          comparison,
        });
      }
    }
  }, []); // Only run on mount

  // Update URL when date range changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Set preset
    if (dateRange.preset) {
      params.set('preset', dateRange.preset);
    }

    // Set dates
    if (dateRange.start) {
      params.set('start', dateRange.start.toISOString().split('T')[0]);
    }
    if (dateRange.end) {
      params.set('end', dateRange.end.toISOString().split('T')[0]);
    }

    // Set comparison
    params.set('comparison', dateRange.comparison.toString());

    setSearchParams(params, { replace: true });
  }, [dateRange, setSearchParams]);

  // Helper to get shareable URL
  const getShareableUrl = () => {
    return window.location.href;
  };

  return { getShareableUrl };
};
