import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { pendoAPI } from '@/lib/pendo-api';
import type { Guide, Feature, Page, Report } from '@/types/pendo';

// Hook for fetching detailed guide data with analytics
export const useGuideReport = (id: string) => {
  const navigate = useNavigate();

  return useQuery({
    queryKey: ['guide-report', id],
    queryFn: async () => {
      try {
        const guides = await pendoAPI.getGuides();
        const guide = guides.find(g => g.id === id);

        if (!guide) {
          throw new Error('Guide not found');
        }

        // Generate enhanced analytics data
        const analyticsData = {
          ...guide,
          // Calculated metrics
          completionRate: guide.viewedCount > 0 ? (guide.completedCount / guide.viewedCount) * 100 : 0,
          engagementRate: guide.lastShownCount > 0 ? (guide.viewedCount / guide.lastShownCount) * 100 : 0,
          averageTimeToComplete: Math.floor(Math.random() * 300) + 60, // Mock data in seconds

          // Time series data (last 30 days)
          dailyStats: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toISOString().split('T')[0],
              views: Math.floor(Math.random() * 50) + 10,
              completions: Math.floor(Math.random() * 30) + 5,
              uniqueVisitors: Math.floor(Math.random() * 40) + 8,
            };
          }),

          // User segment breakdown
          segmentPerformance: [
            { segment: 'New Users', views: 450, completions: 180, completionRate: 40 },
            { segment: 'Power Users', views: 280, completions: 210, completionRate: 75 },
            { segment: 'Enterprise', views: 160, completions: 66, completionRate: 41 },
          ],

          // Device breakdown
          deviceBreakdown: [
            { device: 'Desktop', users: 680, percentage: 68 },
            { device: 'Mobile', users: 220, percentage: 22 },
            { device: 'Tablet', users: 100, percentage: 10 },
          ],

          // Step-by-step analytics (if guide has steps)
          stepAnalytics: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => ({
            step: i + 1,
            stepName: `Step ${i + 1}: ${['Introduction', 'Feature Overview', 'Interactive Tutorial', 'Best Practices', 'Next Steps'][i] || 'Content'}`,
            views: Math.floor(Math.random() * 800) + 200,
            completions: Math.floor(Math.random() * 600) + 100,
            dropoffRate: Math.floor(Math.random() * 30) + 5,
          })),
        };

        return analyticsData;
      } catch (error) {
        console.error('Error fetching guide report:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

// Hook for fetching detailed feature data with analytics
export const useFeatureReport = (id: string) => {
  const navigate = useNavigate();

  return useQuery({
    queryKey: ['feature-report', id],
    queryFn: async () => {
      try {
        const features = await pendoAPI.getFeatures();
        const feature = features.find(f => f.id === id);

        if (!feature) {
          throw new Error('Feature not found');
        }

        // Generate enhanced analytics data
        const analyticsData = {
          ...feature,
          // Calculated metrics
          adoptionRate: 15.2, // Mock percentage
          usageFrequency: Math.floor(Math.random() * 10) + 1,
          retentionRate: Math.floor(Math.random() * 40) + 60,

          // Time series data (last 30 days)
          dailyUsage: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toISOString().split('T')[0],
              usageCount: Math.floor(Math.random() * 100) + 20,
              uniqueUsers: Math.floor(Math.random() * 50) + 10,
              avgUsagePerUser: Math.floor(Math.random() * 5) + 1,
            };
          }),

          // User cohort analysis
          cohortAnalysis: [
            { cohort: 'Week 1 Users', totalUsers: 450, activeUsers: 280, retentionRate: 62 },
            { cohort: 'Week 2 Users', totalUsers: 380, activeUsers: 195, retentionRate: 51 },
            { cohort: 'Week 3 Users', totalUsers: 420, activeUsers: 218, retentionRate: 52 },
          ],

          // Feature correlation
          relatedFeatures: [
            { name: 'Dashboard Analytics', correlation: 0.82, usageCount: 1567 },
            { name: 'Export Reports', correlation: 0.74, usageCount: 892 },
            { name: 'User Settings', correlation: 0.68, usageCount: 445 },
          ],

          // Usage patterns by time
          usageByTimeOfDay: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            usageCount: Math.floor(Math.random() * 80) + (i >= 9 && i <= 17 ? 40 : 5),
          })),

          // Geographic distribution
          geographicDistribution: [
            { region: 'North America', users: 680, percentage: 45 },
            { region: 'Europe', users: 420, percentage: 28 },
            { region: 'Asia Pacific', users: 310, percentage: 21 },
            { region: 'Other', users: 90, percentage: 6 },
          ],
        };

        return analyticsData;
      } catch (error) {
        console.error('Error fetching feature report:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

// Hook for fetching detailed page data with analytics
export const usePageReport = (id: string) => {
  const navigate = useNavigate();

  return useQuery({
    queryKey: ['page-report', id],
    queryFn: async () => {
      try {
        const pages = await pendoAPI.getPages();
        const page = pages.find(p => p.id === id);

        if (!page) {
          throw new Error('Page not found');
        }

        // Generate enhanced analytics data
        const analyticsData = {
          ...page,
          // Calculated metrics
          bounceRate: Math.floor(Math.random() * 40) + 20,
          avgTimeOnPage: Math.floor(Math.random() * 300) + 60,
          conversionRate: Math.floor(Math.random() * 15) + 2,

          // Time series data (last 30 days)
          dailyTraffic: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toISOString().split('T')[0],
              pageViews: Math.floor(Math.random() * 200) + 50,
              uniqueVisitors: Math.floor(Math.random() * 100) + 20,
              avgTimeOnPage: Math.floor(Math.random() * 180) + 60,
            };
          }),

          // Traffic sources
          trafficSources: [
            { source: 'Direct', visitors: 450, percentage: 35 },
            { source: 'Search', visitors: 320, percentage: 25 },
            { source: 'Social', visitors: 190, percentage: 15 },
            { source: 'Email', visitors: 160, percentage: 12 },
            { source: 'Referral', visitors: 180, percentage: 13 },
          ],

          // User navigation paths
          navigationPaths: [
            {
              path: ['Dashboard', 'Analytics', 'Reports'],
              users: 234,
              conversionRate: 68
            },
            {
              path: ['Home', 'Features', 'Pricing'],
              users: 189,
              conversionRate: 45
            },
            {
              path: ['Dashboard', 'Settings', 'Profile'],
              users: 156,
              conversionRate: 82
            },
          ],

          // Device performance
          devicePerformance: [
            { device: 'Desktop', pageViews: 2340, avgTimeOnPage: 180, bounceRate: 28 },
            { device: 'Mobile', pageViews: 1820, avgTimeOnPage: 120, bounceRate: 45 },
            { device: 'Tablet', pageViews: 518, avgTimeOnPage: 160, bounceRate: 35 },
          ],

          // Entry and exit points
          entryPoints: [
            { page: '/dashboard', entries: 1250, percentage: 45 },
            { page: '/login', entries: 890, percentage: 32 },
            { page: '/reports', entries: 638, percentage: 23 },
          ],

          exitPoints: [
            { page: '/logout', exits: 156, percentage: 28 },
            { page: '/external-link', exits: 89, percentage: 16 },
            { page: '/timeout', exits: 67, percentage: 12 },
          ],
        };

        return analyticsData;
      } catch (error) {
        console.error('Error fetching page report:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

// Hook for fetching detailed report data with analytics
export const useReportReport = (id: string) => {
  const navigate = useNavigate();

  return useQuery({
    queryKey: ['report-report', id],
    queryFn: async () => {
      try {
        const reports = await pendoAPI.getReports();
        const report = reports.find(r => r.id === id);

        if (!report) {
          throw new Error('Report not found');
        }

        // Generate enhanced analytics data
        const analyticsData = {
          ...report,
          // Calculated metrics
          totalViews: Math.floor(Math.random() * 500) + 100,
          uniqueViewers: Math.floor(Math.random() * 200) + 50,
          shares: Math.floor(Math.random() * 50) + 10,
          downloads: Math.floor(Math.random() * 80) + 20,
          averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0

          // Time series data (last 30 days)
          dailyEngagement: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toISOString().split('T')[0],
              views: Math.floor(Math.random() * 30) + 5,
              shares: Math.floor(Math.random() * 5) + 1,
              downloads: Math.floor(Math.random() * 8) + 2,
            };
          }),

          // User engagement breakdown
          userEngagement: [
            { userType: 'Admin Users', views: 340, percentage: 42 },
            { userType: 'Regular Users', views: 280, percentage: 35 },
            { userType: 'Guest Users', views: 180, percentage: 23 },
          ],

          // Popular sections
          popularSections: [
            { section: 'Executive Summary', views: 680, percentage: 85 },
            { section: 'Detailed Analytics', views: 520, percentage: 65 },
            { section: 'Recommendations', views: 440, percentage: 55 },
            { section: 'Appendix', views: 220, percentage: 27 },
          ],

          // Feedback data
          userFeedback: [
            { rating: 5, count: 45, percentage: 56 },
            { rating: 4, count: 25, percentage: 31 },
            { rating: 3, count: 8, percentage: 10 },
            { rating: 2, count: 2, percentage: 3 },
          ],
        };

        return analyticsData;
      } catch (error) {
        console.error('Error fetching report analytics:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};