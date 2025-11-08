import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface HeatmapData {
  day_of_week: number;
  hour: number;
  count: number;
}

export function useUsageHeatmap(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['usage-heatmap', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_usage_heatmap', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      if (error) {
        console.error('Heatmap error:', error);
        throw error;
      }

      // Transform to 7x24 matrix
      const heatmap: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

      (data as HeatmapData[])?.forEach((row) => {
        if (row.day_of_week >= 0 && row.day_of_week < 7 && row.hour >= 0 && row.hour < 24) {
          heatmap[row.day_of_week][row.hour] = Number(row.count);
        }
      });

      return heatmap;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!startDate && !!endDate
  });
}
