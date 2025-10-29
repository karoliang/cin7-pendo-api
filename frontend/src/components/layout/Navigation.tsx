import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isDataTables = location.pathname === '/tables';

  return (
    <div className={`border-b border-gray-200 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <Button
            variant={isDashboard ? "default" : "ghost"}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 py-4"
          >
            <HomeIcon className="h-5 w-5" />
            Dashboard
          </Button>
          <Button
            variant={isDataTables ? "default" : "ghost"}
            onClick={() => navigate('/tables')}
            className="flex items-center gap-2 py-4"
          >
            <TableCellsIcon className="h-5 w-5" />
            Data Tables
          </Button>
        </div>
      </div>
    </div>
  );
};