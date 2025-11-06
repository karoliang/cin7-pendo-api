import React, { useMemo } from 'react';
import {
  Cin7Card,
  Cin7CardHeader,
  Cin7CardTitle,
  Cin7CardContent,
  BlockStack,
  InlineStack,
  Text,
  Cin7Badge
} from '@/components/polaris';
import type { ComprehensivePageData } from '@/types/enhanced-pendo';

interface GeographicMapProps {
  pages: ComprehensivePageData[];
  loading?: boolean;
}

interface AggregatedGeoData {
  country: string;
  region: string;
  visitors: number;
  views: number;
  avgTimeOnPage: number;
  flag: string;
}

// Country code to flag emoji mapping
const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  USA: '🇺🇸',
  'United States': '🇺🇸',
  GB: '🇬🇧',
  UK: '🇬🇧',
  'United Kingdom': '🇬🇧',
  CA: '🇨🇦',
  Canada: '🇨🇦',
  AU: '🇦🇺',
  Australia: '🇦🇺',
  DE: '🇩🇪',
  Germany: '🇩🇪',
  FR: '🇫🇷',
  France: '🇫🇷',
  IN: '🇮🇳',
  India: '🇮🇳',
  JP: '🇯🇵',
  Japan: '🇯🇵',
  CN: '🇨🇳',
  China: '🇨🇳',
  BR: '🇧🇷',
  Brazil: '🇧🇷',
  MX: '🇲🇽',
  Mexico: '🇲🇽',
  ES: '🇪🇸',
  Spain: '🇪🇸',
  IT: '🇮🇹',
  Italy: '🇮🇹',
  NL: '🇳🇱',
  Netherlands: '🇳🇱',
  SE: '🇸🇪',
  Sweden: '🇸🇪',
  NO: '🇳🇴',
  Norway: '🇳🇴',
  DK: '🇩🇰',
  Denmark: '🇩🇰',
  FI: '🇫🇮',
  Finland: '🇫🇮',
  PL: '🇵🇱',
  Poland: '🇵🇱',
  CH: '🇨🇭',
  Switzerland: '🇨🇭',
  AT: '🇦🇹',
  Austria: '🇦🇹',
  BE: '🇧🇪',
  Belgium: '🇧🇪',
  IE: '🇮🇪',
  Ireland: '🇮🇪',
  NZ: '🇳🇿',
  'New Zealand': '🇳🇿',
  SG: '🇸🇬',
  Singapore: '🇸🇬',
  HK: '🇭🇰',
  'Hong Kong': '🇭🇰',
  KR: '🇰🇷',
  'South Korea': '🇰🇷',
  ZA: '🇿🇦',
  'South Africa': '🇿🇦',
  AR: '🇦🇷',
  Argentina: '🇦🇷',
  CL: '🇨🇱',
  Chile: '🇨🇱',
  CO: '🇨🇴',
  Colombia: '🇨🇴',
  PE: '🇵🇪',
  Peru: '🇵🇪',
  IL: '🇮🇱',
  Israel: '🇮🇱',
  AE: '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  SA: '🇸🇦',
  'Saudi Arabia': '🇸🇦',
  TR: '🇹🇷',
  Turkey: '🇹🇷',
  RU: '🇷🇺',
  Russia: '🇷🇺',
  UA: '🇺🇦',
  Ukraine: '🇺🇦',
  PH: '🇵🇭',
  Philippines: '🇵🇭',
  TH: '🇹🇭',
  Thailand: '🇹🇭',
  MY: '🇲🇾',
  Malaysia: '🇲🇾',
  ID: '🇮🇩',
  Indonesia: '🇮🇩',
  VN: '🇻🇳',
  Vietnam: '🇻🇳',
  PK: '🇵🇰',
  Pakistan: '🇵🇰',
  BD: '🇧🇩',
  Bangladesh: '🇧🇩',
  EG: '🇪🇬',
  Egypt: '🇪🇬',
  NG: '🇳🇬',
  Nigeria: '🇳🇬',
  KE: '🇰🇪',
  Kenya: '🇰🇪',
  PT: '🇵🇹',
  Portugal: '🇵🇹',
  GR: '🇬🇷',
  Greece: '🇬🇷',
  CZ: '🇨🇿',
  'Czech Republic': '🇨🇿',
  RO: '🇷🇴',
  Romania: '🇷🇴',
  HU: '🇭🇺',
  Hungary: '🇭🇺',
};

