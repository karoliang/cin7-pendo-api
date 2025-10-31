import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { DataTables } from '@/pages/DataTables';
import { ReportDetails } from '@/pages/ReportDetails';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tables" element={<DataTables />} />
        <Route path="/report/:type/:id" element={<ReportDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;