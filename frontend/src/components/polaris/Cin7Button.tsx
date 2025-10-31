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
          {children}
        </PolarisButton>
      </span>
    );
  }
);

Cin7Button.displayName = 'Cin7Button';

// Compatibility wrapper for components using the old Button API
// This wrapper uses plain HTML to support React.ReactNode children (icons + text)
// while maintaining Cin7 branding through CSS
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Cin7ButtonVariant;
  size?: Cin7ButtonSize;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', asChild, className, children, ...props }, ref) => {
    // Use plain button with Cin7 styling to support React.ReactNode children (icons + text)
    const getButtonClasses = () => {
      const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

      const variantClasses = {
        default: 'bg-[var(--cin7-hept-blue,#0033A0)] text-white hover:bg-[var(--cin7-hept-blue-dark,#002266)]',
        primary: 'bg-[var(--cin7-hept-blue,#0033A0)] text-white hover:bg-[var(--cin7-hept-blue-dark,#002266)]',
        destructive: 'bg-[var(--cin7-error,#D32F2F)] text-white hover:bg-red-700',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-[var(--cin7-hept-blue,#0033A0)] underline-offset-4 hover:underline',
      };

      const sizeClasses = {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        micro: 'h-8 rounded-md px-2 text-xs',
        slim: 'h-9 rounded-md px-3',
        medium: 'h-10 px-4 py-2',
        large: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      };

      return cn(base, variantClasses[variant], sizeClasses[size], className);
    };

    return (
      <button
        ref={ref}
        className={getButtonClasses()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Cin7Button;
