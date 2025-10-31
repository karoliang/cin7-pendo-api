import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const location = useLocation();

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isDataTables = location.pathname === '/tables';

  console.log('🧭 Navigation render:', {
    pathname: location.pathname,
    isDashboard,
    isDataTables
  });

  // Base styles for navigation buttons
  const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const primaryStyles = 'bg-[var(--cin7-hept-blue,#0033A0)] text-white hover:bg-[var(--cin7-hept-blue-dark,#002266)]';
  const plainStyles = 'text-gray-700 hover:bg-gray-100';

  return (
    <div className={className}>
      <div className="px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div className="flex gap-2 py-3 items-center">
          <Link
            to="/dashboard"
            className={`${baseStyles} ${isDashboard ? primaryStyles : plainStyles}`}
            onClick={() => console.log('🔘 Dashboard link clicked')}
          >
            Dashboard
          </Link>
          <Link
            to="/tables"
            className={`${baseStyles} ${isDataTables ? primaryStyles : plainStyles}`}
            onClick={() => console.log('🔘 Data Tables link clicked')}
          >
            Data Tables
          </Link>
        </div>
      </div>
    </div>
  );
};