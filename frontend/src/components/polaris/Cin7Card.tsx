import React from 'react';
import { Card as PolarisCard, Box, Text } from '@shopify/polaris';
import type { CardProps as PolarisCardProps } from '@shopify/polaris';
import { cn } from '@/lib/utils';

// Main Card component
export interface Cin7CardProps extends Omit<PolarisCardProps, 'children'> {
  children?: React.ReactNode;
  className?: string;
}

export const Cin7Card = React.forwardRef<HTMLDivElement, Cin7CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('polaris-card-wrapper h-full', className)}>
        <PolarisCard {...props}>
          <div className="h-full flex flex-col">
            {children}
          </div>
        </PolarisCard>
      </div>
    );
  }
);

Cin7Card.displayName = 'Cin7Card';

// Card Header component
export interface Cin7CardHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export const Cin7CardHeader = React.forwardRef<HTMLDivElement, Cin7CardHeaderProps>(
  ({ className, children }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 space-y-1.5', className)}>
        {children}
      </div>
    );
  }
);

Cin7CardHeader.displayName = 'Cin7CardHeader';

// Card Title component
export interface Cin7CardTitleProps {
  children?: React.ReactNode;
  className?: string;
}

export const Cin7CardTitle = React.forwardRef<HTMLHeadingElement, Cin7CardTitleProps>(
  ({ className, children }, ref) => {
    return (
      <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)}>
        {children}
      </h3>
    );
  }
);

Cin7CardTitle.displayName = 'Cin7CardTitle';

// Card Description component
export interface Cin7CardDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

export const Cin7CardDescription = React.forwardRef<HTMLParagraphElement, Cin7CardDescriptionProps>(
  ({ className, children }, ref) => {
    return (
      <p ref={ref} className={cn('text-sm text-muted-foreground', className)}>
        {children}
      </p>
    );
  }
);

Cin7CardDescription.displayName = 'Cin7CardDescription';

// Card Content component
export interface Cin7CardContentProps {
  children?: React.ReactNode;
  className?: string;
}

export const Cin7CardContent = React.forwardRef<HTMLDivElement, Cin7CardContentProps>(
  ({ className, children }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 pt-0', className)}>
        {children}
      </div>
    );
  }
);

Cin7CardContent.displayName = 'Cin7CardContent';

// Card Footer component
export interface Cin7CardFooterProps {
  children?: React.ReactNode;
  className?: string;
}

export const Cin7CardFooter = React.forwardRef<HTMLDivElement, Cin7CardFooterProps>(
  ({ className, children }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center p-6 pt-0', className)}>
        {children}
      </div>
    );
  }
);

Cin7CardFooter.displayName = 'Cin7CardFooter';

// Export all components
export { Cin7Card as Card };
export default Cin7Card;
