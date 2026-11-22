import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { HistoryProvider } from './src/context/HistoryContext';
import { BlogProvider, useBlog } from './src/context/BlogContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { PostDetailScreen } from './src/screens/PostDetailScreen';
import { BookmarksScreen } from './src/screens/BookmarksScreen';
import { DatabaseSetupScreen } from './src/screens/DatabaseSetupScreen';
import { LandingScreen } from './src/screens/LandingScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { CreatePostModal } from './src/components/CreatePostModal';
import { AuthModal } from './src/components/AuthModal';
import { ProfileModal } from './src/components/ProfileModal';
import { Post, Category } from './src/types/blog';

type Tab = 'landing' | 'home' | 'bookmarks' | 'db' | 'admin' | 'settings';

/**
 * Parses URL string (pathname, hash, or query) into corresponding app tab.
 * Admin page works strictly in URL model (e.g. /admin, #/admin, ?tab=admin, or ?admin).
 */
const parseUrlToTab = (urlStr?: string | null): Tab | null => {
  if (!urlStr) return null;
  try {
    const cleanUrl = urlStr.toLowerCase();
    if (
      cleanUrl.includes('/admin') ||
      cleanUrl.includes('#admin') ||
      cleanUrl.includes('#/admin') ||
      cleanUrl.includes('tab=admin') ||
      cleanUrl.includes('admin=true') ||
      cleanUrl.includes('admin=1') ||
      cleanUrl.endsWith('?admin') ||
      cleanUrl.includes('?admin&') ||
      cleanUrl.includes('&admin=')
    ) {
      return 'admin';
    }
    if (
      cleanUrl.includes('/settings') ||
      cleanUrl.includes('#settings') ||
      cleanUrl.includes('#/settings') ||
      cleanUrl.includes('tab=settings') ||
      cleanUrl.endsWith('?settings') ||
      cleanUrl.includes('?settings&') ||
      cleanUrl.includes('&settings=')
    ) {
      return 'settings';
    }
    if (cleanUrl.includes('#bookmarks') || cleanUrl.includes('tab=bookmarks')) {
      return 'bookmarks';
    }
    if (cleanUrl.includes('#home') || cleanUrl.includes('#/home') || cleanUrl.includes('tab=home')) {
      return 'home';
    }
    if (cleanUrl.includes('#landing') || cleanUrl.includes('#/landing') || cleanUrl.includes('tab=landing')) {
      return 'landing';
    }
  } catch {
    // ignore parsing errors
  }
  return null;
};

const getInitialTabFromLocation = (): Tab => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const full = (window.location.pathname || '') + (window.location.hash || '') + (window.location.search || '');
    const detected = parseUrlToTab(full);
    if (detected) return detected;
  }
  return 'landing';
};

