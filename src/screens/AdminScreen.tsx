import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { Post, Category } from '../types/blog';
import { HistoryEvent, HistoryEventType, HistoryEventLevel } from '../types/history';
import { CategoryDragDrop } from '../components/CategoryDragDrop';

interface AdminScreenProps {
  onNavigateToTab?: (tab: 'landing' | 'home' | 'bookmarks' | 'db' | 'admin') => void;
  onSelectPost?: (post: Post) => void;
  onCompose?: () => void;
}

type AdminSubTab = 'overview' | 'posts' | 'categories' | 'history';

const PRESET_COVERS = [
  {
    title: 'AI Neural',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Cyberpunk',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Cosmic',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
  },
  {
    title: 'Urban Grid',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
  },
];

export const AdminScreen: React.FC<AdminScreenProps> = ({
  onNavigateToTab,
  onSelectPost,
  onCompose,
}) => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isNarrow = width < 480;

  const {
    posts,
    categories,
    updatePost,
    deletePost,
    toggleFeatured,
    duplicatePost,
    addCustomCategory,
    removeCustomCategory,
    reorderCategories,
    resetCategories,
    restoreDefaultPosts,
    clearAllCache,
    exportAllData,
    importPostsData,
    databaseStatus,
    recheckDatabase,
  } = useBlog();

  const { user, isAdmin, adminLogin, logout } = useAuth();
  const { historyEvents, clearHistory, exportHistoryJson, addHistoryEvent } =
    useHistory();

  // Admin Login Gate State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Section
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('overview');

  // Posts Control State
  const [postSearch, setPostSearch] = useState('');
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('All');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isSavingPost, setIsSavingPost] = useState(false);

  // Edit Post Form Fields
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editCategory, setEditCategory] = useState<string>('AI & Tech');
  const [editAuthor, setEditAuthor] = useState('');
  const [editAuthorRole, setEditAuthorRole] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editReadTime, setEditReadTime] = useState('');
  const [editLikes, setEditLikes] = useState('0');
  const [editContent, setEditContent] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editAudioUrl, setEditAudioUrl] = useState('');
  const [editAudioTitle, setEditAudioTitle] = useState('');

  // Categories Control State
  const [newCatName, setNewCatName] = useState('');
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<string>(
    categories[0] || 'AI & Tech'
  );
  const [renamingCategory, setRenamingCategory] = useState<{
    original: string;
    newName: string;
  } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // History Control State
  const [historySearch, setHistorySearch] = useState('');
  const [historyLevelFilter, setHistoryLevelFilter] = useState<'All' | HistoryEventLevel>(
    'All'
  );
  const [selectedHistoryEvent, setSelectedHistoryEvent] = useState<HistoryEvent | null>(
    null
  );
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // System & Export Modal State
  const [isExporting, setIsExporting] = useState(false);
  const [exportedJsonData, setExportedJsonData] = useState<string | null>(null);
  const [importJsonInput, setImportJsonInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [systemAlertMessage, setSystemAlertMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Total Likes
  const totalLikes = useMemo(() => {
    return posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  }, [posts]);

  // Word count for post editor
  const editWordCount = useMemo(() => {
    return editContent.trim() ? editContent.trim().split(/\s+/).length : 0;
  }, [editContent]);

  // Filtered Posts for Admin Management
  const filteredAdminPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCat =
        postCategoryFilter === 'All' ||
        p.category.toLowerCase().includes(postCategoryFilter.toLowerCase());
      const query = postSearch.trim().toLowerCase();
      const matchSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.author_name.toLowerCase().includes(query) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(query));
      return matchCat && matchSearch;
    });
  }, [posts, postCategoryFilter, postSearch]);

  // Filtered History Events
  const filteredHistory = useMemo(() => {
    return historyEvents.filter((ev) => {
      const matchLevel =
        historyLevelFilter === 'All' || ev.level === historyLevelFilter;
      const q = historySearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.actor.toLowerCase().includes(q) ||
        ev.type.toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [historyEvents, historyLevelFilter, historySearch]);

  // Open Edit Post Modal
  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditSubtitle(post.subtitle || '');
    setEditCategory(post.category);
    setEditAuthor(post.author_name);
    setEditAuthorRole(post.author_role || 'Staff Contributor');
    setEditCoverImage(post.cover_image);
    setEditReadTime(post.read_time);
    setEditLikes(String(post.likes_count || 0));
    setEditContent(post.content);
    setEditIsFeatured(!!post.is_featured);
    setEditAudioUrl(post.audio_url || '');
    setEditAudioTitle(post.audio_title || '');
  };

  // Save Post Edits
  const handleSavePostEdit = async () => {
    if (!editingPost) return;
    if (!editTitle.trim()) {
      Alert.alert('Validation Error', 'Post title cannot be empty.');
      return;
    }
    if (!editContent.trim()) {
      Alert.alert('Validation Error', 'Post content cannot be empty.');
      return;
    }

    try {
      setIsSavingPost(true);
      const updates: Partial<Post> = {
        title: editTitle.trim(),
        subtitle: editSubtitle.trim() || undefined,
        category: editCategory.trim(),
        author_name: editAuthor.trim() || 'Admin Editor',
        author_role: editAuthorRole.trim() || 'Staff Contributor',
        cover_image: editCoverImage.trim() || editingPost.cover_image,
        read_time: editReadTime.trim() || '4 min',
        likes_count: parseInt(editLikes, 10) || 0,
        content: editContent,
        is_featured: editIsFeatured,
        audio_url: editAudioUrl.trim() || undefined,
        audio_title: editAudioTitle.trim() || undefined,
      };

      await updatePost(editingPost.id, updates);
      setEditingPost(null);
      setSystemAlertMessage('Post updated successfully with full admin rights.');
    } catch {
      Alert.alert('Error', 'Failed to update post.');
    } finally {
      setIsSavingPost(false);
    }
  };

  // Confirm Delete Post
  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete.id);
      setPostToDelete(null);
      setSystemAlertMessage('Post permanently deleted from the database.');
    } catch {
      Alert.alert('Error', 'Failed to delete post.');
    }
  };

  // Handle Add Category
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await addCustomCategory(newCatName.trim());
    setNewCatName('');
  };

  // Handle Category Rename
  const handleSaveRenameCategory = async () => {
    if (!renamingCategory || !renamingCategory.newName.trim()) return;
    const { original, newName } = renamingCategory;
    const trimmedNew = newName.trim();
    if (original === trimmedNew) {
      setRenamingCategory(null);
      return;
    }

    const updated = categories.map((c) => (c === original ? trimmedNew : c));
    await reorderCategories(updated);
    await addHistoryEvent({
      type: 'CATEGORY_RENAME',
      title: 'Category Renamed',
      description: `Renamed category "${original}" to "${trimmedNew}".`,
      actor: 'Admin',
      level: 'info',
    });
    setRenamingCategory(null);
  };

  // Confirm Delete Category
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    await removeCustomCategory(categoryToDelete);
    setCategoryToDelete(null);
  };

  // Move Category Up / Down
  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const newOrder = [...categories];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    await reorderCategories(newOrder);
  };

  // Database Latency & Health Check
  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    const start = Date.now();
    await recheckDatabase();
    const duration = Date.now() - start;
    setIsTestingDb(false);
    setSystemAlertMessage(
      `Database Check Finished in ${duration}ms.\nStatus: ${
        databaseStatus.tableExists
          ? 'Connected to Supabase Live'
          : 'Offline / Setup Needed'
      }\nRows: ${databaseStatus.rowCount}`
    );
  };

  // Full Export
  const handleExportBackup = async () => {
    setIsExporting(true);
    const json = await exportAllData();
    setExportedJsonData(json);
    setIsExporting(false);
  };

  // Clipboard helper
  const copyText = (text: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } else {
      Alert.alert('Payload Ready', 'Text is ready in display container.');
    }
  };

  // Import Backup
  const handleImportJson = async () => {
    try {
      if (!importJsonInput.trim()) {
        Alert.alert('Error', 'Please paste valid JSON payload.');
        return;
      }
      const parsed = JSON.parse(importJsonInput);
      const postsArray = Array.isArray(parsed) ? parsed : parsed.posts;
      if (!Array.isArray(postsArray) || postsArray.length === 0) {
        Alert.alert('Invalid Format', 'JSON must contain an array of posts.');
        return;
      }
      await importPostsData(postsArray);
      setShowImportModal(false);
      setImportJsonInput('');
      setSystemAlertMessage(`Imported ${postsArray.length} posts successfully.`);
    } catch (e: any) {
      Alert.alert('Import Failed', e.message || 'Invalid JSON syntax.');
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getLevelColor = (level: HistoryEventLevel) => {
    switch (level) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'info':
      default:
        return colors.primary;
    }
  };

  const getEventIcon = (type: HistoryEventType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'POST_CREATE':
        return 'add-circle-outline';
      case 'POST_UPDATE':
        return 'create-outline';
      case 'POST_DELETE':
        return 'trash-outline';
      case 'POST_FEATURE':
        return 'star-outline';
      case 'POST_DUPLICATE':
        return 'copy-outline';
      case 'CATEGORY_ADD':
      case 'CATEGORY_RENAME':
      case 'CATEGORY_REORDER':
      case 'CATEGORY_RESET':
        return 'pricetag-outline';
      case 'CATEGORY_DELETE':
        return 'close-circle-outline';
      case 'DB_TEST':
        return 'server-outline';
      case 'CACHE_CLEAR':
        return 'refresh-circle-outline';
      case 'SYSTEM_RESTORE':
        return 'reload-outline';
      case 'BACKUP_EXPORT':
        return 'download-outline';
      case 'BACKUP_IMPORT':
        return 'cloud-upload-outline';
      default:
        return 'shield-checkmark-outline';
    }
  };

  const handleAdminLogin = async () => {
    setLoginError(null);
    const trimmed = loginEmail.trim();
    if (!trimmed) {
      setLoginError('Please enter your administrator email.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your administrator password.');
      return;
    }

    setIsAuthenticating(true);
    const res = await adminLogin({
      email: trimmed,
      password: loginPassword,
    });
    setIsAuthenticating(false);

    if (!res.success) {
      setLoginError(
        res.error || 'Authentication failed. Please verify your credentials.'
      );
    } else {
      setLoginEmail('');
      setLoginPassword('');
      setLoginError(null);
      await addHistoryEvent({
        type: 'ADMIN_ACTION',
        title: 'Admin Session Started',
        description: `Administrator (${trimmed}) signed into the control console.`,
        actor: 'Admin',
        level: 'success',
      });
    }
  };

  const handleFillDemo = () => {
    setLoginEmail('admin@chronicle.com');
    setLoginPassword('admin123');
    setLoginError(null);
  };

  const handleAdminLogout = async () => {
    await logout();
    await addHistoryEvent({
      type: 'ADMIN_ACTION',
      title: 'Admin Session Ended',
      description: 'Administrator signed out of the control console.',
      actor: 'Admin',
      level: 'info',
    });
  };

  // =========================================================
  // ADMIN LOGIN GATE (PROTECTS CONSOLE FROM UNAUTHORIZED USERS)
  // =========================================================
  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { borderBottomColor: colors.separator }]}>
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.adminBadgeIcon,
                  { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Ionicons name="shield-checkmark" size={18} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Admin Console
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  RESTRICTED AREA • CHRONICLE
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {onNavigateToTab && (
                <TouchableOpacity
                  onPress={() => onNavigateToTab('home')}
                  style={[
                    styles.exitButton,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="compass-outline" size={16} color={colors.text} />
                  <Text style={[styles.exitButtonText, { color: colors.text }]}>
                    View App
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.loginGateContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.loginGateCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.gateEmblemWrap,
                { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
              ]}
            >
              <Ionicons name="shield-checkmark" size={42} color="#EF4444" />
            </View>

            <Text style={[styles.gateTitle, { color: colors.text }]}>
              Admin Authentication
            </Text>
            <Text style={[styles.gateSubtitle, { color: colors.textMuted }]}>
              Sign in with administrative privileges to manage editorial dispatches, topic
              categories, and audit telemetry.
            </Text>

            {loginError ? (
              <View
                style={[
                  styles.gateErrorBanner,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={[styles.gateErrorText, { color: '#EF4444' }]}>
                  {loginError}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.gateDemoRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="key-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.gateDemoText, { color: colors.text }]}>
                  Demo: admin@chronicle.com / admin123
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleFillDemo}
                style={[styles.gateFillBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.gateFillBtnText}>Fill Demo</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.gateInputLabel, { color: colors.textSecondary }]}>
              ADMINISTRATOR EMAIL *
            </Text>
            <View
              style={[
                styles.gateInputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: loginEmail.trim() ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={loginEmail.trim() ? colors.primary : colors.textMuted}
              />
              <TextInput
                placeholder="e.g. admin@chronicle.com"
                placeholderTextColor={colors.textMuted}
                value={loginEmail}
                onChangeText={(t) => {
                  setLoginEmail(t);
                  if (loginError) setLoginError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.gateInputField, { color: colors.text }]}
              />
              {loginEmail ? (
                <TouchableOpacity onPress={() => setLoginEmail('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={[styles.gateInputLabel, { color: colors.textSecondary }]}>
              PASSWORD *
            </Text>
            <View
              style={[
                styles.gateInputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: loginPassword ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={loginPassword ? colors.primary : colors.textMuted}
              />
              <TextInput
                placeholder="Enter administrator password"
                placeholderTextColor={colors.textMuted}
                value={loginPassword}
                onChangeText={(t) => {
                  setLoginPassword(t);
                  if (loginError) setLoginError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.gateInputField, { color: colors.text }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleAdminLogin}
              disabled={isAuthenticating}
              style={[styles.gateSubmitBtn, { backgroundColor: '#EF4444' }]}
              activeOpacity={0.85}
            >
              {isAuthenticating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#FFF" />
                  <Text style={styles.gateSubmitText}>Sign In to Admin Console</Text>
                </>
              )}
            </TouchableOpacity>

            {onNavigateToTab && (
              <TouchableOpacity
                onPress={() => onNavigateToTab('home')}
                style={[
                  styles.gateBackBtn,
                  { borderColor: colors.cardBorder, backgroundColor: colors.surface },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="compass-outline" size={16} color={colors.text} />
                <Text style={[styles.gateBackText, { color: colors.text }]}>
                  Return to Stories
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.gateSecurityRow}>
              <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
              <Text style={[styles.gateSecurityText, { color: colors.textMuted }]}>
                Encrypted Session • Role Verification Active
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // =========================================================
  // AUTHENTICATED ADMIN CONSOLE
  // =========================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Admin Header Bar - Responsive Centered */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.adminBadgeIcon,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={20} color="#EF4444" />
            </View>
            <View style={styles.headerTitleWrap}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.headerTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  Admin Console
                </Text>
                <View style={[styles.controlPill, { backgroundColor: '#10B981' }]}>
                  <View style={styles.controlPillDot} />
                  <Text style={styles.controlPillText}>FULL CONTROL</Text>
                </View>
              </View>
              <Text
                style={[styles.headerSubtitle, { color: colors.textMuted }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.email
                  ? `${user.email} (Super Admin)`
                  : user
                  ? `${user.name} (Admin)`
                  : 'Super Administrator'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {onNavigateToTab && (
              <TouchableOpacity
                onPress={() => onNavigateToTab('home')}
                style={[
                  styles.exitButton,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="compass-outline" size={15} color={colors.text} />
                <Text style={[styles.exitButtonText, { color: colors.text }]}>
                  {isNarrow ? 'App' : 'View App'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleAdminLogout}
              style={[
                styles.exitButton,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.28)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={15} color="#EF4444" />
              <Text style={[styles.exitButtonText, { color: '#EF4444' }]}>
                {isNarrow ? 'Exit' : 'Sign Out'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Admin Sub-Tabs Navigation */}
      <View
        style={[
          styles.subTabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.separator },
        ]}
      >
        <View style={styles.subTabInner}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subTabScroll}
          >
            {[
              { id: 'overview', label: 'Overview', icon: 'grid-outline' },
              {
                id: 'posts',
                label: 'Posts',
                count: posts.length,
                icon: 'document-text-outline',
              },
              {
                id: 'categories',
                label: 'Categories',
                count: categories.length,
                icon: 'pricetags-outline',
              },
              {
                id: 'history',
                label: 'History',
                count: historyEvents.length,
                icon: 'time-outline',
              },
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveSubTab(tab.id as AdminSubTab)}
                  style={[
                    styles.subTabButton,
                    isActive
                      ? [
                          styles.subTabButtonActive,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.cardBorder,
                            shadowColor: '#000',
                          },
                        ]
                      : {
                          backgroundColor: 'transparent',
                          borderColor: 'transparent',
                        },
                  ]}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.subTabIconWrap,
                      isActive && { backgroundColor: `${colors.primary}18` },
                    ]}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={15}
                      color={isActive ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <Text
                    style={[
                      styles.subTabButtonText,
                      {
                        color: isActive ? colors.text : colors.textMuted,
                        fontWeight: isActive ? '800' : '600',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.count !== undefined && (
                    <View
                      style={[
                        styles.tabCountPill,
                        {
                          backgroundColor: isActive
                            ? `${colors.primary}20`
                            : colors.separator,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabCountPillText,
                          {
                            color: isActive ? colors.primary : colors.textMuted,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Main Admin Scroll Content */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & METRICS                                  */}
        {/* ========================================================= */}
        {activeSubTab === 'overview' && (
          <View style={styles.tabSection}>
            {/* Bento Metric Summary Grid */}
            <View style={styles.metricsGrid}>
              {/* Card 1: Published Stories */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setActiveSubTab('posts')}
                style={[
                  styles.metricCard,
                  isDesktop && styles.metricCardQuarter,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.metricCardHeader}>
                  <View
                    style={[
                      styles.metricIconWrap,
                      { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
                    ]}
                  >
                    <Ionicons name="newspaper-outline" size={19} color="#3B82F6" />
                  </View>
                  <View
                    style={[
                      styles.metricStatusBadge,
                      { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={[styles.metricStatusText, { color: '#3B82F6' }]}>
                      Live
                    </Text>
                  </View>
                </View>
                <View style={styles.metricCardBody}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {posts.length}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>
                    Published Stories
                  </Text>
                  <Text
                    style={[styles.metricSubLabel, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    Editorial articles live
                  </Text>
                </View>
                <View style={styles.metricCardFooter}>
                  <Text style={[styles.metricActionLink, { color: '#3B82F6' }]}>
                    Manage posts
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color="#3B82F6" />
                </View>
              </TouchableOpacity>

              {/* Card 2: Total Reader Likes */}
              <View
                style={[
                  styles.metricCard,
                  isDesktop && styles.metricCardQuarter,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.metricCardHeader}>
                  <View
                    style={[
                      styles.metricIconWrap,
                      { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                    ]}
                  >
                    <Ionicons name="heart" size={19} color="#EF4444" />
                  </View>
                  <View
                    style={[
                      styles.metricStatusBadge,
                      { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                    ]}
                  >
                    <Ionicons name="trending-up" size={11} color="#EF4444" />
                    <Text style={[styles.metricStatusText, { color: '#EF4444' }]}>
                      Engaged
                    </Text>
                  </View>
                </View>
                <View style={styles.metricCardBody}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {totalLikes.toLocaleString()}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>
                    Total Reader Likes
                  </Text>
                  <Text
                    style={[styles.metricSubLabel, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    Audience appreciation
                  </Text>
                </View>
                <View style={styles.metricCardFooter}>
                  <Text style={[styles.metricActionLink, { color: '#EF4444' }]}>
                    Reader reactions
                  </Text>
                  <Ionicons name="sparkles" size={11} color="#EF4444" />
                </View>
              </View>

              {/* Card 3: Active Topics */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setActiveSubTab('categories')}
                style={[
                  styles.metricCard,
                  isDesktop && styles.metricCardQuarter,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.metricCardHeader}>
                  <View
                    style={[
                      styles.metricIconWrap,
                      { backgroundColor: 'rgba(139, 92, 246, 0.12)' },
                    ]}
                  >
                    <Ionicons name="pricetags-outline" size={19} color="#8B5CF6" />
                  </View>
                  <View
                    style={[
                      styles.metricStatusBadge,
                      { backgroundColor: 'rgba(139, 92, 246, 0.1)' },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#8B5CF6' }]} />
                    <Text style={[styles.metricStatusText, { color: '#8B5CF6' }]}>
                      Taxonomy
                    </Text>
                  </View>
                </View>
                <View style={styles.metricCardBody}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {categories.length}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>
                    Active Topics
                  </Text>
                  <Text
                    style={[styles.metricSubLabel, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    Categories & filters
                  </Text>
                </View>
                <View style={styles.metricCardFooter}>
                  <Text style={[styles.metricActionLink, { color: '#8B5CF6' }]}>
                    Reorder topics
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color="#8B5CF6" />
                </View>
              </TouchableOpacity>

              {/* Card 4: Audit Logs */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setActiveSubTab('history')}
                style={[
                  styles.metricCard,
                  isDesktop && styles.metricCardQuarter,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.metricCardHeader}>
                  <View
                    style={[
                      styles.metricIconWrap,
                      { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
                    ]}
                  >
                    <Ionicons name="time-outline" size={19} color="#10B981" />
                  </View>
                  <View
                    style={[
                      styles.metricStatusBadge,
                      { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.metricStatusText, { color: '#10B981' }]}>
                      Tracked
                    </Text>
                  </View>
                </View>
                <View style={styles.metricCardBody}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {historyEvents.length}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>
                    Audit Logs
                  </Text>
                  <Text
                    style={[styles.metricSubLabel, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    Recorded admin actions
                  </Text>
                </View>
                <View style={styles.metricCardFooter}>
                  <Text style={[styles.metricActionLink, { color: '#10B981' }]}>
                    View event log
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color="#10B981" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Control Actions */}
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionHeadingWrap}>
                <View
                  style={[
                    styles.sectionHeadingDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  QUICK CONTROL ACTIONS
                </Text>
              </View>
              <Text style={[styles.sectionSubHeading, { color: colors.textMuted }]}>
                Administrative shortcuts
              </Text>
            </View>
            <View style={styles.quickActionGrid}>
              <TouchableOpacity
                onPress={() => setActiveSubTab('posts')}
                style={[
                  styles.quickActionCard,
                  isDesktop && styles.metricCardQuarter,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionCardTop}>
                  <View
                    style={[
                      styles.quickActionIconWrap,
                      { backgroundColor: `${colors.primary}18` },
                    ]}
                  >
                    <Ionicons name="create-outline" size={19} color={colors.primary} />
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  Manage Posts
                </Text>
                <Text style={[styles.quickActionDesc, { color: colors.textMuted }]}>
                  Edit, delete, feature, or clone dispatches
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveSubTab('categories')}
                style={[
                  styles.quickActionCard,
                  isDesktop && styles.metricCardQuarter,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionCardTop}>
                  <View
                    style={[
                      styles.quickActionIconWrap,
                      { backgroundColor: 'rgba(139, 92, 246, 0.18)' },
                    ]}
                  >
                    <Ionicons name="pricetags-outline" size={19} color="#8B5CF6" />
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  Categories
                </Text>
                <Text style={[styles.quickActionDesc, { color: colors.textMuted }]}>
                  Reorder, rename, or create topics
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveSubTab('history')}
                style={[
                  styles.quickActionCard,
                  isDesktop && styles.metricCardQuarter,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionCardTop}>
                  <View
                    style={[
                      styles.quickActionIconWrap,
                      { backgroundColor: 'rgba(16, 185, 129, 0.18)' },
                    ]}
                  >
                    <Ionicons name="time-outline" size={19} color="#10B981" />
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  Audit History
                </Text>
                <Text style={[styles.quickActionDesc, { color: colors.textMuted }]}>
                  Timeline of changes, events & actors
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExportBackup}
                style={[
                  styles.quickActionCard,
                  isDesktop && styles.metricCardQuarter,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionCardTop}>
                  <View
                    style={[
                      styles.quickActionIconWrap,
                      { backgroundColor: 'rgba(245, 158, 11, 0.18)' },
                    ]}
                  >
                    <Ionicons name="download-outline" size={19} color="#F59E0B" />
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  Export Backup
                </Text>
                <Text style={[styles.quickActionDesc, { color: colors.textMuted }]}>
                  Full JSON snapshot of all dispatches
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recent History Preview */}
            <View style={[styles.sectionCardHeader, { marginTop: 28 }]}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                RECENT AUDIT TRAIL
              </Text>
              <TouchableOpacity onPress={() => setActiveSubTab('history')}>
                <Text style={[styles.seeAllLink, { color: colors.primary }]}>
                  View All ({historyEvents.length})
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.recentHistoryContainer,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              {historyEvents.slice(0, 4).map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.recentHistoryItem,
                    { borderBottomColor: colors.separator },
                  ]}
                >
                  <View
                    style={[
                      styles.historyIconCircle,
                      { backgroundColor: `${getLevelColor(item.level)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getEventIcon(item.type)}
                      size={16}
                      color={getLevelColor(item.level)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentHistoryTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.recentHistoryDesc, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  </View>
                  <Text
                    style={[styles.recentHistoryTime, { color: colors.textMuted }]}
                  >
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 2: POSTS MANAGEMENT (FULL CONTROL)                   */}
        {/* ========================================================= */}
        {activeSubTab === 'posts' && (
          <View style={styles.tabSection}>
            {/* Search and Filters Bar */}
            <View style={styles.filterRow}>
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  placeholder="Filter posts by title or author..."
                  placeholderTextColor={colors.textMuted}
                  value={postSearch}
                  onChangeText={setPostSearch}
                  style={[styles.searchInput, { color: colors.text }]}
                />
                {postSearch ? (
                  <TouchableOpacity onPress={() => setPostSearch('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {onCompose && (
                <TouchableOpacity
                  onPress={onCompose}
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={styles.primaryActionBtnText}>New Dispatch</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {['All', ...categories].map((cat) => {
                const isSelected = postCategoryFilter === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setPostCategoryFilter(cat)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        { color: isSelected ? '#FFFFFF' : colors.textMuted },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.resultsCounter, { color: colors.textMuted }]}>
              Showing {filteredAdminPosts.length} of {posts.length} stories
            </Text>

            {/* Posts List */}
            {filteredAdminPosts.length === 0 ? (
              <View
                style={[
                  styles.emptyContainer,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="folder-open-outline" size={42} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No stories found
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  Try clearing search or filters to see all editorial dispatches.
                </Text>
              </View>
            ) : (
              filteredAdminPosts.map((post) => (
                <View
                  key={post.id}
                  style={[
                    styles.postAdminCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: post.is_featured
                        ? colors.primary
                        : colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.postCardMain}>
                    <Image
                      source={{ uri: post.cover_image }}
                      style={styles.postThumbnail}
                    />

                    <View style={styles.postInfo}>
                      <View style={styles.postMetaRow}>
                        <View
                          style={[
                            styles.categoryTag,
                            { backgroundColor: colors.badgeBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryTagText,
                              { color: colors.badgeText },
                            ]}
                          >
                            {post.category}
                          </Text>
                        </View>
                        {post.is_featured && (
                          <View
                            style={[
                              styles.featuredTag,
                              { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                            ]}
                          >
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.featuredTagText}>Featured</Text>
                          </View>
                        )}
                        <Text
                          style={[styles.postDateText, { color: colors.textMuted }]}
                        >
                          {post.read_time}
                        </Text>
                      </View>

                      <Text
                        style={[styles.postCardTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {post.title}
                      </Text>

                      <Text
                        style={[styles.postAuthorText, { color: colors.textMuted }]}
                      >
                        by {post.author_name} • {post.likes_count || 0} likes
                      </Text>
                    </View>
                  </View>

                  {/* Aligned Action Toolbar */}
                  <View
                    style={[
                      styles.postCardActions,
                      { borderTopColor: colors.separator },
                    ]}
                  >
                    {onSelectPost && (
                      <TouchableOpacity
                        onPress={() => onSelectPost(post)}
                        style={[
                          styles.cardActionBtn,
                          { backgroundColor: colors.surface },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="eye-outline" size={15} color={colors.text} />
                        <Text style={[styles.cardActionBtnText, { color: colors.text }]}>
                          View
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => toggleFeatured(post.id)}
                      style={[
                        styles.cardActionBtn,
                        {
                          backgroundColor: post.is_featured
                            ? 'rgba(245, 158, 11, 0.15)'
                            : colors.surface,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={post.is_featured ? 'star' : 'star-outline'}
                        size={15}
                        color={post.is_featured ? '#F59E0B' : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.cardActionBtnText,
                          {
                            color: post.is_featured ? '#F59E0B' : colors.text,
                          },
                        ]}
                      >
                        {post.is_featured ? 'Featured' : 'Feature'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenEdit(post)}
                      style={[
                        styles.cardActionBtn,
                        { backgroundColor: `${colors.primary}15` },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="create-outline"
                        size={15}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.cardActionBtnText,
                          { color: colors.primary, fontWeight: '700' },
                        ]}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => duplicatePost(post.id)}
                      style={[
                        styles.cardActionBtn,
                        { backgroundColor: colors.surface },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={15}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.cardActionBtnText,
                          { color: colors.textMuted },
                        ]}
                      >
                        Clone
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setPostToDelete(post)}
                      style={[
                        styles.cardActionBtn,
                        { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                      <Text
                        style={[styles.cardActionBtnText, { color: '#EF4444' }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CATEGORIES MANAGEMENT (FULL CONTROL)               */}
        {/* ========================================================= */}
        {activeSubTab === 'categories' && (
          <View style={styles.tabSection}>
            {/* Interactive Category Drag & Drop Component */}
            <View
              style={[
                styles.categoryCardWrapper,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <CategoryDragDrop
                selectedCategory={selectedAdminCategory}
                onSelectCategory={setSelectedAdminCategory}
                title="INTERACTIVE CATEGORY REORDERING & QUICK-ADD"
                showAllOption={false}
              />
            </View>

            {/* Quick Add Form */}
            <View
              style={[
                styles.categoryAddCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Add New Editorial Category
              </Text>
              <View style={styles.categoryInputRow}>
                <TextInput
                  placeholder="e.g. Neuroscience, Web3, Space, Quantum..."
                  placeholderTextColor={colors.textMuted}
                  value={newCatName}
                  onChangeText={setNewCatName}
                  style={[
                    styles.categoryTextInput,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={handleAddCategory}
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={styles.primaryActionBtnText}>Add Topic</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Detailed Categories List */}
            <View style={styles.sectionCardHeader}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                ALL CATEGORIES ({categories.length})
              </Text>
              <TouchableOpacity
                onPress={() => resetCategories()}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllLink, { color: colors.primary }]}>
                  Reset Defaults
                </Text>
              </TouchableOpacity>
            </View>

            {categories.map((cat, index) => {
              const count = posts.filter(
                (p) => p.category.toLowerCase() === cat.toLowerCase()
              ).length;
              return (
                <View
                  key={cat}
                  style={[
                    styles.categoryItemRow,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.catLeft}>
                    <View
                      style={[
                        styles.categoryPill,
                        { backgroundColor: colors.badgeBg },
                      ]}
                    >
                      <Ionicons
                        name="pricetag"
                        size={13}
                        color={colors.badgeText}
                      />
                      <Text
                        style={[
                          styles.categoryPillText,
                          { color: colors.badgeText },
                        ]}
                      >
                        {cat}
                      </Text>
                    </View>
                    <Text
                      style={[styles.categoryCount, { color: colors.textMuted }]}
                    >
                      {count} stories
                    </Text>
                  </View>

                  <View style={styles.catActions}>
                    <TouchableOpacity
                      onPress={() => handleMoveCategory(index, 'up')}
                      disabled={index === 0}
                      style={[
                        styles.iconButtonSmall,
                        {
                          backgroundColor: colors.surface,
                          opacity: index === 0 ? 0.3 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="chevron-up" size={16} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleMoveCategory(index, 'down')}
                      disabled={index === categories.length - 1}
                      style={[
                        styles.iconButtonSmall,
                        {
                          backgroundColor: colors.surface,
                          opacity: index === categories.length - 1 ? 0.3 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="chevron-down" size={16} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        setRenamingCategory({ original: cat, newName: cat })
                      }
                      style={[
                        styles.iconButtonSmall,
                        { backgroundColor: `${colors.primary}15` },
                      ]}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={15}
                        color={colors.primary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setCategoryToDelete(cat)}
                      style={[
                        styles.iconButtonSmall,
                        { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                      ]}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: AUDIT HISTORY                                      */}
        {/* ========================================================= */}
        {activeSubTab === 'history' && (
          <View style={styles.tabSection}>
            <View style={styles.filterRow}>
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  placeholder="Search audit trail by title or actor..."
                  placeholderTextColor={colors.textMuted}
                  value={historySearch}
                  onChangeText={setHistorySearch}
                  style={[styles.searchInput, { color: colors.text }]}
                />
                {historySearch ? (
                  <TouchableOpacity onPress={() => setHistorySearch('')}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => setShowClearHistoryConfirm(true)}
                style={[
                  styles.dangerButtonSmall,
                  { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.dangerButtonSmallText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Level Filter Tabs */}
            <View style={styles.levelFilterRow}>
              {(['All', 'success', 'info', 'warning', 'error'] as const).map(
                (lvl) => {
                  const isSelected = historyLevelFilter === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setHistoryLevelFilter(lvl)}
                      style={[
                        styles.levelPill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.card,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.levelPillText,
                          {
                            color: isSelected ? '#FFF' : colors.textMuted,
                            textTransform: 'capitalize',
                          },
                        ]}
                      >
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            <View style={styles.historyStatsHeader}>
              <Text style={[styles.resultsCounter, { color: colors.textMuted }]}>
                Audit Logs ({filteredHistory.length} events recorded)
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const json = exportHistoryJson();
                  setExportedJsonData(json);
                }}
              >
                <Text style={[styles.seeAllLink, { color: colors.primary }]}>
                  Export History JSON
                </Text>
              </TouchableOpacity>
            </View>

            {/* History Events Timeline */}
            {filteredHistory.length === 0 ? (
              <View
                style={[
                  styles.emptyContainer,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="time-outline" size={42} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No history records
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  All new administrative actions will appear in this audit log.
                </Text>
              </View>
            ) : (
              filteredHistory.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyEventCard,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.historyEventHeader}>
                    <View style={styles.historyEventHeaderLeft}>
                      <View
                        style={[
                          styles.historyIconCircle,
                          { backgroundColor: `${getLevelColor(item.level)}20` },
                        ]}
                      >
                        <Ionicons
                          name={getEventIcon(item.type)}
                          size={16}
                          color={getLevelColor(item.level)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.historyItemTitle, { color: colors.text }]}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={[
                            styles.historyItemActor,
                            { color: colors.textMuted },
                          ]}
                        >
                          Actor: {item.actor} • {formatTime(item.timestamp)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.levelTag,
                        { backgroundColor: `${getLevelColor(item.level)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.levelTagText,
                          { color: getLevelColor(item.level) },
                        ]}
                      >
                        {item.level.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.historyItemDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </Text>

                  {item.details && (
                    <TouchableOpacity
                      onPress={() => setSelectedHistoryEvent(item)}
                      style={[
                        styles.inspectBtn,
                        { backgroundColor: colors.surface },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="code-slash-outline"
                        size={14}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.inspectBtnText,
                          { color: colors.primary },
                        ]}
                      >
                        Inspect Payload
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* ========================================================= */}
      {/* NEW MODAL 1: EDIT POST (FULL CONTROL & MODERN DESIGN)    */}
      {/* ========================================================= */}
      <Modal
        visible={!!editingPost}
        animationType="fade"
        transparent
        onRequestClose={() => setEditingPost(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalDialogBox,
              isDesktop && styles.modalDialogBoxDesktop,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.separator }]}
            >
              <View style={styles.modalHeaderTitleWrap}>
                <View style={styles.modalBadgeRow}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Edit Dispatch
                  </Text>
                  <View
                    style={[
                      styles.modalHeaderBadge,
                      { backgroundColor: `${colors.primary}20` },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={12}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.modalHeaderBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      ADMIN PRIVILEGES
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Update title, metadata, cover imagery, audio, and markdown content
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditingPost(null)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Core Metadata */}
              <View
                style={[
                  styles.formSectionCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.formSectionHeader}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                    TITLE & SUBTITLE
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Dispatch Title *
                </Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Post title..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Subtitle / Deck
                </Text>
                <TextInput
                  value={editSubtitle}
                  onChangeText={setEditSubtitle}
                  placeholder="Supporting premise or summary deck..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />
              </View>

              {/* 2. Category Selector */}
              <View
                style={[
                  styles.formSectionCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.formSectionHeader}>
                  <Ionicons name="pricetag-outline" size={16} color="#8B5CF6" />
                  <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                    TOPIC CATEGORY
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryPillsRow}
                >
                  {categories.map((c) => {
                    const isSelected = editCategory === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setEditCategory(c)}
                        style={[
                          styles.editCategoryChip,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.card,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.cardBorder,
                          },
                        ]}
                      >
                        <Ionicons
                          name="pricetag"
                          size={12}
                          color={isSelected ? '#FFF' : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.editCategoryChipText,
                            { color: isSelected ? '#FFF' : colors.text },
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 3. Cover Image Studio */}
              <View
                style={[
                  styles.formSectionCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.formSectionHeader}>
                  <Ionicons name="image-outline" size={16} color="#3B82F6" />
                  <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                    COVER PHOTOGRAPHY
                  </Text>
                </View>

                {editCoverImage ? (
                  <View style={styles.coverPreviewContainer}>
                    <Image
                      source={{ uri: editCoverImage }}
                      style={styles.coverPreviewImage}
                    />
                    <View style={styles.coverPreviewBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={styles.coverPreviewBadgeText}>Preview Active</Text>
                    </View>
                  </View>
                ) : null}

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Cover Image URL
                </Text>
                <TextInput
                  value={editCoverImage}
                  onChangeText={setEditCoverImage}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />

                <Text style={[styles.inputLabelSmall, { color: colors.textMuted }]}>
                  Quick Unsplash Presets:
                </Text>
                <View style={styles.presetCoversGrid}>
                  {PRESET_COVERS.map((preset) => (
                    <TouchableOpacity
                      key={preset.title}
                      onPress={() => setEditCoverImage(preset.url)}
                      style={[
                        styles.presetCoverBtn,
                        {
                          backgroundColor: colors.card,
                          borderColor:
                            editCoverImage === preset.url
                              ? colors.primary
                              : colors.cardBorder,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: preset.url }}
                        style={styles.presetCoverThumbnail}
                      />
                      <Text
                        style={[
                          styles.presetCoverText,
                          {
                            color:
                              editCoverImage === preset.url
                                ? colors.primary
                                : colors.text,
                          },
                        ]}
                      >
                        {preset.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 4. Author & Metrics */}
              <View
                style={[
                  styles.formSectionCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.formSectionHeader}>
                  <Ionicons name="person-outline" size={16} color="#EC4899" />
                  <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                    AUTHOR & METRICS
                  </Text>
                </View>

                <View style={styles.formRowTwoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Author Name
                    </Text>
                    <TextInput
                      value={editAuthor}
                      onChangeText={setEditAuthor}
                      placeholder="e.g. Alex Rivera"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.inputField,
                        {
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Author Role
                    </Text>
                    <TextInput
                      value={editAuthorRole}
                      onChangeText={setEditAuthorRole}
                      placeholder="e.g. Staff Contributor"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.inputField,
                        {
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.formRowTwoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Read Time
                    </Text>
                    <TextInput
                      value={editReadTime}
                      onChangeText={setEditReadTime}
                      placeholder="e.g. 5 min"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.inputField,
                        {
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Likes Count
                    </Text>
                    <TextInput
                      value={editLikes}
                      onChangeText={setEditLikes}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.inputField,
                        {
                          backgroundColor: colors.inputBg,
                          color: colors.text,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Featured Hero Toggle */}
                <TouchableOpacity
                  onPress={() => setEditIsFeatured(!editIsFeatured)}
                  style={[
                    styles.featureToggleRow,
                    {
                      backgroundColor: editIsFeatured
                        ? 'rgba(245, 158, 11, 0.15)'
                        : colors.card,
                      borderColor: editIsFeatured ? '#F59E0B' : colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={editIsFeatured ? 'star' : 'star-outline'}
                    size={24}
                    color={editIsFeatured ? '#F59E0B' : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.featureToggleTitle, { color: colors.text }]}
                    >
                      Hero Carousel Featured Story
                    </Text>
                    <Text
                      style={[
                        styles.featureToggleSubtitle,
                        { color: colors.textMuted },
                      ]}
                    >
                      Pin as high-impact banner story at the top of the feed
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.toggleIndicator,
                      {
                        backgroundColor: editIsFeatured
                          ? '#F59E0B'
                          : colors.separator,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        {
                          alignSelf: editIsFeatured ? 'flex-end' : 'flex-start',
                          backgroundColor: '#FFF',
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* 5. Audio Voice Edition */}
              <View
                style={[
                  styles.formSectionCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.formSectionHeader}>
                  <Ionicons name="headset-outline" size={16} color="#10B981" />
                  <Text style={[styles.formSectionTitle, { color: colors.text }]}>
                    AUDIO VOICE EDITION (OPTIONAL)
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Audio Stream URL (.mp3 / .ogg)
                </Text>
                <TextInput
                  value={editAudioUrl}
                  onChangeText={setEditAudioUrl}
                  placeholder="https://... audio file link"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Audio Track Title
                </Text>
                <TextInput
                  value={editAudioTitle}
                  onChangeText={setEditAudioTitle}
                  placeholder="e.g. AI Synthesized Voice Edition"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />
              </View>

              {/* 6. Content Body */}
              <View
                style={[
                  styles.formSectionCard,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.formSectionHeaderBetween}>
                  <View style={styles.formSectionHeader}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.formSectionTitle, { color: colors.text }]}
                    >
                      ARTICLE CONTENT (MARKDOWN) *
                    </Text>
                  </View>
                  <Text
                    style={[styles.wordCountBadge, { color: colors.textMuted }]}
                  >
                    {editWordCount} words
                  </Text>
                </View>

                <TextInput
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="Article body text and markdown..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                  style={[
                    styles.inputField,
                    styles.textAreaField,
                    {
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View
              style={[styles.modalFooter, { borderTopColor: colors.separator }]}
            >
              <TouchableOpacity
                onPress={() => setEditingPost(null)}
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.modalCancelBtnText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSavePostEdit}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: colors.primary },
                ]}
                disabled={isSavingPost}
                activeOpacity={0.8}
              >
                {isSavingPost ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <View style={styles.btnRowInner}>
                    <Ionicons name="checkmark-sharp" size={16} color="#FFF" />
                    <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================= */}
      {/* NEW MODAL 2: CONFIRM DELETE POST                          */}
      {/* ========================================================= */}
      <Modal
        visible={!!postToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setPostToDelete(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View
            style={[
              styles.confirmModalBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.confirmIconWrap,
                { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
              ]}
            >
              <Ionicons name="trash-outline" size={32} color="#EF4444" />
            </View>

            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              Delete Dispatch?
            </Text>
            <Text style={[styles.confirmDesc, { color: colors.textMuted }]}>
              Permanently remove "{postToDelete?.title}"? This action removes it
              from both local device storage and the Supabase cloud database.
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                onPress={() => setPostToDelete(null)}
                style={[
                  styles.confirmCancelBtn,
                  { backgroundColor: colors.surface },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.confirmCancelBtnText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDeletePost}
                style={[styles.confirmDeleteBtn, { backgroundColor: '#EF4444' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmDeleteBtnText}>
                  Delete Permanently
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* NEW MODAL 3: RENAME CATEGORY                              */}
      {/* ========================================================= */}
      <Modal
        visible={!!renamingCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setRenamingCategory(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View
            style={[
              styles.confirmModalBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.confirmIconWrap,
                { backgroundColor: `${colors.primary}20` },
              ]}
            >
              <Ionicons
                name="pricetag-outline"
                size={28}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              Rename Topic Category
            </Text>
            <Text style={[styles.confirmDesc, { color: colors.textMuted }]}>
              Renaming "{renamingCategory?.original}" will update all associated
              filter chips.
            </Text>

            <TextInput
              value={renamingCategory?.newName || ''}
              onChangeText={(text) =>
                setRenamingCategory((prev) =>
                  prev ? { ...prev, newName: text } : null
                )
              }
              placeholder="New category name..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.categoryTextInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                  width: '100%',
                  marginBottom: 18,
                },
              ]}
            />
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                onPress={() => setRenamingCategory(null)}
                style={[
                  styles.confirmCancelBtn,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[styles.confirmCancelBtnText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveRenameCategory}
                style={[
                  styles.confirmDeleteBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.confirmDeleteBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* NEW MODAL 4: CONFIRM DELETE CATEGORY                      */}
      {/* ========================================================= */}
      <Modal
        visible={!!categoryToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryToDelete(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View
            style={[
              styles.confirmModalBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.confirmIconWrap,
                { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
              ]}
            >
              <Ionicons name="warning-outline" size={32} color="#EF4444" />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              Delete Topic Category?
            </Text>
            <Text style={[styles.confirmDesc, { color: colors.textMuted }]}>
              Remove "{categoryToDelete}"? Posts currently categorized under this
              topic will remain safe and viewable under "All".
            </Text>
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                onPress={() => setCategoryToDelete(null)}
                style={[
                  styles.confirmCancelBtn,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[styles.confirmCancelBtnText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDeleteCategory}
                style={[styles.confirmDeleteBtn, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.confirmDeleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* NEW MODAL 5: INSPECT HISTORY AUDIT PAYLOAD                */}
      {/* ========================================================= */}
      <Modal
        visible={!!selectedHistoryEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedHistoryEvent(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View
            style={[
              styles.payloadModalBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.payloadHeader}>
              <View>
                <Text style={[styles.confirmTitle, { color: colors.text }]}>
                  Audit Event Payload
                </Text>
                <Text
                  style={[styles.payloadSubtitle, { color: colors.textMuted }]}
                >
                  {selectedHistoryEvent?.title} ({selectedHistoryEvent?.type})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedHistoryEvent(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.payloadScroll}>
              <Text
                style={[styles.payloadJsonText, { color: colors.textSecondary }]}
              >
                {JSON.stringify(
                  selectedHistoryEvent?.details || selectedHistoryEvent,
                  null,
                  2
                )}
              </Text>
            </ScrollView>

            <View style={styles.payloadFooterRow}>
              <TouchableOpacity
                onPress={() =>
                  copyText(
                    JSON.stringify(
                      selectedHistoryEvent?.details || selectedHistoryEvent,
                      null,
                      2
                    )
                  )
                }
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    flex: 1,
                  },
                ]}
              >
                <Ionicons
                  name={copyFeedback ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color={copyFeedback ? '#10B981' : colors.text}
                />
                <Text
                  style={[
                    styles.secondaryActionBtnText,
                    { color: copyFeedback ? '#10B981' : colors.text },
                  ]}
                >
                  {copyFeedback ? 'Copied JSON!' : 'Copy Payload'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedHistoryEvent(null)}
                style={[
                  styles.primaryActionBtn,
                  { backgroundColor: colors.primary, flex: 1 },
                ]}
              >
                <Text style={styles.primaryActionBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* NEW MODAL 6: CLEAR HISTORY CONFIRM                        */}
      {/* ========================================================= */}
      <Modal
        visible={showClearHistoryConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearHistoryConfirm(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View
            style={[
              styles.confirmModalBox,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.confirmIconWrap,
                { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
              ]}
            >
              <Ionicons name="trash-outline" size={32} color="#EF4444" />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              Clear Audit History?
            </Text>
            <Text style={[styles.confirmDesc, { color: colors.textMuted }]}>
              This will permanently purge all recorded event telemetry and audit logs
              from local application storage.
            </Text>
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                onPress={() => setShowClearHistoryConfirm(false)}
                style={[
                  styles.confirmCancelBtn,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[styles.confirmCancelBtnText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await clearHistory();
                  setShowClearHistoryConfirm(false);
                  setSystemAlertMessage('Audit history cleared.');
                }}
                style={[styles.confirmDeleteBtn, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.confirmDeleteBtnText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* NEW MODAL 7: JSON EXPORT VIEWER                           */}
      {/* ========================================================= */}
      <Modal
        visible={!!exportedJsonData}
        animationType="fade"
        transparent
        onRequestClose={() => setExportedJsonData(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalDialogBox,
              isDesktop && styles.modalDialogBoxDesktop,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.separator }]}
            >
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  JSON Data Snapshot
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.textMuted }]}
                >
                  Complete serialized database snapshot ready for backup or
                  replication
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setExportedJsonData(null)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <TextInput
                value={exportedJsonData || ''}
                multiline
                editable={false}
                style={[
                  styles.exportCodeBox,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
              />
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.separator }]}
            >
              <TouchableOpacity
                onPress={() => copyText(exportedJsonData || '')}
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    flex: 1,
                  },
                ]}
              >
                <Ionicons
                  name={copyFeedback ? 'checkmark' : 'copy-outline'}
                  size={16}
                  color={copyFeedback ? '#10B981' : colors.text}
                />
                <Text
                  style={[
                    styles.secondaryActionBtnText,
                    { color: copyFeedback ? '#10B981' : colors.text },
                  ]}
                >
                  {copyFeedback ? 'Copied to Clipboard!' : 'Copy Snapshot'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setExportedJsonData(null)}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: colors.primary, flex: 1 },
                ]}
              >
                <Text style={styles.modalSaveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* NEW MODAL 8: IMPORT BACKUP JSON                           */}
      {/* ========================================================= */}
      <Modal
        visible={showImportModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalDialogBox,
              isDesktop && styles.modalDialogBoxDesktop,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.separator }]}
            >
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Import JSON Backup
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.textMuted }]}
                >
                  Paste previously exported posts array into application memory
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Paste JSON Array Here *
              </Text>
              <TextInput
                value={importJsonInput}
                onChangeText={setImportJsonInput}
                placeholder='[ { "title": "...", "content": "..." } ]'
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
                style={[
                  styles.exportCodeBox,
                  {
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
              />
            </ScrollView>

            <View
              style={[styles.modalFooter, { borderTopColor: colors.separator }]}
            >
              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={[
                  styles.modalCancelBtn,
                  { borderColor: colors.cardBorder },
                ]}
              >
                <Text
                  style={[styles.modalCancelBtnText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleImportJson}
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <View style={styles.btnRowInner}>
                  <Ionicons name="cloud-upload" size={16} color="#FFF" />
                  <Text style={styles.modalSaveBtnText}>Import Posts</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating System Alert Toast */}
      {systemAlertMessage && (
        <View
          style={[
            styles.systemAlertToast,
            { backgroundColor: colors.card, borderColor: colors.primary },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text
            style={[styles.systemAlertToastText, { color: colors.text }]}
          >
            {systemAlertMessage}
          </Text>
          <TouchableOpacity onPress={() => setSystemAlertMessage(null)}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    width: '100%',
  },
  headerInner: {
    width: '100%',
    maxWidth: 1140,
    alignSelf: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'nowrap',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexShrink: 0,
  },
  controlPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  controlPillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  exitButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  subTabBar: {
    borderBottomWidth: 1,
    width: '100%',
  },
  subTabInner: {
    width: '100%',
    maxWidth: 1140,
    alignSelf: 'center',
  },
  subTabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  subTabButtonActive: {
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  subTabIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabButtonText: {
    fontSize: 12.5,
  },
  tabCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    marginLeft: 2,
  },
  tabCountPillText: {
    fontSize: 10.5,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    width: '100%',
    maxWidth: 1140,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 120,
  },
  tabSection: {
    width: '100%',
  },
  btnRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Overview Bento Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: 145,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  metricCardQuarter: {
    flexBasis: '23%',
    minWidth: 180,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricStatusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metricCardBody: {
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricSubLabel: {
    fontSize: 11,
    lineHeight: 15,
  },
  metricCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  metricActionLink: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 22,
    gap: 12,
    flexWrap: 'wrap',
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 240,
  },
  statusBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBannerDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  bannerActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionHeadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionSubHeading: {
    fontSize: 11,
    fontWeight: '500',
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 145,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  quickActionDesc: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  recentHistoryContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  recentHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  historyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentHistoryTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  recentHistoryDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  recentHistoryTime: {
    fontSize: 11,
  },
  // Posts Tab Styles
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryScroll: {
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultsCounter: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  postAdminCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  postCardMain: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
  },
  postThumbnail: {
    width: 86,
    height: 86,
    borderRadius: 12,
  },
  postInfo: {
    flex: 1,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  featuredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredTagText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  postDateText: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  postCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  postAuthorText: {
    fontSize: 12,
    marginTop: 5,
  },
  postCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 44,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  // Categories Tab Styles
  categoryCardWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  categoryAddCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputLabelSmall: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryTextInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  categoryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButtonSmall: {
    padding: 8,
    borderRadius: 8,
  },
  // History Tab Styles
  dangerButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dangerButtonSmallText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  levelFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  historyStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyEventCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  historyEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyEventHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyItemActor: {
    fontSize: 11,
    marginTop: 2,
  },
  levelTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelTagText: {
    fontSize: 9,
    fontWeight: '900',
  },
  historyItemDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inspectBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // System Tab Styles
  systemCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  systemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  systemCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  systemCardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  systemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  systemDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  systemDetailValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  systemActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dangerActionsColumn: {
    gap: 12,
  },
  dangerButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerButtonOutlineText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  // Modern Modal Design Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Platform.OS === 'web' ? 24 : 12,
  },
  modalDialogBox: {
    width: '100%',
    maxHeight: '94%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 14,
  },
  modalDialogBoxDesktop: {
    maxWidth: 780,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderTitleWrap: {
    flex: 1,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  modalCloseBtn: {
    padding: 8,
    borderRadius: 100,
  },
  modalScroll: {
    flexGrow: 1,
  },
  modalScrollContent: {
    padding: 20,
    gap: 14,
  },
  formSectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  formSectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  wordCountBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  editCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  editCategoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  coverPreviewContainer: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  coverPreviewImage: {
    width: '100%',
    height: '100%',
  },
  coverPreviewBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coverPreviewBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  presetCoversGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
    paddingRight: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetCoverThumbnail: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  presetCoverText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formRowTwoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  inputField: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  textAreaField: {
    minHeight: 180,
    lineHeight: 22,
  },
  featureToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  featureToggleTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  featureToggleSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleIndicator: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalSaveBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Confirm Modal Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 20,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDeleteBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  payloadModalBox: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '82%',
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
  },
  payloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payloadSubtitle: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  payloadScroll: {
    maxHeight: 340,
    marginVertical: 10,
  },
  payloadJsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  payloadFooterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  exportCodeBox: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 280,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  systemAlertToast: {
    position: 'absolute',
    bottom: 84,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 520,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  systemAlertToastText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  loginGateContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 36,
  },
  loginGateCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  gateEmblemWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  gateSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  gateErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  gateErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  gateDemoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  gateDemoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gateFillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gateFillBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  gateInputLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  gateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
  },
  gateInputField: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  gateSubmitBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    elevation: 3,
  },
  gateSubmitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  gateBackBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  gateBackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gateSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  gateSecurityText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
