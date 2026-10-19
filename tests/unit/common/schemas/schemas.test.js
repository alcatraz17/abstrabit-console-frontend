import { describe, expect, it } from 'vitest';
import { loginSchema } from '../../../../src/common/schemas/auth.schema.js';
import { commandConfigSchema } from '../../../../src/common/schemas/command.schema.js';
import { settingsSchema } from '../../../../src/common/schemas/guild.schema.js';
import { validateWith } from '../../../../src/utils/validation.js';
import { reportConfig } from '../../../helpers/fixtures.js';

const config = () => structuredClone(reportConfig().config);

describe('loginSchema', () => {
  it('normalises the email and reports missing fields', () => {
    expect(
      validateWith(loginSchema, { email: ' Admin@Example.com ', password: 'x' }).data.email,
    ).toBe('Admin@Example.com');
    expect(validateWith(loginSchema, { email: '', password: '' }).fields).toEqual({
      email: 'Enter your email address.',
      password: 'Enter your password.',
    });
    expect(validateWith(loginSchema, { email: 'nope', password: 'x' }).fields.email).toBe(
      'Enter a valid email address.',
    );
  });
});

describe('commandConfigSchema', () => {
  it('accepts the default report configuration', () => {
    expect(validateWith(commandConfigSchema, config()).fields).toBeNull();
  });

  it('points errors at the rule fields the editor shows', () => {
    const draft = config();
    draft.rules[0].name = ' ';
    draft.rules[0].match = { anyKeywords: ['Down', 'down'], severityIn: [] };
    draft.rules[0].then = { priority: null, addTags: ['Bad Tag'], mirror: null };
    const { fields } = validateWith(commandConfigSchema, draft);
    expect(fields['rules.0.name']).toBe('Name the rule.');
    expect(fields['rules.0.match.anyKeywords']).toMatch(/Duplicate keywords/);
    expect(fields['rules.0.then.addTags.0']).toMatch(/lowercase/);
  });

  it('requires a condition and an effect, and rejects unknown placeholders', () => {
    const draft = config();
    draft.rules[0].match = { anyKeywords: [], severityIn: [] };
    draft.rules[0].then = { priority: null, addTags: [], mirror: null };
    draft.replyTemplate = 'Ticket {ticket}';
    const { fields } = validateWith(commandConfigSchema, draft);
    expect(fields['rules.0.match.anyKeywords']).toMatch(/at least one keyword or severity/);
    expect(fields['rules.0.then.priority']).toMatch(/at least one effect/);
    expect(fields.replyTemplate).toBe('Unknown placeholders: {ticket}.');
  });

  it('rejects empty cooldown numbers', () => {
    const draft = config();
    draft.cooldown.maxCount = Number.NaN;
    expect(validateWith(commandConfigSchema, draft).fields['cooldown.maxCount']).toBe(
      'Enter a number.',
    );
  });
});

describe('settingsSchema', () => {
  const discordUrl =
    'https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz_-0123456789';

  it('keeps a stored webhook when the field is left empty', () => {
    const schema = settingsSchema({ hasStoredUrl: true });
    expect(
      validateWith(schema, { postChannelId: null, mirrorKind: 'discord', mirrorUrl: '' }).fields,
    ).toBeNull();
  });

  it('requires a matching webhook URL for a new mirror', () => {
    const schema = settingsSchema({ hasStoredUrl: false });
    expect(
      validateWith(schema, { postChannelId: null, mirrorKind: 'slack', mirrorUrl: '' }).fields
        .mirrorUrl,
    ).toMatch(/Enter the webhook URL/);
    expect(
      validateWith(schema, { postChannelId: null, mirrorKind: 'slack', mirrorUrl: discordUrl })
        .fields.mirrorUrl,
    ).toMatch(/Slack webhook URL/);
    expect(
      validateWith(schema, { postChannelId: null, mirrorKind: 'discord', mirrorUrl: discordUrl })
        .fields,
    ).toBeNull();
  });
});
