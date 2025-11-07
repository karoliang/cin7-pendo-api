import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cin7Card, Cin7CardHeader, Cin7CardTitle, Cin7CardContent, Cin7Badge, BlockStack, Text } from '@/components/polaris';
import type { Guide, Feature, Page } from '@/types/pendo';

interface TopPerformersProps {
  guides: Guide[];
  features: Feature[];
  pages: Page[];
  loading?: boolean;
}

interface RankedGuide extends Guide {
  completionRate: number;
}

interface RankedItem {
  id: string;
  name: string;
  value: number;
  displayValue: string;
}

export const TopPerformers: React.FC<TopPerformersProps> = ({
  guides,
  features,
  pages,
  loading = false
}) => {
  const navigate = useNavigate();

  // Calculate top guides by completion rate
  const getTopGuides = (): RankedItem[] => {
    const guidesWithRate: RankedGuide[] = guides.map(guide => ({
      ...guide,
      completionRate: guide.viewedCount > 0
        ? (guide.completedCount / guide.viewedCount) * 100
        : 0
    }));

    return guidesWithRate
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5)
      .map(guide => ({
        id: guide.id,
        name: guide.name,
        value: guide.completionRate,
        displayValue: `${(guide.completionRate || 0).toFixed(1)}%`
      }));
  };

  // Get top features by usage count
  const getTopFeatures = (): RankedItem[] => {
    return features
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(feature => ({
        id: feature.id,
        name: feature.name,
        value: feature.usageCount,
        displayValue: feature.usageCount.toLocaleString()
      }));
  };

  // Get top pages by view count
  const getTopPages = (): RankedItem[] => {
    return pages
      .sort((a, b) => b.viewedCount - a.viewedCount)
      .slice(0, 5)
      .map(page => ({
        id: page.id,
        name: page.name,
        value: page.viewedCount,
        displayValue: page.viewedCount.toLocaleString()
      }));
  };

  const topGuides = getTopGuides();
  const topFeatures = getTopFeatures();
  const topPages = getTopPages();

  // Get badge variant based on rank
  const getRankBadgeVariant = (rank: number): 'success' | 'info' | 'neutral' => {
    if (rank === 1) return 'success';
    if (rank <= 3) return 'info';
    return 'neutral';
  };

  // Render a ranked list
  const renderRankedList = (items: RankedItem[], title: string, emptyMessage: string, type: 'guides' | 'features' | 'pages') => (
    <Cin7Card className="h-full">
      <Cin7CardHeader>
        <Cin7CardTitle className="text-lg font-semibold">
          {title}
        </Cin7CardTitle>
      </Cin7CardHeader>
      <Cin7CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Text as="p" variant="bodyMd" tone="subdued">Loading...</Text>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Text as="p" variant="bodyMd" tone="subdued">{emptyMessage}</Text>
          </div>
        ) : (
          <BlockStack gap="300">
            {items.map((item, index) => {
              const rank = index + 1;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/report/${type}/${item.id}`)}
                  className="group flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[var(--cin7-hept-blue,#0033A0)] hover:bg-[var(--cin7-hept-blue-lighter,#E6EBF5)] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Cin7Badge variant={getRankBadgeVariant(rank)}>
                      {`#${rank}`}
                    </Cin7Badge>
                    <div className="flex-1 min-w-0">
                      <Text
                        as="p"
                        variant="bodyMd"
                        fontWeight="semibold"
                        truncate
                      >
                        {item.name}
                      </Text>
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <Text
                      as="p"
                      variant="headingMd"
                      fontWeight="bold"
                      tone={rank === 1 ? 'success' : undefined}
                    >
                      {item.displayValue}
                    </Text>
                  </div>
                </div>
              );
            })}
          </BlockStack>
        )}
      </Cin7CardContent>
    </Cin7Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {renderRankedList(
        topGuides,
        'Top 5 Guides',
        'No guides available',
        'guides'
      )}
      {renderRankedList(
        topFeatures,
        'Top 5 Features',
        'No features available',
        'features'
      )}
      {renderRankedList(
        topPages,
        'Top 5 Pages',
        'No pages available',
        'pages'
      )}
    </div>
  );
};
