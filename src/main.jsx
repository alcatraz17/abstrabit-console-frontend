import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from './App.jsx';
import './index.css';
import { createQueryClient } from './query-client.js';
import { routes } from './routes.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App router={createBrowserRouter(routes)} queryClient={createQueryClient()} />
  </StrictMode>,
);
