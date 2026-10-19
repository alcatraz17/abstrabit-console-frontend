export const queryKeys = {
  me: ['auth', 'me'],
  bot: ['bot'],
  guilds: ['guilds'],
  channels: (guildId) => ['guilds', guildId, 'channels'],
  commandConfig: (guildId, command) => ['guilds', guildId, 'commands', command],
  overview: (guildId) => ['guilds', guildId, 'overview'],
  feed: (guildId, filters) => ['guilds', guildId, 'feed', filters],
  interaction: (interactionId) => ['interactions', interactionId],
  jobs: (guildId, status) => ['guilds', guildId, 'jobs', status],
  securityEvents: ['security-events'],
};
