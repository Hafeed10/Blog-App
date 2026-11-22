import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR } from '../types/auth';
import { Category } from '../types/blog';
import { CategoryDragDrop } from './CategoryDragDrop';
import { pickImageFromLibrary, takePhotoWithCamera } from '../services/imagePickerService';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';

const PRESET_AUDIO_TRACKS = [
  {
    title: 'AI Synthesized Voice Edition',
    url: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg',
    duration: '5:40 min',
  },
  {
    title: 'Ambient Deep Focus Brief',
    url: 'https://actions.google.com/sounds/v1/ambient/rain_heavy.ogg',
    duration: '4:15 min',
  },
  {
    title: 'Tech Dispatches Podcast Ep',
    url: 'https://actions.google.com/sounds/v1/science_fiction/glitch_sound.ogg',
    duration: '6:30 min',
  },
];

const CATEGORIES: Category[] = [
  'AI & Tech',
  'Design',
  'Engineering',
  'Culture',
  'Business',
];

type TimePreset = 'now' | '1h' | 'yesterday' | 'custom';
type CoverStyleOption = 'banner' | 'magazine' | 'minimal';
type AudioSourceOption = 'ai' | 'preset' | 'custom';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { createNewPost, databaseStatus } = useBlog();
  const { user, isLoggedIn, promptLoginForAction, setProfileModalVisible } = useAuth();

  // Basic Details
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<Category>('AI & Tech');
  const [authorName, setAuthorName] = useState(user?.name || 'Alex Rivera');
  const [authorRole, setAuthorRole] = useState(user?.role || 'Contributing Writer');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('4 min');

  // Sync author state when logged in user changes
  useEffect(() => {
    if (user) {
      setAuthorName(user.name);
      setAuthorRole(user.role || 'Staff Contributor');
    }
  }, [user, visible]);

  // If somehow modal is triggered without being logged in, redirect to login
  useEffect(() => {
    if (visible && !isLoggedIn) {
      onClose();
      promptLoginForAction(() => {}, 'Please sign in or create your author profile first to add a new post.');
    }
  }, [visible, isLoggedIn]);

  // 1. Creation Time State
  const [timePreset, setTimePreset] = useState<TimePreset>('now');
  const [customDateTime, setCustomDateTime] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 19).replace('T', ' ');
  });

  // 2. Cover Page Option State
  const [coverImage, setCoverImage] = useState(DEFAULT_COVER_IMAGE);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [coverStyle, setCoverStyle] = useState<CoverStyleOption>('banner');

  // 3. Image Option State (Story Images & Gallery)
  const [showImageTool, setShowImageTool] = useState(false);
  const [inlineImageUrl, setInlineImageUrl] = useState('');
  const [inlineImageCaption, setInlineImageCaption] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  // 4. Audio Adding Option State
  const [hasAudio, setHasAudio] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSourceOption>('ai');
  const [audioTitle, setAudioTitle] = useState('Audio Edition: Read Aloud');
  const [audioDuration, setAudioDuration] = useState('4:30 min');
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [previewAudioPlaying, setPreviewAudioPlaying] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickingCover, setIsPickingCover] = useState(false);
  const [isPickingInline, setIsPickingInline] = useState(false);

  const handlePickCoverImage = async () => {
    setIsPickingCover(true);
    try {
      const uri = await pickImageFromLibrary({ aspect: [16, 9], quality: 0.8 });
      if (uri) {
        setCoverImage(uri);
        Alert.alert('Cover Set', 'Your cover image has been updated!');
      }
    } finally {
      setIsPickingCover(false);
    }
  };

  const handleTakeCoverPhoto = async () => {
    setIsPickingCover(true);
    try {
      const uri = await takePhotoWithCamera({ aspect: [16, 9], quality: 0.8 });
      if (uri) {
        setCoverImage(uri);
        Alert.alert('Cover Set', 'Your cover photo has been captured and set!');
      }
    } finally {
      setIsPickingCover(false);
    }
  };

  const handlePickInlineImage = async () => {
    setIsPickingInline(true);
    try {
      const uri = await pickImageFromLibrary({ quality: 0.8 });
      if (uri) {
        setInlineImageUrl(uri);
      }
    } finally {
      setIsPickingInline(false);
    }
  };

  // Compute final ISO creation time
  const getSelectedCreatedAt = (): string => {
    const now = new Date();
    if (timePreset === 'now') {
      return now.toISOString();
    }
    if (timePreset === '1h') {
      return new Date(now.getTime() - 3600000).toISOString();
    }
    if (timePreset === 'yesterday') {
      return new Date(now.getTime() - 86400000).toISOString();
    }
    if (timePreset === 'custom') {
      const parsed = Date.parse(customDateTime);
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString();
      }
    }
    return now.toISOString();
  };

  const formattedDisplayTime = () => {
    try {
      const d = new Date(getSelectedCreatedAt());
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Just now';
    }
  };

  // Insert image markdown snippet into content
  const handleInsertInlineImage = (url: string, caption: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      Alert.alert('Image URL Required', 'Please provide or select an image URL first.');
      return;
    }
    const cleanCaption = caption.trim() || 'Story illustration';
    const markdownSnippet = `\n\n![${cleanCaption}](${cleanUrl})\n\n`;
    setContent((prev) => prev + markdownSnippet);

    // Also track in attached images if not already there
    if (!attachedImages.includes(cleanUrl)) {
      setAttachedImages((prev) => [...prev, cleanUrl]);
    }

    setInlineImageUrl('');
    setInlineImageCaption('');
    setShowImageTool(false);
    Alert.alert('Image Inserted', 'Markdown image tag added to your story content.');
  };

  const handleAddAttachedImage = (url: string) => {
    const clean = url.trim();
    if (!clean) return;
    if (!attachedImages.includes(clean)) {
      setAttachedImages((prev) => [...prev, clean]);
    }
  };

  const handleRemoveAttachedImage = (url: string) => {
    setAttachedImages((prev) => prev.filter((img) => img !== url));
  };

  // Determine final audio URL
  const getFinalAudioUrl = (): string | undefined => {
    if (!hasAudio) return undefined;
    if (audioSource === 'ai') {
      return PRESET_AUDIO_TRACKS[0].url;
    }
    if (audioSource === 'preset') {
      return PRESET_AUDIO_TRACKS[1].url;
    }
    return customAudioUrl.trim() || PRESET_AUDIO_TRACKS[0].url;
  };

  const handlePublish = async () => {
    if (!isLoggedIn || !user) {
      Alert.alert(
        'Author Sign In Required',
        'Please sign in or set up your author profile before publishing.'
      );
      promptLoginForAction(() => {}, 'Please sign in or create your author profile first to add a new post.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a blog post title.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Required Field', 'Please write some content for the blog post.');
      return;
    }

    setIsSubmitting(true);

    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.floor(Math.random() * 1000);

    const finalCreatedAt = getSelectedCreatedAt();
    const finalAudio = getFinalAudioUrl();

    const result = await createNewPost({
      title: title.trim(),
      subtitle: subtitle.trim(),
      slug,
      content: content.trim(),
      cover_image: coverImage,
      cover_style: coverStyle,
      images: attachedImages,
      audio_url: finalAudio,
      audio_title: hasAudio ? audioTitle.trim() || 'Audio Edition' : undefined,
      audio_duration: hasAudio ? audioDuration.trim() || '4:30 min' : undefined,
      category,
      read_time: readTime,
      author_name: user?.name || authorName.trim() || 'Alex Rivera',
      author_avatar: user?.avatarUrl || DEFAULT_AVATAR,
      author_role: user?.role || authorRole.trim() || 'Staff Writer',
      author_phone: user?.phoneNumber,
      is_featured: false,
      created_at: finalCreatedAt,
    });

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Story Published!',
        databaseStatus.tableExists
          ? 'Your story is live and saved directly to Supabase cloud PostgreSQL!'
          : 'Your story has been added to your local feed with your custom creation time, cover page, images, and audio.'
      );
      // Reset form
      setTitle('');
      setSubtitle('');
      setContent('');
      setAttachedImages([]);
      setHasAudio(false);
      onClose();
    } else {
      Alert.alert('Publication Note', result.error || 'Saved locally.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header Bar */}
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Compose Dispatch</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              Rich media story editor
            </Text>
          </View>
          <TouchableOpacity
            onPress={handlePublish}
            disabled={isSubmitting}
            style={[styles.publishBtn, { backgroundColor: colors.primary }]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={styles.publishBtnInner}>
                <Ionicons name="paper-plane" size={14} color="#FFF" />
                <Text style={styles.publishBtnText}>Publish</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* ============================================================== */}
          {/* AUTHOR PROFILE BANNER */}
          {/* ============================================================== */}
          {user ? (
            <View style={[styles.authorProfileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.authorProfileLeft}>
                <Image source={{ uri: user.avatarUrl || DEFAULT_AVATAR }} style={styles.authorProfileAvatar} />
                <View style={styles.authorProfileTextCol}>
                  <View style={styles.authorNameRoleRow}>
                    <Text style={[styles.authorProfileName, { color: colors.text }]}>{user.name}</Text>
                    <View style={[styles.verifiedAuthorPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={styles.verifiedAuthorPillText}>Author</Text>
                    </View>
                  </View>
                  <View style={styles.authorContactRow}>
                    <Ionicons
                      name={user.phoneNumber ? 'call' : 'shield-checkmark'}
                      size={11}
                      color={user.isAdmin ? '#EF4444' : colors.primary}
                    />
                    <Text style={[styles.authorContactText, { color: colors.textMuted }]}>
                      {user.phoneNumber || user.email || 'Administrator'}
                    </Text>
                    <Text style={[styles.dotSep, { color: colors.textMuted }]}>•</Text>
                    <Text style={[styles.authorContactRole, { color: colors.textSecondary }]}>
                      {user.role || 'Staff Writer'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setProfileModalVisible(true)}
                style={[styles.editProfileBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
                <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>Profile</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ============================================================== */}
          {/* 1. CREATION TIME OPTION */}
          {/* ============================================================== */}
          <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="time" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>CREATION TIME</Text>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.timeBadgeText, { color: colors.primary }]}>
                  {formattedDisplayTime()}
                </Text>
              </View>
            </View>

            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Set the exact publication or backdate timestamp for this story.
            </Text>

            <View style={styles.chipRow}>
              <TouchableOpacity
                onPress={() => setTimePreset('now')}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: timePreset === 'now' ? colors.primary : colors.surface,
                    borderColor: timePreset === 'now' ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="flash"
                  size={12}
                  color={timePreset === 'now' ? '#FFF' : colors.textMuted}
                />
                <Text style={[styles.choiceChipText, { color: timePreset === 'now' ? '#FFF' : colors.text }]}>
                  Right Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTimePreset('1h')}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: timePreset === '1h' ? colors.primary : colors.surface,
                    borderColor: timePreset === '1h' ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="timer-outline"
                  size={12}
                  color={timePreset === '1h' ? '#FFF' : colors.textMuted}
                />
                <Text style={[styles.choiceChipText, { color: timePreset === '1h' ? '#FFF' : colors.text }]}>
                  1 hr ago
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTimePreset('yesterday')}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: timePreset === 'yesterday' ? colors.primary : colors.surface,
                    borderColor: timePreset === 'yesterday' ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={timePreset === 'yesterday' ? '#FFF' : colors.textMuted}
                />
                <Text style={[styles.choiceChipText, { color: timePreset === 'yesterday' ? '#FFF' : colors.text }]}>
                  Yesterday
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTimePreset('custom')}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: timePreset === 'custom' ? colors.primary : colors.surface,
                    borderColor: timePreset === 'custom' ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="pencil"
                  size={12}
                  color={timePreset === 'custom' ? '#FFF' : colors.textMuted}
                />
                <Text style={[styles.choiceChipText, { color: timePreset === 'custom' ? '#FFF' : colors.text }]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {timePreset === 'custom' && (
              <View style={styles.customDateInputWrap}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                  Enter Date & Time (YYYY-MM-DD HH:MM:SS)
                </Text>
                <View style={styles.inputWithAction}>
                  <TextInput
                    value={customDateTime}
                    onChangeText={setCustomDateTime}
                    placeholder="2026-11-20 23:25:00"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      styles.flexOne,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const d = new Date();
                      setCustomDateTime(d.toISOString().slice(0, 19).replace('T', ' '));
                    }}
                    style={[styles.smallActionBtn, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.smallActionText, { color: colors.primary }]}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ============================================================== */}
          {/* 2. COVER PAGE ADD OPTION */}
          {/* ============================================================== */}
          <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="image" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  COVER PAGE & STYLE
                </Text>
              </View>
              <View style={[styles.styleTag, { backgroundColor: colors.badgeBg }]}>
                <Text style={[styles.styleTagText, { color: colors.badgeText }]}>
                  {coverStyle.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Visual Cover Preview */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handlePickCoverImage}
              style={[styles.coverPreviewContainer, { borderColor: colors.cardBorder }]}
            >
              <Image source={{ uri: coverImage }} style={styles.coverPreview} resizeMode="cover" />
              <View style={styles.coverOverlay}>
                <View style={styles.coverOverlayPills}>
                  <View style={styles.categoryBadgePill}>
                    <Text style={styles.categoryBadgePillText}>{category}</Text>
                  </View>
                  <View style={styles.coverTypeBadge}>
                    <Ionicons name="sparkles" size={11} color="#FBBF24" />
                    <Text style={styles.coverTypeBadgeText}>
                      {coverStyle === 'magazine'
                        ? 'Magazine Page'
                        : coverStyle === 'minimal'
                        ? 'Minimal Header'
                        : 'Hero Banner'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.coverPreviewTitle} numberOfLines={1}>
                  {title || 'Story Title Preview'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cover Layout Style Selector */}
            <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
              COVER DISPLAY STYLE
            </Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                onPress={() => setCoverStyle('banner')}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: coverStyle === 'banner' ? colors.accent : colors.surface,
                    borderColor: coverStyle === 'banner' ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="tablet-portrait-outline"
                  size={13}
                  color={coverStyle === 'banner' ? '#FFF' : colors.textMuted}
                />
                <Text style={[styles.choiceChipText, { color: coverStyle === 'banner' ? '#FFF' : colors.text }]}>
                  Standard Banner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCoverStyle('magazine')}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: coverStyle === 'magazine' ? colors.accent : colors.surface,
                    borderColor: coverStyle === 'magazine' ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="newspaper-outline"
                  size={13}
                  color={coverStyle === 'magazine' ? '#FFF' : colors.textMuted}
                />
                <Text style={[styles.choiceChipText, { color: coverStyle === 'magazine' ? '#FFF' : colors.text }]}>
                  Magazine Cover
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCoverStyle('minimal')}
                style={[
                  styles.choiceChip,
                  {
                    backgroundColor: coverStyle === 'minimal' ? colors.accent : colors.surface,
                    borderColor: coverStyle === 'minimal' ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="remove-outline"
                  size={13}
                  color={coverStyle === 'minimal' ? '#FFF' : colors.textMuted}
                />
                <Text style={[styles.choiceChipText, { color: coverStyle === 'minimal' ? '#FFF' : colors.text }]}>
                  Minimal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cover Image Add Option */}
            <View style={styles.customCoverUrlWrap}>
              <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                ADD COVER PAGE IMAGE
              </Text>

              {/* Quick Upload Buttons */}
              <View style={styles.coverUploadButtonsRow}>
                <TouchableOpacity
                  onPress={handlePickCoverImage}
                  disabled={isPickingCover}
                  style={[styles.coverUploadActionBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  {isPickingCover ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={15} color="#FFF" />
                      <Text style={styles.coverUploadActionBtnText}>Upload Cover Image</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTakeCoverPhoto}
                  disabled={isPickingCover}
                  style={[
                    styles.coverCameraActionBtn,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={15} color={colors.text} />
                  <Text style={[styles.coverCameraActionBtnText, { color: colors.text }]}>Take Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Or Paste Web URL */}
              <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                OR PASTE WEB URL
              </Text>
              <View style={styles.inputWithAction}>
                <TextInput
                  placeholder="https://images.unsplash.com/photo-..."
                  placeholderTextColor={colors.textMuted}
                  value={customCoverUrl}
                  onChangeText={setCustomCoverUrl}
                  style={[
                    styles.input,
                    styles.flexOne,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (!customCoverUrl.trim()) {
                      Alert.alert('URL Empty', 'Please enter a valid image URL.');
                      return;
                    }
                    setCoverImage(customCoverUrl.trim());
                    Alert.alert('Cover Applied', 'Your custom cover page image has been set!');
                  }}
                  style={[styles.smallActionBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ============================================================== */}
          {/* 3. IMAGE OPTION (STORY IMAGES & MEDIA) */}
          {/* ============================================================== */}
          <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="images" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  STORY IMAGES & MEDIA
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowImageTool(!showImageTool)}
                style={[styles.toggleToolBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons
                  name={showImageTool ? 'chevron-up' : 'add-circle-outline'}
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.toggleToolText, { color: colors.primary }]}>
                  {showImageTool ? 'Hide Tool' : '+ Insert Image'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Embed inline markdown illustrations into your story or attach gallery media.
            </Text>

            {/* Expandable Image Insertion Tool */}
            {showImageTool && (
              <View style={[styles.imageToolBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Text style={[styles.toolTitle, { color: colors.text }]}>
                  Insert Image into Story Markdown
                </Text>

                {/* Upload Button */}
                <TouchableOpacity
                  onPress={handlePickInlineImage}
                  disabled={isPickingInline}
                  style={[styles.inlineUploadBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  {isPickingInline ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={16} color="#FFF" />
                      <Text style={styles.inlineUploadBtnText}>Upload Image from Device</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Custom Image URL & Caption */}
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  OR ENTER IMAGE URL
                </Text>
                <TextInput
                  placeholder="https://images.unsplash.com/photo-..."
                  placeholderTextColor={colors.textMuted}
                  value={inlineImageUrl}
                  onChangeText={setInlineImageUrl}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                />

                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                  CAPTION / FIGURE TITLE
                </Text>
                <TextInput
                  placeholder="e.g. Figure 1: Neural interconnect pipeline"
                  placeholderTextColor={colors.textMuted}
                  value={inlineImageCaption}
                  onChangeText={setInlineImageCaption}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={() => handleInsertInlineImage(inlineImageUrl, inlineImageCaption)}
                  style={[styles.insertBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="code-download-outline" size={16} color="#FFF" />
                  <Text style={styles.insertBtnText}>Insert Markdown into Story Content</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Attached Media List */}
            {attachedImages.length > 0 && (
              <View style={styles.attachedWrap}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                  ATTACHED GALLERY MEDIA ({attachedImages.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {attachedImages.map((imgUrl, idx) => (
                    <View key={idx} style={[styles.attachedThumbWrap, { borderColor: colors.cardBorder }]}>
                      <Image source={{ uri: imgUrl }} style={styles.attachedThumb} />
                      <TouchableOpacity
                        onPress={() => handleRemoveAttachedImage(imgUrl)}
                        style={styles.attachedDeleteBtn}
                      >
                        <Ionicons name="close" size={12} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* ============================================================== */}
          {/* 4. AUDIO ADDING OPTION */}
          {/* ============================================================== */}
          <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="musical-notes" size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  AUDIO EDITION / PODCAST
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setHasAudio(!hasAudio)}
                style={[
                  styles.audioToggleBtn,
                  {
                    backgroundColor: hasAudio ? colors.accent : colors.surface,
                    borderColor: hasAudio ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name={hasAudio ? 'volume-high' : 'volume-mute-outline'}
                  size={14}
                  color={hasAudio ? '#FFF' : colors.textMuted}
                />
                <Text style={[styles.audioToggleText, { color: hasAudio ? '#FFF' : colors.textMuted }]}>
                  {hasAudio ? 'Audio Attached' : 'Add Audio'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Attach an audio edition, voiceover narration, or podcast stream to your story.
            </Text>

            {hasAudio && (
              <View style={styles.audioConfigBox}>
                {/* Audio Source Options */}
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                  AUDIO SOURCE
                </Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    onPress={() => setAudioSource('ai')}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: audioSource === 'ai' ? colors.primary : colors.surface,
                        borderColor: audioSource === 'ai' ? 'transparent' : colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mic-outline"
                      size={13}
                      color={audioSource === 'ai' ? '#FFF' : colors.textMuted}
                    />
                    <Text style={[styles.choiceChipText, { color: audioSource === 'ai' ? '#FFF' : colors.text }]}>
                      AI Synthesis
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setAudioSource('preset')}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: audioSource === 'preset' ? colors.primary : colors.surface,
                        borderColor: audioSource === 'preset' ? 'transparent' : colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="radio-outline"
                      size={13}
                      color={audioSource === 'preset' ? '#FFF' : colors.textMuted}
                    />
                    <Text style={[styles.choiceChipText, { color: audioSource === 'preset' ? '#FFF' : colors.text }]}>
                      Preset Track
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setAudioSource('custom')}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: audioSource === 'custom' ? colors.primary : colors.surface,
                        borderColor: audioSource === 'custom' ? 'transparent' : colors.cardBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="link-outline"
                      size={13}
                      color={audioSource === 'custom' ? '#FFF' : colors.textMuted}
                    />
                    <Text style={[styles.choiceChipText, { color: audioSource === 'custom' ? '#FFF' : colors.text }]}>
                      Custom Audio URL
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Audio URL if selected */}
                {audioSource === 'custom' && (
                  <View style={styles.customDateInputWrap}>
                    <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                      Direct Audio URL (.mp3 / .ogg / .m4a / podcast link)
                    </Text>
                    <TextInput
                      placeholder="https://cdn.example.com/podcast-episode.mp3"
                      placeholderTextColor={colors.textMuted}
                      value={customAudioUrl}
                      onChangeText={setCustomAudioUrl}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                        },
                      ]}
                    />
                  </View>
                )}

                {/* Audio Metadata */}
                <View style={styles.twoColumn}>
                  <View style={styles.flexOne}>
                    <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                      AUDIO TITLE
                    </Text>
                    <TextInput
                      value={audioTitle}
                      onChangeText={setAudioTitle}
                      placeholder="e.g. AI Audio Overvew"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                        },
                      ]}
                    />
                  </View>
                  <View style={{ width: 110 }}>
                    <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                      DURATION
                    </Text>
                    <TextInput
                      value={audioDuration}
                      onChangeText={setAudioDuration}
                      placeholder="4:30 min"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* In-Modal Audio Player Preview */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPreviewAudioPlaying(!previewAudioPlaying)}
                  style={[styles.audioPreviewPlayer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                >
                  <View style={[styles.audioPlayBtnCircle, { backgroundColor: colors.accent }]}>
                    <Ionicons
                      name={previewAudioPlaying ? 'pause' : 'play'}
                      size={14}
                      color="#FFF"
                    />
                  </View>
                  <View style={styles.audioPreviewInfo}>
                    <Text style={[styles.audioPreviewTitle, { color: colors.text }]}>
                      {audioTitle || 'Story Audio Track'}
                    </Text>
                    <Text style={[styles.audioPreviewSub, { color: colors.textMuted }]}>
                      {previewAudioPlaying ? 'Simulating Playback...' : `Preview Track (${audioDuration})`}
                    </Text>
                  </View>
                  <Ionicons
                    name="pulse"
                    size={20}
                    color={previewAudioPlaying ? colors.accent : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ============================================================== */}
          {/* GENERAL STORY DETAILS (TITLE, CATEGORY, BODY) */}
          {/* ============================================================== */}
          <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* Interactive Category Selector with Drag & Drop Reordering and Custom Category Option */}
            <CategoryDragDrop
              selectedCategory={category}
              onSelectCategory={(newCat) => setCategory(newCat)}
              title="CATEGORY"
            />

            {/* Title */}
            <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
              STORY TITLE *
            </Text>
            <TextInput
              placeholder="A compelling title for your dispatch..."
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
            />

            {/* Subtitle */}
            <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
              SUBTITLE
            </Text>
            <TextInput
              placeholder="A brief summary or hook..."
              placeholderTextColor={colors.textMuted}
              value={subtitle}
              onChangeText={setSubtitle}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
            />

            {/* Author and Read Time */}
            <View style={styles.twoColumn}>
              <View style={styles.flexOne}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                  AUTHOR
                </Text>
                <TextInput
                  value={authorName}
                  onChangeText={setAuthorName}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.flexOne}>
                <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                  READ TIME
                </Text>
                <TextInput
                  value={readTime}
                  onChangeText={setReadTime}
                  placeholder="e.g. 5 min"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Content Body */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.inputSubLabel, { color: colors.textSecondary }]}>
                STORY CONTENT (MARKDOWN SUPPORTED) *
              </Text>
              <TouchableOpacity
                onPress={() => setShowImageTool(true)}
                style={styles.inlineInsertAction}
              >
                <Ionicons name="image-outline" size={13} color={colors.primary} />
                <Text style={[styles.inlineInsertActionText, { color: colors.primary }]}>
                  Add Image
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Type your markdown here... Format with headings (##, ###), bullet lists (-), and inline images (![caption](url))."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  publishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  publishBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 50,
    gap: 14,
  },
  cardSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customDateInputWrap: {
    marginTop: 4,
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 6,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  inputWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  smallActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  styleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  styleTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  coverPreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    marginBottom: 12,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  coverOverlayPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadgePill: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgePillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  coverTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  coverTypeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  coverPreviewTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subTabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    marginVertical: 8,
  },
  subTabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  presetScroll: {
    marginVertical: 6,
  },
  coverThumbCard: {
    width: 110,
    height: 75,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  thumbLabelText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  checkCircle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCoverUrlWrap: {
    marginTop: 4,
  },
  coverUploadButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  coverUploadActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  coverUploadActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  coverCameraActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  coverCameraActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inlineUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  inlineUploadBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toggleToolText: {
    fontSize: 11,
    fontWeight: '700',
  },
  imageToolBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  contentPhotoCard: {
    width: 100,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  contentThumb: {
    width: 100,
    height: 60,
  },
  contentThumbLabel: {
    fontSize: 10,
    fontWeight: '600',
    padding: 4,
  },
  insertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  insertBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  attachedWrap: {
    marginTop: 10,
  },
  attachedThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
    position: 'relative',
    borderWidth: 1,
  },
  attachedThumb: {
    width: '100%',
    height: '100%',
  },
  attachedDeleteBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  audioToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  audioConfigBox: {
    marginTop: 6,
  },
  audioPreviewPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    gap: 10,
  },
  audioPlayBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPreviewInfo: {
    flex: 1,
  },
  audioPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  audioPreviewSub: {
    fontSize: 10,
    marginTop: 2,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineInsertAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineInsertActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 180,
    lineHeight: 22,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  authorProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  authorProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  authorProfileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  authorProfileTextCol: {
    flex: 1,
  },
  authorNameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  authorProfileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  verifiedAuthorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  verifiedAuthorPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  authorContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorContactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotSep: {
    fontSize: 10,
    marginHorizontal: 2,
  },
  authorContactRole: {
    fontSize: 11,
    fontWeight: '500',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
