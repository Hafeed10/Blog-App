import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { useAuth } from '../context/AuthContext';
import { Post, Category } from '../types/blog';
import { DEFAULT_AVATAR } from '../types/auth';

interface LandingScreenProps {
  onExplore: (category?: Category) => void;
  onSelectPost: (post: Post) => void;
  onCompose: () => void;
  onOpenDatabaseInfo: () => void;
  onOpenBookmarks: () => void;
  onOpenAdmin?: () => void;
  showAdmin?: boolean;
}

const CATEGORIES: { label: Category; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { label: 'All', icon: 'grid-outline', desc: 'All dispatches' },
  { label: 'AI & Tech', icon: 'hardware-chip-outline', desc: 'Neural & Autonomous' },
  { label: 'Design', icon: 'color-palette-outline', desc: 'Spatial & Tactile' },
  { label: 'Engineering', icon: 'construct-outline', desc: 'Systems & Cloud' },
  { label: 'Culture', icon: 'globe-outline', desc: 'Society & Ethics' },
  { label: 'Business', icon: 'trending-up-outline', desc: 'Frontier Ventures' },
];

const FEATURES = [
  {
    icon: 'book-outline' as const,
    title: 'Distraction-Free Typography',
    description:
      'Engineered for sustained focus. Custom font scaling, calibrated line heights, and OLED obsidian dark mode.',
    badge: 'READER FIRST',
  },
  {
    icon: 'headset-outline' as const,
    title: 'Audio Voice Editions',
    description:
      'Synthesized voice narrations for dispatches. Listen while commuting, exercising, or multitasking.',
    badge: 'VOICE READY',
  },
  {
    icon: 'cloud-done-outline' as const,
    title: 'Real-Time Cloud Sync',
    description:
      'Connected to Supabase PostgreSQL with instant state sync, live like counts, and offline resilience.',
    badge: 'SUPABASE CLOUD',
  },
  {
    icon: 'create-outline' as const,
    title: 'Modern Author Studio',
    description:
      'Compose and publish essays in seconds with high-resolution Unsplash photography and markdown formatting.',
    badge: 'PUBLISHING',
  },
  {
    icon: 'bookmark-outline' as const,
    title: 'Offline Reading Sanctum',
    description:
      'Save stories to your local reading list with one tap. Enjoy zero-latency reading even when disconnected.',
    badge: 'LOCAL STORAGE',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'New Model Design',
    description:
      'Glassmorphic frosted cards, glowing category pills, and micro-physics designed for modern mobile and web.',
    badge: 'AESTHETICS',
  },
];

