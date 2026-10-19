import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { adminApi } from '../api/admin.api.js';
import { queryKeys } from '../api/query-keys.js';
import { readStorage, writeStorage } from '../utils/storage.js';
import { GuildContext } from './contexts.js';

const STORAGE_KEY = 'console.selectedGuildId';

function pickGuild(guilds, preferredId) {
  if (!guilds?.length) return null;
  const preferred = guilds.find((guild) => guild.id === preferredId);
  if (preferred) return preferred;
  return guilds.find((guild) => guild.status !== 'disconnected') ?? guilds[0];
}

export function GuildProvider({ children }) {
  const [preferredId, setPreferredId] = useState(() => readStorage(STORAGE_KEY));

  const guildsQuery = useQuery({
    queryKey: queryKeys.guilds,
    queryFn: ({ signal }) => adminApi.guilds(signal),
  });

  const selectGuild = useCallback((guildId) => {
    setPreferredId(guildId);
    writeStorage(STORAGE_KEY, guildId);
  }, []);

  const value = useMemo(
    () => ({
      guilds: guildsQuery.data ?? [],
      guild: pickGuild(guildsQuery.data, preferredId),
      isLoading: guildsQuery.isPending,
      error: guildsQuery.error,
      refetch: guildsQuery.refetch,
      selectGuild,
    }),
    [
      guildsQuery.data,
      guildsQuery.isPending,
      guildsQuery.error,
      guildsQuery.refetch,
      preferredId,
      selectGuild,
    ],
  );

  return <GuildContext value={value}>{children}</GuildContext>;
}
