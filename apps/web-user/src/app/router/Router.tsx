import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/features/home/pages';

export const Router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
]);
