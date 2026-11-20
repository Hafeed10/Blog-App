import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, Category } from '../types/blog';
import { INITIAL_POSTS } from '../data/mockPosts';
import {
  checkDatabaseHealth,
  fetchRemotePosts,
  insertRemotePost,
  likeRemotePost,
  DatabaseStatus,
} from '../services/supabase';

interface BlogContextType {
  posts: Post[];
  featuredPost: Post | null;
  filteredPosts: Post[];
  bookmarkedPosts: Post[];
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
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
  ) => Promise<{ success: boolean; error?: string }>;
  databaseStatus: DatabaseStatus;
  recheckDatabase: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | null>(null);

const BOOKMARKS_STORAGE_KEY = '@app_blog_bookmarks';
const LIKES_STORAGE_KEY = '@app_blog_liked_ids';

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
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

  // Load saved bookmarks and likes
  useEffect(() => {
    (async () => {
      try {
        const [savedBookmarks, savedLikes] = await Promise.all([
          AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY),
          AsyncStorage.getItem(LIKES_STORAGE_KEY),
        ]);
        if (savedBookmarks) setBookmarkedIds(JSON.parse(savedBookmarks));
        if (savedLikes) setLikedIds(JSON.parse(savedLikes));
      } catch (e) {
        console.warn('Failed to load local storage preferences', e);
      }
    })();
  }, []);

  // Fetch posts from Supabase or fallback to mock
  const loadPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const status = await checkDatabaseHealth();
      setDatabaseStatus(status);

      if (status.tableExists) {
        const { posts: remotePosts, error } = await fetchRemotePosts();
        if (!error && remotePosts && remotePosts.length > 0) {
          setPosts(remotePosts);
        } else {
          // If table exists but empty, show mock or empty
          setPosts(INITIAL_POSTS);
        }
      } else {
        // Fallback to rich mock posts
        setPosts(INITIAL_POSTS);
      }
    } catch {
      setPosts(INITIAL_POSTS);
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
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count + delta) } : p
      )
    );

    try {
      await AsyncStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(nextLikedIds));
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
  ): Promise<{ success: boolean; error?: string }> => {
    const optimisticPost: Post = {
      ...newPostData,
      id: `local-${Date.now()}`,
      created_at: newPostData.created_at || new Date().toISOString(),
      likes_count: 0,
    };

    if (databaseStatus.tableExists) {
      const { post: remotePost, error } = await insertRemotePost(newPostData);
      if (error) {
        // Fallback: still show locally so user doesn't lose work
        setPosts((prev) => [optimisticPost, ...prev]);
        return { success: false, error: error.message };
      }
      if (remotePost) {
        setPosts((prev) => [remotePost, ...prev]);
        return { success: true };
      }
    }

    // Offline / Mock mode addition
    setPosts((prev) => [optimisticPost, ...prev]);
    return { success: true };
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
        selectedCategory,
        setSelectedCategory,
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
