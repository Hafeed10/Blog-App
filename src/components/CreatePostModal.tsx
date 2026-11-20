import React, { useState } from 'react';
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
import { Category } from '../types/blog';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRESET_COVERS = [
  {
    label: 'Cybernetic AI',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Spatial Glass',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cloud Servers',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Modern Pavilion',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Code Matrix',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
  },
];

const CATEGORIES: Category[] = [
  'AI & Tech',
  'Design',
  'Engineering',
  'Culture',
  'Business',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { createNewPost, databaseStatus } = useBlog();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<Category>('AI & Tech');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [authorName, setAuthorName] = useState('Alex Rivera');
  const [authorRole, setAuthorRole] = useState('Contributing Writer');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('4 min');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async () => {
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

    const result = await createNewPost({
      title: title.trim(),
      subtitle: subtitle.trim(),
      slug,
      content: content.trim(),
      cover_image: coverImage,
      category,
      read_time: readTime,
      author_name: authorName.trim() || 'Alex Rivera',
      author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      author_role: authorRole.trim() || 'Staff Writer',
      is_featured: false,
    });

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Story Published!',
        databaseStatus.tableExists
          ? 'Your story is live and saved directly to Supabase cloud PostgreSQL!'
          : 'Your story has been added to your local feed.'
      );
      // Reset form
      setTitle('');
      setSubtitle('');
      setContent('');
      onClose();
    } else {
      Alert.alert('Publication Note', result.error || 'Failed to sync to Supabase.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Compose New Post</Text>
          <TouchableOpacity
            onPress={handlePublish}
            disabled={isSubmitting}
            style={[styles.publishBtn, { backgroundColor: colors.primary }]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.publishBtnText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Cover Image Preview & Presets */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>COVER IMAGE</Text>
          <View style={[styles.coverPreviewContainer, { borderColor: colors.cardBorder }]}>
            <Image source={{ uri: coverImage }} style={styles.coverPreview} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {PRESET_COVERS.map((preset) => {
              const isSelected = coverImage === preset.url;
              return (
                <TouchableOpacity
                  key={preset.label}
                  onPress={() => setCoverImage(preset.url)}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: isSelected ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Category Selector */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: isSelected ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Title */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TITLE</Text>
          <TextInput
            placeholder="A compelling title for your story..."
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
          />

          {/* Subtitle */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SUBTITLE</Text>
          <TextInput
            placeholder="A brief summary or hook..."
            placeholderTextColor={colors.textMuted}
            value={subtitle}
            onChangeText={setSubtitle}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
          />

          {/* Author Name and Read Time */}
          <View style={styles.twoColumn}>
            <View style={styles.flexOne}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>AUTHOR</Text>
              <TextInput
                value={authorName}
                onChangeText={setAuthorName}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>
            <View style={styles.flexOne}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>READ TIME</Text>
              <TextInput
                value={readTime}
                onChangeText={setReadTime}
                placeholder="e.g. 5 min"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>
          </View>

          {/* Content Body */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            STORY CONTENT (MARKDOWN SUPPORTED)
          </Text>
          <TextInput
            placeholder="Type your markdown or text here... Write your story with subheadings, code snippets, and paragraphs."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            style={[
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
          />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  publishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  coverPreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 10,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  presetScroll: {
    marginBottom: 10,
  },
  presetPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  flexOne: {
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 180,
    lineHeight: 22,
  },
});
