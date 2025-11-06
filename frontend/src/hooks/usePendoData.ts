import { useQuery } from '@tanstack/react-query';
import { pendoAPI } from '@/lib/pendo-api';

// Hook for fetching guides
export const useGuides = (params?: {
  limit?: number;
  offset?: number;
  state?: string;
}) => {
  return useQuery({
    queryKey: ['guides', params],
    queryFn: () => pendoAPI.getGuides(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching features
export const useFeatures = (params?: {
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['features', params],
    queryFn: () => pendoAPI.getFeatures(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching pages
export const usePages = (params?: {
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['pages', params],
    queryFn: () => pendoAPI.getPages(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching reports
export const useReports = (params?: {
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => pendoAPI.getReports(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching dashboard overview data with enriched analytics
export const useDashboardOverview = () => {
  const guidesQuery = useGuidesWithAnalytics(90);
  const featuresQuery = useFeaturesWithAnalytics(90);
  const pagesQuery = usePagesWithAnalytics(90);
  const reportsQuery = useReports({ limit: 1000 });

  // Debug logging to identify stuck queries
  console.log('📊 Dashboard queries status:', {
    guides: { isLoading: guidesQuery.isLoading, hasData: !!guidesQuery.data, hasError: !!guidesQuery.error },
    features: { isLoading: featuresQuery.isLoading, hasData: !!featuresQuery.data, hasError: !!featuresQuery.error },
    pages: { isLoading: pagesQuery.isLoading, hasData: !!pagesQuery.data, hasError: !!pagesQuery.error },
    reports: { isLoading: reportsQuery.isLoading, hasData: !!reportsQuery.data, hasError: !!reportsQuery.error }
  });

  return {
    guides: guidesQuery.data || [],
    features: featuresQuery.data || [],
    pages: pagesQuery.data || [],
    reports: reportsQuery.data || [],
    isLoading: guidesQuery.isLoading || featuresQuery.isLoading ||
              pagesQuery.isLoading || reportsQuery.isLoading,
    error: guidesQuery.error || featuresQuery.error ||
            pagesQuery.error || reportsQuery.error,
    refetch: () => {
      guidesQuery.refetch();
      featuresQuery.refetch();
      pagesQuery.refetch();
      reportsQuery.refetch();
    },
  };
};

// Hook for fetching guide performance time series data
export const useGuidePerformance = (daysBack: number = 30) => {
  return useQuery({
    queryKey: ['guidePerformance', daysBack],
    queryFn: () => pendoAPI.getAllGuidesPerformanceTimeSeries(daysBack),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching guides with enriched analytics
export const useGuidesWithAnalytics = (daysBack: number = 90) => {
  return useQuery({
    queryKey: ['guidesWithAnalytics', daysBack],
    queryFn: () => pendoAPI.getAllGuidesWithAnalytics(daysBack),
    staleTime: 10 * 60 * 1000, // 10 minutes (longer because aggregation is slower)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching features with enriched analytics
export const useFeaturesWithAnalytics = (daysBack: number = 90) => {
  return useQuery({
    queryKey: ['featuresWithAnalytics', daysBack],
    queryFn: () => pendoAPI.getAllFeaturesWithAnalytics(daysBack),
    staleTime: 10 * 60 * 1000, // 10 minutes (longer because aggregation is slower)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching pages with enriched analytics
export const usePagesWithAnalytics = (daysBack: number = 90) => {
  return useQuery({
    queryKey: ['pagesWithAnalytics', daysBack],
    queryFn: () => pendoAPI.getAllPagesWithAnalytics(daysBack),
    staleTime: 10 * 60 * 1000, // 10 minutes (longer because aggregation is slower)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};