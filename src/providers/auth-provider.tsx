import type { Session, User } from '@supabase/supabase-js';
import { createContext, use, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { signOut as signOutFromSupabase } from '@/services/auth/auth-service';
import { queryClient } from '@/services/query/query-client';
import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase/client';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  signOut: () => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let active = true;

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsLoading(false);

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!active) return;
      setSession(sessionData.session);
      setIsLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session?.user),
      isLoading,
      session,
      signOut: async () => {
        await signOutFromSupabase();
        setSession(null);
        queryClient.clear();
      },
      user: session?.user ?? null,
    }),
    [isLoading, session],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}
