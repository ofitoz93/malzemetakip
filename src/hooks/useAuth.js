import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setRole(profile?.role || 'inspector');
      }
      setLoading(false);
    };

    getSession();
  }, []);

  return { user, role, loading };
};
