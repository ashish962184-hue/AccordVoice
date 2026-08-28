import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLocalMode = !supabase;

  useEffect(() => {
    if (supabase) {
      // Supabase mode
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } else {
      // Local demo mode: check localStorage
      try {
        const savedUser = localStorage.getItem('accordvoice_user');
        const savedToken = localStorage.getItem('accordvoice_token');
        if (savedUser && savedToken) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setSession({ access_token: savedToken, user: parsed });
        }
      } catch (e) {
        console.error('Error loading local session:', e);
      }
      setLoading(false);
    }
  }, []);

  const signUp = async (email, password, fullName = '') => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      return data;
    }

    // Local mode signup
    const userId = 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const localUser = {
      id: userId,
      email: email.trim(),
      user_metadata: { full_name: fullName || email.split('@')[0] },
      created_at: new Date().toISOString(),
    };
    const token = 'local-json-' + btoa(unescape(encodeURIComponent(JSON.stringify(localUser))));

    localStorage.setItem('accordvoice_user', JSON.stringify(localUser));
    localStorage.setItem('accordvoice_token', token);

    setUser(localUser);
    setSession({ access_token: token, user: localUser });
    return { user: localUser, session: { access_token: token, user: localUser } };
  };

  const signIn = async (email, password) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    }

    // Local mode sign in (accept any email/password, or use stored)
    let localUser;
    const savedUser = localStorage.getItem('accordvoice_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.email === email.trim()) {
          localUser = parsed;
        }
      } catch {}
    }

    if (!localUser) {
      const userId = 'local-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
      localUser = {
        id: userId,
        email: email.trim(),
        user_metadata: { full_name: email.split('@')[0] },
        created_at: new Date().toISOString(),
      };
    }

    const token = 'local-json-' + btoa(unescape(encodeURIComponent(JSON.stringify(localUser))));

    localStorage.setItem('accordvoice_user', JSON.stringify(localUser));
    localStorage.setItem('accordvoice_token', token);

    setUser(localUser);
    setSession({ access_token: token, user: localUser });
    return { user: localUser, session: { access_token: token, user: localUser } };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('accordvoice_user');
      localStorage.removeItem('accordvoice_token');
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isLocalMode, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
