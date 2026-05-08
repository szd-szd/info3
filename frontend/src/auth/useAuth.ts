import { useContext } from 'react';
import { AuthContext, type AuthCtx } from './auth-context';

export function useAuth(): AuthCtx {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth hors AuthProvider');
  return v;
}
