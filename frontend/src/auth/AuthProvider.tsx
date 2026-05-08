import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';
import { AuthContext, type AuthCtx } from './auth-context';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, role, employee_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(uid);
    setProfile(p);
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }
      const p = await fetchProfile(session.user.id);
      setProfile(p);
    })();
  }, [session?.user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    (): AuthCtx => ({ session, profile, loading, refreshProfile, signOut }),
    [session, profile, loading, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
