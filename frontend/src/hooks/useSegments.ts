import { useQuery } from '@tanstack/react-query';

interface Segment {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  lastUpdatedAt?: string;
  createdByUser?: {
    username?: string;
  };
}

interface SegmentResponse {
  segments: Segment[];
  totalCount: number;
}

export function useSegments() {
  return useQuery({
    queryKey: ['segments'],
    queryFn: async (): Promise<SegmentResponse> => {
      const apiKey = import.meta.env.VITE_PENDO_API_KEY;

      if (!apiKey) {
        throw new Error('Pendo API key not configured');
      }

      const response = await fetch('https://app.pendo.io/api/v1/segment', {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch segments: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        segments: Array.isArray(data) ? data : [],
        totalCount: Array.isArray(data) ? data.length : 0,
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour - segments don't change frequently
    retry: 2,
  });
}
