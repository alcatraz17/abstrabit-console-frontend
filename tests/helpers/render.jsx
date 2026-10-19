import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { App } from '../../src/App.jsx';
import { routes } from '../../src/routes.jsx';

export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  });
  const user = userEvent.setup();
  const view = render(<App router={router} queryClient={queryClient} />);
  return { ...view, router, queryClient, user };
}

export function currentPath(router) {
  const { pathname, search } = router.state.location;
  return `${pathname}${search}`;
}
