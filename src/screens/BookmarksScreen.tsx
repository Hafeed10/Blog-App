import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { Post } from '../types/blog';
import { PostCard } from '../components/PostCard';

interface BookmarksScreenProps {
  onSelectPost: (post: Post) => void;
  onExplore: () => void;
}

export const BookmarksScreen: React.FC<BookmarksScreenProps> = ({
  onSelectPost,
  onExplore,
}) => {
  const { colors } = useTheme();
  const { bookmarkedPosts } = useBlog();

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>Reading List</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {bookmarkedPosts.length} {bookmarkedPosts.length === 1 ? 'story' : 'stories'} saved
        for offline reading
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        <Ionicons name="bookmark-outline" size={40} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Your List is Empty</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
        Tap the bookmark icon on any dispatch to save it here for later.
      </Text>
      <TouchableOpacity
        onPress={onExplore}
        style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.exploreBtnText}>Discover Stories</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={bookmarkedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} onPress={onSelectPost} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 240,
  },
  exploreBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
