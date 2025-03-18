import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import DashboardLayout from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Reports from './pages/Reports';
import ReportDetails from './pages/ReportDetails';
import Settings from './pages/Settings';
import RoadReport from './pages/RoadReport';
import DailyReports from './pages/DailyReports';
import RoadMap from './pages/RoadMap';
import Teams from './pages/Teams';
import ServiceOrderForm from './pages/ServiceOrderForm';
import ServiceOrdersList from './pages/ServiceOrdersList';
import Analytics from './pages/Analytics';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'upload',
        element: <Upload />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'reports/:id',
        element: <ReportDetails />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'road-report',
        element: <ServiceOrderForm />,
      },
      {
        path: 'service-orders',
        element: <ServiceOrdersList />,
      },
      {
        path: 'daily-reports',
        element: <DailyReports />,
      },
      {
        path: 'road-map',
        element: <RoadMap />,
      },
      {
        path: 'teams',
        element: <Teams />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);