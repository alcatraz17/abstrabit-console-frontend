import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../store/hooks.js';
import { FullPageError, FullPageLoading } from '../layout/FullPageState.jsx';

export function RequireAuth() {
  const { status, error, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoading />;
  if (status === 'error') return <FullPageError error={error} onRetry={retry} />;
  if (status !== 'authenticated') {
    const next = `${location.pathname}${location.search}`;
    const search = next === '/' ? '' : `?next=${encodeURIComponent(next)}`;
    return <Navigate to={`/login${search}`} replace />;
  }
  return <Outlet />;
}
