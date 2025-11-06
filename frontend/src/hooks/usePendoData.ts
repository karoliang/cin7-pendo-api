import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
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
  const guidesQuery = useGuidesWithAnalytics(7);
  const featuresQuery = useFeaturesWithAnalytics(7);
  const pagesQuery = usePagesWithAnalytics(7);
  const reportsQuery = useReports({ limit: 1000 });

  // Debug logging to identify stuck queries
  console.log('📊 Dashboard queries status:', {
    guides: {
      isLoading: guidesQuery.isLoading,
      isFetching: guidesQuery.isFetching,
      hasData: !!guidesQuery.data,
      dataLength: guidesQuery.data?.length,
      hasError: !!guidesQuery.error,
      error: guidesQuery.error
    },
    features: {
      isLoading: featuresQuery.isLoading,
      isFetching: featuresQuery.isFetching,
      hasData: !!featuresQuery.data,
      dataLength: featuresQuery.data?.length,
      hasError: !!featuresQuery.error,
      error: featuresQuery.error
    },
    pages: {
      isLoading: pagesQuery.isLoading,
      isFetching: pagesQuery.isFetching,
      hasData: !!pagesQuery.data,
      dataLength: pagesQuery.data?.length,
      hasError: !!pagesQuery.error,
      error: pagesQuery.error
    },
    reports: {
      isLoading: reportsQuery.isLoading,
      isFetching: reportsQuery.isFetching,
      hasData: !!reportsQuery.data,
      dataLength: reportsQuery.data?.length,
      hasError: !!reportsQuery.error,
      error: reportsQuery.error
    }
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
export const useGuidePerformance = (daysBack: number = 7) => {
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
export const useGuidesWithAnalytics = (daysBack: number = 7) => {
  const query = useQuery({
    queryKey: ['guidesWithAnalytics', daysBack],
    queryFn: () => pendoAPI.getAllGuidesWithAnalytics(daysBack),
    staleTime: 10 * 60 * 1000, // 10 minutes (longer because aggregation is slower)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    console.log('📊 Guides query state:', {
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      error: query.error,
      dataLength: query.data?.length,
      sampleData: query.data?.slice(0, 2)
    });
  }, [query.data, query.isLoading, query.isFetching, query.isError, query.error]);

  return query;
};

// Hook for fetching features with enriched analytics
export const useFeaturesWithAnalytics = (daysBack: number = 7) => {
  const query = useQuery({
    queryKey: ['featuresWithAnalytics', daysBack],
    queryFn: () => pendoAPI.getAllFeaturesWithAnalytics(daysBack),
    staleTime: 10 * 60 * 1000, // 10 minutes (longer because aggregation is slower)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    console.log('📊 Features query state:', {
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      error: query.error,
      dataLength: query.data?.length,
      sampleData: query.data?.slice(0, 2)
    });
  }, [query.data, query.isLoading, query.isFetching, query.isError, query.error]);

  return query;
};

// Hook for fetching pages with enriched analytics
export const usePagesWithAnalytics = (daysBack: number = 7) => {
  const query = useQuery({
    queryKey: ['pagesWithAnalytics', daysBack],
    queryFn: () => pendoAPI.getAllPagesWithAnalytics(daysBack),
    staleTime: 10 * 60 * 1000, // 10 minutes (longer because aggregation is slower)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    console.log('📊 Pages query state:', {
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      error: query.error,
      dataLength: query.data?.length,
      sampleData: query.data?.slice(0, 2)
    });
  }, [query.data, query.isLoading, query.isFetching, query.isError, query.error]);

  return query;
};