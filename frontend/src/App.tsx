import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { DataTables } from '@/pages/DataTables';
import { ReportDetails } from '@/pages/ReportDetails';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/tables',
    element: <DataTables />,
  },
  {
    path: '/report/:type/:id',
    element: <ReportDetails />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;