import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { Router } from './router';

export function App() {
  return (
    <AppProvider>
      <RouterProvider router={Router} />
    </AppProvider>
  );
}
