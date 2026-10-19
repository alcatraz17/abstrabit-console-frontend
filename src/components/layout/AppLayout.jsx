import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { APP_NAME } from '../../common/constants.js';
import { GuildProvider } from '../../store/GuildProvider.jsx';
import { useAuth, useToast } from '../../store/hooks.js';
import { cx } from '../../utils/cx.js';
import { Button } from '../ui/Button.jsx';
import { DemoBanner } from './DemoBanner.jsx';
import { GuildSwitcher } from './GuildSwitcher.jsx';

const NAVIGATION = [
  { to: '/', label: 'Overview', end: true },
  { to: '/servers', label: 'Servers' },
];

function navClasses({ isActive }) {
  return cx(
    'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  );
}

export function AppLayout() {
  const { admin, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.info('You are signed out on this device. The server could not be reached to confirm.');
    } finally {
      setSigningOut(false);
      navigate('/login', { replace: true });
    }
  }

  return (
    <GuildProvider>
      <div className="flex min-h-dvh flex-col bg-slate-50">
        <DemoBanner />
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
            <span className="flex items-center gap-2 font-semibold text-slate-900">
              <img src="/favicon.svg" alt="" className="size-6" />
              <span className="hidden sm:inline">{APP_NAME}</span>
            </span>
            <GuildSwitcher />
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 md:inline">{admin?.email}</span>
              <Button variant="secondary" size="sm" onClick={handleSignOut} loading={signingOut}>
                Sign out
              </Button>
            </div>
          </div>
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
          >
            {NAVIGATION.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClasses}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </GuildProvider>
  );
}
