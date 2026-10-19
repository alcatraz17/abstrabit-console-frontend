import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <main className="grid min-h-dvh place-items-center bg-slate-50 text-slate-900">
      <h1 className="text-xl font-semibold">Abstrabit Console</h1>
    </main>
  </StrictMode>,
);
