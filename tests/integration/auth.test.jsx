import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ADMIN, GUILD, OVERVIEW } from '../helpers/fixtures.js';
import { apiError, installMockApi, json } from '../helpers/mock-api.js';
import { currentPath, renderApp } from '../helpers/render.jsx';

function signedOutApi(extra = {}) {
  return installMockApi({
    'GET /api/auth/me': apiError(401, 'unauthorized', 'Sign in to continue.'),
    'GET /api/admin/guilds': { guilds: [GUILD] },
    'GET /api/admin/guilds/300000000000000001/overview': OVERVIEW,
    ...extra,
  });
}

async function fillAndSubmit(user, email, password) {
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('authentication', () => {
  it('sends signed-out visitors to the login page and back after signing in', async () => {
    const api = signedOutApi({ 'POST /api/auth/login': { admin: ADMIN } });
    const { router, user } = renderApp('/live?status=failed');

    await screen.findByRole('heading', { name: /Sign in/ });
    expect(currentPath(router)).toBe('/login?next=%2Flive%3Fstatus%3Dfailed');

    api.on('GET /api/admin/guilds/300000000000000001/interactions', {
      items: [],
      cursor: new Date().toISOString(),
      hasMore: false,
    });
    await fillAndSubmit(user, 'admin@example.com', 'correct horse battery');

    await waitFor(() => expect(currentPath(router)).toBe('/live?status=failed'));
    expect(api.callsTo('POST', '/api/auth/login')[0].body).toEqual({
      email: 'admin@example.com',
      password: 'correct horse battery',
    });
  });

  it('validates before calling the API', async () => {
    const api = signedOutApi();
    const { user } = renderApp('/login');
    await screen.findByRole('heading', { name: /Sign in/ });

    await fillAndSubmit(user, 'not-an-email', '');

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(api.callsTo('POST', '/api/auth/login')).toHaveLength(0);
  });

  it('shows the same banner for wrong credentials and clears the password', async () => {
    signedOutApi({
      'POST /api/auth/login': apiError(
        401,
        'invalid_credentials',
        'The email or password is incorrect.',
      ),
    });
    const { user } = renderApp('/login');
    await screen.findByRole('heading', { name: /Sign in/ });

    await fillAndSubmit(user, 'admin@example.com', 'wrong password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The email or password is incorrect.',
    );
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('admin@example.com');
  });

  it('explains rate limiting with the retry time', async () => {
    signedOutApi({
      'POST /api/auth/login': json(
        { error: { code: 'rate_limited', message: 'Too many failed sign-in attempts.' } },
        429,
        { 'Retry-After': '540' },
      ),
    });
    const { user } = renderApp('/login');
    await screen.findByRole('heading', { name: /Sign in/ });

    await fillAndSubmit(user, 'admin@example.com', 'whatever');

    expect(await screen.findByRole('alert')).toHaveTextContent('Try again in 9 minutes.');
  });

  it('ignores external redirect targets', async () => {
    signedOutApi({ 'POST /api/auth/login': { admin: ADMIN } });
    const { router, user } = renderApp('/login?next=https%3A%2F%2Fevil.example');
    await screen.findByRole('heading', { name: /Sign in/ });

    await fillAndSubmit(user, 'admin@example.com', 'correct horse battery');

    await waitFor(() => expect(currentPath(router)).toBe('/'));
  });

  it('signs out and returns to the login page', async () => {
    const api = installMockApi({
      'GET /api/auth/me': { admin: ADMIN },
      'GET /api/admin/guilds': { guilds: [GUILD] },
      'GET /api/admin/guilds/300000000000000001/overview': OVERVIEW,
      'POST /api/auth/logout': json(undefined, 204),
    });
    const { router, user } = renderApp('/');

    await screen.findByText('admin@example.com');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(currentPath(router)).toBe('/login'));
    expect(api.callsTo('POST', '/api/auth/logout')).toHaveLength(1);
  });

  it('returns to the login page with a notice when the session expires', async () => {
    installMockApi({
      'GET /api/auth/me': { admin: ADMIN },
      'GET /api/admin/guilds': apiError(401, 'session_expired', 'Your session has expired.'),
    });
    const { router } = renderApp('/servers');

    expect(await screen.findByText(/Your session has expired/)).toBeInTheDocument();
    expect(currentPath(router)).toBe('/login?next=%2Fservers');
  });
});
