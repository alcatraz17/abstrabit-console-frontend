import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth.api.js';
import { setUnauthorizedListener } from '../api/client.js';
import { queryKeys } from '../api/query-keys.js';
import { AuthContext } from './contexts.js';

const SESSION_NOTICES = {
  session_expired: 'Your session has expired. Sign in again to continue.',
  unauthorized: 'You have been signed out. Sign in again to continue.',
};

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState(null);

  const session = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: Infinity,
    retry: 1,
  });

  const clearPrivateData = useCallback(() => {
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    queryClient.setQueryData(queryKeys.me, null);
  }, [queryClient]);

  useEffect(
    () =>
      setUnauthorizedListener((error) => {
        setNotice(SESSION_NOTICES[error.code] ?? SESSION_NOTICES.unauthorized);
        clearPrivateData();
      }),
    [clearPrivateData],
  );

  const signIn = useCallback(
    async (credentials) => {
      const admin = await authApi.login(credentials);
      setNotice(null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
      queryClient.setQueryData(queryKeys.me, admin);
      return admin;
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setNotice(null);
      clearPrivateData();
    }
  }, [clearPrivateData]);

  const value = useMemo(() => {
    let status = 'anonymous';
    if (session.isPending) status = 'loading';
    else if (session.isError) status = 'error';
    else if (session.data) status = 'authenticated';
    return {
      status,
      admin: session.data ?? null,
      error: session.error,
      retry: session.refetch,
      notice,
      dismissNotice: () => setNotice(null),
      signIn,
      signOut,
    };
  }, [
    session.isPending,
    session.isError,
    session.data,
    session.error,
    session.refetch,
    notice,
    signIn,
    signOut,
  ]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
