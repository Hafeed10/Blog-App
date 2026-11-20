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

  const formattedDateTime = () => {
    try {
      const d = new Date(post.created_at);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return post.created_at;
    }
  };

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
      {/* Cover Image & Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: post.cover_image }} style={styles.image} resizeMode="cover" />
        <View style={styles.topBadgesRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
          {post.cover_style === 'magazine' && (
            <View style={styles.magazineTag}>
              <Text style={styles.magazineTagText}>MAGAZINE</Text>
            </View>
          )}
        </View>

        {/* Media count pill if attached images present */}
        {post.images && post.images.length > 0 && (
          <View style={styles.photoCountBadge}>
            <Ionicons name="images" size={11} color="#FFF" />
            <Text style={styles.photoCountText}>{post.images.length}</Text>
          </View>
        )}
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
          {/* Creation Time display */}
          <View style={styles.timeWrap}>
            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{formattedDateTime()}</Text>
          </View>
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
          <View style={styles.leftMetaRow}>
            <View style={styles.readTime}>
              <Ionicons name="book-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
                {post.read_time}
              </Text>
            </View>

            {/* Audio badge if story has audio option */}
            {(post.audio_url || post.audio_title) && (
              <View style={[styles.audioPill, { backgroundColor: colors.surface }]}>
                <Ionicons name="headset" size={12} color={colors.accent} />
                <Text style={[styles.audioPillText, { color: colors.accent }]}>
                  {post.audio_duration || 'Audio'}
                </Text>
              </View>
            )}
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
  },
  topBadgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  magazineTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  magazineTagText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  photoCountText: {
    color: '#FFF',
    fontSize: 10,
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
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    fontSize: 10,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: 11,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  leftMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: 11,
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  audioPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
