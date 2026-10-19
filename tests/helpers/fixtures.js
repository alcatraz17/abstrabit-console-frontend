export const ADMIN = { id: 'b7a0c3a8-3f3e-4f57-9d0a-2b1c9e4f0a11', email: 'admin@example.com' };

export const GUILD = {
  id: '300000000000000001',
  name: 'Acme Support',
  status: 'connected',
  attentionReason: null,
  postChannelId: '300000000000000011',
  mirrorKind: 'discord',
  mirrorUrlMasked: 'discord.com/…/••••6789',
  settings: { mirrorOutage: false, slowAi: false },
  connectedAt: '2026-10-19T09:00:00.000Z',
  updatedAt: '2026-10-19T09:00:00.000Z',
};

export const OVERVIEW = {
  commands24h: 12,
  successRate: 0.9167,
  averageAckMs: 420,
  p95AckMs: 910,
  pendingRetries: 1,
  deadJobs: 0,
  openReports: 3,
  openHighPriority: 1,
  rejectedRequests24h: 4,
  lastSweepAt: new Date().toISOString(),
};

export function feedItem(overrides = {}) {
  return {
    id: '400000000000000001',
    kind: 'command',
    command: 'report',
    userName: 'maya',
    inputPreview: 'Checkout is down in the EU',
    status: 'done',
    priority: 'high',
    tags: ['outage'],
    blockReason: null,
    reportId: 42,
    ackMs: 310,
    configVersion: 3,
    aiSummary: null,
    receivedAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:01.000Z',
    actions: [
      {
        id: 'job-reply',
        kind: 'discord_reply',
        status: 'succeeded',
        attempts: 1,
        maxAttempts: 8,
        nextAttemptAt: null,
        lastError: null,
      },
      {
        id: 'job-mirror',
        kind: 'mirror',
        status: 'dead',
        attempts: 8,
        maxAttempts: 8,
        nextAttemptAt: null,
        lastError: 'POST /webhooks/:id/:token returned 404',
      },
    ],
    ...overrides,
  };
}

export function interactionDetail(overrides = {}) {
  const item = feedItem();
  return {
    ...item,
    channelId: '300000000000000010',
    input: { text: 'Checkout is down in the EU', severity: 'high' },
    decision: {
      allowed: true,
      reason: null,
      priority: 'high',
      tags: ['outage'],
      mirror: true,
      postToChannel: true,
      aiEnabled: false,
      visibility: 'ephemeral',
      matchedRuleId: 'outage',
      matchedRuleName: 'Outage keywords',
      matchedKeyword: 'down',
      configVersion: 3,
    },
    ai: null,
    processStatus: 'succeeded',
    report: {
      id: 42,
      status: 'open',
      priority: 'high',
      severity: 'high',
      text: 'Checkout is down in the EU',
      handledByName: null,
      handledAt: null,
      channelId: '300000000000000011',
      channelMessageId: '400000000000000099',
    },
    timeline: [
      {
        id: 'received-1',
        at: '2026-10-20T10:00:00.000Z',
        kind: 'event',
        level: 'info',
        title: 'Interaction received and verified',
        detail: 'Acknowledged in 310 ms',
      },
      {
        id: 'attempt-1',
        at: '2026-10-20T10:00:02.000Z',
        kind: 'attempt',
        level: 'warn',
        title: 'mirror attempt 1: failed',
        detail: 'POST /webhooks/:id/:token returned 404',
        jobKind: 'mirror',
        outcome: 'rejected',
        durationMs: 140,
        httpStatus: 404,
      },
    ],
    ...overrides,
  };
}

export function reportConfig(overrides = {}) {
  return {
    command: 'report',
    version: 3,
    updatedAt: '2026-10-20T09:00:00.000Z',
    config: {
      enabled: true,
      visibility: 'ephemeral',
      postToChannel: true,
      mirrorPolicy: 'always',
      aiEnabled: true,
      cooldown: { maxCount: 3, windowSeconds: 300 },
      replyTemplate: 'Logged as report #{reportId} with {priority} priority.',
      rules: [
        {
          id: 'outage',
          name: 'Outage keywords',
          enabled: true,
          match: { anyKeywords: ['outage', 'down'], severityIn: [] },
          then: { priority: 'high', addTags: ['outage'], mirror: true },
        },
      ],
    },
    ...overrides,
  };
}
