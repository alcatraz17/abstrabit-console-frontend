import { RedirectIfAuthenticated } from './components/guards/RedirectIfAuthenticated.jsx';
import { RequireAuth } from './components/guards/RequireAuth.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { CommandsPage } from './pages/commands/CommandsPage.jsx';
import { LiveLogPage } from './pages/live-log/LiveLogPage.jsx';
import { LoginPage } from './pages/login/LoginPage.jsx';
import { NotFoundPage } from './pages/not-found/NotFoundPage.jsx';
import { OverviewPage } from './pages/overview/OverviewPage.jsx';
import { ServersPage } from './pages/servers/ServersPage.jsx';

export const routes = [
  {
    element: <RedirectIfAuthenticated />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'live', element: <LiveLogPage /> },
          { path: 'commands', element: <CommandsPage /> },
          { path: 'servers', element: <ServersPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
