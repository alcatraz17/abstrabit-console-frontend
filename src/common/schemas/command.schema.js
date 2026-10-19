import { z } from 'zod';
import {
  LIMITS,
  MIRROR_POLICIES,
  PRIORITIES,
  SEVERITIES,
  TEMPLATE_PLACEHOLDERS,
  VISIBILITIES,
} from '../constants.js';

const TAG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const PLACEHOLDER = /\{([A-Za-z]+)\}/g;
const KNOWN_PLACEHOLDERS = new Set(TEMPLATE_PLACEHOLDERS);

const fold = (value) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim();

export function findUnknownPlaceholders(template) {
  const unknown = new Set();
  for (const [, name] of template.matchAll(PLACEHOLDER)) {
    if (!KNOWN_PLACEHOLDERS.has(name)) unknown.add(name);
  }
  return [...unknown];
}

function duplicatesOf(values, normalize) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    const key = normalize(value);
    if (seen.has(key)) duplicates.add(value);
    seen.add(key);
  }
  return [...duplicates];
}

const keywordSchema = z
  .string()
  .trim()
  .min(1, 'Keywords cannot be empty.')
  .max(LIMITS.keywordLength, `Keywords are at most ${LIMITS.keywordLength} characters.`)
  .refine((value) => /[\p{L}\p{N}]/u.test(value), 'Keywords need at least one letter or digit.');

const tagSchema = z
  .string()
  .trim()
  .min(1, 'Tags cannot be empty.')
  .max(LIMITS.tagLength, `Tags are at most ${LIMITS.tagLength} characters.`)
  .regex(TAG_PATTERN, 'Tags use lowercase letters, digits, hyphens and underscores.');

export const ruleSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    name: z
      .string()
      .trim()
      .min(1, 'Name the rule.')
      .max(LIMITS.ruleName, `Rule names are at most ${LIMITS.ruleName} characters.`),
    enabled: z.boolean(),
    match: z.object({
      anyKeywords: z
        .array(keywordSchema)
        .max(LIMITS.keywordsPerRule, `A rule has at most ${LIMITS.keywordsPerRule} keywords.`),
      severityIn: z.array(z.enum(SEVERITIES)),
    }),
    then: z.object({
      priority: z.enum(PRIORITIES).nullable(),
      addTags: z
        .array(tagSchema)
        .max(LIMITS.tagsPerRule, `A rule adds at most ${LIMITS.tagsPerRule} tags.`),
      mirror: z.boolean().nullable(),
    }),
  })
  .superRefine((rule, context) => {
    if (rule.match.anyKeywords.length === 0 && rule.match.severityIn.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['match', 'anyKeywords'],
        message: 'Add at least one keyword or severity to match on.',
      });
    }
    if (
      rule.then.priority === null &&
      rule.then.addTags.length === 0 &&
      rule.then.mirror === null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['then', 'priority'],
        message: 'Choose at least one effect: a priority, tags or a mirror setting.',
      });
    }
    const keywords = duplicatesOf(rule.match.anyKeywords, fold);
    if (keywords.length > 0) {
      context.addIssue({
        code: 'custom',
        path: ['match', 'anyKeywords'],
        message: `Duplicate keywords: ${keywords.join(', ')}.`,
      });
    }
    const tags = duplicatesOf(rule.then.addTags, (value) => value);
    if (tags.length > 0) {
      context.addIssue({
        code: 'custom',
        path: ['then', 'addTags'],
        message: `Duplicate tags: ${tags.join(', ')}.`,
      });
    }
  });

export const commandConfigSchema = z
  .object({
    enabled: z.boolean(),
    visibility: z.enum(VISIBILITIES),
    postToChannel: z.boolean(),
    mirrorPolicy: z.enum(MIRROR_POLICIES),
    aiEnabled: z.boolean(),
    cooldown: z
      .object({
        maxCount: z
          .number({ error: 'Enter a number.' })
          .int('Use a whole number.')
          .min(1, 'Allow at least 1 report.')
          .max(LIMITS.cooldownMaxCount, `Allow at most ${LIMITS.cooldownMaxCount} reports.`),
        windowSeconds: z
          .number({ error: 'Enter a number.' })
          .int('Use a whole number.')
          .min(
            LIMITS.cooldownMinWindowSeconds,
            `Use at least ${LIMITS.cooldownMinWindowSeconds} seconds.`,
          )
          .max(
            LIMITS.cooldownMaxWindowSeconds,
            `Use at most ${LIMITS.cooldownMaxWindowSeconds} seconds.`,
          ),
      })
      .nullable(),
    replyTemplate: z
      .string()
      .max(LIMITS.replyTemplate, `Templates are at most ${LIMITS.replyTemplate} characters.`)
      .superRefine((value, context) => {
        const unknown = findUnknownPlaceholders(value);
        if (unknown.length > 0) {
          context.addIssue({
            code: 'custom',
            message: `Unknown placeholders: ${unknown.map((name) => `{${name}}`).join(', ')}.`,
          });
        }
      }),
    rules: z
      .array(ruleSchema)
      .max(LIMITS.rulesPerCommand, `A command has at most ${LIMITS.rulesPerCommand} rules.`),
  })
  .superRefine((config, context) => {
    const ids = config.rules.map((rule) => rule.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', path: ['rules'], message: 'Rule ids must be unique.' });
    }
  });

export const ruleTestInputSchema = z.object({
  text: z.string().max(LIMITS.reportText, `Reports are at most ${LIMITS.reportText} characters.`),
  severity: z.enum(SEVERITIES).nullable(),
  recentCountForUser: z
    .number({ error: 'Enter a number.' })
    .int('Use a whole number.')
    .min(0, 'Use 0 or more.')
    .max(1000, 'Use 1000 or less.'),
});