const AUTHORS = [
  {
    name: 'Elena Vance',
    role: 'Design Technologist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Exploring on-device intelligence, agentic design patterns, and human-AI collaborative workflows.',
    followers: '14.2K',
    articles: '18 dispatches',
  },
  {
    name: 'Marcus Thorne',
    role: 'Principal UX Architect',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Investigating chromatic depth, tactile UI elevation, and spatial interactions for future devices.',
    followers: '9.8K',
    articles: '12 dispatches',
  },
  {
    name: 'Dr. Aris Thorne',
    role: 'Robotics & Systems Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    bio: 'Researches autonomous physical systems, neural control loops, and distributed edge computing.',
    followers: '11.5K',
    articles: '15 dispatches',
  },
  {
    name: 'Maya Lin',
    role: 'Distributed Systems',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    bio: 'Pioneering low-latency edge topologies, reactive micro-frontends, and verifiable decentralized data.',
    followers: '16.7K',
    articles: '24 dispatches',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Chronicle feels like the reading sanctuary the internet forgot how to build. Crisp typography, audio editions, and zero clutter.',
    name: 'Sophia Chen',
    title: 'Staff Product Designer at Linear',
  },
  {
    quote:
      'The speed of publishing paired with real-time Supabase cloud sync is unmatched. It has become our engineering team’s favorite platform.',
    name: 'David Keller',
    title: 'VP Engineering at Vercel Labs',
  },
  {
    quote:
      'The font scaling and OLED dark mode make long-form tech reading effortless on both my phone and ultra-wide monitor.',
    name: 'Amara Okafor',
    title: 'AI Ethics Fellow at Oxford',
  },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onExplore,
  onSelectPost,
  onCompose,
  onOpenDatabaseInfo,
  onOpenBookmarks,
  onOpenAdmin,
  showAdmin = false,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { posts, featuredPost, isLiked, toggleLike } = useBlog();
  const { user, isLoggedIn, setAuthModalVisible, setProfileModalVisible } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 680;

  // Responsive typography for Hero Headline (prevents awkward word breaks on mobile/narrow web screens)
  const heroHeadlineFontSize = windowWidth < 420 ? 26 : windowWidth < 680 ? 30 : 38;
  const heroHeadlineLineHeight = windowWidth < 420 ? 34 : windowWidth < 680 ? 38 : 46;

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');

  // Carousel state for Trending Dispatches
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slideScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Primary lead story
  const leadPost = featuredPost || posts[0];
  // Secondary trending stories (excluding lead if possible) - expanded for carousel browsing
  const trendingPosts = posts.filter((p) => p.id !== leadPost?.id).slice(0, 8);

  // Dynamic card width and snap interval for horizontal slider
  const contentWidth = Math.min(windowWidth - 32, 1080);
  const slideCardWidth = contentWidth < 500
    ? Math.round(contentWidth * 0.88)
    : contentWidth < 768
    ? 340
    : 360;
  const slideGap = 14;
  const snapInterval = slideCardWidth + slideGap;

  const handleSlideScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(scrollX / snapInterval);
    if (newIndex >= 0 && newIndex < trendingPosts.length && newIndex !== currentSlideIndex) {
      setCurrentSlideIndex(newIndex);
    }
  };

  const goToSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(index, trendingPosts.length - 1));
    setCurrentSlideIndex(clamped);
    slideScrollRef.current?.scrollTo({
      x: clamped * snapInterval,
      animated: true,
    });
  };

  const handlePrevSlide = () => {
    goToSlide(currentSlideIndex - 1);
  };

  const handleNextSlide = () => {
    goToSlide(currentSlideIndex + 1);
  };

  // Carousel state for Featured Writers (slide option)
  const [currentAuthorSlideIndex, setCurrentAuthorSlideIndex] = useState(0);
  const authorSlideScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Author card width and snap interval for horizontal slider
  const authorCardWidth = contentWidth < 500
    ? Math.round(contentWidth * 0.84)
    : contentWidth < 768
    ? 280
    : 300;
  const authorSlideGap = 14;
  const authorSnapInterval = authorCardWidth + authorSlideGap;

  const handleAuthorSlideScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(scrollX / authorSnapInterval);
    if (newIndex >= 0 && newIndex < AUTHORS.length && newIndex !== currentAuthorSlideIndex) {
      setCurrentAuthorSlideIndex(newIndex);
    }
  };

  const goToAuthorSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(index, AUTHORS.length - 1));
    setCurrentAuthorSlideIndex(clamped);
    authorSlideScrollRef.current?.scrollTo({
      x: clamped * authorSnapInterval,
      animated: true,
    });
  };

  const handlePrevAuthorSlide = () => {
    goToAuthorSlide(currentAuthorSlideIndex - 1);
  };

  const handleNextAuthorSlide = () => {
    goToAuthorSlide(currentAuthorSlideIndex + 1);
  };

  const handleSubscribe = () => {
    if (!newsletterEmail.trim()) {
      setSubscriptionError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail.trim())) {
      setSubscriptionError('Please enter a valid email address.');
      return;
    }

    setSubscriptionError('');
    setIsSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Floating / Sticky Header */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: isDark ? 'rgba(11, 13, 19, 0.85)' : 'rgba(248, 250, 252, 0.92)',
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/favicon.png')}
              style={styles.brandLogoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.brandName, { color: colors.text }]}>CHRONICLE</Text>
              <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
                EDITORIAL MAGAZINE
              </Text>
            </View>
          </View>

          <View style={styles.topBarActions}>
            {/* Theme Toggle */}
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={17}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* Admin Console Shortcut (hidden by default) */}
            {showAdmin && onOpenAdmin && (
              <TouchableOpacity
                onPress={onOpenAdmin}
                style={[
                  styles.iconBtn,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-checkmark" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}

            {/* User Profile or Sign In */}
            {isLoggedIn && user ? (
              <TouchableOpacity
                onPress={() => setProfileModalVisible(true)}
                activeOpacity={0.8}
                style={styles.avatarWrap}
              >
                <Image
                  source={{ uri: user.avatarUrl || DEFAULT_AVATAR }}
                  style={[styles.topAvatar, { borderColor: colors.primary }]}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setAuthModalVisible(true)}
                activeOpacity={0.8}
                style={[styles.signInBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="person" size={12} color="#FFF" />
                <Text style={styles.signInBtnText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.centerWrapper}>
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          {/* Eyebrow Badge */}
          <View
            style={[
              styles.eyebrowBadge,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)',
              },
            ]}
          >
            <Ionicons name="flash" size={13} color={colors.primary} />
            <Text style={[styles.eyebrowText, { color: colors.primary }]}>
              NEXT-GENERATION EDITORIAL PLATFORM
            </Text>
          </View>

          {/* Master Headline */}
          <Text
            style={[
              styles.heroHeadline,
              {
                fontSize: heroHeadlineFontSize,
                lineHeight: heroHeadlineLineHeight,
                color: colors.text,
              },
            ]}
          >
            Where Bold Ideas Meet{' '}
            <Text style={{ color: colors.primary }}>Immersive Storytelling.</Text>
          </Text>

          {/* Subtitle */}
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            An independent publication exploring artificial intelligence, spatial user interfaces,
            systems engineering, and modern culture. Crafted for thinkers, builders, and lifelong
            readers.
          </Text>

          {/* Hero Action Buttons */}
          <View style={styles.heroCtaRow}>
            <TouchableOpacity
              onPress={() => onExplore()}
              style={[styles.primaryCtaBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryCtaText}>Start Reading Stories</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCompose}
              style={[
                styles.secondaryCtaBtn,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color={colors.text} />
              <Text style={[styles.secondaryCtaText, { color: colors.text }]}>Publish a Story</Text>
            </TouchableOpacity>
          </View>

          {/* Live Metrics Row */}
          <View
            style={[
              styles.metricsBar,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>50K+</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Active Readers</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>1.2K+</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Dispatches</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>4.9 ★</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Reader Rating</Text>
            </View>
          </View>
        </View>

        {/* LEAD DISPATCH SPOTLIGHT */}
        {leadPost && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionOverline, { color: colors.primary }]}>
                  EDITOR'S CHOICE
                </Text>
                <Text style={[styles.sectionMainTitle, { color: colors.text }]}>
                  Today's Lead Dispatch
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onExplore()}
                style={styles.seeAllLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>View Feed</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => onSelectPost(leadPost)}
              style={[
                styles.leadCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.leadImageWrap}>
                <Image
                  source={{ uri: leadPost.cover_image }}
                  style={styles.leadImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
                  style={styles.leadGradient}
                />

                <View style={styles.leadTopPills}>
                  <View style={styles.leadFeatureBadge}>
                    <Ionicons name="flash" size={12} color="#FBBF24" />
                    <Text style={styles.leadFeatureText}>FEATURED STORY</Text>
                  </View>
                  <View style={styles.leadCatBadge}>
                    <Text style={styles.leadCatText}>{leadPost.category}</Text>
                  </View>
                  {leadPost.audio_url && (
                    <View style={styles.leadAudioBadge}>
                      <Ionicons name="headset" size={11} color="#60A5FA" />
                      <Text style={styles.leadAudioText}>AUDIO EDITION</Text>
                    </View>
                  )}
                </View>

                <View style={styles.leadOverlayContent}>
                  <Text style={styles.leadTitle} numberOfLines={2}>
                    {leadPost.title}
                  </Text>
                  {leadPost.subtitle && (
                    <Text style={styles.leadSubtitle} numberOfLines={2}>
                      {leadPost.subtitle}
                    </Text>
                  )}

                  <View style={styles.leadAuthorRow}>
                    <View style={styles.authorInfo}>
                      {leadPost.author_avatar ? (
                        <Image
                          source={{ uri: leadPost.author_avatar }}
                          style={styles.leadAuthorAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.leadAuthorAvatar,
                            { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
                          ]}
                        >
                          <Ionicons name="person" size={14} color="#FFF" />
                        </View>
                      )}
                      <View>
                        <Text style={styles.leadAuthorName}>{leadPost.author_name}</Text>
                        <Text style={styles.leadAuthorRole}>
                          {leadPost.author_role || 'Staff Writer'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.leadReadAction}>
                      <Text style={styles.leadReadTime}>{leadPost.read_time}</Text>
                      <View style={styles.readNowPill}>
                        <Text style={styles.readNowText}>Read Story</Text>
                        <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* TOPICS / CHANNELS EXPLORER */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionOverline, { color: colors.primary }]}>
                CURATED CHANNELS
              </Text>
              <Text style={[styles.sectionMainTitle, { color: colors.text }]}>
                Explore by Topic
              </Text>
            </View>
          </View>

          <View style={styles.topicsGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                onPress={() => onExplore(cat.label)}
                style={[
                  styles.topicCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.topicIconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(37, 99, 235, 0.08)',
                    },
                  ]}
                >
                  <Ionicons name={cat.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.topicInfo}>
                  <Text style={[styles.topicTitle, { color: colors.text }]}>{cat.label}</Text>
                  <Text style={[styles.topicDesc, { color: colors.textMuted }]}>{cat.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* TRENDING DISPATCHES PREVIEW */}
        {trendingPosts.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionOverline, { color: colors.primary }]}>
                  LATEST SIGNALS
                </Text>
                <Text style={[styles.sectionMainTitle, { color: colors.text }]}>
                  Trending Dispatches
                </Text>
              </View>

              <View style={styles.sectionHeaderActions}>
                {/* View Mode: Slide */}
                <View
                  style={[
                    styles.viewModeToggle,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.viewModeBtn,
                      styles.viewModeBtnActive,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name="swap-horizontal"
                      size={13}
                      color="#FFFFFF"
                    />
                    <Text
                      style={[
                        styles.viewModeText,
                        { color: '#FFFFFF' },
                      ]}
                    >
                      Slide
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => onExplore()}
                  style={styles.seeAllLink}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>All ({posts.length})</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Trending Cards: Slide Mode (Horizontal Carousel) */}
            <View style={styles.slideContainer}>
                <ScrollView
                  ref={slideScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={snapInterval}
                  snapToAlignment="start"
                  contentContainerStyle={styles.trendingSlideContent}
                  onScroll={handleSlideScroll}
                  scrollEventThrottle={16}
                >
                  {trendingPosts.map((post, index) => {
                    const liked = isLiked(post.id);
                    return (
                      <TouchableOpacity
                        key={post.id}
                        onPress={() => onSelectPost(post)}
                        activeOpacity={0.85}
                        style={[
                          styles.trendingCard,
                          styles.trendingSlideCard,
                          {
                            width: slideCardWidth,
                            marginRight: index === trendingPosts.length - 1 ? 0 : slideGap,
                            backgroundColor: colors.card,
                            borderColor: colors.cardBorder,
                          },
                        ]}
                      >
                        <Image source={{ uri: post.cover_image }} style={styles.trendingThumb} />
                        <View style={styles.trendingBody}>
                          <View style={styles.trendingMetaTop}>
                            <View
                              style={[
                                styles.trendingCatPill,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(59, 130, 246, 0.15)'
                                    : 'rgba(37, 99, 235, 0.08)',
                                },
                              ]}
                            >
                              <Text style={[styles.trendingCatText, { color: colors.primary }]}>
                                {post.category}
                              </Text>
                            </View>
                            <Text style={[styles.trendingReadTime, { color: colors.textMuted }]}>
                              {post.read_time}
                            </Text>
                          </View>

                          <Text style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={2}>
                            {post.title}
                          </Text>

                          {post.subtitle && (
                            <Text
                              style={[styles.trendingSubtitle, { color: colors.textMuted }]}
                              numberOfLines={1}
                            >
                              {post.subtitle}
                            </Text>
                          )}

                          <View style={styles.trendingFooter}>
                            <View style={styles.trendingAuthorRow}>
                              {post.author_avatar ? (
                                <Image
                                  source={{ uri: post.author_avatar }}
                                  style={styles.trendingAuthorAvatar}
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.trendingAuthorAvatar,
                                    { backgroundColor: colors.primary },
                                  ]}
                                />
                              )}
                              <Text
                                style={[styles.trendingAuthorName, { color: colors.textSecondary }]}
                                numberOfLines={1}
                              >
                                {post.author_name}
                              </Text>
                            </View>

                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation?.();
                                toggleLike(post.id);
                              }}
                              style={styles.trendingLikesRow}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={liked ? 'heart' : 'heart-outline'}
                                size={14}
                                color={liked ? '#EF4444' : colors.textMuted}
                              />
                              <Text
                                style={[
                                  styles.trendingLikesText,
                                  { color: liked ? '#EF4444' : colors.textMuted },
                                ]}
                              >
                                {post.likes_count}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Slider Navigation & Pagination Dots Bar */}
                <View style={styles.slideFooterRow}>
                  {/* Pagination Dots */}
                  <View style={styles.slideDotsWrap}>
                    {trendingPosts.map((_, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => goToSlide(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                        style={[
                          styles.slideDot,
                          {
                            backgroundColor: idx === currentSlideIndex ? colors.primary : colors.cardBorder,
                            width: idx === currentSlideIndex ? 20 : 6,
                          },
                        ]}
                      />
                    ))}
                  </View>

                  {/* Left / Right Slide Navigation Buttons & Counter */}
                  <View style={styles.slideArrowsWrap}>
                    <TouchableOpacity
                      onPress={handlePrevSlide}
                      disabled={currentSlideIndex === 0}
                      style={[
                        styles.slideNavBtn,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          opacity: currentSlideIndex === 0 ? 0.35 : 1,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-back" size={16} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.slideCounterText, { color: colors.textMuted }]}>
                      {currentSlideIndex + 1} / {trendingPosts.length}
                    </Text>

                    <TouchableOpacity
                      onPress={handleNextSlide}
                      disabled={currentSlideIndex === trendingPosts.length - 1}
                      style={[
                        styles.slideNavBtn,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          opacity: currentSlideIndex === trendingPosts.length - 1 ? 0.35 : 1,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-forward" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

        {/* PLATFORM CAPABILITIES / BENTO GRID */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionOverline, { color: colors.primary }]}>
                CRAFTED FOR FOCUS
              </Text>
              <Text style={[styles.sectionMainTitle, { color: colors.text }]}>
                The Chronicle Standard
              </Text>
            </View>
          </View>

          <View style={styles.bentoGrid}>
            {FEATURES.map((feat, index) => (
              <View
                key={index}
                style={[
                  styles.bentoCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.bentoCardHeader}>
                  <View
                    style={[
                      styles.bentoIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(37, 99, 235, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons name={feat.icon} size={22} color={colors.primary} />
                  </View>
                  <View
                    style={[
                      styles.bentoBadge,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      },
                    ]}
                  >
                    <Text style={[styles.bentoBadgeText, { color: colors.textMuted }]}>
                      {feat.badge}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.bentoTitle, { color: colors.text }]}>{feat.title}</Text>
                <Text style={[styles.bentoDesc, { color: colors.textSecondary }]}>
                  {feat.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* FEATURED VOICES / AUTHORS */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionOverline, { color: colors.primary }]}>
                CONTRIBUTING MINDS
              </Text>
              <Text style={[styles.sectionMainTitle, { color: colors.text }]}>
                Featured Writers
              </Text>
            </View>

            <View style={styles.sectionHeaderActions}>
              {/* View Mode: Slide only */}
              <View
                style={[
                  styles.viewModeToggle,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.viewModeBtn,
                    styles.viewModeBtnActive,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={13}
                    color="#FFFFFF"
                  />
                  <Text
                    style={[
                      styles.viewModeText,
                      { color: '#FFFFFF' },
                    ]}
                  >
                    Slide
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onCompose}
                style={styles.seeAllLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Join as Writer</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Authors Slide Mode (Horizontal Carousel) */}
          <View style={styles.slideContainer}>
            <ScrollView
              ref={authorSlideScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={authorSnapInterval}
              snapToAlignment="start"
              contentContainerStyle={styles.authorSlideContent}
              onScroll={handleAuthorSlideScroll}
              scrollEventThrottle={16}
            >
              {AUTHORS.map((author, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.authorSlideCard,
                    {
                      width: authorCardWidth,
                      marginRight: idx === AUTHORS.length - 1 ? 0 : authorSlideGap,
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Image source={{ uri: author.avatar }} style={styles.authorCardAvatar} />
                  <Text style={[styles.authorCardName, { color: colors.text }]}>{author.name}</Text>
                  <Text style={[styles.authorCardRole, { color: colors.primary }]}>
                    {author.role}
                  </Text>
                  <Text
                    style={[styles.authorCardBio, { color: colors.textSecondary }]}
                    numberOfLines={3}
                  >
                    {author.bio}
                  </Text>

                  <View style={[styles.authorCardMeta, { borderTopColor: colors.separator }]}>
                    <View style={styles.authorStat}>
                      <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                      <Text style={[styles.authorStatText, { color: colors.textMuted }]}>
                        {author.followers}
                      </Text>
                    </View>
                    <View style={styles.authorStat}>
                      <Ionicons name="document-text-outline" size={13} color={colors.textMuted} />
                      <Text style={[styles.authorStatText, { color: colors.textMuted }]}>
                        {author.articles}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Slider Navigation & Pagination Dots Bar */}
            <View style={styles.slideFooterRow}>
              {/* Pagination Dots */}
              <View style={styles.slideDotsWrap}>
                {AUTHORS.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => goToAuthorSlide(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    style={[
                      styles.slideDot,
                      {
                        backgroundColor:
                          idx === currentAuthorSlideIndex ? colors.primary : colors.cardBorder,
                        width: idx === currentAuthorSlideIndex ? 20 : 6,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Left / Right Slide Navigation Buttons & Counter */}
              <View style={styles.slideArrowsWrap}>
                <TouchableOpacity
                  onPress={handlePrevAuthorSlide}
                  disabled={currentAuthorSlideIndex === 0}
                  style={[
                    styles.slideNavBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      opacity: currentAuthorSlideIndex === 0 ? 0.35 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.slideCounterText, { color: colors.textMuted }]}>
                  {currentAuthorSlideIndex + 1} / {AUTHORS.length}
                </Text>

                <TouchableOpacity
                  onPress={handleNextAuthorSlide}
                  disabled={currentAuthorSlideIndex === AUTHORS.length - 1}
                  style={[
                    styles.slideNavBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      opacity: currentAuthorSlideIndex === AUTHORS.length - 1 ? 0.35 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* TESTIMONIALS / READER REVIEWS */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionOverline, { color: colors.primary }]}>
                COMMUNITY VOICES
              </Text>
              <Text style={[styles.sectionMainTitle, { color: colors.text }]}>
                What Readers Say
              </Text>
            </View>
          </View>

          <View style={styles.testimonialsGrid}>
            {TESTIMONIALS.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.testimonialCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.quoteIconWrap}>
                  <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.testimonialQuote, { color: colors.text }]}>
                  "{item.quote}"
                </Text>
                <View style={styles.testimonialAuthor}>
                  <Text style={[styles.testimonialName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.testimonialTitle, { color: colors.textMuted }]}>
                    {item.title}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* NEWSLETTER SUBSCRIPTION */}
        <View style={styles.sectionWrap}>
          <LinearGradient
            colors={
              isDark
                ? ['#161B2A', '#0F131D']
                : ['#EEF2FF', '#E0E7FF']
            }
            style={[styles.newsletterCard, { borderColor: colors.cardBorder }]}
          >
            <View style={[styles.newsletterIconBox, { backgroundColor: colors.primary }]}>
              <Ionicons name="mail" size={24} color="#FFFFFF" />
            </View>

            <Text style={[styles.newsletterHeadline, { color: colors.text }]}>
              The Sunday Chronicle
            </Text>
            <Text style={[styles.newsletterSub, { color: colors.textSecondary }]}>
              Get our highest-impact dispatches on frontier tech, spatial computing, and modern
              design delivered to your inbox every Sunday morning. No spam, ever.
            </Text>

            {isSubscribed ? (
              <View style={styles.subscribedBox}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={[styles.subscribedTitle, { color: colors.text }]}>
                  You're on the list!
                </Text>
                <Text style={[styles.subscribedDesc, { color: colors.textSecondary }]}>
                  Welcome to Chronicle. Check your inbox this Sunday for our editorial briefing.
                </Text>
              </View>
            ) : (
              <View style={styles.subscriptionForm}>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? '#1F2538' : '#FFFFFF',
                      borderColor: subscriptionError ? '#EF4444' : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    value={newsletterEmail}
                    onChangeText={(val) => {
                      setNewsletterEmail(val);
                      if (subscriptionError) setSubscriptionError('');
                    }}
                    placeholder="Enter your email address..."
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.emailInput,
                      { color: colors.text },
                      Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {},
                    ]}
                  />
                  <TouchableOpacity
                    onPress={handleSubscribe}
                    style={[styles.subscribeBtn, { backgroundColor: colors.primary }]}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.subscribeBtnText}>Subscribe</Text>
                  </TouchableOpacity>
                </View>
                {subscriptionError ? (
                  <Text style={styles.errorText}>{subscriptionError}</Text>
                ) : null}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* FOOTER */}
        <View style={[styles.footer, { borderTopColor: colors.separator }]}>
          <View style={[styles.footerTop, isMobile && styles.footerTopMobile]}>
            <View style={[styles.footerBrand, isMobile && styles.footerBrandMobile]}>
              <View style={styles.brandRow}>
                <Image
                  source={require('../../assets/favicon.png')}
                  style={styles.brandLogoImage}
                  resizeMode="contain"
                />
                <Text style={[styles.brandName, { color: colors.text }]}>CHRONICLE</Text>
              </View>
              <Text style={[styles.footerBio, { color: colors.textSecondary }]}>
                A next-generation publishing platform and editorial magazine for inquisitive
                minds.
              </Text>
            </View>

            <View style={[styles.footerNav, isMobile && styles.footerNavMobile]}>
              <TouchableOpacity
                onPress={() => onExplore()}
                style={styles.footerLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>
                  Stories Feed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onOpenBookmarks}
                style={styles.footerLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>
                  Reading List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onCompose}
                style={styles.footerLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>
                  Publish Story
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onOpenDatabaseInfo}
                style={styles.footerLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>
                  Cloud DB Setup
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={[
              styles.footerBottom,
              { borderTopColor: colors.separator },
              isMobile && styles.footerBottomMobile,
            ]}
          >
            <Text style={[styles.copyrightText, { color: colors.textMuted }]}>
              © 2026 CHRONICLE EDITORIAL. Powered by React Native & Supabase.
            </Text>
            <View style={styles.socialRow}>
              <TouchableOpacity
                onPress={() => onExplore()}
                style={styles.socialIcon}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-github" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onExplore()}
                style={styles.socialIcon}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-twitter" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onExplore()}
                style={styles.socialIcon}
                activeOpacity={0.7}
              >
                <Ionicons name="radio-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  topBar: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  topBarInner: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandLogoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickFeedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  signInBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarWrap: {
    position: 'relative',
  },
  topAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
  },
  centerWrapper: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  heroSection: {
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroHeadline: {
    fontSize: Platform.OS === 'web' ? 36 : 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 44 : 36,
    letterSpacing: -0.6,
    maxWidth: 820,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  heroSub: {
    fontSize: Platform.OS === 'web' ? 15 : 14,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 640,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  heroCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 36,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
  },
  secondaryCtaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 840,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  sectionWrap: {
    marginTop: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 11,
  },
  viewModeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  sectionMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  seeAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  leadCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 6,
  },
  leadImageWrap: {
    width: '100%',
    height: Platform.OS === 'web' ? 420 : 340,
    position: 'relative',
    justifyContent: 'space-between',
  },
  leadImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  leadGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  leadTopPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: 18,
    zIndex: 2,
  },
  leadFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadFeatureText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  leadCatBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadCatText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  leadAudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadAudioText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
  },
  leadOverlayContent: {
    padding: 20,
    zIndex: 2,
  },
  leadTitle: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 26 : 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: Platform.OS === 'web' ? 34 : 26,
    marginBottom: 8,
  },
  leadSubtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  leadAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leadAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  leadAuthorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  leadAuthorRole: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  leadReadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leadReadTime: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  readNowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  readNowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: Platform.OS === 'web' ? 160 : 140,
    gap: 10,
  },
  topicIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  topicDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  slideContainer: {
    width: '100%',
  },
  trendingSlideContent: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  trendingCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
    minWidth: Platform.OS === 'web' ? 300 : '100%',
  },
  trendingSlideCard: {
    flex: 0,
    minWidth: undefined,
  },
  trendingThumb: {
    width: '100%',
    height: 160,
  },
  trendingBody: {
    padding: 14,
  },
  trendingMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendingCatPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendingCatText: {
    fontSize: 10,
    fontWeight: '700',
  },
  trendingReadTime: {
    fontSize: 11,
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  trendingSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  slideFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  slideDotsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slideDot: {
    height: 6,
    borderRadius: 3,
  },
  slideArrowsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slideNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCounterText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  trendingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  trendingAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  trendingAuthorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  trendingAuthorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingLikesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingLikesText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  bentoCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 300 : '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bentoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bentoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bentoTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  bentoDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  authorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  authorSlideContent: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  authorSlideCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  authorCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 240 : '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  authorCardAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 12,
  },
  authorCardName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  authorCardRole: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  authorCardBio: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
    minHeight: 54,
  },
  authorCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  authorStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorStatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  testimonialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  testimonialCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 280 : '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  quoteIconWrap: {
    marginBottom: 10,
  },
  testimonialQuote: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  testimonialAuthor: {},
  testimonialName: {
    fontSize: 13,
    fontWeight: '700',
  },
  testimonialTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  newsletterCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: Platform.OS === 'web' ? 36 : 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  newsletterIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  newsletterHeadline: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  newsletterSub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 560,
    marginBottom: 20,
  },
  subscriptionForm: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    width: '100%',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    fontSize: 13,
    height: 40,
  },
  subscribeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  subscribeBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
  subscribedBox: {
    alignItems: 'center',
    padding: 12,
  },
  subscribedTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  subscribedDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    marginTop: 50,
    paddingTop: 32,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 24,
  },
  footerTopMobile: {
    flexDirection: 'column',
    gap: 20,
    marginBottom: 20,
  },
  footerBrand: {
    maxWidth: 320,
  },
  footerBrandMobile: {
    maxWidth: '100%',
  },
  footerBio: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  footerNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
  },
  footerNavMobile: {
    width: '100%',
    columnGap: 16,
    rowGap: 10,
  },
  footerLink: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  footerBottomMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 14,
  },
  copyrightText: {
    fontSize: 11,
    lineHeight: 16,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  socialIcon: {
    paddingVertical: 4,
    paddingRight: 8,
  },
});