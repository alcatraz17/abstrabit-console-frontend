import { describe, expect, it } from 'vitest';
import {
  isInteractionSettled,
  mergeFeedChanges,
} from '../../../../src/pages/live-log/feed-merge.js';

const item = (id, minute, overrides = {}) => ({
  id,
  status: 'processing',
  command: 'report',
  receivedAt: `2026-10-20T10:${String(minute).padStart(2, '0')}:00.000Z`,
  actions: [],
  ...overrides,
});

const data = (items, hasMore = false) => ({
  pages: [{ items, cursor: 'c1', hasMore }],
  pageParams: [undefined],
});

describe('mergeFeedChanges', () => {
  it('updates rows in place, prepends new rows and advances the cursor', () => {
    const merged = mergeFeedChanges(
      data([item('2', 2), item('1', 1)]),
      { items: [item('3', 3), item('1', 1, { status: 'done' })], cursor: 'c2' },
      {},
    );
    expect(merged.pages[0].items.map((row) => [row.id, row.status])).toEqual([
      ['3', 'processing'],
      ['2', 'processing'],
      ['1', 'done'],
    ]);
    expect(merged.pages[0].cursor).toBe('c2');
  });

  it('drops rows that leave the status filter and skips rows that do not match it', () => {
    const merged = mergeFeedChanges(
      data([item('1', 1, { status: 'failed' })]),
      { items: [item('1', 1, { status: 'done' }), item('2', 2, { status: 'done' })], cursor: 'c2' },
      { status: 'failed' },
    );
    expect(merged.pages[0].items).toEqual([]);
  });

  it('ignores changes older than the loaded window while more pages exist', () => {
    const merged = mergeFeedChanges(
      {
        pages: [
          { items: [item('5', 5)], cursor: 'c1', hasMore: false },
          { items: [item('4', 4)], cursor: 'c1', hasMore: true },
        ],
        pageParams: [undefined, 'x'],
      },
      { items: [item('1', 1, { status: 'done' })], cursor: 'c2' },
      {},
    );
    expect(merged.pages[0].items.map((row) => row.id)).toEqual(['5', '4']);
    expect(merged.pages[0].hasMore).toBe(true);
    expect(merged.pageParams).toEqual([undefined]);
  });

  it('leaves missing data untouched', () => {
    expect(mergeFeedChanges(undefined, { items: [], cursor: 'c' }, {})).toBeUndefined();
  });
});

describe('isInteractionSettled', () => {
  it('waits for processing and unfinished actions', () => {
    expect(isInteractionSettled(item('1', 1))).toBe(false);
    expect(
      isInteractionSettled(item('1', 1, { status: 'partial', actions: [{ status: 'retrying' }] })),
    ).toBe(false);
    expect(
      isInteractionSettled(
        item('1', 1, { status: 'partial', actions: [{ status: 'succeeded' }, { status: 'dead' }] }),
      ),
    ).toBe(true);
    expect(isInteractionSettled(undefined)).toBe(false);
  });
});
