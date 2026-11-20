-- =====================================================================
-- SUPABASE BLOG DATABASE SCHEMA & SEED DATA
-- Project: https://ftpwzsyajenwjfgoddwy.supabase.co
-- Key: sb_publishable_Edi2csDPvelAy-fc-ZsRcQ_PT-S8xXp
-- 
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ftpwzsyajenwjfgoddwy
-- 2. Click on "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste the contents of this file, and click "Run".
-- =====================================================================

-- 1. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    cover_style TEXT DEFAULT 'banner',
    images TEXT[] DEFAULT '{}',
    audio_url TEXT,
    audio_title TEXT,
    audio_duration TEXT,
    category TEXT NOT NULL DEFAULT 'Tech',
    read_time TEXT DEFAULT '4 min',
    author_name TEXT NOT NULL DEFAULT 'Elena Vance',
    author_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    author_role TEXT DEFAULT 'Design Technologist',
    likes_count INTEGER DEFAULT 142,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add newer columns if table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='cover_style') THEN
        ALTER TABLE public.posts ADD COLUMN cover_style TEXT DEFAULT 'banner';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='images') THEN
        ALTER TABLE public.posts ADD COLUMN images TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='audio_url') THEN
        ALTER TABLE public.posts ADD COLUMN audio_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='audio_title') THEN
        ALTER TABLE public.posts ADD COLUMN audio_title TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='audio_duration') THEN
        ALTER TABLE public.posts ADD COLUMN audio_duration TEXT;
    END IF;
END $$;

-- 2. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Posts
CREATE POLICY "Allow public read access for posts"
    ON public.posts
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access for posts"
    ON public.posts
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access for likes"
    ON public.posts
    FOR UPDATE
    USING (true);

-- 5. RLS Policies for Comments
CREATE POLICY "Allow public read access for comments"
    ON public.comments
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access for comments"
    ON public.comments
    FOR INSERT
    WITH CHECK (true);
