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

// Regex to validate standard UUID v4 format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether an ID string is a valid PostgreSQL UUID.
 * Local mock IDs (e.g. 'post-1', 'local-12345') must NOT be queried as UUIDs in Supabase,
 * otherwise PostgREST returns "400 Bad Request: invalid input syntax for type uuid".
 */
export function isValidUUID(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// Columns guaranteed to exist in the public.posts schema
export const STANDARD_POST_COLUMNS = new Set<string>([
  'title',
  'subtitle',
  'slug',
  'content',
  'cover_image',
  'category',
  'read_time',
  'author_name',
  'author_avatar',
  'author_role',
  'likes_count',
  'is_featured',
  'created_at',
  'updated_at',
]);

// Dynamically discovered columns that actually exist in the remote database
const confirmedRemoteColumns = new Set<string>(STANDARD_POST_COLUMNS);

/**
 * Inspects a returned database row and registers newly confirmed columns.
 */
export function recordRemoteColumns(row: Record<string, any>) {
  if (row && typeof row === 'object') {
    Object.keys(row).forEach((k) => confirmedRemoteColumns.add(k));
  }
}

/**
 * Strips out attributes not supported by the remote Supabase table schema
 * to prevent PostgREST from failing with HTTP 400 Bad Request.
 */
function sanitizePostPayload(payload: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (val !== undefined && confirmedRemoteColumns.has(key)) {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Checks connection to the Supabase endpoint and tests if 'posts' table exists.
 * Discovers and tracks remote columns to guarantee safe queries.
 */
export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  try {
    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      // PGRST205 indicates table does not exist yet
      return {
        connected: true,
        tableExists: false,
        errorMessage: error.message || 'Table public.posts not found. Run SQL setup.',
        rowCount: 0,
      };
    }

    if (data && data[0]) {
      recordRemoteColumns(data[0]);
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

    if (data && data.length > 0) {
      data.forEach((p) => recordRemoteColumns(p));
    }

    return { posts: data as Post[], error: null };
  } catch (err) {
    return { posts: null, error: err };
  }
}

/**
 * Insert a new post to Supabase with support for creation time, cover style, images, and audio.
 * Automatically sanitizes payload so columns not yet migrated in Supabase do not throw 400 errors.
 */
export async function insertRemotePost(
  post: Omit<Post, 'id' | 'likes_count' | 'created_at'> & { created_at?: string }
): Promise<{ post: Post | null; error: any }> {
  try {
    const rawPayload: Record<string, any> = {
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
      created_at: post.created_at,
      cover_style: post.cover_style,
      images: post.images && post.images.length > 0 ? post.images : undefined,
      audio_url: post.audio_url,
      audio_title: post.audio_title,
      audio_duration: post.audio_duration,
      author_phone: post.author_phone,
    };

    // Sanitize to only confirmed remote columns to prevent 400 Bad Request
    const safePayload = sanitizePostPayload(rawPayload);

    const { data, error } = await supabase
      .from('posts')
      .insert([safePayload])
      .select()
      .single();

    if (error) {
      // Fallback: minimal essential columns only
      const minimalPayload: Record<string, any> = {
        title: post.title,
        subtitle: post.subtitle || '',
        slug: post.slug,
        content: post.content,
        cover_image: post.cover_image,
        category: post.category,
        read_time: post.read_time,
        author_name: post.author_name,
        likes_count: 0,
      };
      if (post.author_avatar) minimalPayload.author_avatar = post.author_avatar;
      if (post.author_role) minimalPayload.author_role = post.author_role;
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
          author_phone: post.author_phone,
        } as Post,
        error: null,
      };
    }

    if (data) {
      recordRemoteColumns(data);
    }

    return {
      post: {
        ...data,
        cover_style: post.cover_style,
        images: post.images,
        audio_url: post.audio_url,
        audio_title: post.audio_title,
        audio_duration: post.audio_duration,
        author_phone: post.author_phone,
      } as Post,
      error: null,
    };
  } catch (err) {
    return { post: null, error: err };
  }
}

/**
 * Update an existing post in Supabase.
 * Checks for valid UUID and strips out non-existent schema columns.
 */
export async function updateRemotePost(
  postId: string,
  updates: Partial<Post>
): Promise<{ post: Post | null; error: any }> {
  try {
    if (!isValidUUID(postId)) {
      // Local/mock post not stored on remote Supabase
      return { post: null, error: null };
    }

    const rawPayload: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    delete rawPayload.id;

    const safePayload = sanitizePostPayload(rawPayload);

    const { data, error } = await supabase
      .from('posts')
      .update(safePayload)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      return { post: null, error };
    }

    return {
      post: {
        ...data,
        ...updates,
      } as Post,
      error: null,
    };
  } catch (err) {
    return { post: null, error: err };
  }
}

/**
 * Delete a post from Supabase
 */
export async function deleteRemotePost(postId: string): Promise<{ success: boolean; error: any }> {
  try {
    if (!isValidUUID(postId)) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Like a post (increments likes count)
 */
export async function likeRemotePost(postId: string, currentLikes: number): Promise<boolean> {
  try {
    if (!isValidUUID(postId)) {
      // Mock / local post, success locally without error
      return true;
    }

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
    if (!isValidUUID(postId)) {
      return [];
    }

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
 * Delete a comment from Supabase
 */
export async function deleteRemoteComment(commentId: string): Promise<{ success: boolean; error: any }> {
  try {
    if (!isValidUUID(commentId)) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Insert comment for a post
 */
export async function addRemoteComment(
  postId: string,
  userName: string,
  content: string,
  userAvatar?: string
): Promise<Comment | null> {
  try {
    if (!isValidUUID(postId)) {
      return null;
    }

    const commentPayload: Record<string, any> = {
      post_id: postId,
      user_name: userName,
      content,
      created_at: new Date().toISOString(),
    };
    if (userAvatar) {
      commentPayload.user_avatar = userAvatar;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([commentPayload])
      .select()
      .single();

    if (error || !data) return null;
    return data as Comment;
  } catch {
    return null;
  }
}
