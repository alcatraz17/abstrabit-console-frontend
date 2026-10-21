export const APP_NAME = 'Abstrabit Console';

export const CONFIGURABLE_COMMANDS = Object.freeze(['report', 'status']);
export const FEED_COMMANDS = Object.freeze(['report', 'status', 'connect']);

export const SEVERITIES = Object.freeze(['low', 'medium', 'high']);
export const PRIORITIES = Object.freeze(['low', 'normal', 'high']);
export const VISIBILITIES = Object.freeze(['ephemeral', 'public']);
export const MIRROR_POLICIES = Object.freeze(['always', 'high_only', 'never']);
export const MIRROR_KINDS = Object.freeze(['none', 'discord', 'slack']);
export const TEMPLATE_PLACEHOLDERS = Object.freeze([
  'reportId',
  'priority',
  'tags',
  'rule',
  'user',
]);

export const INTERACTION_STATUSES = Object.freeze([
  'received',
  'processing',
  'done',
  'partial',
  'failed',
  'blocked',
]);

export const LIMITS = Object.freeze({
  reportText: 1000,
  rulesPerCommand: 25,
  ruleName: 60,
  keywordsPerRule: 30,
  keywordLength: 40,
  tagsPerRule: 5,
  tagLength: 24,
  replyTemplate: 500,
  cooldownMaxCount: 50,
  cooldownMinWindowSeconds: 10,
  cooldownMaxWindowSeconds: 3600,
  mirrorUrl: 300,
});

export const POLLING = Object.freeze({
  feedMs: 4000,
  detailMs: 3000,
  overviewMs: 15_000,
  failuresMs: 10_000,
  connectMs: 4000,
});

export const SWEEP_STALE_AFTER_MS = 3 * 60 * 1000;
export const ACK_BUDGET_MS = 3000;

export const LABELS = Object.freeze({
  status: {
    received: 'Received',
    processing: 'Processing',
    done: 'Done',
    partial: 'Partial',
    failed: 'Failed',
    blocked: 'Blocked',
    pending: 'Pending',
    running: 'Running',
    retrying: 'Retrying',
    succeeded: 'Delivered',
    dead: 'Failed',
    skipped: 'Skipped',
    open: 'Open',
    acknowledged: 'Acknowledged',
    escalated: 'Escalated',
    resolved: 'Resolved',
    connected: 'Connected',
    needs_attention: 'Needs attention',
    disconnected: 'Disconnected',
  },
  jobKind: {
    process: 'Processing',
    ai_enrich: 'AI summary',
    discord_reply: 'Reply',
    channel_post: 'Channel card',
    mirror: 'Mirror',
    component_update: 'Card update',
    failure_notice: 'Failure notice',
  },
  blockReason: {
    command_disabled: 'Command turned off',
    empty_text: 'Empty report',
    cooldown: 'Cooldown reached',
  },
  visibility: { ephemeral: 'Only the user (ephemeral)', public: 'Everyone in the channel' },
  mirrorPolicy: {
    always: 'Every report',
    high_only: 'High priority only',
    never: 'Never',
  },
  mirrorKind: { none: 'No mirror', discord: 'Discord webhook', slack: 'Slack webhook' },
  securityEvent: {
    signature_rejected: 'Invalid signature',
    duplicate_interaction: 'Duplicate delivery',
    login_failed: 'Failed sign-in',
    cron_unauthorized: 'Unauthorized sweep call',
  },
  command: { report: '/report', status: '/status', connect: '/connect' },
});
