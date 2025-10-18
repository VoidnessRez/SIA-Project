import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // User is set via onAuthStateChange
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('adminToken'); // Also clear admin token if exists
  };

  const signUp = async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { success: false, error: error.message };
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    login,
    logout,
    signUp,
    isAuthenticated,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
