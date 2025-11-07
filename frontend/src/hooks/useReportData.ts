import { useQuery } from '@tanstack/react-query';
import { pendoAPI } from '@/lib/pendo-api';
import type {
  ComprehensiveFeatureData,
  ComprehensiveReportData
} from '@/types/enhanced-pendo';

// Hook for fetching comprehensive guide data with REAL Pendo API analytics
export const useGuideReport = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['guide-report', id],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      try {
        console.log(`🚀 useGuideReport: Fetching analytics for guide ${id}`);

        // Calculate date range for analytics (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const period = {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };

        console.log(`📅 Analytics period: ${period.start} to ${period.end}`);

        // Fetch REAL comprehensive analytics data from Pendo API with enhanced error handling
        const analyticsData = await pendoAPI.getGuideAnalytics(id, period);

        if (!analyticsData) {
          throw new Error('Guide analytics not found');
        }

        console.log(`✅ useGuideReport: Successfully fetched analytics for ${analyticsData.name}`);
        console.log(`📊 Summary: ${analyticsData.viewedCount} views, ${analyticsData.completionRate.toFixed(1)}% completion`);

        return analyticsData;
      } catch (error) {
        console.error('❌ useGuideReport: Error fetching guide report:', error);

        // Enhanced error handling with user-friendly messages
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            console.error(`🚨 Guide ${id} not found. Available guides can be checked in browser console.`);
            throw new Error(`Guide "${id}" not found in Pendo. Please verify the guide ID or select a different guide.`);
          }

          if (error.message.includes('not accessible')) {
            console.error(`🚨 Pendo API access issues detected.`);
            throw new Error(`Unable to access Pendo analytics. Please check API permissions or try again later.`);
          }

          if (error.message.includes('not found')) {
            throw new Error(`Guide data not available. The guide may not exist or may not be accessible.`);
          }
        }

        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 404s or permission errors
      if (error instanceof Error && (
        error.message.includes('404') ||
        error.message.includes('not accessible') ||
        error.message.includes('permission')
      )) {
        return false; // Don't retry these errors
      }
      return failureCount < 2; // Retry other errors max 2 times
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary API calls
    refetchOnReconnect: true, // Do refetch on reconnect
  });
};

// Hook for fetching comprehensive feature data with REAL Pendo API analytics
export const useFeatureReport = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['feature-report', id],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      try {
        console.log(`🚀 useFeatureReport: Fetching analytics for feature ${id}`);

        // Calculate date range for analytics (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const period = {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };

        console.log(`📅 Analytics period: ${period.start} to ${period.end}`);

        // Fetch REAL comprehensive analytics data from Pendo API
        const analyticsData = await pendoAPI.getFeatureAnalytics(id, period);

        if (!analyticsData) {
          throw new Error('Feature analytics not found');
        }

        console.log(`✅ useFeatureReport: Successfully fetched analytics for ${analyticsData.name}`);
        console.log(`📊 Summary: ${analyticsData.usageCount} uses, ${analyticsData.visitorCount} visitors`);

        return analyticsData;
      } catch (error) {
        console.error('❌ useFeatureReport: Error fetching feature report:', error);

        // Enhanced error handling with user-friendly messages
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            console.error(`🚨 Feature ${id} not found. Available features can be checked in browser console.`);
            throw new Error(`Feature "${id}" not found in Pendo. Please verify the feature ID or select a different feature.`);
          }

          if (error.message.includes('not accessible')) {
            console.error(`🚨 Pendo API access issues detected.`);
            throw new Error(`Unable to access Pendo analytics. Please check API permissions or try again later.`);
          }

          if (error.message.includes('not found')) {
            throw new Error(`Feature data not available. The feature may not exist or may not be accessible.`);
          }
        }

        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 404s or permission errors
      if (error instanceof Error && (
        error.message.includes('404') ||
        error.message.includes('not accessible') ||
        error.message.includes('permission')
      )) {
        return false; // Don't retry these errors
      }
      return failureCount < 2; // Retry other errors max 2 times
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary API calls
    refetchOnReconnect: true, // Do refetch on reconnect
  });
};
// Hook for fetching comprehensive page data with all analytics
export const usePageReport = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['page-report', id],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      try {
        // Calculate analytics period (last 30 days by default)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const period = {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        };

        console.log(`📊 Fetching real page analytics for ${id} from Pendo Aggregation API`);

        // Fetch real analytics from Pendo Aggregation API
        const analyticsData = await pendoAPI.getPageAnalytics(id, period);

        console.log(`✅ Page analytics loaded:`, {
          views: analyticsData.viewedCount,
          visitors: analyticsData.visitorCount,
          avgTime: analyticsData.avgTimeOnPage,
        });

        // Return the real analytics data from Pendo API
        // All fields are now populated by getPageAnalytics()
        return analyticsData;
      } catch (error) {
        console.error('Error fetching page report:', error);

        // Enhanced error handling with user-friendly messages
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            throw new Error(`Page "${id}" not found. Please verify the page ID or select a different page.`);
          }
        }

        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 404s
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

// Hook for fetching comprehensive report data with all analytics
export const useReportReport = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['report-report', id],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      try {
        // Calculate period (last 30 days) for API consistency
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const period = {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        };

        // Call the new getReportAnalytics method that provides AI-powered insights
        const analyticsData = await pendoAPI.getReportAnalytics(id, period);

        console.log(`✅ useReportReport: Successfully fetched analytics for ${analyticsData.name}`);
        console.log(`📊 Summary: ${analyticsData.totalViews} views, ${analyticsData.insights.length} insights, ${analyticsData.recommendations.length} recommendations`);

        return analyticsData;
      } catch (error) {
        console.error('Error fetching report analytics:', error);

        // Enhanced error handling with user-friendly messages
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            throw new Error(`Report "${id}" not found. Please verify the report ID or select a different report.`);
          }
        }

        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 404s
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
