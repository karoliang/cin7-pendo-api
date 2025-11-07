import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, getCurrentUser, signOut as supabaseSignOut, signInWithGoogle } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        // Validate email domain for cin7.com
        if (session?.user?.email && !session.user.email.endsWith('@cin7.com')) {
          console.error('Invalid email domain. Only @cin7.com emails are allowed.');
          await supabaseSignOut();
          setSession(null);
          setUser(null);
          // Show user-friendly error message
          alert(`Access Denied\n\nOnly @cin7.com email addresses are allowed to access this application.\n\nYou attempted to sign in with: ${session.user.email}\n\nPlease contact your IT administrator if you believe this is an error.`);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      setSession(session);
      setUser(session?.user ?? null);

      // Validate email domain for cin7.com
      if (session?.user?.email && !session.user.email.endsWith('@cin7.com')) {
        console.error('Invalid email domain. Only @cin7.com emails are allowed.');
        await supabaseSignOut();
        setSession(null);
        setUser(null);
        // Show user-friendly error message
        alert(`Access Denied\n\nOnly @cin7.com email addresses are allowed to access this application.\n\nYou attempted to sign in with: ${session.user.email}\n\nPlease contact your IT administrator if you believe this is an error.`);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
