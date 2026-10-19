import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ADMIN, GUILD } from '../helpers/fixtures.js';
import { installMockApi, json } from '../helpers/mock-api.js';
import { renderApp } from '../helpers/render.jsx';

const base = `/api/admin/guilds/${GUILD.id}`;

function serversApi(extra = {}) {
  return installMockApi({
    'GET /api/auth/me': { admin: ADMIN },
    'GET /api/admin/guilds': { guilds: [GUILD] },
    'GET /api/admin/bot': {
      applicationId: '100000000000000001',
      inviteUrl: 'https://discord.com/oauth2/authorize?client_id=100000000000000001',
    },
    [`GET ${base}/channels`]: {
      channels: [
        { id: '300000000000000011', name: 'reports', type: 'text', canPost: true },
        { id: '300000000000000012', name: 'locked', type: 'text', canPost: false },
      ],
    },
    ...extra,
  });
}

describe('servers', () => {
  it('creates a connect code with the command to run', async () => {
    serversApi({
      'POST /api/admin/connect-codes': json(
        {
          code: 'K7M2Q9XB',
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
          command: '/connect code:K7M2Q9XB',
        },
        201,
      ),
    });
    const { user } = renderApp('/servers');

    await user.click(await screen.findByRole('button', { name: 'Generate connect code' }));

    expect(await screen.findByText('K7M2Q9XB')).toBeInTheDocument();
    expect(screen.getByText('/connect code:K7M2Q9XB')).toBeInTheDocument();
    expect(screen.getByText(/Expires in/)).toHaveTextContent(/(10:00|9:5\d)/);
  });

  it('marks channels the bot cannot post in and saves a new mirror', async () => {
    const api = serversApi({
      [`PUT ${base}/settings`]: ({ body }) => ({
        guild: {
          ...GUILD,
          ...body,
          mirrorUrlMasked: 'hooks.slack.com/…/••••ests',
          updatedAt: new Date().toISOString(),
        },
      }),
    });
    const { user } = renderApp('/servers');

    const locked = await screen.findByRole('option', {
      name: '#locked (bot is missing permissions)',
    });
    expect(locked).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Mirror to'), 'slack');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Enter the webhook URL for this mirror.')).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Webhook URL'),
      'https://hooks.slack.com/services/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ittests',
    );
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => expect(api.callsTo('PUT', `${base}/settings`)).toHaveLength(1));
    expect(api.callsTo('PUT', `${base}/settings`)[0].body).toEqual({
      postChannelId: '300000000000000011',
      mirrorKind: 'slack',
      mirrorUrl:
        'https://hooks.slack.com/services/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ittests',
    });
    expect(await screen.findByText('Server settings saved.')).toBeInTheDocument();
  });

  it('disconnects a server after confirmation', async () => {
    const api = serversApi({ [`DELETE ${base}`]: { commandsRemoved: true } });
    const { user } = renderApp('/servers');

    await user.click(await screen.findByRole('button', { name: 'Disconnect' }));
    const dialog = await screen.findByRole('dialog');
    expect(api.callsTo('DELETE', base)).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(api.callsTo('DELETE', base)).toHaveLength(1));
    expect(await screen.findByText('Acme Support was disconnected.')).toBeInTheDocument();
  });
});
