import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../lib/types';

export type AuthCtx = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);
