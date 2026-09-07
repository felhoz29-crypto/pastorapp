import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Usuario, Iglesia } from '@/types';

interface AuthContextType {
  session: Session | null;
  usuario: Usuario | null;
  iglesia: Iglesia | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iglesia, setIglesia] = useState<Iglesia | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data: usr } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    setUsuario(usr as Usuario | null);

    if (usr) {
      const { data: igl } = await supabase
        .from('iglesias')
        .select('*')
        .eq('id', usr.iglesia_id)
        .maybeSingle();
      setIglesia(igl as Iglesia | null);
    } else {
      setIglesia(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          await loadProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        setUsuario(null);
        setIglesia(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setIglesia(null);
  };

  return (
    <AuthContext.Provider value={{ session, usuario, iglesia, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
