import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { BlogProvider, useBlog } from './src/context/BlogContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { PostDetailScreen } from './src/screens/PostDetailScreen';
import { BookmarksScreen } from './src/screens/BookmarksScreen';
import { DatabaseSetupScreen } from './src/screens/DatabaseSetupScreen';
import { CreatePostModal } from './src/components/CreatePostModal';
import { AuthModal } from './src/components/AuthModal';
import { ProfileModal } from './src/components/ProfileModal';
import { Post } from './src/types/blog';

type Tab = 'home' | 'bookmarks' | 'db';

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
  const { bookmarkedPosts } = useBlog();
  const { isLoggedIn, promptLoginForAction } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isComposeVisible, setIsComposeVisible] = useState(false);

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
        {activeTab === 'home' && (
          <HomeScreen
            onSelectPost={(post: Post) => setSelectedPost(post)}
            onOpenDatabaseInfo={() => setActiveTab('db')}
          />
        )}

        {activeTab === 'bookmarks' && (
          <BookmarksScreen
            onSelectPost={(post: Post) => setSelectedPost(post)}
            onExplore={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'db' && (
          <DatabaseSetupScreen onBack={() => setActiveTab('home')} />
        )}
      </View>

      {/* Floating Bottom Navigation Pill Bar */}
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
          {/* Home Tab */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'home' ? 'compass' : 'compass-outline'}
              size={22}
              color={activeTab === 'home' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.navLabel,
                { color: activeTab === 'home' ? colors.primary : colors.textMuted },
              ]}
            >
              Explore
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
            onPress={() => setActiveTab('bookmarks')}
            activeOpacity={0.7}
          >
            <View style={styles.iconBadgeWrapper}>
              <Ionicons
                name={activeTab === 'bookmarks' ? 'bookmark' : 'bookmark-outline'}
                size={22}
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
        </View>
      </View>

      {/* Compose Post Modal */}
      <CreatePostModal
        visible={isComposeVisible}
        onClose={() => setIsComposeVisible(false)}
      />

      {/* Author Auth & Profile Modals */}
      <AuthModal />
      <ProfileModal />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <BlogProvider>
            <MainApp />
          </BlogProvider>
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
    maxWidth: 440,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 16,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
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
