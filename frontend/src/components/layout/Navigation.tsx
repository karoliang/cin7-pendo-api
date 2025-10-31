import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from '@shopify/polaris';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine selected tab based on current route
  const getSelectedTab = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      return 0;
    } else if (location.pathname === '/tables') {
      return 1;
    }
    return 0;
  };

  const tabs = [
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

  const handleTabChange = (selectedTabIndex: number) => {
    if (selectedTabIndex === 0) {
      navigate('/');
    } else if (selectedTabIndex === 1) {
      navigate('/tables');
    }
  };

  return (
    <div className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs tabs={tabs} selected={getSelectedTab()} onSelect={handleTabChange} />
      </div>
    </div>
  );
};