import React from 'react';
import { BlockStack, InlineStack, Text } from '@shopify/polaris';
import type { BlockStackProps, InlineStackProps, TextProps } from '@shopify/polaris';

// Cin7-branded BlockStack component
export interface Cin7BlockStackProps extends BlockStackProps {
  children: React.ReactNode;
}

export const Cin7BlockStack: React.FC<Cin7BlockStackProps> = (props) => {
  return <BlockStack {...props} />;
};

Cin7BlockStack.displayName = 'Cin7BlockStack';

// Cin7-branded InlineStack component
export interface Cin7InlineStackProps extends InlineStackProps {
  children: React.ReactNode;
}

export const Cin7InlineStack: React.FC<Cin7InlineStackProps> = (props) => {
  return <InlineStack {...props} />;
};

Cin7InlineStack.displayName = 'Cin7InlineStack';

// Cin7-branded Text component
export interface Cin7TextProps extends TextProps {
  children: React.ReactNode;
}

export const Cin7Text: React.FC<Cin7TextProps> = (props) => {
  return <Text {...props} />;
};

Cin7Text.displayName = 'Cin7Text';

// Export Polaris components directly for convenience
export { BlockStack, InlineStack, Text };
