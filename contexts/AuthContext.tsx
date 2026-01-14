
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabase, db, syncToCloud } from '../db';
import { UserProfile, UserRole } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  canEdit: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get profile from local DB based on user email
  // We use live query so if admin updates it, it reflects immediately
  const profile = useLiveQuery(
    async () => {
      if (!user?.email) return null;
      const p = await db.profiles.where('email').equals(user.email).first();
      return p || null;
    },
    [user]
  );

  const refreshSession = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        // 1. Always try to fetch latest profile from Supabase to ensure roles/status are up to date
        const { data: remoteProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (remoteProfile) {
            // Update local DB with remote truth (activates user if changed in cloud)
            await db.profiles.put(remoteProfile);
        } else {
            // 2. If not found remotely (e.g. offline or first creation failed), check local
            const exists = await db.profiles.where('email').equals(session.user.email).first();
            if (!exists) {
                // Create default profile for new user (Viewer, Inactive)
                const newProfile: UserProfile = {
                    id: session.user.id,
                    email: session.user.email,
                    role: 'viewer',
                    isActive: false // Admin must activate
                };
                await db.profiles.add(newProfile);
                // Try to sync to cloud if possible
                syncToCloud('profiles', newProfile);
            }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        refreshSession();
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const isAdmin = (user && profile?.role === 'admin' && profile?.isActive === true) || !user; // Admin if logged in OR local mode (no user)
  const isEditor = ((profile?.role === 'editor' || profile?.role === 'admin') && profile?.isActive === true) || !user;
  const canEdit = isEditor; // Alias

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile: profile ?? null, 
      loading,
      isAdmin,
      isEditor,
      canEdit,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
