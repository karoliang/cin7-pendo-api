import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { DataTables } from '@/pages/DataTables';
import { ReportDetails } from '@/pages/ReportDetails';
import './index.css';
import { useEffect } from 'react';

function RouteDebugger() {
  const location = useLocation();

  useEffect(() => {
    console.log('🚀 Route changed to:', location.pathname);
  }, [location]);

  return null;
}

function App() {
  return (
    <>
      <RouteDebugger />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tables" element={<DataTables />} />
        <Route path="/report/:type/:id" element={<ReportDetails />} />
      </Routes>
    </>
  );
}

export default App;