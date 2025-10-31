import React from 'react';
import { Cin7Card, Cin7CardContent, BlockStack, InlineStack, Text } from '@/components/polaris';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  description?: string;
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  description,
  loading = false
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'success';
      case 'decrease':
        return 'critical';
      default:
        return 'subdued';
    }
  };

  const getChangeSymbol = () => {
    switch (changeType) {
      case 'increase':
        return '↑';
      case 'decrease':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <Cin7Card>
      <Cin7CardContent>
        <BlockStack gap="400">
          {/* Title */}
          <Text as="h3" variant="headingSm" tone="subdued">
            {title}
          </Text>

          {/* Value */}
          <Text as="p" variant="heading2xl" fontWeight="bold">
            {loading ? '...' : value}
          </Text>

          {/* Change & Description */}
          {(change !== undefined || description) && (
            <InlineStack gap="200" wrap={false} blockAlign="center">
              {change !== undefined && (
                <Text as="span" variant="bodySm" fontWeight="medium" tone={getChangeColor()}>
                  {getChangeSymbol()} {Math.abs(change)}%
                </Text>
              )}
              {description && (
                <Text as="span" variant="bodySm" tone="subdued">
                  {description}
                </Text>
              )}
            </InlineStack>
          )}
        </BlockStack>
      </Cin7CardContent>
    </Cin7Card>
  );
};