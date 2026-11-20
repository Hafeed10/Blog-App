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
import { HomeScreen } from './src/screens/HomeScreen';
import { PostDetailScreen } from './src/screens/PostDetailScreen';
import { BookmarksScreen } from './src/screens/BookmarksScreen';
import { DatabaseSetupScreen } from './src/screens/DatabaseSetupScreen';
import { CreatePostModal } from './src/components/CreatePostModal';
import { Post } from './src/types/blog';

type Tab = 'home' | 'bookmarks' | 'db';

function MainApp() {
  const { colors, isDark } = useTheme();
  const { bookmarkedPosts, databaseStatus } = useBlog();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isComposeVisible, setIsComposeVisible] = useState(false);

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

          {/* Center Compose (+) Trigger */}
          <TouchableOpacity
            style={[styles.composeButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsComposeVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Database Setup Tab */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('db')}
            activeOpacity={0.7}
          >
            <View style={styles.iconBadgeWrapper}>
              <Ionicons
                name={activeTab === 'db' ? 'server' : 'server-outline'}
                size={22}
                color={activeTab === 'db' ? colors.primary : colors.textMuted}
              />
              <View
                style={[
                  styles.dotBadge,
                  {
                    backgroundColor: databaseStatus.tableExists ? '#10B981' : '#F59E0B',
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                { color: activeTab === 'db' ? colors.primary : colors.textMuted },
              ]}
            >
              Database
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compose Post Modal */}
      <CreatePostModal
        visible={isComposeVisible}
        onClose={() => setIsComposeVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BlogProvider>
          <MainApp />
        </BlogProvider>
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
  dotBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 4,
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
