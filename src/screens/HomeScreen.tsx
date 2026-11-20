import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { Post } from '../types/blog';
import { Header } from '../components/Header';
import { CategoryFilter } from '../components/CategoryFilter';
import { HeroCarousel } from '../components/HeroCarousel';
import { PostCard } from '../components/PostCard';
// import { DatabaseStatusBanner } from '../components/DatabaseStatusBanner';

interface HomeScreenProps {
  onSelectPost: (post: Post) => void;
  onOpenDatabaseInfo: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPost,
  onOpenDatabaseInfo,
}) => {
  const { colors } = useTheme();
  const {
    filteredPosts,
    featuredPost,
    searchQuery,
    setSearchQuery,
    isLoading,
    isRefreshing,
    refreshPosts,
  } = useBlog();

  const renderHeader = () => (
    <View>
      <Header onOpenDatabaseInfo={onOpenDatabaseInfo} />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search stories, topics, authors..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Database Setup / Status Banner - hidden */}
      {/* <DatabaseStatusBanner onOpenDatabaseInfo={onOpenDatabaseInfo} /> */}

      {/* Featured Hero (shown only when not searching) */}
      {!searchQuery && featuredPost && (
        <HeroCarousel post={featuredPost} onPress={onSelectPost} />
      )}

      {/* Category Pills */}
      <CategoryFilter />

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {searchQuery ? `SEARCH RESULTS (${filteredPosts.length})` : 'LATEST DISPATCHES'}
        </Text>
        <Text style={[styles.sectionCounter, { color: colors.textMuted }]}>
          {filteredPosts.length} stories
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Connecting & loading feed...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Stories Found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? `No articles match "${searchQuery}". Try different keywords.`
            : 'No articles currently available in this category.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} onPress={onSelectPost} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshPosts}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionCounter: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
