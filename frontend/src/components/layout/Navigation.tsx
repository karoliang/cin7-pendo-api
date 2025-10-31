import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isDataTables = location.pathname === '/tables';

  console.log('🧭 Navigation render:', {
    pathname: location.pathname,
    isDashboard,
    isDataTables
  });

  const handleDashboardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔘 Dashboard button clicked - navigating to /dashboard');
    navigate('/dashboard', { replace: false });
  }, [navigate]);

  const handleTablesClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔘 Data Tables button clicked - navigating to /tables');
    console.log('Current location before navigate:', location.pathname);
    try {
      navigate('/tables', { replace: false });
      console.log('✅ navigate() called successfully');
    } catch (error) {
      console.error('❌ navigate() failed:', error);
    }
  }, [navigate, location]);

  // Base styles for navigation buttons
  const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer';

  const primaryStyles = 'bg-[var(--cin7-hept-blue,#0033A0)] text-white hover:bg-[var(--cin7-hept-blue-dark,#002266)]';
  const plainStyles = 'text-gray-700 hover:bg-gray-100';

  return (
    <div className={className}>
      <div className="px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div className="flex gap-2 py-3 items-center">
          <button
            type="button"
            className={`${baseStyles} ${isDashboard ? primaryStyles : plainStyles}`}
            onClick={handleDashboardClick}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`${baseStyles} ${isDataTables ? primaryStyles : plainStyles}`}
            onClick={handleTablesClick}
          >
            Data Tables
          </button>
        </div>
      </div>
    </div>
  );
};