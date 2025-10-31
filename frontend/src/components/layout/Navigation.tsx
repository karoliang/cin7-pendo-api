import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Cin7Button } from '@/components/polaris/Cin7Button';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isDataTables = location.pathname === '/tables';

  return (
    <div className={className}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 py-2">
          <Cin7Button
            variant={isDashboard ? 'primary' : 'plain'}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Cin7Button>
          <Cin7Button
            variant={isDataTables ? 'primary' : 'plain'}
            onClick={() => navigate('/tables')}
          >
            Data Tables
          </Cin7Button>
        </div>
      </div>
    </div>
  );
};