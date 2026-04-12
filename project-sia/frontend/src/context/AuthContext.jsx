import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    console.log('[AuthContext] 🔐 Login attempt:', { identifier, hasPassword: !!password });
    
    try {
      console.log('[AuthContext] 📡 Sending login request to:', `${BACKEND_URL}/api/auth/login`);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      console.log('[AuthContext] 📨 Login response status:', response.status);
      const data = await response.json();
      console.log('[AuthContext] 📦 Login response data:', data);

      if (!response.ok) {
        console.log('[AuthContext] ❌ Login failed:', data.error);
        return { success: false, error: data.error || 'Login failed' };
      }

      // Store user in localStorage and state
      console.log('[AuthContext] 💾 Storing user in localStorage:', data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      console.log('[AuthContext] ✅ Login successful');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[AuthContext] 💥 Login error:', error);
      console.error('[AuthContext] Error details:', {
        message: error.message,
        stack: error.stack
      });
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('adminToken'); // Also clear admin token if exists
    setUser(null);
    console.log('[AuthContext] ✅ Logout complete');
  };

  const signUp = async (userData) => {
    console.log('[AuthContext] 📝 SignUp attempt with data:', {
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
      hasPassword: !!userData.password,
      city: userData.city,
      province: userData.province
    });
    
    try {
      // ✅ FIRST: Create Supabase Auth account
      console.log('[AuthContext] � Creating Supabase account...');
      const { data: supabaseAuth, error: supabaseError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name
          }
        }
      });

      if (supabaseError) {
        console.error('[AuthContext] ❌ Supabase signup failed:', supabaseError.message);
        return { success: false, error: supabaseError.message };
      }

      console.log('[AuthContext] ✅ Supabase account created:', {
        userId: supabaseAuth.user?.id,
        email: supabaseAuth.user?.email
      });

      // ✅ THEN: Create in your backend (with Supabase user ID)
      console.log('[AuthContext] �📡 Sending signup request to:', `${BACKEND_URL}/api/auth/signup`);
      
      const backendData = {
        ...userData,
        supabase_id: supabaseAuth.user.id // Include Supabase ID
      };
      
      console.log('[AuthContext] 📦 Full userData being sent:', backendData);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });

      console.log('[AuthContext] 📨 Signup response status:', response.status);
      const data = await response.json();
      console.log('[AuthContext] 📦 Signup response data:', data);

      if (!response.ok) {
        console.log('[AuthContext] ❌ Backend signup failed:', data.error);
        // Rollback: Delete Supabase account if backend fails
        console.warn('[AuthContext] ⚠️ Rolling back Supabase account...');
        await supabase.auth.signOut();
        return { success: false, error: data.error || 'Signup failed' };
      }

      console.log('[AuthContext] ✅ Signup successful, user created:', data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[AuthContext] 💥 Sign up error:', error);
      console.error('[AuthContext] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const refreshUser = () => {
    // Re-read user from localStorage (useful after profile updates)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('[AuthContext] ✅ User refreshed from localStorage');
      } catch (err) {
        console.error('[AuthContext] Failed to refresh user:', err);
      }
    }
  };

  const updateUserData = (newData) => {
    // Update both state and localStorage
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    console.log('[AuthContext] ✅ User data updated:', updatedUser);
  };

  const value = {
    user,
    login,
    logout,
    signUp,
    isAuthenticated,
    refreshUser,
    updateUserData,
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
