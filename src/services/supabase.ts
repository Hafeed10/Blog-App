import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, Comment } from '../types/blog';

export const SUPABASE_URL = 'https://ftpwzsyajenwjfgoddwy.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Edi2csDPvelAy-fc-ZsRcQ_PT-S8xXp';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface DatabaseStatus {
  connected: boolean;
  tableExists: boolean;
  errorMessage?: string;
  rowCount: number;
}

/**
 * Checks connection to the Supabase endpoint and tests if 'posts' table exists.
 */
export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  try {
    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // PGRST205 indicates table does not exist yet
      return {
        connected: true,
        tableExists: false,
        errorMessage: error.message || 'Table public.posts not found. Run SQL setup.',
        rowCount: 0,
      };
    }

    return {
      connected: true,
      tableExists: true,
      rowCount: count ?? 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      errorMessage: err.message || 'Network error connecting to Supabase',
      rowCount: 0,
    };
  }
}

/**
 * Fetch all posts ordered by creation date
 */
export async function fetchRemotePosts(): Promise<{ posts: Post[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { posts: null, error };
    }

    return { posts: data as Post[], error: null };
  } catch (err) {
    return { posts: null, error: err };
  }
}

/**
 * Insert a new post to Supabase
 */
export async function insertRemotePost(post: Omit<Post, 'id' | 'created_at' | 'likes_count'>): Promise<{ post: Post | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title: post.title,
          subtitle: post.subtitle || '',
          slug: post.slug,
          content: post.content,
          cover_image: post.cover_image,
          category: post.category,
          read_time: post.read_time,
          author_name: post.author_name,
          author_avatar: post.author_avatar,
          author_role: post.author_role,
          likes_count: 0,
          is_featured: post.is_featured || false,
        },
      ])
      .select()
      .single();

    if (error) {
      return { post: null, error };
    }

    return { post: data as Post, error: null };
  } catch (err) {
    return { post: null, error: err };
  }
}

/**
 * Like a post (increments likes count)
 */
export async function likeRemotePost(postId: string, currentLikes: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ likes_count: currentLikes + 1 })
      .eq('id', postId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetch comments for a post
 */
export async function fetchRemoteComments(postId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data as Comment[];
  } catch {
    return [];
  }
}

/**
 * Insert comment for a post
 */
export async function addRemoteComment(postId: string, userName: string, content: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_name: userName,
          content,
        },
      ])
      .select()
      .single();

    if (error || !data) return null;
    return data as Comment;
  } catch {
    return null;
  }
}
