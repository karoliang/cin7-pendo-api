import { useQuery } from '@tanstack/react-query';

interface Report {
  id: string;
  name: string;
  description?: string;
  type: string;
  createdAt?: string;
  lastUpdatedAt?: string;
  lastSuccessRunAt?: string;
  createdByUser?: {
    username?: string;
  };
}

interface ReportResponse {
  reports: Report[];
  totalCount: number;
  byType: Record<string, number>;
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async (): Promise<ReportResponse> => {
      const apiKey = import.meta.env.VITE_PENDO_API_KEY;

      if (!apiKey) {
        throw new Error('Pendo API key not configured');
      }

      const response = await fetch('https://app.pendo.io/api/v1/report', {
        method: 'GET',
        headers: {
          'X-Pendo-Integration-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }

      const data = await response.json();
      const reports = Array.isArray(data) ? data : [];

      // Calculate type distribution
      const byType: Record<string, number> = {};
      reports.forEach(report => {
        const type = report.type || 'Unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      return {
        reports,
        totalCount: reports.length,
        byType,
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour - reports don't change frequently
    retry: 2,
  });
}
