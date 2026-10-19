import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ADMIN, GUILD, reportConfig } from '../helpers/fixtures.js';
import { apiError, installMockApi } from '../helpers/mock-api.js';
import { renderApp } from '../helpers/render.jsx';

const configPath = `/api/admin/guilds/${GUILD.id}/commands/report`;

function commandsApi(extra = {}) {
  return installMockApi({
    'GET /api/auth/me': { admin: ADMIN },
    'GET /api/admin/guilds': { guilds: [GUILD] },
    [`GET ${configPath}`]: reportConfig(),
    ...extra,
  });
}

describe('command configuration', () => {
  it('saves changes with the version they were based on', async () => {
    const api = commandsApi({
      [`PUT ${configPath}`]: ({ body }) => reportConfig({ version: 4, config: body.config }),
    });
    const { user } = renderApp('/commands');

    const save = await screen.findByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    await user.click(screen.getByRole('switch', { name: 'AI summary and tags' }));
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await user.click(save);

    await waitFor(() => expect(api.callsTo('PUT', configPath)).toHaveLength(1));
    const [request] = api.callsTo('PUT', configPath);
    expect(request.body.expectedVersion).toBe(3);
    expect(request.body.config.aiEnabled).toBe(false);
    expect(await screen.findByText('Saved /report as version 4.')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('blocks saving an invalid rule and shows the error next to it', async () => {
    const api = commandsApi();
    const { user } = renderApp('/commands');

    await user.click(await screen.findByRole('button', { name: 'Add rule' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Name the rule.')).toBeInTheDocument();
    expect(
      screen.getByText('Add at least one keyword or severity to match on.'),
    ).toBeInTheDocument();
    expect(api.callsTo('PUT', configPath)).toHaveLength(0);
  });

  it('resolves a version conflict by overwriting with the latest version', async () => {
    let saves = 0;
    const api = commandsApi({
      [`PUT ${configPath}`]: ({ body }) => {
        saves += 1;
        if (saves === 1) {
          api.on(`GET ${configPath}`, reportConfig({ version: 5 }));
          return apiError(
            409,
            'version_conflict',
            'This configuration was changed by someone else.',
          );
        }
        return reportConfig({ version: 6, config: body.config });
      },
    });
    const { user } = renderApp('/commands');

    await user.click(await screen.findByRole('switch', { name: 'Command enabled' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const alert = await screen.findByText('Someone else saved this configuration');
    await user.click(
      within(alert.closest('[role="status"]')).getByRole('button', { name: 'Overwrite with mine' }),
    );

    await waitFor(() => expect(api.callsTo('PUT', configPath)).toHaveLength(2));
    const [first, second] = api.callsTo('PUT', configPath);
    expect(first.body.expectedVersion).toBe(3);
    expect(second.body.expectedVersion).toBe(5);
    expect(second.body.config.enabled).toBe(false);
    expect(await screen.findByText('Saved /report as version 6.')).toBeInTheDocument();
  });

  it('tests the unsaved draft against sample input', async () => {
    const api = commandsApi({
      [`POST /api/admin/guilds/${GUILD.id}/rules/test`]: {
        decision: {
          allowed: true,
          reason: null,
          priority: 'high',
          tags: ['outage'],
          mirror: true,
          postToChannel: true,
          aiEnabled: true,
          visibility: 'ephemeral',
          matchedRuleId: 'outage',
          matchedRuleName: 'Outage keywords',
          matchedKeyword: 'down',
          configVersion: 0,
        },
      },
    });
    const { user } = renderApp('/commands');

    await user.type(await screen.findByLabelText('Report text'), 'Checkout is down');
    await user.click(screen.getByRole('button', { name: 'Run test' }));

    expect(await screen.findByText(/keyword “down”/)).toBeInTheDocument();
    const [request] = api.callsTo('POST', `/api/admin/guilds/${GUILD.id}/rules/test`);
    expect(request.body).toMatchObject({
      command: 'report',
      input: { text: 'Checkout is down', severity: null, recentCountForUser: 0 },
    });
  });
});
