import React from 'react';
import { Button as PolarisButton } from '@shopify/polaris';
import type { ButtonProps as PolarisButtonProps } from '@shopify/polaris';
import { cn } from '@/lib/utils';

// Map shadcn/ui button variants to Polaris equivalents
type Cin7ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary' | 'plain';
type Cin7ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'micro' | 'slim' | 'medium' | 'large';

export interface Cin7ButtonProps extends Omit<PolarisButtonProps, 'variant' | 'size'> {
  variant?: Cin7ButtonVariant;
  size?: Cin7ButtonSize;
  asChild?: boolean;
  className?: string;
}

export const Cin7Button = React.forwardRef<HTMLButtonElement, Cin7ButtonProps>(
  ({ variant = 'default', size = 'default', asChild = false, className, children, ...props }, ref) => {
    // Map Cin7 variants to Polaris variant
    const getPolarisVariant = (): PolarisButtonProps['variant'] => {
      switch (variant) {
        case 'default':
        case 'primary':
          return 'primary';
        case 'destructive':
          return undefined; // Will use tone='critical' instead
        case 'outline':
          return 'secondary';
        case 'plain':
        case 'ghost':
        case 'link':
          return 'plain';
        case 'secondary':
        default:
          return 'secondary';
      }
    };

    // Map Cin7 sizes to Polaris sizes
    const getPolarisSize = (): PolarisButtonProps['size'] => {
      switch (size) {
        case 'sm':
        case 'micro':
          return 'micro';
        case 'default':
        case 'slim':
          return 'slim';
        case 'lg':
        case 'medium':
          return 'medium';
        case 'large':
          return 'large';
        case 'icon':
          return 'slim';
        default:
          return 'medium';
      }
    };

    const polarisVariant = getPolarisVariant();
    const polarisSize = getPolarisSize();
    const tone = variant === 'destructive' ? 'critical' : undefined;

    return (
      <span className={cn(className)}>
        <PolarisButton
          {...props}
          variant={polarisVariant}
          size={polarisSize}
          tone={tone}
        >
          {children as any}
        </PolarisButton>
      </span>
    );
  }
);

Cin7Button.displayName = 'Cin7Button';

// Compatibility wrapper for components using the old Button API
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Cin7ButtonVariant;
  size?: Cin7ButtonSize;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', asChild, className, children, onClick, disabled, type }, ref) => {
    return (
      <Cin7Button
        variant={variant}
        size={size}
        onClick={onClick as any}
        disabled={disabled}
        submit={type === 'submit'}
        className={className}
      >
        {children as any}
      </Cin7Button>
    );
  }
);

Button.displayName = 'Button';

export default Cin7Button;