// Ensure click-time border color and outline are fully removed on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'expo-remove-click-border-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      *, *::before, *::after {
        outline: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      *:focus, *:focus-visible, *:active {
        outline: none !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      button:focus, input:focus, textarea:focus, select:focus, a:focus, div:focus, [role="button"]:focus, [tabindex]:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function MainApp() {
  const { colors, isDark } = useTheme();
  const { bookmarkedPosts, setSelectedCategory } = useBlog();
  const { isLoggedIn, promptLoginForAction } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTabFromLocation);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isComposeVisible, setIsComposeVisible] = useState(false);

  const navigateToTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (tab === 'admin') {
          const isAlreadyAdmin =
            window.location.pathname.toLowerCase() === '/admin' ||
            window.location.pathname.toLowerCase().endsWith('/admin') ||
            window.location.hash.toLowerCase() === '#/admin' ||
            window.location.hash.toLowerCase() === '#admin';
          if (!isAlreadyAdmin) {
            window.history.pushState({ tab: 'admin' }, '', '/admin');
          }
        } else {
          const isAtAdmin =
            window.location.pathname.toLowerCase().endsWith('/admin') ||
            window.location.hash.toLowerCase() === '#/admin' ||
            window.location.hash.toLowerCase() === '#admin' ||
            window.location.search.toLowerCase().includes('tab=admin') ||
            window.location.search.toLowerCase().includes('admin');
          if (isAtAdmin) {
            window.history.pushState(null, '', '/');
          }
        }
      } catch {
        // Fallback for restricted hash environments
        if (tab === 'admin') {
          window.location.hash = '/admin';
        } else if (window.location.hash.includes('admin')) {
          window.location.hash = '';
        }
      }
    }
  }, []);

  // Sync with Web browser back/forward buttons and hash navigation
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleLocationChange = () => {
        const full = (window.location.pathname || '') + (window.location.hash || '') + (window.location.search || '');
        const tab = parseUrlToTab(full);
        if (tab) {
          setActiveTab(tab);
        } else if (
          window.location.pathname === '/' ||
          window.location.pathname === '' ||
          window.location.hash === '' ||
          window.location.hash === '#'
        ) {
          setActiveTab('landing');
        }
      };

      window.addEventListener('popstate', handleLocationChange);
      window.addEventListener('hashchange', handleLocationChange);
      return () => {
        window.removeEventListener('popstate', handleLocationChange);
        window.removeEventListener('hashchange', handleLocationChange);
      };
    }
  }, []);

  // Sync with Native deep links (e.g. blog://admin)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Linking.getInitialURL().then((url) => {
        const tab = parseUrlToTab(url);
        if (tab) setActiveTab(tab);
      }).catch(() => {});

      const subscription = Linking.addEventListener('url', ({ url }) => {
        const tab = parseUrlToTab(url);
        if (tab) setActiveTab(tab);
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  const handlePressCompose = () => {
    if (!isLoggedIn) {
      promptLoginForAction(() => {
        setIsComposeVisible(true);
      }, 'Please sign in or create your author profile first to add a new post.');
    } else {
      setIsComposeVisible(true);
    }
  };

  // If viewing a single post detail
  if (selectedPost) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <PostDetailScreen post={selectedPost} onBack={() => setSelectedPost(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Screen Views */}
      <View style={styles.content}>
        {activeTab === 'landing' && (
          <LandingScreen
            onExplore={(category?: Category) => {
              if (category) {
                setSelectedCategory(category);
              }
              navigateToTab('home');
            }}
            onSelectPost={(post: Post) => setSelectedPost(post)}
            onCompose={handlePressCompose}
            onOpenDatabaseInfo={() => navigateToTab('db')}
            onOpenBookmarks={() => navigateToTab('bookmarks')}
            onOpenAdmin={() => navigateToTab('admin')}
          />
        )}

        {activeTab === 'home' && (
          <HomeScreen
            onSelectPost={(post: Post) => setSelectedPost(post)}
            onOpenDatabaseInfo={() => navigateToTab('db')}
            onGoToLanding={() => navigateToTab('landing')}
            onOpenAdmin={() => navigateToTab('admin')}
          />
        )}

        {activeTab === 'bookmarks' && (
          <BookmarksScreen
            onSelectPost={(post: Post) => setSelectedPost(post)}
            onExplore={() => navigateToTab('home')}
          />
        )}

        {activeTab === 'db' && (
          <DatabaseSetupScreen onBack={() => navigateToTab('home')} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            onNavigateToTab={(tab) => navigateToTab(tab)}
            onOpenDatabaseInfo={() => navigateToTab('db')}
            onOpenAdmin={() => navigateToTab('admin')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminScreen
            onNavigateToTab={(tab) => navigateToTab(tab)}
            onSelectPost={(post: Post) => setSelectedPost(post)}
            onCompose={handlePressCompose}
          />
        )}
      </View>

      {/* Floating Bottom Navigation Pill Bar (Hidden in Admin Mode; Admin accessible strictly via URL model) */}
      {activeTab !== 'admin' && (
        <View style={styles.bottomNavWrapper}>
          <View
            style={[
              styles.bottomNavBar,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Discover / Landing Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('landing')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === 'landing' ? 'sparkles' : 'sparkles-outline'}
                size={21}
                color={activeTab === 'landing' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: activeTab === 'landing' ? colors.primary : colors.textMuted },
                ]}
              >
                Discover
              </Text>
            </TouchableOpacity>

            {/* Stories / Feed Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('home')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === 'home' ? 'compass' : 'compass-outline'}
                size={21}
                color={activeTab === 'home' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: activeTab === 'home' ? colors.primary : colors.textMuted },
                ]}
              >
                Stories
              </Text>
            </TouchableOpacity>

            {/* Center Compose (+) Trigger */}
            <TouchableOpacity
              style={[styles.composeButton, { backgroundColor: colors.primary }]}
              onPress={handlePressCompose}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Bookmarks Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('bookmarks')}
              activeOpacity={0.7}
            >
              <View style={styles.iconBadgeWrapper}>
                <Ionicons
                  name={activeTab === 'bookmarks' ? 'bookmark' : 'bookmark-outline'}
                  size={21}
                  color={activeTab === 'bookmarks' ? colors.primary : colors.textMuted}
                />
                {bookmarkedPosts.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.badgeText}>{bookmarkedPosts.length}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: activeTab === 'bookmarks' ? colors.primary : colors.textMuted,
                  },
                ]}
              >
                Saved
              </Text>
            </TouchableOpacity>

            {/* Settings Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigateToTab('settings')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
                size={21}
                color={activeTab === 'settings' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: activeTab === 'settings' ? colors.primary : colors.textMuted },
                ]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Compose Post Modal */}
      <CreatePostModal
        visible={isComposeVisible}
        onClose={() => setIsComposeVisible(false)}
      />

      {/* Author Auth & Profile Modals */}
      <AuthModal />
      <ProfileModal onOpenAdmin={() => navigateToTab('admin')} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <HistoryProvider>
            <BlogProvider>
              <MainApp />
            </BlogProvider>
          </HistoryProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bottomNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 460,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 12,
    elevation: 10,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        }),
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 46,
    flex: 1,
    maxWidth: 68,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  iconBadgeWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  composeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    marginHorizontal: 4,
  },
});
