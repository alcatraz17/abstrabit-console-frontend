import { z } from 'zod';
import { LIMITS, MIRROR_KINDS } from '../constants.js';

const MIRROR_URL_SHAPES = {
  discord:
    /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+\/?$/,
  slack: /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+\/?$/,
};

export const MIRROR_URL_HINTS = {
  discord: 'https://discord.com/api/webhooks/…',
  slack: 'https://hooks.slack.com/services/…',
};

export function settingsSchema({ hasStoredUrl }) {
  return z
    .object({
      postChannelId: z.string().nullable(),
      mirrorKind: z.enum(MIRROR_KINDS),
      mirrorUrl: z.string().trim().max(LIMITS.mirrorUrl, 'The webhook URL is too long.'),
    })
    .superRefine((value, context) => {
      if (value.mirrorKind === 'none') return;
      if (!value.mirrorUrl) {
        if (!hasStoredUrl) {
          context.addIssue({
            code: 'custom',
            path: ['mirrorUrl'],
            message: 'Enter the webhook URL for this mirror.',
          });
        }
        return;
      }
      if (!MIRROR_URL_SHAPES[value.mirrorKind].test(value.mirrorUrl)) {
        context.addIssue({
          code: 'custom',
          path: ['mirrorUrl'],
          message: `Enter a ${value.mirrorKind === 'discord' ? 'Discord' : 'Slack'} webhook URL starting with ${MIRROR_URL_HINTS[value.mirrorKind]}`,
        });
      }
    });
}
