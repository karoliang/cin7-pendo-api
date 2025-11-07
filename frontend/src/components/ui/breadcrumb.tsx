import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm text-gray-600', className)}
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {/* Separator before item (except first) */}
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400 flex-shrink-0" />
              )}

              {/* Breadcrumb item */}
              {isLast ? (
                // Current page - not clickable
                <span
                  className={cn(
                    'flex items-center font-medium text-gray-900',
                    Icon && 'gap-1.5'
                  )}
                  aria-current="page"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : item.href ? (
                // Clickable link
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center hover:text-gray-900 transition-colors',
                    Icon && 'gap-1.5'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              ) : (
                // Non-clickable item
                <span className={cn('flex items-center', Icon && 'gap-1.5')}>
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Convenience component for common Home breadcrumb
export interface BreadcrumbWithHomeProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbWithHome: React.FC<BreadcrumbWithHomeProps> = ({
  items,
  className,
}) => {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: HomeIcon },
    ...items,
  ];

  return <Breadcrumb items={breadcrumbItems} className={className} />;
};
