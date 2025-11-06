import React, { useMemo } from 'react';
import {
  Cin7Card,
  Cin7CardHeader,
  Cin7CardTitle,
  Cin7CardContent,
  BlockStack,
  InlineStack,
  Text
} from '@/components/polaris';
import { Tooltip } from '@shopify/polaris';
import type { ComprehensivePageData } from '@/types/enhanced-pendo';

interface FrustrationMetricsProps {
  pages: ComprehensivePageData[];
  loading?: boolean;
}

interface MetricConfig {
  icon: string;
  label: string;
  tooltip: string;
  key: keyof AggregatedMetrics;
  format: (value: number) => string;
  color: string;
}

interface AggregatedMetrics {
  totalRageClicks: number;
  totalDeadClicks: number;
  totalErrorClicks: number;
  totalUTurns: number;
  frustrationRate: number;
}

export const FrustrationMetrics: React.FC<FrustrationMetricsProps> = ({ pages, loading = false }) => {
  // Calculate aggregate frustration metrics
  const metrics = useMemo((): AggregatedMetrics => {
    if (!pages || pages.length === 0) {
      return {
        totalRageClicks: 0,
        totalDeadClicks: 0,
        totalErrorClicks: 0,
        totalUTurns: 0,
        frustrationRate: 0
      };
    }

    let totalRageClicks = 0;
    let totalDeadClicks = 0;
    let totalErrorClicks = 0;
    let totalUTurns = 0;
    let totalViews = 0;

    pages.forEach((page) => {
      // First try to get from frustrationMetrics summary if available
      if (page.frustrationMetrics) {
        totalRageClicks += page.frustrationMetrics.totalRageClicks || 0;
        totalDeadClicks += page.frustrationMetrics.totalDeadClicks || 0;
        totalErrorClicks += page.frustrationMetrics.totalErrorClicks || 0;
        totalUTurns += page.frustrationMetrics.totalUTurns || 0;
      }
      // Otherwise aggregate from eventBreakdown array
      else if (page.eventBreakdown && Array.isArray(page.eventBreakdown)) {
        page.eventBreakdown.forEach((event) => {
          totalRageClicks += event.rageClicks || 0;
          totalDeadClicks += event.deadClicks || 0;
          totalErrorClicks += event.errorClicks || 0;
          totalUTurns += event.uTurns || 0;
        });
      }

      // Accumulate total page views for frustration rate calculation
      totalViews += page.viewedCount || 0;
    });

    // Calculate overall frustration rate
    const totalFrustrationEvents = totalRageClicks + totalDeadClicks + totalErrorClicks + totalUTurns;
    const frustrationRate = totalViews > 0 ? (totalFrustrationEvents / totalViews) * 100 : 0;

    return {
      totalRageClicks,
      totalDeadClicks,
      totalErrorClicks,
      totalUTurns,
      frustrationRate
    };
  }, [pages]);

  // Metric configurations
  const metricConfigs: MetricConfig[] = [
    {
      icon: '🤬',
      label: 'Rage Clicks',
      tooltip: 'Rapid repeated clicks on the same element indicating user frustration',
      key: 'totalRageClicks',
      format: (value) => value.toLocaleString(),
      color: 'text-red-600'
    },
    {
      icon: '💀',
      label: 'Dead Clicks',
      tooltip: 'Clicks on non-interactive elements where users expected interaction',
      key: 'totalDeadClicks',
      format: (value) => value.toLocaleString(),
      color: 'text-gray-600'
    },
    {
      icon: '❌',
      label: 'Error Clicks',
      tooltip: 'Clicks that resulted in errors or failed actions',
      key: 'totalErrorClicks',
      format: (value) => value.toLocaleString(),
      color: 'text-red-500'
    },
    {
      icon: '↩️',
      label: 'U-Turns',
      tooltip: 'Users who immediately navigated back after landing on a page',
      key: 'totalUTurns',
      format: (value) => value.toLocaleString(),
      color: 'text-orange-600'
    },
    {
      icon: '📊',
      label: 'Frustration Rate',
      tooltip: 'Percentage of page views that included frustration events',
      key: 'frustrationRate',
      format: (value) => `${value.toFixed(1)}%`,
      color: 'text-amber-600'
    }
  ];

  // Determine if frustration levels are high
  const getIntensityColor = (key: keyof AggregatedMetrics, value: number): string => {
    if (key === 'frustrationRate') {
      if (value > 5) return 'bg-red-50 border-red-200';
      if (value > 2) return 'bg-amber-50 border-amber-200';
      return 'bg-green-50 border-green-200';
    }

    // For count-based metrics
    if (value > 1000) return 'bg-red-50 border-red-200';
    if (value > 100) return 'bg-amber-50 border-amber-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <Cin7Card>
      <Cin7CardHeader>
        <Cin7CardTitle>Frustration Metrics</Cin7CardTitle>
      </Cin7CardHeader>
      <Cin7CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Text as="p" variant="bodyMd" tone="subdued">
              Loading frustration metrics...
            </Text>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {metricConfigs.map((config) => {
              const value = metrics[config.key];
              const intensityColor = getIntensityColor(config.key, value);

              return (
                <div
                  key={config.key}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${intensityColor}`}
                >
                  <BlockStack gap="200">
                    {/* Icon and Label with Tooltip */}
                    <InlineStack gap="200" blockAlign="center" wrap={false}>
                      <span className="text-2xl" role="img" aria-label={config.label}>
                        {config.icon}
                      </span>
                      <Tooltip content={config.tooltip} dismissOnMouseOut>
                        <Text as="h4" variant="headingSm" tone="subdued">
                          {config.label}
                        </Text>
                      </Tooltip>
                    </InlineStack>

                    {/* Metric Value */}
                    <Text
                      as="p"
                      variant="headingXl"
                      fontWeight="bold"
                      tone={value > 0 ? undefined : 'subdued'}
                    >
                      <span className={config.color}>
                        {config.format(value)}
                      </span>
                    </Text>
                  </BlockStack>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Message */}
        {!loading && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
              {metrics.frustrationRate === 0
                ? '✅ No frustration events detected across monitored pages'
                : metrics.frustrationRate < 2
                ? '✓ Frustration levels are within acceptable range'
                : metrics.frustrationRate < 5
                ? '⚠️ Moderate frustration detected - consider reviewing user experience'
                : '🚨 High frustration levels detected - immediate attention recommended'
              }
            </Text>
          </div>
        )}
      </Cin7CardContent>
    </Cin7Card>
  );
};

export default FrustrationMetrics;
