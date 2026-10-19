import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './store/AuthProvider.jsx';
import { ToastProvider } from './store/ToastProvider.jsx';

export function App({ router, queryClient }) {
  const [client] = useState(queryClient);
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
