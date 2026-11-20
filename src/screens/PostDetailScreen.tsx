import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();

  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

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

  // Audio simulation timer
  const audioTotalSeconds = 340; // ~5:40 min default
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isPlayingAudio) {
      timerRef.current = setInterval(() => {
        setPlaybackSeconds((prev) => {
          if (prev >= audioTotalSeconds) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlayingAudio, playbackSpeed]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleSpeed = () => {
    if (playbackSpeed === 1.0) setPlaybackSpeed(1.25);
    else if (playbackSpeed === 1.25) setPlaybackSpeed(1.5);
    else if (playbackSpeed === 1.5) setPlaybackSpeed(2.0);
    else setPlaybackSpeed(1.0);
  };

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

    const authorName = user?.name || 'You (Reader)';
    const authorAvatar = user?.avatarUrl;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      post_id: post.id,
      user_name: authorName,
      user_avatar: authorAvatar,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
    };

    setIsSubmittingComment(true);

    if (databaseStatus.tableExists) {
      const added = await addRemoteComment(post.id, authorName, commentText.trim());
      if (added) {
        setComments((prev) => [...prev, { ...added, user_avatar: authorAvatar || added.user_avatar }]);
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

  // Format creation time cleanly
  const formattedCreationTime = () => {
    try {
      const d = new Date(post.created_at);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return post.created_at;
    }
  };

  // Render markdown-like sections, including image markdown `![alt](url)`
  const renderContent = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Image markdown: ![alt](url)
      const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
        const altText = imageMatch[1];
        const imageUrl = imageMatch[2];
        return (
          <View
            key={`img-${idx}`}
            style={[
              styles.contentImageWrapper,
              { borderColor: colors.cardBorder, backgroundColor: colors.card },
            ]}
          >
            <Image source={{ uri: imageUrl }} style={styles.contentImage} resizeMode="cover" />
            {altText ? (
              <View style={[styles.captionBar, { backgroundColor: colors.surface }]}>
                <Ionicons name="camera-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.captionText, { color: colors.textSecondary }]}>
                  {altText}
                </Text>
              </View>
            ) : null}
          </View>
        );
      }

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

  const isMagazineStyle = post.cover_style === 'magazine';
  const isMinimalStyle = post.cover_style === 'minimal';

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
        {/* ============================================================== */}
        {/* 2. COVER PAGE ADD OPTION RENDERING */}
        {/* ============================================================== */}
        <View
          style={[
            styles.heroContainer,
            isMagazineStyle && styles.heroContainerMagazine,
            isMinimalStyle && styles.heroContainerMinimal,
          ]}
        >
          <Image source={{ uri: post.cover_image }} style={styles.heroImage} resizeMode="cover" />
          {isMagazineStyle && (
            <View style={styles.magazineHeroOverlay}>
              <View style={styles.magazineBadgeRow}>
                <View style={styles.magazinePill}>
                  <Text style={styles.magazinePillText}>EDITORIAL DISPATCH</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: colors.badgeBg }]}>
                  <Text style={[styles.categoryText, { color: colors.badgeText }]}>
                    {post.category}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.articleContainer}>
          {/* ============================================================== */}
          {/* 1. CREATION TIME RENDERING */}
          {/* ============================================================== */}
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
            {/* Creation Time display */}
            <View style={styles.creationTimeBadge}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.primary, fontWeight: '700' }]}>
                {formattedCreationTime()}
              </Text>
            </View>
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
                  borderColor: isFollowing ? colors.cardBorder : 'transparent',
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

          {/* ============================================================== */}
          {/* 4. AUDIO ADDING OPTION (AUDIO PLAYER) */}
          {/* ============================================================== */}
          {(post.audio_url || post.audio_title) && (
            <View
              style={[
                styles.audioPlayerCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.audioTopRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsPlayingAudio(!isPlayingAudio)}
                  style={[
                    styles.audioMainPlayBtn,
                    { backgroundColor: isPlayingAudio ? colors.accent : colors.primary },
                  ]}
                >
                  <Ionicons
                    name={isPlayingAudio ? 'pause' : 'play'}
                    size={16}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <View style={styles.audioMetaWrap}>
                  <Text style={[styles.audioTitleText, { color: colors.text }]} numberOfLines={1}>
                    {post.audio_title || 'Audio Edition: Story Narration'}
                  </Text>
                  <Text style={[styles.audioSubText, { color: colors.textMuted }]}>
                    {isPlayingAudio ? 'Playing...' : 'Tap to listen'} • {post.audio_duration || post.read_time}
                  </Text>
                </View>

                {/* Speed toggle */}
                <TouchableOpacity
                  onPress={handleToggleSpeed}
                  style={[styles.audioToolBtn, { backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.speedText, { color: colors.primary }]}>
                    {playbackSpeed}x
                  </Text>
                </TouchableOpacity>

                {/* Mute toggle */}
                <TouchableOpacity
                  onPress={() => setIsMuted(!isMuted)}
                  style={[styles.audioToolBtn, { backgroundColor: colors.surface }]}
                >
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
                    size={15}
                    color={isMuted ? colors.heart : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Progress Scrubber Bar */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressTrack, { backgroundColor: colors.separator }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.accent,
                        width: `${Math.min(100, (playbackSeconds / audioTotalSeconds) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.timeCounterRow}>
                  <Text style={[styles.timeCounterText, { color: colors.textMuted }]}>
                    {formatSeconds(playbackSeconds)}
                  </Text>
                  <Text style={[styles.timeCounterText, { color: colors.textMuted }]}>
                    {post.audio_duration || formatSeconds(audioTotalSeconds)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Article Body */}
          <View style={styles.body}>{renderContent(post.content)}</View>

          {/* ============================================================== */}
          {/* 3. ATTACHED STORY GALLERY RENDERING */}
          {/* ============================================================== */}
          {post.images && post.images.length > 0 && (
            <View style={[styles.gallerySection, { borderTopColor: colors.separator }]}>
              <View style={styles.galleryHeader}>
                <Ionicons name="images-outline" size={16} color={colors.primary} />
                <Text style={[styles.galleryTitle, { color: colors.text }]}>
                  STORY MEDIA & GALLERY ({post.images.length})
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {post.images.map((imgUrl, i) => (
                  <View
                    key={`gal-${i}`}
                    style={[
                      styles.galleryCard,
                      { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    ]}
                  >
                    <Image source={{ uri: imgUrl }} style={styles.galleryImage} resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

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
    position: 'relative',
  },
  heroContainerMagazine: {
    height: 360,
  },
  heroContainerMinimal: {
    height: 180,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  magazineHeroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  magazineBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  magazinePill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  magazinePillText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  articleContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  creationTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
  audioPlayerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  audioTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioMainPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioMetaWrap: {
    flex: 1,
  },
  audioTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  audioSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  audioToolBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeCounterText: {
    fontSize: 10,
    fontWeight: '600',
  },
  body: {
    marginTop: 6,
  },
  contentImageWrapper: {
    marginVertical: 14,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  contentImage: {
    width: '100%',
    height: 220,
  },
  captionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  captionText: {
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
  },
  gallerySection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  galleryTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  galleryScroll: {
    marginBottom: 8,
  },
  galleryCard: {
    width: 160,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
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
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
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
