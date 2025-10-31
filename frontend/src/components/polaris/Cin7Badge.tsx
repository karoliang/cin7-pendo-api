import React from 'react';
import { Badge as PolarisBadge } from '@shopify/polaris';
import type { BadgeProps as PolarisBadgeProps } from '@shopify/polaris';
import { cn } from '@/lib/utils';

// Map shadcn/ui badge variants to Polaris equivalents
type Cin7BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'error' | 'neutral';

export interface Cin7BadgeProps extends Omit<PolarisBadgeProps, 'tone' | 'progress'> {
  variant?: Cin7BadgeVariant;
  className?: string;
}

export const Cin7Badge = React.forwardRef<HTMLSpanElement, Cin7BadgeProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    // Map Cin7 variants to Polaris tone
    const getPolarisTone = (): PolarisBadgeProps['tone'] => {
      switch (variant) {
        case 'success':
          return 'success';
        case 'warning':
          return 'warning';
        case 'error':
        case 'destructive':
          return 'critical';
        case 'info':
          return 'info';
        case 'secondary':
        case 'neutral':
          return 'info';
        case 'outline':
          return undefined;
        case 'default':
        default:
          return 'info';
      }
    };

    return (
      <span ref={ref} className={cn('inline-flex', className)}>
        <PolarisBadge tone={getPolarisTone()} {...props}>
          {children}
        </PolarisBadge>
      </span>
    );
  }
);

Cin7Badge.displayName = 'Cin7Badge';

export default Cin7Badge;
