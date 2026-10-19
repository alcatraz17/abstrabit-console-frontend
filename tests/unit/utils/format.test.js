import { describe, expect, it } from 'vitest';
import {
  formatCountdown,
  formatMs,
  formatPercent,
  formatRelative,
  humanize,
} from '../../../src/utils/format.js';

describe('format', () => {
  const now = new Date('2026-10-20T10:00:00Z').getTime();

  it('describes relative times', () => {
    expect(formatRelative('2026-10-20T09:59:58Z', now)).toBe('just now');
    expect(formatRelative('2026-10-20T09:58:00Z', now)).toBe('2 minutes ago');
    expect(formatRelative('2026-10-20T07:00:00Z', now)).toBe('3 hours ago');
    expect(formatRelative('2026-10-20T10:00:30Z', now)).toBe('in 30 seconds');
    expect(formatRelative(null, now)).toBe('—');
    expect(formatRelative('not a date', now)).toBe('—');
  });

  it('formats durations, ratios and countdowns', () => {
    expect(formatMs(312.4)).toBe('312 ms');
    expect(formatMs(2450)).toBe('2.45 s');
    expect(formatMs(null)).toBe('—');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0.9167)).toBe('91.7%');
    expect(formatPercent(null)).toBe('—');
    expect(formatCountdown(125_000)).toBe('2:05');
    expect(formatCountdown(-5)).toBe('0:00');
  });

  it('humanizes identifiers', () => {
    expect(humanize('needs_attention')).toBe('Needs attention');
    expect(humanize('')).toBe('');
  });
});
