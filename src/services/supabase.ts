import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, Comment } from '../types/blog';
import { sanitizeUrl, sanitizeText, sanitizeSlug, isSafeUUID } from '../utils/security';

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
  return isSafeUUID(id);
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
    const safeTitle = sanitizeText(post.title, 300);
    const safeSubtitle = post.subtitle ? sanitizeText(post.subtitle, 500) : '';
    const safeSlug = sanitizeSlug(post.slug || safeTitle);
    const safeContent = sanitizeText(post.content, 100000);
    const safeCoverImage = sanitizeUrl(post.cover_image, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80');
    const safeCategory = sanitizeText(post.category, 50) || 'General';
    const safeReadTime = sanitizeText(post.read_time, 20) || '4 min';
    const safeAuthorName = sanitizeText(post.author_name, 100) || 'Staff Contributor';
    const safeAuthorAvatar = sanitizeUrl(post.author_avatar);
    const safeAuthorRole = sanitizeText(post.author_role, 100) || 'Author';
    const safeAudioUrl = post.audio_url ? sanitizeUrl(post.audio_url) : undefined;
    const safeAudioTitle = post.audio_title ? sanitizeText(post.audio_title, 200) : undefined;
    const safeAudioDuration = post.audio_duration ? sanitizeText(post.audio_duration, 20) : undefined;
    const safeImages = Array.isArray(post.images)
      ? post.images.map((img) => sanitizeUrl(img)).filter(Boolean)
      : undefined;

    const rawPayload: Record<string, any> = {
      title: safeTitle,
      subtitle: safeSubtitle,
      slug: safeSlug,
      content: safeContent,
      cover_image: safeCoverImage,
      category: safeCategory,
      read_time: safeReadTime,
      author_name: safeAuthorName,
      author_avatar: safeAuthorAvatar,
      author_role: safeAuthorRole,
      likes_count: 0,
      is_featured: Boolean(post.is_featured),
      created_at: post.created_at || new Date().toISOString(),
      cover_style: post.cover_style || 'banner',
      images: safeImages,
      audio_url: safeAudioUrl,
      audio_title: safeAudioTitle,
      audio_duration: safeAudioDuration,
      author_phone: post.author_phone ? sanitizeText(post.author_phone, 30) : undefined,
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
        title: safeTitle,
        subtitle: safeSubtitle,
        slug: safeSlug,
        content: safeContent,
        cover_image: safeCoverImage,
        category: safeCategory,
        read_time: safeReadTime,
        author_name: safeAuthorName,
        likes_count: 0,
      };
      if (safeAuthorAvatar) minimalPayload.author_avatar = safeAuthorAvatar;
      if (safeAuthorRole) minimalPayload.author_role = safeAuthorRole;
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
          images: safeImages,
          audio_url: safeAudioUrl,
          audio_title: safeAudioTitle,
          audio_duration: safeAudioDuration,
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
        images: safeImages,
        audio_url: safeAudioUrl,
        audio_title: safeAudioTitle,
        audio_duration: safeAudioDuration,
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
 * Checks for valid UUID, validates data types, and strips out non-existent schema columns.
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

    const sanitizedUpdates: Partial<Post> = { ...updates };
    if (updates.title) sanitizedUpdates.title = sanitizeText(updates.title, 300);
    if (updates.subtitle) sanitizedUpdates.subtitle = sanitizeText(updates.subtitle, 500);
    if (updates.slug) sanitizedUpdates.slug = sanitizeSlug(updates.slug);
    if (updates.content) sanitizedUpdates.content = sanitizeText(updates.content, 100000);
    if (updates.cover_image) sanitizedUpdates.cover_image = sanitizeUrl(updates.cover_image);
    if (updates.category) sanitizedUpdates.category = sanitizeText(updates.category, 50);
    if (updates.author_name) sanitizedUpdates.author_name = sanitizeText(updates.author_name, 100);
    if (updates.author_avatar) sanitizedUpdates.author_avatar = sanitizeUrl(updates.author_avatar);
    if (updates.audio_url) sanitizedUpdates.audio_url = sanitizeUrl(updates.audio_url);
    if (updates.images && Array.isArray(updates.images)) {
      sanitizedUpdates.images = updates.images.map((img) => sanitizeUrl(img)).filter(Boolean);
    }

    const rawPayload: Record<string, any> = {
      ...sanitizedUpdates,
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
        ...sanitizedUpdates,
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
 * Insert comment for a post (with strict input sanitization and XSS protection)
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

    const safeUserName = sanitizeText(userName, 100) || 'Anonymous Reader';
    const safeContent = sanitizeText(content, 1000);
    if (!safeContent.trim()) {
      return null;
    }

    const commentPayload: Record<string, any> = {
      post_id: postId,
      user_name: safeUserName,
      content: safeContent,
      created_at: new Date().toISOString(),
    };
    if (userAvatar) {
      commentPayload.user_avatar = sanitizeUrl(userAvatar);
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
