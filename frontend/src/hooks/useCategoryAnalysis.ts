import { useMemo } from 'react';
import type { Feature } from '@/types/pendo';

interface CategoryData {
  name: string;
  totalUsage: number;
  uniqueUsers: number;
  featureCount: number;
  avgUsagePerFeature: number;
  features: Feature[];
}

export function useCategoryAnalysis(features: Feature[]): CategoryData[] {
  return useMemo(() => {
    const categoryMap = new Map<string, {
      name: string;
      totalUsage: number;
      uniqueUsers: Set<number>;
      featureCount: number;
      features: Feature[];
    }>();

    features.forEach(feature => {
      // Extract category from feature data
      // Features from API have group.name like "Reporting / Insights"
      const categoryName = (feature as any).group?.name || 'Uncategorized';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          totalUsage: 0,
          uniqueUsers: new Set(),
          featureCount: 0,
          features: []
        });
      }

      const category = categoryMap.get(categoryName)!;
      category.totalUsage += feature.usageCount || 0;
      category.featureCount += 1;
      category.features.push(feature);

      // Track unique users (simplified - ideally would aggregate from events)
      // For now, use max unique users as proxy
      if (feature.visitorCount && feature.visitorCount > 0) {
        for (let i = 0; i < feature.visitorCount; i++) {
          category.uniqueUsers.add(i);
        }
      }
    });

    // Convert to array and calculate metrics
    return Array.from(categoryMap.values())
      .map(cat => ({
        name: cat.name,
        totalUsage: cat.totalUsage,
        uniqueUsers: cat.uniqueUsers.size,
        featureCount: cat.featureCount,
        avgUsagePerFeature: cat.totalUsage / cat.featureCount,
        features: cat.features
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
  }, [features]);
}
