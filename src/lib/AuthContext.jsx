import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext();

const ADMIN_EMAILS = [
  ...(import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
  'hlaingphonemyint20@gmail.com',
];

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(null); // 'admin'|'driver'|'customer'
  const [loading, setLoading] = useState(true);

  const resolveRole = async (authUser) => {
    if (!authUser) { setRole(null); return; }
    // Admin check first (fastest)
    if (ADMIN_EMAILS.includes(authUser.email)) { setRole('admin'); return; }
    // Check user_metadata (set at signUp)
    if (authUser.user_metadata?.role === 'driver') { setRole('driver'); return; }
    // Fallback: check user_roles table (for Supabase-invited drivers)
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (data?.role === 'driver') { setRole('driver'); return; }
    } catch (_) {}
    setRole('customer');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      resolveRole(u).finally(() => setLoading(false));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      resolveRole(u);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user, role, loading,
      isAdmin:  role === 'admin',
      isDriver: role === 'driver',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
