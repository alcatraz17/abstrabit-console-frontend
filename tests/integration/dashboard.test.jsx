import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ADMIN, GUILD, OVERVIEW, feedItem, interactionDetail } from '../helpers/fixtures.js';
import { installMockApi, json } from '../helpers/mock-api.js';
import { currentPath, renderApp } from '../helpers/render.jsx';

const base = `/api/admin/guilds/${GUILD.id}`;

function signedInApi(extra = {}) {
  return installMockApi({
    'GET /api/auth/me': { admin: ADMIN },
    'GET /api/admin/guilds': { guilds: [GUILD] },
    [`GET ${base}/overview`]: OVERVIEW,
    ...extra,
  });
}

describe('dashboard', () => {
  it('asks to connect a server when none is linked', async () => {
    installMockApi({
      'GET /api/auth/me': { admin: ADMIN },
      'GET /api/admin/guilds': { guilds: [] },
    });
    renderApp('/');
    expect(await screen.findByText('No Discord server connected yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Connect a server' })).toHaveAttribute(
      'href',
      '/servers',
    );
  });

  it('shows the overview figures for the selected server', async () => {
    signedInApi();
    renderApp('/');
    expect(await screen.findByText('91.7%')).toBeInTheDocument();
    expect(screen.getByText('910 ms')).toBeInTheDocument();
    expect(screen.getByText('1 high priority')).toBeInTheDocument();
  });

  it('lists interactions with their actions and opens the details drawer', async () => {
    const api = signedInApi({
      [`GET ${base}/interactions`]: {
        items: [feedItem()],
        cursor: '2026-10-20T10:00:05.000Z',
        hasMore: false,
      },
      'GET /api/admin/interactions/400000000000000001': { interaction: interactionDetail() },
      'POST /api/admin/jobs/job-mirror/retry': json({ queued: 1 }, 202),
    });
    const { router, user } = renderApp('/live');

    const row = (await screen.findByText('Checkout is down in the EU')).closest('tr');
    expect(within(row).getByText('Mirror 8/8')).toBeInTheDocument();
    expect(within(row).getByText('outage')).toBeInTheDocument();
    expect(within(row).getByText('Delivered')).toHaveAttribute('title', 'Delivery');
    expect(within(row).getByText('Report open')).toHaveAttribute('title', 'Report status');

    await user.click(within(row).getByRole('button', { name: 'Checkout is down in the EU' }));
    expect(currentPath(router)).toBe('/live?interaction=400000000000000001');

    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByText(/Outage keywords/)).toBeInTheDocument();
    expect(within(drawer).getByText('Report #42')).toBeInTheDocument();
    expect(within(drawer).getByText('Delivery')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Open in Discord' })).toHaveAttribute(
      'href',
      `https://discord.com/channels/${GUILD.id}/300000000000000011/400000000000000099`,
    );

    await user.click(within(drawer).getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(api.callsTo('POST', '/api/admin/jobs/job-mirror/retry')).toHaveLength(1),
    );
    expect(await screen.findByText('Retry queued.')).toBeInTheDocument();
  });

  it('passes filters to the feed and offers to clear them', async () => {
    const api = signedInApi({
      [`GET ${base}/interactions`]: {
        items: [],
        cursor: '2026-10-20T10:00:05.000Z',
        hasMore: false,
      },
    });
    const { user } = renderApp('/live');

    await screen.findByText('No interactions yet');
    await user.selectOptions(screen.getByLabelText('Delivery'), 'failed');

    expect(await screen.findByText('No interactions match these filters')).toBeInTheDocument();
    expect(api.callsTo('GET', `${base}/interactions`).at(-1).query).toMatchObject({
      status: 'failed',
      limit: '50',
    });
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('No interactions yet')).toBeInTheDocument();
  });

  it('retries a failed delivery from the failures page', async () => {
    const api = signedInApi({
      [`GET ${base}/jobs`]: ({ query }) => ({
        jobs:
          query.status === 'dead'
            ? [
                {
                  id: 'job-mirror',
                  interactionId: '400000000000000001',
                  kind: 'mirror',
                  status: 'dead',
                  attempts: 8,
                  maxAttempts: 8,
                  nextAttemptAt: null,
                  deadlineAt: null,
                  lastError: 'POST /webhooks/:id/:token returned 404',
                  updatedAt: '2026-10-20T10:05:00.000Z',
                  command: 'report',
                  userName: 'maya',
                  reportId: 42,
                  retryable: true,
                },
              ]
            : [],
      }),
      'GET /api/admin/security-events': {
        events: [
          {
            id: 1,
            at: '2026-10-20T10:01:00.000Z',
            type: 'signature_rejected',
            level: 'warn',
            guildId: null,
            detail: 'invalid_signature',
            ip: '203.0.113.9',
          },
        ],
      },
      [`POST ${base}/jobs/retry-dead`]: json({ queued: 1 }, 202),
    });
    const { user } = renderApp('/failures?jobs=dead');

    expect(await screen.findByText('POST /webhooks/:id/:token returned 404')).toBeInTheDocument();
    expect(await screen.findByText('Invalid signature')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry all failed' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Retry 1' }));

    await waitFor(() => expect(api.callsTo('POST', `${base}/jobs/retry-dead`)).toHaveLength(1));
    expect(await screen.findByText('1 action queued for retry.')).toBeInTheDocument();
  });
});
