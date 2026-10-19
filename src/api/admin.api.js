import { apiRequest, toQueryString } from './client.js';

const guildPath = (guildId) => `/admin/guilds/${encodeURIComponent(guildId)}`;

export const adminApi = {
  bot: (signal) => apiRequest('/admin/bot', { signal }),
  createConnectCode: () => apiRequest('/admin/connect-codes', { method: 'POST' }),

  guilds: async (signal) => (await apiRequest('/admin/guilds', { signal })).guilds,
  channels: async (guildId, signal) =>
    (await apiRequest(`${guildPath(guildId)}/channels`, { signal })).channels,
  saveSettings: async (guildId, settings) =>
    (await apiRequest(`${guildPath(guildId)}/settings`, { method: 'PUT', body: settings })).guild,
  testMirror: (guildId) => apiRequest(`${guildPath(guildId)}/test-mirror`, { method: 'POST' }),
  syncCommands: (guildId) => apiRequest(`${guildPath(guildId)}/commands/sync`, { method: 'POST' }),
  disconnect: (guildId) => apiRequest(guildPath(guildId), { method: 'DELETE' }),
  saveDemo: async (guildId, settings) =>
    (await apiRequest(`${guildPath(guildId)}/demo`, { method: 'PUT', body: settings })).settings,

  commandConfig: (guildId, command, signal) =>
    apiRequest(`${guildPath(guildId)}/commands/${command}`, { signal }),
  saveCommandConfig: (guildId, command, expectedVersion, config) =>
    apiRequest(`${guildPath(guildId)}/commands/${command}`, {
      method: 'PUT',
      body: { expectedVersion, config },
    }),
  testRules: async (guildId, body) =>
    (await apiRequest(`${guildPath(guildId)}/rules/test`, { method: 'POST', body })).decision,

  overview: (guildId, signal) => apiRequest(`${guildPath(guildId)}/overview`, { signal }),
  feed: (guildId, params, signal) =>
    apiRequest(`${guildPath(guildId)}/interactions${toQueryString(params)}`, { signal }),
  interaction: async (interactionId, signal) =>
    (await apiRequest(`/admin/interactions/${encodeURIComponent(interactionId)}`, { signal }))
      .interaction,

  jobs: async (guildId, status, signal) =>
    (await apiRequest(`${guildPath(guildId)}/jobs${toQueryString({ status })}`, { signal })).jobs,
  retryJob: (jobId) =>
    apiRequest(`/admin/jobs/${encodeURIComponent(jobId)}/retry`, { method: 'POST' }),
  retryDeadJobs: (guildId) =>
    apiRequest(`${guildPath(guildId)}/jobs/retry-dead`, { method: 'POST' }),
  securityEvents: async (signal) => (await apiRequest('/admin/security-events', { signal })).events,
};
