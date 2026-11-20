import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DEFAULT_AVATAR } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  login: (profile: {
    name: string;
    phoneNumber: string;
    countryCode?: string;
    avatarUrl: string;
    role?: string;
    bio?: string;
  }) => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  logout: () => Promise<void>;
  authModalVisible: boolean;
  setAuthModalVisible: (visible: boolean) => void;
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
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [authReasonMessage, setAuthReasonMessage] = useState<string | null>(null);

  // Load persisted user on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
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
      setUser(null);
      setProfileModalVisible(false);
    } catch (err) {
      console.warn('Failed to log out', err);
    }
  };

  const promptLoginForAction = useCallback(
    (actionCallback: () => void, reasonMessage?: string) => {
      setPendingAction(() => actionCallback);
      setAuthReasonMessage(
        reasonMessage || 'Please sign in or create your profile first to add a new post.'
      );
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoadingAuth,
        login,
        updateProfile,
        logout,
        authModalVisible,
        setAuthModalVisible,
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
