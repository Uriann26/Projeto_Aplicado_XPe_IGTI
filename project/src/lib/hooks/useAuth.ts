import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { Profile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  async function handleAuthChange(event: string, session: any) {
    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    } else {
      setUser(null);
      setProfile(null);
      if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    }
  }

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      setProfile(null);
    }
  }

  async function checkUser() {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  return { user, profile, loading };
}