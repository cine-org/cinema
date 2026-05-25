import { createBrowserRouter } from 'react-router-dom';
import { DashboardPage } from '@/features/dashboard/pages';

export const Router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
]);
