import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

// Type aliases for cleaner code
type GuideRow = Database['public']['Tables']['pendo_guides']['Row'];
type FeatureRow = Database['public']['Tables']['pendo_features']['Row'];
type PageRow = Database['public']['Tables']['pendo_pages']['Row'];

// Hook for fetching guides from Supabase
export const useSupabaseGuides = (daysBack: number = 7) => {
  return useQuery({
    queryKey: ['supabase-guides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pendo_guides')
        .select('*')
        .order('views', { ascending: false })
        .limit(10000);

      if (error) {
        console.error('Error fetching guides from Supabase:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data.length} guides from Supabase`);
      return data as GuideRow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching features from Supabase
export const useSupabaseFeatures = (daysBack: number = 7) => {
  return useQuery({
    queryKey: ['supabase-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pendo_features')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(10000);

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
export const useSupabasePages = (daysBack: number = 7) => {
  return useQuery({
    queryKey: ['supabase-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pendo_pages')
        .select('*')
        .order('views', { ascending: false })
        .limit(10000);

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

// Hook for dashboard overview using Supabase
export const useSupabaseDashboard = (daysBack: number = 7) => {
  const guidesQuery = useSupabaseGuides(daysBack);
  const featuresQuery = useSupabaseFeatures(daysBack);
  const pagesQuery = useSupabasePages(daysBack);

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

  return {
    guides: transformedGuides as any, // Type assertion for Pendo compatibility
    features: transformedFeatures as any, // Type assertion for Pendo compatibility
    pages: transformedPages as any, // Type assertion for Pendo compatibility
    reports: [] as any, // Reports not synced yet
    isLoading: guidesQuery.isLoading || featuresQuery.isLoading || pagesQuery.isLoading,
    error: guidesQuery.error || featuresQuery.error || pagesQuery.error,
    refetch: () => {
      guidesQuery.refetch();
      featuresQuery.refetch();
      pagesQuery.refetch();
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
