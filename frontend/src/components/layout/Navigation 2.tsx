import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from '@shopify/polaris';
import type { TabProps } from '@shopify/polaris';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine selected tab based on current route
  const getSelectedTab = React.useMemo(() => {
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      return 0;
    } else if (location.pathname === '/tables') {
      return 1;
    }
    return 0;
  }, [location.pathname]);

  const tabs: TabProps[] = [
    {
      id: 'dashboard',
      content: 'Dashboard',
      panelID: 'dashboard-panel',
    },
    {
      id: 'data-tables',
      content: 'Data Tables',
      panelID: 'data-tables-panel',
    },
  ];

  const handleTabChange = React.useCallback((selectedTabIndex: number) => {
    console.log('Tab changed to index:', selectedTabIndex);
    if (selectedTabIndex === 0) {
      navigate('/dashboard');
    } else if (selectedTabIndex === 1) {
      navigate('/tables');
    }
  }, [navigate]);

  return (
    <div className={className}>
      <div className="px-4 sm:px-6 lg:px-8" style={{ maxWidth: '100%' }}>
        <Tabs tabs={tabs} selected={getSelectedTab} onSelect={handleTabChange} />
      </div>
    </div>
  );
};