import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

// Type aliases for cleaner code
type GuideRow = Database['public']['Tables']['pendo_guides']['Row'];
type FeatureRow = Database['public']['Tables']['pendo_features']['Row'];
type PageRow = Database['public']['Tables']['pendo_pages']['Row'];
type ReportRow = Database['public']['Tables']['pendo_reports']['Row'];
type EventRow = Database['public']['Tables']['pendo_events']['Row'];

// Hook for fetching guides from Supabase
export const useSupabaseGuides = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['supabase-guides', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('pendo_guides')
        .select('*');

      // Apply date filtering if provided
      if (startDate) {
        query = query.gte('last_updated_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('last_updated_at', endDate.toISOString());
      }

      query = query.order('views', { ascending: false }).limit(10000);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching guides from Supabase:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} guides from Supabase (${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()})`);
      return data as GuideRow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching features from Supabase
export const useSupabaseFeatures = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['supabase-features', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('pendo_features')
        .select('*');

      // Apply date filtering if provided
      if (startDate) {
        query = query.gte('last_updated_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('last_updated_at', endDate.toISOString());
      }

      query = query.order('usage_count', { ascending: false }).limit(10000);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching features from Supabase:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} features from Supabase`);
      return data as FeatureRow[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching pages from Supabase
export const useSupabasePages = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['supabase-pages', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('pendo_pages')
        .select('*');

      // Apply date filtering if provided
      if (startDate) {
        query = query.gte('last_updated_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('last_updated_at', endDate.toISOString());
      }

      query = query.order('views', { ascending: false }).limit(10000);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pages from Supabase:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} pages from Supabase`);
      return data as PageRow[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching reports from Supabase
export const useSupabaseReports = () => {
  return useQuery({
    queryKey: ['supabase-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pendo_reports')
        .select('*')
        .order('last_success_run_at', { ascending: false })
        .limit(10000);

      if (error) {
        console.error('Error fetching reports from Supabase:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} reports from Supabase`);
      return data as ReportRow[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching events from Supabase
export const useSupabaseEvents = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['supabase-events', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('pendo_events')
        .select('*');

      // Apply date filtering if provided
      if (startDate) {
        query = query.gte('browser_time', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('browser_time', endDate.toISOString());
      }

      query = query.order('browser_time', { ascending: false }).limit(10000);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching events from Supabase:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} events from Supabase`);
      return data as EventRow[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for dashboard overview using Supabase
export const useSupabaseDashboard = (startDate?: Date, endDate?: Date) => {
  const guidesQuery = useSupabaseGuides(startDate, endDate);
  const featuresQuery = useSupabaseFeatures(startDate, endDate);
  const pagesQuery = useSupabasePages(startDate, endDate);
  const reportsQuery = useSupabaseReports();
  const eventsQuery = useSupabaseEvents(startDate, endDate);

  // Transform Supabase data to match Pendo types
  const transformedGuides = (guidesQuery.data || []).map(guide => ({
    ...guide,
    createdAt: guide.created_at,
    updatedAt: guide.last_updated_at,
    lastShownCount: guide.views,
    viewedCount: guide.views,
    completedCount: guide.completions,
  }));

  const transformedFeatures = (featuresQuery.data || []).map(feature => ({
    ...feature,
    createdAt: feature.created_at,
    updatedAt: feature.last_updated_at,
    usageCount: feature.usage_count,
    visitorCount: feature.unique_users, // Map unique_users to visitorCount
    accountCount: 0, // Not available in synced data
    eventType: 'click' as const, // Default value
  }));

  const transformedPages = (pagesQuery.data || []).map(page => ({
    ...page,
    createdAt: page.created_at,
    updatedAt: page.last_updated_at,
    viewedCount: page.views,
    visitorCount: page.unique_visitors,
  }));

  const transformedReports = (reportsQuery.data || []).map(report => ({
    ...report,
    createdAt: report.created_at,
    updatedAt: report.last_updated_at,
    lastSuccessRunAt: report.last_success_run_at,
  }));

  const transformedEvents = (eventsQuery.data || []).map(event => ({
    ...event,
    createdAt: event.created_at,
  }));

  return {
    guides: transformedGuides as any, // Type assertion for Pendo compatibility
    features: transformedFeatures as any, // Type assertion for Pendo compatibility
    pages: transformedPages as any, // Type assertion for Pendo compatibility
    reports: transformedReports as any, // Type assertion for Pendo compatibility
    events: transformedEvents as any, // Type assertion for Pendo compatibility
    isLoading: guidesQuery.isLoading || featuresQuery.isLoading || pagesQuery.isLoading || reportsQuery.isLoading || eventsQuery.isLoading,
    error: guidesQuery.error || featuresQuery.error || pagesQuery.error || reportsQuery.error || eventsQuery.error,
    refetch: () => {
      guidesQuery.refetch();
      featuresQuery.refetch();
      pagesQuery.refetch();
      reportsQuery.refetch();
      eventsQuery.refetch();
    },
  };
};

// Hook for fetching guide analytics with sparkline data
export const useSupabaseGuideAnalytics = (guideId: string, daysBack: number = 7) => {
  return useQuery({
    queryKey: ['supabase-guide-analytics', guideId, daysBack],
    queryFn: async () => {
      // Fetch guide data
      const { data: guide, error: guideError } = await supabase
        .from('pendo_guides')
        .select('*')
        .eq('id', guideId)
        .single();

      if (guideError) {
        console.error('Error fetching guide:', guideError);
        throw guideError;
      }

      // Fetch events for sparkline
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: events, error: eventsError } = await supabase
        .from('pendo_events')
        .select('browser_time')
        .eq('entity_id', guideId)
        .eq('entity_type', 'guide')
        .gte('browser_time', startDate.toISOString())
        .order('browser_time', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        // Return guide data even if events fail
        return { ...guide, sparkline: [] };
      }

      // Calculate sparkline data (daily counts)
      const sparkline: number[] = [];
      const dailyCounts: Record<string, number> = {};

      events?.forEach((event: any) => {
        const date = new Date(event.browser_time).toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      // Fill in missing days with 0
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        sparkline.push(dailyCounts[dateStr] || 0);
      }

      return { ...guide, sparkline };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!guideId,
  });
};

// Hook for fetching sync status
export const useSupabaseSyncStatus = () => {
  return useQuery({
    queryKey: ['supabase-sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching sync status:', error);
        throw error;
      }

      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Hook for triggering manual sync (requires Edge Function endpoint)
export const useTriggerSync = () => {
  return async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-pendo-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to trigger sync');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error triggering sync:', error);
      throw error;
    }
  };
};
