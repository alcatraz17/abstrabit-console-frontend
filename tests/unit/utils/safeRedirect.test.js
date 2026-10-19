import { describe, expect, it } from 'vitest';
import { safeRedirect } from '../../../src/utils/safeRedirect.js';

describe('safeRedirect', () => {
  it.each([
    ['/live?status=failed', '/live?status=failed'],
    ['/commands#rules', '/commands#rules'],
    ['/servers/../failures', '/failures'],
  ])('keeps the internal path %s', (target, expected) => {
    expect(safeRedirect(target)).toBe(expected);
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['absolute URL', 'https://evil.example/'],
    ['protocol-relative', '//evil.example/path'],
    ['backslash trick', '/\\evil.example'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['embedded newline', '/\n/evil.example'],
    ['tab trick', '/\t/evil.example'],
    ['login loop', '/login?next=/'],
    ['oversized', `/${'a'.repeat(3000)}`],
  ])('falls back for %s', (_label, target) => {
    expect(safeRedirect(target)).toBe('/');
  });

  it('uses the given fallback', () => {
    expect(safeRedirect('https://evil.example', '/live')).toBe('/live');
  });
});
