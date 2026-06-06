import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { cache, CACHE_KEYS } from '../lib/cache';
import type { User, Provider } from '../types';

const USER_CACHE_STORAGE_KEY = 'hire_one_user_cache';
const PROVIDER_CACHE_STORAGE_KEY = 'hire_one_provider_cache';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  provider: Provider | null;
  loading: boolean;
  initializing: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProvider: () => Promise<void>;
  isAdmin: boolean;
  isProvider: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_CACHE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [provider, setProvider] = useState<Provider | null>(() => {
    try {
      const raw = localStorage.getItem(PROVIDER_CACHE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Provider) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const lastLoadId = useRef(0);

  // Fetch user profile with caching
  const fetchUserProfile = useCallback(async (userId: string, forceRefresh = false): Promise<User | null> => {
    const cacheKey = CACHE_KEYS.userProfile(userId);
    
    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<User>(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      // Cache for 5 minutes
      cache.set(cacheKey, data, 5 * 60 * 1000);
      return data;
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      return null;
    }
  }, []);

  // Fetch provider profile with caching
  const fetchProviderProfile = useCallback(async (userId: string, forceRefresh = false): Promise<Provider | null> => {
    const cacheKey = CACHE_KEYS.providerProfile(userId);
    
    if (!forceRefresh) {
      const cached = cache.get<Provider>(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      
      cache.set(cacheKey, data, 5 * 60 * 1000);
      return data;
    } catch {
      return null;
    }
  }, []);

  // Keep lightweight local cache for faster next load
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_CACHE_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_CACHE_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (provider) {
      localStorage.setItem(PROVIDER_CACHE_STORAGE_KEY, JSON.stringify(provider));
    } else {
      localStorage.removeItem(PROVIDER_CACHE_STORAGE_KEY);
    }
  }, [provider]);

  // Load user data (called after auth)
  const loadUserData = useCallback(async (userId: string, forceRefresh = false) => {
    const loadId = ++lastLoadId.current;

    try {
      // Fetch user first and only hit provider table when role requires it.
      // This removes an unnecessary query for customer/admin users.
      const userData = await fetchUserProfile(userId, forceRefresh);
      const providerData = userData?.role === 'provider'
        ? await fetchProviderProfile(userId, forceRefresh)
        : null;

      // Ignore stale async responses
      if (loadId !== lastLoadId.current) return;

      setUser(userData);
      setProvider(userData?.role === 'provider' ? providerData : null);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, [fetchUserProfile, fetchProviderProfile]);

  // Initialize auth
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        let { data: { session: currentSession } } = await supabase.auth.getSession();

        // Attempt one refresh when session is missing (helps after hard refreshes)
        if (!currentSession) {
          const refreshed = await supabase.auth.refreshSession();
          currentSession = refreshed.data.session;
        }
        
        if (!mounted) return;
        
        setSession(currentSession);

        if (currentSession?.user?.id) {
          await loadUserData(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      // Avoid async directly in callback as recommended by Supabase.
      setTimeout(async () => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user?.id) {
          await loadUserData(newSession.user.id, true);
        } else {
          setUser(null);
          setProvider(null);
          cache.clearUserData();
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (session?.user?.id) {
      const userData = await fetchUserProfile(session.user.id, true);
      setUser(userData);
    }
  }, [session?.user?.id, fetchUserProfile]);

  // Refresh provider data
  const refreshProvider = useCallback(async () => {
    if (session?.user?.id) {
      const providerData = await fetchProviderProfile(session.user.id, true);
      setProvider(providerData);
    }
  }, [session?.user?.id, fetchProviderProfile]);

  // Sign up
  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) return { error: error.message };

      return { error: null };
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Sign in
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };

      return { error: null };
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    cache.clearUserData();
    localStorage.removeItem(USER_CACHE_STORAGE_KEY);
    localStorage.removeItem(PROVIDER_CACHE_STORAGE_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setProvider(null);
    setSession(null);
  };

  const isAdmin = user?.role === 'admin';
  const isProvider = user?.role === 'provider';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        provider,
        loading,
        initializing,
        signUp,
        signIn,
        signOut,
        refreshUser,
        refreshProvider,
        isAdmin,
        isProvider,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
