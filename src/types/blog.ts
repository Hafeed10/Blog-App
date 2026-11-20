export interface Post {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: string;
  cover_image: string;
  cover_style?: 'banner' | 'magazine' | 'minimal';
  images?: string[];
  audio_url?: string;
  audio_title?: string;
  audio_duration?: string;
  category: string;
  read_time: string;
  author_name: string;
  author_avatar?: string;
  author_role?: string;
  author_phone?: string;
  likes_count: number;
  is_featured?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export type Category = 'All' | 'Tech' | 'Design' | 'AI & Tech' | 'Engineering' | 'Culture' | 'Business';
