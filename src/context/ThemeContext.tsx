import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  isDark: boolean;
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  surface: string;
  separator: string;
  heart: string;
  inputBg: string;
}

const darkColors: ThemeColors = {
  isDark: true,
  background: '#0B0D13',
  card: '#141824',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  text: '#F3F4F6',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#3B82F6',
  accent: '#8B5CF6',
  badgeBg: 'rgba(59, 130, 246, 0.15)',
  badgeText: '#60A5FA',
  surface: '#1E2435',
  separator: 'rgba(255, 255, 255, 0.07)',
  heart: '#EF4444',
  inputBg: '#1B2030',
};

const lightColors: ThemeColors = {
  isDark: false,
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#2563EB',
  accent: '#7C3AED',
  badgeBg: 'rgba(37, 99, 235, 0.1)',
  badgeText: '#1D4ED8',
  surface: '#F1F5F9',
  separator: 'rgba(0, 0, 0, 0.06)',
  heart: '#EF4444',
  inputBg: '#F1F5F9',
};

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(true); // Default to sleek dark modern mode

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved !== null) {
          setIsDark(saved === 'dark');
        } else if (systemScheme === 'light') {
          setIsDark(false);
        }
      } catch {
        // Fallback default
      }
    })();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ colors: isDark ? darkColors : lightColors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
