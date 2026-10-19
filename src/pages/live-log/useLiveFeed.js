import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api.js';
import { queryKeys } from '../../api/query-keys.js';
import { POLLING } from '../../common/constants.js';
import { mergeFeedChanges } from './feed-merge.js';

const PAGE_SIZE = 50;

export function useLiveFeed(guildId, command, status) {
  const queryClient = useQueryClient();
  const [live, setLive] = useState({ paused: false, error: null, updatedAt: null });

  const query = useInfiniteQuery({
    queryKey: queryKeys.feed(guildId, { command, status }),
    queryFn: ({ pageParam, signal }) =>
      adminApi.feed(guildId, { command, status, before: pageParam, limit: PAGE_SIZE }, signal),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.items.at(-1)?.receivedAt ?? undefined) : undefined,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const ready = query.isSuccess;
  const paused = live.paused;

  useEffect(() => {
    if (!ready || paused) return undefined;
    const queryKey = queryKeys.feed(guildId, { command, status });
    const controller = new AbortController();
    let timer;

    async function poll() {
      const cursor = queryClient.getQueryData(queryKey)?.pages[0]?.cursor;
      if (cursor && document.visibilityState === 'visible') {
        try {
          const changes = await adminApi.feed(
            guildId,
            { command, since: cursor },
            controller.signal,
          );
          queryClient.setQueryData(queryKey, (current) =>
            mergeFeedChanges(current, changes, { command, status }),
          );
          setLive((current) => ({ ...current, error: null, updatedAt: Date.now() }));
        } catch (error) {
          if (controller.signal.aborted) return;
          setLive((current) => ({ ...current, error }));
        }
      }
      if (!controller.signal.aborted) timer = setTimeout(poll, POLLING.feedMs);
    }

    timer = setTimeout(poll, POLLING.feedMs);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [ready, paused, guildId, command, status, queryClient]);

  return {
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    query,
    live,
    setPaused: (value) => setLive((current) => ({ ...current, paused: value })),
  };
}
