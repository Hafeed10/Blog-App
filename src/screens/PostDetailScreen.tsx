import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { Post, Comment } from '../types/blog';
import {
  fetchRemoteComments,
  addRemoteComment,
} from '../services/supabase';

interface PostDetailScreenProps {
  post: Post;
  onBack: () => void;
}

export const PostDetailScreen: React.FC<PostDetailScreenProps> = ({ post, onBack }) => {
  const { colors } = useTheme();
  const {
    isBookmarked,
    toggleBookmark,
    isLiked,
    toggleLike,
    databaseStatus,
  } = useBlog();

  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'mock-c1',
      post_id: post.id,
      user_name: 'David Keller',
      user_avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      content:
        'Fascinating insights! The intersection of local NPUs and distributed databases like Supabase is definitely the future.',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const bookmarked = isBookmarked(post.id);
  const liked = isLiked(post.id);

  // Load comments
  useEffect(() => {
    if (databaseStatus.tableExists) {
      (async () => {
        const remote = await fetchRemoteComments(post.id);
        if (remote && remote.length > 0) {
          setComments(remote);
        }
      })();
    }
  }, [post.id, databaseStatus.tableExists]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: post.title,
        message: `${post.title}\n\nRead more on Chronicle:\nhttps://ftpwzsyajenwjfgoddwy.supabase.co/posts/${post.slug}`,
      });
    } catch {
      // ignore
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      post_id: post.id,
      user_name: 'You (Reader)',
      content: commentText.trim(),
      created_at: new Date().toISOString(),
    };

    setIsSubmittingComment(true);

    if (databaseStatus.tableExists) {
      const added = await addRemoteComment(post.id, 'You (Reader)', commentText.trim());
      if (added) {
        setComments((prev) => [...prev, added]);
      } else {
        setComments((prev) => [...prev, newComment]);
      }
    } else {
      setComments((prev) => [...prev, newComment]);
    }

    setCommentText('');
    setIsSubmittingComment(false);
    Alert.alert('Comment Posted', 'Your response has been published!');
  };

  // Render markdown-like sections
  const renderContent = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <Text
            key={idx}
            style={[
              styles.h3,
              {
                color: colors.text,
                fontSize: 18 * fontSizeMultiplier,
              },
            ]}
          >
            {trimmed.replace('### ', '')}
          </Text>
        );
      }

      if (trimmed.startsWith('## ')) {
        return (
          <Text
            key={idx}
            style={[
              styles.h2,
              {
                color: colors.text,
                fontSize: 20 * fontSizeMultiplier,
              },
            ]}
          >
            {trimmed.replace('## ', '')}
          </Text>
        );
      }

      if (trimmed.startsWith('- ')) {
        return (
          <View key={idx} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
            <Text
              style={[
                styles.paragraph,
                styles.bulletText,
                {
                  color: colors.text,
                  fontSize: 16 * fontSizeMultiplier,
                },
              ]}
            >
              {trimmed.replace('- ', '')}
            </Text>
          </View>
        );
      }

      if (trimmed.startsWith('```')) {
        return null;
      }

      if (!trimmed) {
        return <View key={idx} style={{ height: 10 }} />;
      }

      return (
        <Text
          key={idx}
          style={[
            styles.paragraph,
            {
              color: colors.text,
              fontSize: 16 * fontSizeMultiplier,
              lineHeight: 25 * fontSizeMultiplier,
            },
          ]}
        >
          {trimmed}
        </Text>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Floating App Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.separator }]}>
        <TouchableOpacity onPress={onBack} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.navActions}>
          <TouchableOpacity
            onPress={() => setFontSizeMultiplier((m) => (m >= 1.3 ? 0.9 : m + 0.15))}
            style={styles.navBtn}
          >
            <Ionicons name="text-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
            <Ionicons name="share-social-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggleBookmark(post.id)} style={styles.navBtn}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={bookmarked ? colors.primary : colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: post.cover_image }} style={styles.heroImage} resizeMode="cover" />
        </View>

        <View style={styles.articleContainer}>
          {/* Category & Read Time */}
          <View style={styles.metaTop}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.badgeBg }]}>
              <Text style={[styles.categoryText, { color: colors.badgeText }]}>
                {post.category}
              </Text>
            </View>
            <View style={styles.readTime}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.readTimeText, { color: colors.textMuted }]}>
                {post.read_time}
              </Text>
            </View>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>

          {/* Subtitle */}
          {post.subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {post.subtitle}
            </Text>
          ) : null}

          {/* Author Card */}
          <View
            style={[
              styles.authorCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.authorLeft}>
              <Image
                source={{
                  uri:
                    post.author_avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
                }}
                style={styles.authorAvatar}
              />
              <View>
                <Text style={[styles.authorName, { color: colors.text }]}>
                  {post.author_name}
                </Text>
                <Text style={[styles.authorRole, { color: colors.textMuted }]}>
                  {post.author_role || 'Staff Contributor'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsFollowing(!isFollowing)}
              style={[
                styles.followBtn,
                {
                  backgroundColor: isFollowing ? colors.surface : colors.primary,
                  borderColor: isFollowing ? colors.cardBorder : colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.followBtnText,
                  { color: isFollowing ? colors.text : '#FFFFFF' },
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Audio Listen Preview Bar */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsPlayingAudio(!isPlayingAudio)}
            style={[
              styles.audioBar,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.audioPlayIcon,
                { backgroundColor: isPlayingAudio ? colors.accent : colors.primary },
              ]}
            >
              <Ionicons
                name={isPlayingAudio ? 'pause' : 'play'}
                size={14}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.audioTextWrapper}>
              <Text style={[styles.audioTitle, { color: colors.text }]}>
                {isPlayingAudio ? 'Playing Audio Edition...' : 'Listen to this story'}
              </Text>
              <Text style={[styles.audioSub, { color: colors.textMuted }]}>
                {post.read_time} • AI Voice Synthesis Preview
              </Text>
            </View>
            <Ionicons
              name="volume-high-outline"
              size={18}
              color={isPlayingAudio ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>

          {/* Article Body */}
          <View style={styles.body}>{renderContent(post.content)}</View>

          {/* Comments Section */}
          <View style={[styles.commentsSection, { borderTopColor: colors.separator }]}>
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>
                RESPONSES ({comments.length})
              </Text>
            </View>

            {/* Add Comment Input */}
            <View
              style={[
                styles.commentInputBox,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <TextInput
                placeholder="Share your thoughts on this story..."
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                style={[styles.commentInput, { color: colors.text }]}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={isSubmittingComment || !commentText.trim()}
                style={[
                  styles.submitCommentBtn,
                  {
                    backgroundColor: commentText.trim() ? colors.primary : colors.surface,
                  },
                ]}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text
                    style={{
                      color: commentText.trim() ? '#FFF' : colors.textMuted,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    Respond
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* List of comments */}
            {comments.map((comment) => (
              <View
                key={comment.id}
                style={[
                  styles.commentCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.commentUserRow}>
                  <Image
                    source={{
                      uri:
                        comment.user_avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                    }}
                    style={styles.commentAvatar}
                  />
                  <View>
                    <Text style={[styles.commentUser, { color: colors.text }]}>
                      {comment.user_name}
                    </Text>
                    <Text style={[styles.commentDate, { color: colors.textMuted }]}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.commentContent, { color: colors.textSecondary }]}>
                  {comment.content}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Interaction Bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.card, borderTopColor: colors.separator },
        ]}
      >
        <TouchableOpacity
          onPress={() => toggleLike(post.id)}
          style={styles.bottomBarAction}
          activeOpacity={0.7}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? colors.heart : colors.text}
          />
          <Text style={[styles.bottomBarText, { color: colors.text }]}>
            {post.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleBookmark(post.id)}
          style={styles.bottomBarAction}
          activeOpacity={0.7}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={bookmarked ? colors.primary : colors.text}
          />
          <Text style={[styles.bottomBarText, { color: colors.text }]}>
            {bookmarked ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.bottomBarAction} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={20} color={colors.text} />
          <Text style={[styles.bottomBarText, { color: colors.text }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    width: '100%',
    height: 240,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  articleContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorRole: {
    fontSize: 11,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  audioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  audioPlayIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTextWrapper: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  audioSub: {
    fontSize: 11,
  },
  body: {
    marginTop: 6,
  },
  h2: {
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 10,
  },
  h3: {
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    marginBottom: 0,
  },
  commentsSection: {
    marginTop: 30,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  commentsHeader: {
    marginBottom: 14,
  },
  commentsTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  commentInputBox: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  commentInput: {
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  submitCommentBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  commentCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentDate: {
    fontSize: 10,
  },
  commentContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  bottomBarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomBarText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
