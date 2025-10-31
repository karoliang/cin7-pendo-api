import React from 'react';
import { cn } from '@/lib/utils';

// Map shadcn/ui button variants to Polaris equivalents
type Cin7ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type Cin7ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface Cin7ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Cin7ButtonVariant;
  size?: Cin7ButtonSize;
  asChild?: boolean;
}

export const Cin7Button = React.forwardRef<HTMLButtonElement, Cin7ButtonProps>(
  ({ variant = 'default', size = 'default', asChild = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant styles with Cin7 colors
          variant === 'default' && 'bg-[#0066CC] text-white hover:bg-[#004999]',
          variant === 'destructive' && 'bg-[#D32F2F] text-white hover:bg-red-700',
          variant === 'outline' && 'border border-gray-300 bg-white hover:bg-gray-50',
          variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
          variant === 'ghost' && 'hover:bg-gray-100 hover:text-gray-900',
          variant === 'link' && 'text-[#0066CC] underline-offset-4 hover:underline',
          // Size styles
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-9 rounded-md px-3',
          size === 'lg' && 'h-11 rounded-md px-8',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Cin7Button.displayName = 'Cin7Button';

export default Cin7Button;
