import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types/blog';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';

interface HeroCarouselProps {
  post: Post | null;
  onPress: (post: Post) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ post, onPress }) => {
  const { colors } = useTheme();
  const { isBookmarked, toggleBookmark } = useBlog();

  if (!post) return null;

  const bookmarked = isBookmarked(post.id);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(post)}
        style={[styles.card, { borderColor: colors.cardBorder }]}
      >
        {/* Cover Image */}
        <Image source={{ uri: post.cover_image }} style={styles.image} resizeMode="cover" />

        {/* Gradient Overlay for high readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)']}
          style={styles.gradient}
        />

        {/* Top Badges */}
        <View style={styles.topRow}>
            <View style={styles.badgeRow}>
              <View style={styles.featuredBadge}>
                <Ionicons name="flash" size={12} color="#FBBF24" />
                <Text style={styles.featuredText}>FEATURED</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{post.category}</Text>
              </View>
              {(post.audio_url || post.audio_title) && (
                <View style={styles.audioBadge}>
                  <Ionicons name="headset" size={11} color="#60A5FA" />
                  <Text style={styles.audioBadgeText}>AUDIO</Text>
                </View>
              )}
            </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleBookmark(post.id);
            }}
            style={styles.bookmarkButton}
            activeOpacity={0.8}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={bookmarked ? '#3B82F6' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>

          {post.subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {post.subtitle}
            </Text>
          )}

          {/* Footer: Author and Stats */}
          <View style={styles.footerRow}>
            <View style={styles.authorRow}>
              {post.author_avatar ? (
                <Image source={{ uri: post.author_avatar }} style={styles.authorAvatar} />
              ) : (
                <View style={[styles.authorAvatar, { backgroundColor: colors.primary }]} />
              )}
              <View>
                <Text style={styles.authorName}>{post.author_name}</Text>
                <Text style={styles.authorRole}>{post.author_role || 'Contributor'}</Text>
              </View>
            </View>

            <View style={styles.metaRight}>
              <View style={styles.readTimeBadge}>
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text style={styles.readTimeText}>{post.read_time}</Text>
              </View>
              <Text style={styles.heroDateText}>
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  featuredText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  audioBadgeText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  authorRole: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  heroDateText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
});
