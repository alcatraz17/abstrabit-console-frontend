import { useContext } from 'react';
import { AuthContext, GuildContext, ToastContext } from './contexts.js';

function useRequiredContext(context, name) {
  const value = useContext(context);
  if (value === null) throw new Error(`${name} must be used inside its provider.`);
  return value;
}

export const useAuth = () => useRequiredContext(AuthContext, 'useAuth');
export const useGuild = () => useRequiredContext(GuildContext, 'useGuild');
export const useToast = () => useRequiredContext(ToastContext, 'useToast');
