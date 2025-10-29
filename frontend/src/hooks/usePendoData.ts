import { useQuery } from '@tanstack/react-query';
import { pendoAPI } from '@/lib/pendo-api';
import { Guide, Feature, Page, Report } from '@/types/pendo';

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
    cacheTime: 10 * 60 * 1000, // 10 minutes
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
    cacheTime: 10 * 60 * 1000,
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
    cacheTime: 10 * 60 * 1000,
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
    cacheTime: 10 * 60 * 1000,
  });
};

// Hook for fetching dashboard overview data
export const useDashboardOverview = () => {
  const guidesQuery = useGuides({ limit: 1000 });
  const featuresQuery = useFeatures({ limit: 1000 });
  const pagesQuery = usePages({ limit: 1000 });
  const reportsQuery = useReports({ limit: 1000 });

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