// Helper function to get flag emoji
const getCountryFlag = (country: string): string => {
  return countryFlags[country] || '🌍'; // Default to globe emoji
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

export const GeographicMap: React.FC<GeographicMapProps> = ({
  pages,
  loading = false
}) => {
  // Aggregate geographic data from all pages
  const aggregatedData = useMemo(() => {
    const geoMap = new Map<string, {
      region: string;
      visitors: number;
      views: number;
      totalTime: number;
      count: number;
    }>();

    pages.forEach(page => {
      page.geographicDistribution?.forEach(geo => {
        const key = geo.country || geo.region;
        if (!key) return;

        if (!geoMap.has(key)) {
          geoMap.set(key, {
            region: geo.region,
            visitors: 0,
            views: 0,
            totalTime: 0,
            count: 0
          });
        }

        const current = geoMap.get(key)!;
        current.visitors += geo.visitors;
        current.views += geo.views;
        current.totalTime += geo.avgTimeOnPage * geo.visitors;
        current.count += geo.visitors;
      });
    });

    // Calculate averages and create final array
    const result: AggregatedGeoData[] = Array.from(geoMap.entries()).map(([country, data]) => ({
      country,
      region: data.region,
      visitors: data.visitors,
      views: data.views,
      avgTimeOnPage: data.count > 0 ? data.totalTime / data.count : 0,
      flag: getCountryFlag(country)
    }));

    // Sort by visitors descending and take top 10
    return result.sort((a, b) => b.visitors - a.visitors).slice(0, 10);
  }, [pages]);

  // Calculate max visitors for scaling bars
  const maxVisitors = useMemo(() => {
    return Math.max(...aggregatedData.map(d => d.visitors), 1);
  }, [aggregatedData]);

  // Get color based on traffic volume
  const getTrafficColor = (visitors: number): string => {
    const percentage = (visitors / maxVisitors) * 100;
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  // Get rank badge variant
  const getRankBadgeVariant = (rank: number): 'success' | 'info' | 'neutral' => {
    if (rank === 1) return 'success';
    if (rank <= 3) return 'info';
    return 'neutral';
  };

  return (
    <Cin7Card>
      <Cin7CardHeader>
        <Cin7CardTitle className="text-lg font-semibold">
          Geographic Distribution
        </Cin7CardTitle>
      </Cin7CardHeader>
      <Cin7CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Text as="p" variant="bodyMd" tone="subdued">
              Loading geographic data...
            </Text>
          </div>
        ) : aggregatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🌍</div>
            <Text as="p" variant="bodyMd" tone="subdued">
              No geographic data available
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Geographic distribution will appear as visitors access your pages
            </Text>
          </div>
        ) : (
          <BlockStack gap="300">
            {aggregatedData.map((geo, index) => {
              const rank = index + 1;
              const trafficPercentage = (geo.visitors / maxVisitors) * 100;

              return (
                <div
                  key={geo.country}
                  className="group p-4 rounded-lg border border-gray-200 hover:border-[var(--cin7-hept-blue,#0033A0)] hover:bg-[var(--cin7-hept-blue-lighter,#E6EBF5)] transition-all duration-200"
                >
                  {/* Header Row */}
                  <InlineStack gap="300" wrap={false} blockAlign="center">
                    <Cin7Badge variant={getRankBadgeVariant(rank)}>
                      {`#${rank}`}
                    </Cin7Badge>
                    <div className="flex-1 min-w-0">
                      <InlineStack gap="200" wrap={false} blockAlign="center">
                        <span className="text-2xl">{geo.flag}</span>
                        <div className="flex-1 min-w-0">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {geo.country}
                          </Text>
                          {geo.region && geo.region !== geo.country && (
                            <Text as="p" variant="bodySm" tone="subdued">
                              {geo.region}
                            </Text>
                          )}
                        </div>
                      </InlineStack>
                    </div>
                  </InlineStack>

                  {/* Metrics Row */}
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Visitors
                      </Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {geo.visitors.toLocaleString()}
                      </Text>
                    </div>
                    <div>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Page Views
                      </Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {geo.views.toLocaleString()}
                      </Text>
                    </div>
                    <div>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Avg. Time
                      </Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {formatTime(geo.avgTimeOnPage)}
                      </Text>
                    </div>
                  </div>

                  {/* Traffic Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${getTrafficColor(geo.visitors)} transition-all duration-300`}
                        style={{ width: `${trafficPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </BlockStack>
        )}
      </Cin7CardContent>
    </Cin7Card>
  );
};
