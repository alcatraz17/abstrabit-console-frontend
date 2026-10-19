import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/client.js';

function shouldRetry(failureCount, error) {
  if (!(error instanceof ApiError)) return false;
  const transient = error.status === 0 || error.status >= 500;
  return transient && failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 10_000, refetchOnWindowFocus: true },
      mutations: { retry: false },
    },
  });
}
