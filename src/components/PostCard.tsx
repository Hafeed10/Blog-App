import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types/blog';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';

interface PostCardProps {
  post: Post;
  onPress: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
  const { colors } = useTheme();
  const { isBookmarked, toggleBookmark, isLiked, toggleLike } = useBlog();

  const bookmarked = isBookmarked(post.id);
  const liked = isLiked(post.id);

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(post)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: post.cover_image }} style={styles.image} />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{post.category}</Text>
        </View>
      </View>

      {/* Details Container */}
      <View style={styles.content}>
        <View style={styles.metaTop}>
          <View style={styles.authorRow}>
            {post.author_avatar ? (
              <Image source={{ uri: post.author_avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]} />
            )}
            <Text style={[styles.authorName, { color: colors.textSecondary }]}>
              {post.author_name}
            </Text>
          </View>
          <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{formattedDate}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {post.title}
        </Text>

        {post.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {post.subtitle}
          </Text>
        ) : null}

        {/* Action Row */}
        <View style={[styles.footer, { borderTopColor: colors.separator }]}>
          <View style={styles.readTime}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
              {post.read_time}
            </Text>
          </View>

          <View style={styles.actions}>
            {/* Like Button */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(post.id);
              }}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={17}
                color={liked ? colors.heart : colors.textMuted}
              />
              <Text
                style={[
                  styles.countText,
                  { color: liked ? colors.heart : colors.textMuted },
                ]}
              >
                {post.likes_count}
              </Text>
            </TouchableOpacity>

            {/* Bookmark Button */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleBookmark(post.id);
              }}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={17}
                color={bookmarked ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 11,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
