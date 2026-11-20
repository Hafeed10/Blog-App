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
 * Insert a new post to Supabase with support for creation time, cover style, images, and audio
 */
export async function insertRemotePost(
  post: Omit<Post, 'id' | 'likes_count' | 'created_at'> & { created_at?: string }
): Promise<{ post: Post | null; error: any }> {
  try {
    const basePayload: Record<string, any> = {
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
    };

    if (post.created_at) {
      basePayload.created_at = post.created_at;
    }
    if (post.cover_style) {
      basePayload.cover_style = post.cover_style;
    }
    if (post.images && post.images.length > 0) {
      basePayload.images = post.images;
    }
    if (post.audio_url) {
      basePayload.audio_url = post.audio_url;
    }
    if (post.audio_title) {
      basePayload.audio_title = post.audio_title;
    }
    if (post.audio_duration) {
      basePayload.audio_duration = post.audio_duration;
    }
    if (post.author_phone) {
      basePayload.author_phone = post.author_phone;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([basePayload])
      .select()
      .single();

    if (error) {
      // If table doesn't have newer columns yet, fallback to minimal columns
      const minimalPayload: Record<string, any> = {
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
      };
      if (post.created_at) minimalPayload.created_at = post.created_at;

      const fallbackRes = await supabase
        .from('posts')
        .insert([minimalPayload])
        .select()
        .single();

      if (fallbackRes.error) {
        return { post: null, error: fallbackRes.error };
      }
      return {
        post: {
          ...fallbackRes.data,
          cover_style: post.cover_style,
          images: post.images,
          audio_url: post.audio_url,
          audio_title: post.audio_title,
          audio_duration: post.audio_duration,
        } as Post,
        error: null,
      };
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
export async function addRemoteComment(
  postId: string,
  userName: string,
  content: string
): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_name: userName,
          content,
          created_at: new Date().toISOString(),
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
