import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DEFAULT_AVATAR, AdminLoginCredentials } from '../types/auth';
import { supabase } from '../services/supabase';
import { authRateLimiter, sanitizeText, safeJsonParse } from '../utils/security';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoadingAuth: boolean;
  login: (profile: {
    name: string;
    phoneNumber: string;
    countryCode?: string;
    avatarUrl: string;
    role?: string;
    bio?: string;
  }) => Promise<boolean>;
  adminLogin: (credentials: AdminLoginCredentials) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  logout: () => Promise<void>;
  authModalVisible: boolean;
  setAuthModalVisible: (visible: boolean) => void;
  authInitialTab: 'author' | 'admin';
  setAuthInitialTab: (tab: 'author' | 'admin') => void;
  openAdminLogin: () => void;
  profileModalVisible: boolean;
  setProfileModalVisible: (visible: boolean) => void;
  promptLoginForAction: (actionCallback: () => void, reasonMessage?: string) => void;
  executePendingAction: () => void;
  clearPendingAction: () => void;
  authReasonMessage: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = '@app_blog_user_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'author' | 'admin'>('author');
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [authReasonMessage, setAuthReasonMessage] = useState<string | null>(null);

  // Load persisted user on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          const parsed = safeJsonParse<UserProfile | null>(stored, null);
          if (parsed && typeof parsed === 'object') {
            setUser(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load user profile from storage', err);
      } finally {
        setIsLoadingAuth(false);
      }
    })();
  }, []);

  const login = async (profileData: {
    name: string;
    phoneNumber: string;
    countryCode?: string;
    avatarUrl: string;
    role?: string;
    bio?: string;
  }): Promise<boolean> => {
    try {
      const fullProfile: UserProfile = {
        id: `user-${Date.now()}`,
        name: profileData.name.trim(),
        phoneNumber: profileData.phoneNumber.trim(),
        countryCode: profileData.countryCode || '+1',
        avatarUrl: profileData.avatarUrl.trim() || DEFAULT_AVATAR,
        role: profileData.role?.trim() || 'Author',
        bio: profileData.bio?.trim() || '',
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fullProfile));
      setUser(fullProfile);
      setAuthModalVisible(false);
      setAuthReasonMessage(null);

      // If an action was blocked awaiting login (e.g. creating new post), run it now!
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 300);
      }

      return true;
    } catch (err) {
      console.warn('Failed to save user profile', err);
      return false;
    }
  };

  const adminLogin = async (credentials: AdminLoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const email = sanitizeText(credentials.email, 150).trim().toLowerCase();
      const password = credentials.password || '';

      if (!email) {
        return { success: false, error: 'Please enter your administrator email.' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Please enter a valid administrator email address (e.g. admin@chronicle.com).' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      // Brute Force & Rate Limit Protection (max 5 failed attempts per 5 minutes)
      const rateLimitKey = `admin_auth_${email}`;
      const rateCheck = authRateLimiter.isAllowed(rateLimitKey, 5, 5 * 60 * 1000);
      if (!rateCheck.allowed) {
        return {
          success: false,
          error: `Too many login attempts. Access temporarily locked for security. Please retry in ${rateCheck.retryAfterSeconds} seconds.`,
        };
      }

      // Secure authorized credentials check
      const isDemoAdmin = email === 'admin@chronicle.com' && password === 'admin123';

      let authenticatedViaSupabase = false;
      let remoteUserMeta: any = null;

      if (!isDemoAdmin) {
        // For non-demo accounts, authenticate securely with remote Supabase Auth
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!error && data?.user) {
            authenticatedViaSupabase = true;
            remoteUserMeta = data.user.user_metadata;
          }
        } catch {
          // Fallback to local admin verification failure
        }
      }

      const isKnownAdmin = isDemoAdmin || authenticatedViaSupabase;

      if (!isKnownAdmin) {
        return {
          success: false,
          error:
            'Invalid credentials. Access denied. (Demo: admin@chronicle.com / admin123 or registered Supabase Admin).',
        };
      }

      // Successful login resets rate limiter
      authRateLimiter.reset(rateLimitKey);

      const namePart = email.split('@')[0];
      const displayName =
        remoteUserMeta?.full_name ||
        (namePart.toLowerCase() === 'admin'
          ? 'Super Administrator'
          : namePart.charAt(0).toUpperCase() + namePart.slice(1) + ' (Admin)');

      const adminProfile: UserProfile = {
        id: `admin-${Date.now()}`,
        name: displayName,
        email,
        phoneNumber: '',
        countryCode: '',
        avatarUrl:
          remoteUserMeta?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        role: 'System Administrator',
        bio: 'Super Administrator with full editorial and system privileges.',
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminProfile));
      setUser(adminProfile);
      setAuthModalVisible(false);
      setAuthReasonMessage(null);

      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 300);
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Admin login exception', err);
      return { success: false, error: err?.message || 'Admin authentication failed.' };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    try {
      const updatedUser: UserProfile = {
        ...user,
        ...updates,
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    } catch (err) {
      console.warn('Failed to update user profile', err);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      try {
        await supabase.auth.signOut();
      } catch {}
    } catch (err) {
      console.warn('Failed to remove stored user', err);
    } finally {
      setUser(null);
      setProfileModalVisible(false);
    }
  };

  const openAdminLogin = useCallback(() => {
    setAuthInitialTab('admin');
    setAuthModalVisible(true);
  }, []);

  const promptLoginForAction = useCallback(
    (actionCallback: () => void, reasonMessage?: string) => {
      setPendingAction(() => actionCallback);
      setAuthReasonMessage(
        reasonMessage || 'Please sign in or create your profile first to add a new post.'
      );
      setAuthInitialTab('author');
      setAuthModalVisible(true);
    },
    []
  );

  const executePendingAction = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    setAuthReasonMessage(null);
  }, []);

  const isAdmin = Boolean(user && (user.isAdmin || user.role?.toLowerCase().includes('admin')));

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin,
        isLoadingAuth,
        login,
        adminLogin,
        updateProfile,
        logout,
        authModalVisible,
        setAuthModalVisible,
        authInitialTab,
        setAuthInitialTab,
        openAdminLogin,
        profileModalVisible,
        setProfileModalVisible,
        promptLoginForAction,
        executePendingAction,
        clearPendingAction,
        authReasonMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
