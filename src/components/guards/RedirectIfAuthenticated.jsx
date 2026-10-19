import { Navigate, Outlet, useSearchParams } from 'react-router';
import { useAuth } from '../../store/hooks.js';
import { safeRedirect } from '../../utils/safeRedirect.js';
import { FullPageLoading } from '../layout/FullPageState.jsx';

export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === 'loading') return <FullPageLoading />;
  if (status === 'authenticated') {
    return <Navigate to={safeRedirect(searchParams.get('next'))} replace />;
  }
  return <Outlet />;
}
