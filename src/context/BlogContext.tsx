import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, Category, DEFAULT_CATEGORIES } from '../types/blog';
import { INITIAL_POSTS } from '../data/mockPosts';
import {
  checkDatabaseHealth,
  fetchRemotePosts,
  insertRemotePost,
  updateRemotePost,
  deleteRemotePost,
  likeRemotePost,
  DatabaseStatus,
} from '../services/supabase';
import { useHistory } from './HistoryContext';
import { useAuth } from './AuthContext';
import { safeJsonParse, sanitizeText } from '../utils/security';

interface BlogContextType {
  posts: Post[];
  featuredPost: Post | null;
  filteredPosts: Post[];
  bookmarkedPosts: Post[];
  categories: string[];
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  addCustomCategory: (name: string) => Promise<string>;
  removeCustomCategory: (name: string) => Promise<void>;
  reorderCategories: (newOrder: string[]) => Promise<void>;
  resetCategories: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  bookmarkedIds: string[];
  toggleBookmark: (postId: string) => Promise<void>;
  isBookmarked: (postId: string) => boolean;
  likedIds: string[];
  toggleLike: (postId: string) => Promise<void>;
  isLiked: (postId: string) => boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshPosts: () => Promise<void>;
  createNewPost: (
    post: Omit<Post, 'id' | 'likes_count' | 'created_at'> & { created_at?: string }
  ) => Promise<{ success: boolean; error?: string; post?: Post }>;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<{ success: boolean; error?: string }>;
  deletePost: (postId: string) => Promise<{ success: boolean; error?: string }>;
  toggleFeatured: (postId: string) => Promise<void>;
  duplicatePost: (postId: string) => Promise<{ success: boolean; newPost?: Post; error?: string }>;
  restoreDefaultPosts: () => Promise<void>;
  clearAllCache: () => Promise<void>;
  exportAllData: () => Promise<string>;
  importPostsData: (imported: Post[]) => Promise<boolean>;
  databaseStatus: DatabaseStatus;
  recheckDatabase: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | null>(null);

const BOOKMARKS_STORAGE_KEY = '@app_blog_bookmarks';
const LIKES_STORAGE_KEY = '@app_blog_liked_ids';
const CATEGORIES_STORAGE_KEY = '@app_blog_categories_v2';
const POSTS_STORAGE_KEY = '@app_blog_posts_v3';
const DELETED_POSTS_STORAGE_KEY = '@app_blog_deleted_ids_v3';

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addHistoryEvent } = useHistory();
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>({
    connected: false,
    tableExists: false,
    rowCount: 0,
  });

  // Load saved bookmarks, likes, custom/reordered categories, and persisted posts
  useEffect(() => {
    (async () => {
      try {
        const [savedBookmarks, savedLikes, savedCategories, savedPosts, savedDeleted] = await Promise.all([
          AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY),
          AsyncStorage.getItem(LIKES_STORAGE_KEY),
          AsyncStorage.getItem(CATEGORIES_STORAGE_KEY),
          AsyncStorage.getItem(POSTS_STORAGE_KEY),
          AsyncStorage.getItem(DELETED_POSTS_STORAGE_KEY),
        ]);
        if (savedBookmarks) setBookmarkedIds(safeJsonParse<string[]>(savedBookmarks, []));
        if (savedLikes) setLikedIds(safeJsonParse<string[]>(savedLikes, []));
        if (savedCategories) {
          const parsed = safeJsonParse<string[]>(savedCategories, []);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(parsed.map((c) => sanitizeText(c, 50)).filter(Boolean));
          }
        }
        const deletedIds: string[] = savedDeleted ? safeJsonParse<string[]>(savedDeleted, []) : [];
        if (savedPosts) {
          const parsedPosts: Post[] = safeJsonParse<Post[]>(savedPosts, []);
          if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
            setPosts(parsedPosts.filter((p) => !deletedIds.includes(p.id)));
          } else {
            setPosts(INITIAL_POSTS.filter((p) => !deletedIds.includes(p.id)));
          }
        } else {
          setPosts(INITIAL_POSTS.filter((p) => !deletedIds.includes(p.id)));
        }
      } catch (e) {
        console.warn('Failed to load local storage preferences', e);
      }
    })();
  }, []);

  // Category management functions
  const addCustomCategory = async (name: string): Promise<string> => {
    const trimmed = sanitizeText(name, 50).trim();
    if (!trimmed) return '';
    const existing = categories.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setSelectedCategory(existing);
      return existing;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    setSelectedCategory(trimmed);
    try {
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
      await addHistoryEvent({
        type: 'CATEGORY_ADD',
        title: 'Category Added',
        description: `Created new editorial category "${trimmed}".`,
        actor: 'Admin',
        level: 'success',
      });
    } catch (e) {
      console.warn('Failed to save categories', e);
    }
    return trimmed;
  };

  const removeCustomCategory = async (name: string) => {
    const updated = categories.filter((c) => c !== name);
    setCategories(updated);
    if (selectedCategory === name) {
      setSelectedCategory('All');
    }
    try {
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
      await addHistoryEvent({
        type: 'CATEGORY_DELETE',
        title: 'Category Deleted',
        description: `Removed editorial category "${name}".`,
        actor: 'Admin',
        level: 'warning',
      });
    } catch (e) {
      console.warn('Failed to save categories', e);
    }
  };

  const reorderCategories = async (newOrder: string[]) => {
    setCategories(newOrder);
    try {
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(newOrder));
      await addHistoryEvent({
        type: 'CATEGORY_REORDER',
        title: 'Categories Reordered',
        description: `Updated priority order of ${newOrder.length} categories.`,
        actor: 'Admin',
        level: 'info',
      });
    } catch (e) {
      console.warn('Failed to save categories order', e);
    }
  };

  const resetCategories = async () => {
    setCategories([...DEFAULT_CATEGORIES]);
    try {
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      await addHistoryEvent({
        type: 'CATEGORY_RESET',
        title: 'Categories Reset',
        description: 'Restored editorial categories to factory defaults.',
        actor: 'Admin',
        level: 'info',
      });
    } catch (e) {
      console.warn('Failed to reset categories', e);
    }
  };

  // Fetch posts from Supabase or fallback to mock (respecting deleted and local custom posts)
  const loadPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const savedDeletedStr = await AsyncStorage.getItem(DELETED_POSTS_STORAGE_KEY).catch(() => null);
      const deletedIds: string[] = savedDeletedStr ? safeJsonParse<string[]>(savedDeletedStr, []) : [];

      const status = await checkDatabaseHealth();
      setDatabaseStatus(status);

      if (status.tableExists) {
        const { posts: remotePosts, error } = await fetchRemotePosts();
        if (!error && remotePosts && remotePosts.length > 0) {
          const validPosts = remotePosts.filter((p) => !deletedIds.includes(p.id));
          setPosts(validPosts);
          await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(validPosts));
        } else {
          // If table exists but empty, check local storage or fallback to mock
          const savedPostsStr = await AsyncStorage.getItem(POSTS_STORAGE_KEY).catch(() => null);
          if (savedPostsStr) {
            const parsed: Post[] = safeJsonParse<Post[]>(savedPostsStr, []);
            const valid = parsed.filter((p) => !deletedIds.includes(p.id));
            setPosts(valid);
          } else {
            const initial = INITIAL_POSTS.filter((p) => !deletedIds.includes(p.id));
            setPosts(initial);
            await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(initial));
          }
        }
      } else {
        // Fallback to local storage or mock
        const savedPostsStr = await AsyncStorage.getItem(POSTS_STORAGE_KEY).catch(() => null);
        if (savedPostsStr) {
          const parsed: Post[] = safeJsonParse<Post[]>(savedPostsStr, []);
          const valid = parsed.filter((p) => !deletedIds.includes(p.id));
          setPosts(valid);
        } else {
          const initial = INITIAL_POSTS.filter((p) => !deletedIds.includes(p.id));
          setPosts(initial);
          await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(initial));
        }
      }
    } catch {
      const savedDeletedStr = await AsyncStorage.getItem(DELETED_POSTS_STORAGE_KEY).catch(() => null);
      const deletedIds: string[] = savedDeletedStr ? safeJsonParse<string[]>(savedDeletedStr, []) : [];
      const savedPostsStr = await AsyncStorage.getItem(POSTS_STORAGE_KEY).catch(() => null);
      if (savedPostsStr) {
        const parsed: Post[] = safeJsonParse<Post[]>(savedPostsStr, []);
        setPosts(parsed.filter((p) => !deletedIds.includes(p.id)));
      } else {
        setPosts(INITIAL_POSTS.filter((p) => !deletedIds.includes(p.id)));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const recheckDatabase = async () => {
    await loadPosts(true);
  };

  const refreshPosts = async () => {
    await loadPosts(true);
  };

  // Toggle bookmark
  const toggleBookmark = async (postId: string) => {
    let next: string[];
    if (bookmarkedIds.includes(postId)) {
      next = bookmarkedIds.filter((id) => id !== postId);
    } else {
      next = [...bookmarkedIds, postId];
    }
    setBookmarkedIds(next);
    try {
      await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const isBookmarked = (postId: string) => bookmarkedIds.includes(postId);

  // Toggle like (optimistic update + sync with Supabase)
  const toggleLike = async (postId: string) => {
    const isCurrentlyLiked = likedIds.includes(postId);
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Optimistic state
    const nextLikedIds = isCurrentlyLiked
      ? likedIds.filter((id) => id !== postId)
      : [...likedIds, postId];
    setLikedIds(nextLikedIds);

    const delta = isCurrentlyLiked ? -1 : 1;
    const nextPosts = posts.map((p) =>
      p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count + delta) } : p
    );
    setPosts(nextPosts);

    try {
      await AsyncStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(nextLikedIds));
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts));
      if (!isCurrentlyLiked && databaseStatus.tableExists) {
        await likeRemotePost(postId, post.likes_count);
      }
    } catch {
      // ignore
    }
  };

  const isLiked = (postId: string) => likedIds.includes(postId);

  // Create new post
  const createNewPost = async (
    newPostData: Omit<Post, 'id' | 'likes_count' | 'created_at'> & { created_at?: string }
  ): Promise<{ success: boolean; error?: string; post?: Post }> => {
    const optimisticPost: Post = {
      ...newPostData,
      id: `local-${Date.now()}`,
      created_at: newPostData.created_at || new Date().toISOString(),
      likes_count: 0,
    };

    let createdPost = optimisticPost;
    let resSuccess = true;
    let resError: string | undefined = undefined;

    if (databaseStatus.tableExists) {
      const { post: remotePost, error } = await insertRemotePost(newPostData);
      if (error) {
        // Fallback: still show locally so user doesn't lose work
        const nextList = [optimisticPost, ...posts];
        setPosts(nextList);
        AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextList)).catch(() => {});
        resSuccess = false;
        resError = error.message;
      } else if (remotePost) {
        createdPost = remotePost;
        const nextList = [remotePost, ...posts];
        setPosts(nextList);
        AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextList)).catch(() => {});
        resSuccess = true;
      }
    } else {
      // Offline / Mock mode addition
      const nextList = [optimisticPost, ...posts];
      setPosts(nextList);
      AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextList)).catch(() => {});
    }

    await addHistoryEvent({
      type: 'POST_CREATE',
      title: 'Post Published',
      description: `Created new dispatch "${newPostData.title}".`,
      actor: newPostData.author_name || 'Admin',
      level: 'success',
      targetId: createdPost.id,
      details: {
        category: newPostData.category,
        author: newPostData.author_name,
        readTime: newPostData.read_time,
      },
    });

    return { success: resSuccess, error: resError, post: createdPost };
  };

  // Update existing post
  const updatePost = async (
    postId: string,
    updates: Partial<Post>
  ): Promise<{ success: boolean; error?: string }> => {
    const existing = posts.find((p) => p.id === postId);
    if (!existing) {
      return { success: false, error: 'Post not found' };
    }

    // IDOR Protection: verify user is authorized (Admin or Author of the post)
    const isOwner =
      user &&
      ((user.name &&
        existing.author_name &&
        user.name.trim().toLowerCase() === existing.author_name.trim().toLowerCase()) ||
        (user.email && existing.author_role && user.email.toLowerCase().includes('admin')));

    if (!isAdmin && !isOwner) {
      return {
        success: false,
        error: "Unauthorized (IDOR Protection): You cannot edit another author's post.",
      };
    }

    const updatedPost: Post = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const nextPosts = posts.map((p) => (p.id === postId ? updatedPost : p));
    setPosts(nextPosts);
    AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts)).catch(() => {});

    if (databaseStatus.tableExists) {
      const { error } = await updateRemotePost(postId, updates);
      if (error) {
        console.warn('Supabase remote update failed, kept local changes', error);
      }
    }

    await addHistoryEvent({
      type: 'POST_UPDATE',
      title: 'Post Updated',
      description: `Updated dispatch "${updatedPost.title}".`,
      actor: user?.name || (isAdmin ? 'Admin' : 'Author'),
      level: 'info',
      targetId: postId,
      details: updates,
    });

    return { success: true };
  };

  // Delete post
  const deletePost = async (postId: string): Promise<{ success: boolean; error?: string }> => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) {
      return { success: false, error: 'Post not found' };
    }

    // IDOR Protection: verify user is authorized (Admin or Author of the post)
    const isOwner =
      user &&
      ((user.name &&
        targetPost.author_name &&
        user.name.trim().toLowerCase() === targetPost.author_name.trim().toLowerCase()) ||
        (user.email && targetPost.author_role && user.email.toLowerCase().includes('admin')));

    if (!isAdmin && !isOwner) {
      return {
        success: false,
        error: "Unauthorized (IDOR Protection): You cannot delete another author's post.",
      };
    }

    const postTitle = targetPost.title;

    const remainingPosts = posts.filter((p) => p.id !== postId);
    setPosts(remainingPosts);
    setBookmarkedIds((prev) => prev.filter((id) => id !== postId));
    setLikedIds((prev) => prev.filter((id) => id !== postId));

    // Persist deleted state to AsyncStorage so post never reappears
    try {
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(remainingPosts));
      const savedDeletedStr = await AsyncStorage.getItem(DELETED_POSTS_STORAGE_KEY).catch(() => null);
      const deletedIds: string[] = savedDeletedStr ? safeJsonParse<string[]>(savedDeletedStr, []) : [];
      if (!deletedIds.includes(postId)) {
        deletedIds.push(postId);
        await AsyncStorage.setItem(DELETED_POSTS_STORAGE_KEY, JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn('Failed to save deleted post to AsyncStorage', e);
    }

    if (databaseStatus.tableExists) {
      const { error } = await deleteRemotePost(postId);
      if (error) {
        console.warn('Supabase remote deletion failed', error);
      }
    }

    await addHistoryEvent({
      type: 'POST_DELETE',
      title: 'Post Deleted',
      description: `Deleted dispatch "${postTitle}".`,
      actor: 'Admin',
      level: 'warning',
      targetId: postId,
    });

    return { success: true };
  };

  // Toggle Featured status
  const toggleFeatured = async (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    const nextFeatured = !target.is_featured;
    const nextPosts = posts.map((p) => (p.id === postId ? { ...p, is_featured: nextFeatured } : p));
    setPosts(nextPosts);
    AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(nextPosts)).catch(() => {});

    if (databaseStatus.tableExists) {
      await updateRemotePost(postId, { is_featured: nextFeatured });
    }

    await addHistoryEvent({
      type: 'POST_FEATURE',
      title: nextFeatured ? 'Post Featured' : 'Post Unfeatured',
      description: `Dispatch "${target.title}" marked as ${nextFeatured ? 'Featured Hero Story' : 'Standard'}.`,
      actor: 'Admin',
      level: 'info',
      targetId: postId,
    });
  };

  // Duplicate Post
  const duplicatePost = async (
    postId: string
  ): Promise<{ success: boolean; newPost?: Post; error?: string }> => {
    const original = posts.find((p) => p.id === postId);
    if (!original) {
      return { success: false, error: 'Original post not found' };
    }

    const duplicatedData: Omit<Post, 'id' | 'likes_count' | 'created_at'> & { created_at?: string } = {
      title: `${original.title} (Copy)`,
      subtitle: original.subtitle ? `${original.subtitle} (Draft Copy)` : undefined,
      slug: `${original.slug}-copy-${Date.now()}`,
      content: original.content,
      cover_image: original.cover_image,
      cover_style: original.cover_style,
      images: original.images ? [...original.images] : [],
      audio_url: original.audio_url,
      audio_title: original.audio_title,
      audio_duration: original.audio_duration,
      category: original.category,
      read_time: original.read_time,
      author_name: original.author_name,
      author_avatar: original.author_avatar,
      author_role: original.author_role,
      author_phone: original.author_phone,
      is_featured: false,
      created_at: new Date().toISOString(),
    };

    const res = await createNewPost(duplicatedData);
    if (res.success && res.post) {
      await addHistoryEvent({
        type: 'POST_DUPLICATE',
        title: 'Post Duplicated',
        description: `Created duplicate clone of "${original.title}".`,
        actor: 'Admin',
        level: 'info',
        targetId: res.post.id,
      });
      return { success: true, newPost: res.post };
    }
    return { success: false, error: res.error || 'Failed to duplicate post' };
  };

  // Restore Default Mock Posts
  const restoreDefaultPosts = async () => {
    setPosts(INITIAL_POSTS);
    try {
      await AsyncStorage.removeItem(DELETED_POSTS_STORAGE_KEY);
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
    } catch (e) {
      console.warn('Failed to reset posts storage', e);
    }
    await addHistoryEvent({
      type: 'SYSTEM_RESTORE',
      title: 'Default Posts Restored',
      description: 'Reset story database with curated initial editorial dispatches.',
      actor: 'Admin',
      level: 'warning',
    });
  };

  // Clear App Cache & Preferences
  const clearAllCache = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(BOOKMARKS_STORAGE_KEY),
        AsyncStorage.removeItem(LIKES_STORAGE_KEY),
        AsyncStorage.removeItem(CATEGORIES_STORAGE_KEY),
      ]);
      setBookmarkedIds([]);
      setLikedIds([]);
      setCategories([...DEFAULT_CATEGORIES]);
      await addHistoryEvent({
        type: 'CACHE_CLEAR',
        title: 'App Cache & Preferences Reset',
        description: 'Cleared bookmarks, saved likes, and custom categories.',
        actor: 'Admin',
        level: 'warning',
      });
    } catch (e) {
      console.warn('Failed to clear cache', e);
    }
  };

  // Export full JSON Backup
  const exportAllData = async (): Promise<string> => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'Chronicle Editorial Platform',
      version: '2.4.0',
      databaseStatus,
      postsCount: posts.length,
      categories,
      bookmarkedIds,
      posts,
    };
    const json = JSON.stringify(payload, null, 2);
    await addHistoryEvent({
      type: 'BACKUP_EXPORT',
      title: 'Full Platform Backup Exported',
      description: `Exported JSON payload containing ${posts.length} posts and ${categories.length} categories.`,
      actor: 'Admin',
      level: 'info',
    });
    return json;
  };

  // Import Posts Data
  const importPostsData = async (imported: Post[]): Promise<boolean> => {
    if (!Array.isArray(imported) || imported.length === 0) return false;
    setPosts(imported);
    await addHistoryEvent({
      type: 'BACKUP_IMPORT',
      title: 'Posts Imported From Backup',
      description: `Loaded ${imported.length} dispatches into application memory.`,
      actor: 'Admin',
      level: 'success',
      details: { importedCount: imported.length },
    });
    return true;
  };

  // Filtered posts calculation
  const featuredPost = useMemo(() => {
    return posts.find((p) => p.is_featured) || posts[0] || null;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        post.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        (post.subtitle && post.subtitle.toLowerCase().includes(query)) ||
        post.content.toLowerCase().includes(query) ||
        post.author_name.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const bookmarkedPosts = useMemo(() => {
    return posts.filter((p) => bookmarkedIds.includes(p.id));
  }, [posts, bookmarkedIds]);

  return (
    <BlogContext.Provider
      value={{
        posts,
        featuredPost,
        filteredPosts,
        bookmarkedPosts,
        categories,
        selectedCategory,
        setSelectedCategory,
        addCustomCategory,
        removeCustomCategory,
        reorderCategories,
        resetCategories,
        searchQuery,
        setSearchQuery,
        bookmarkedIds,
        toggleBookmark,
        isBookmarked,
        likedIds,
        toggleLike,
        isLiked,
        isLoading,
        isRefreshing,
        refreshPosts,
        createNewPost,
        updatePost,
        deletePost,
        toggleFeatured,
        duplicatePost,
        restoreDefaultPosts,
        clearAllCache,
        exportAllData,
        importPostsData,
        databaseStatus,
        recheckDatabase,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};
