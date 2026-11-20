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
-- Allow anyone with the publishable/anon key to read posts
CREATE POLICY "Allow public read access for posts"
    ON public.posts
    FOR SELECT
    USING (true);

-- Allow anyone with the publishable/anon key to insert new posts
CREATE POLICY "Allow public insert access for posts"
    ON public.posts
    FOR INSERT
    WITH CHECK (true);

-- Allow updating likes
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

-- 6. Insert Initial High-Quality Seed Posts
INSERT INTO public.posts (title, subtitle, slug, content, cover_image, category, read_time, author_name, author_avatar, author_role, likes_count, is_featured)
VALUES
(
    'The Architectural Shift in Mobile Intelligence: Agentic Systems on Device',
    'How local neural engines and autonomous agent loops are reshaping mobile experiences in 2026 and beyond.',
    'architectural-shift-mobile-intelligence-2026',
    'The landscape of mobile engineering is undergoing its most radical transformation since the transition from desktop web to touch screens. With neural processing units (NPUs) now standard in modern smartphones, we are moving past client-server request-response paradigms toward truly autonomous agentic loops running directly on user devices.

### 1. From Passive Views to Proactive Co-Pilots
Traditional applications wait for user touch events, render loading spinners, and ping remote REST or GraphQL APIs. Next-generation mobile architectures reverse this dynamic:
- Context engines continuously synthesize local ambient signals (location, calendar cadence, cognitive load).
- On-device distilled LLMs evaluate high-frequency micro-intent without sending private data over the wire.
- Background workflows orchestrate sync with distributed cloud backends like Supabase only when high-durability consensus is needed.

### 2. High-Performance Fluidity in React Native
React Native’s latest architecture (Fabric renderer and TurboModules) eliminates bridge serialization bottlenecks. High-frame-rate tactile physics and gesture-driven transitions feel native and instant.

```typescript
// On-device reactive dispatching pattern
const agentDispatch = async (intent: UserIntent) => {
  const localResolution = await npxLocalModel.resolve(intent);
  if (localResolution.confident) {
    applyOptimisticState(localResolution.payload);
  }
  return backgroundSyncToCloud(intent);
};
```

### 3. Privacy, Ownership, and the Distributed Web
Users are demanding absolute control over their digital footprint. By leveraging local databases coupled with edge-computed synchronization, developers achieve sub-10ms response times while guaranteeing zero-knowledge encryption.',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    'AI & Tech',
    '6 min',
    'Elena Vance',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'Design Technologist',
    384,
    true
),
(
    'Designing for the Spatial Era: Beyond the Flat Glass Paradigm',
    'Tactile elevation, chromatic depth, and micro-physics for future-facing interfaces.',
    'designing-for-spatial-era',
    'Flat design stripped interfaces down to clinical simplicity, but human cognition thrives on physical hierarchy and spatial cues. Today’s top design systems embrace subtle frosted depth, layered dimensional lighting, and physics-informed haptics.

### The Anatomy of Modern Depth
1. **Frosted Translucency**: Using dynamic blur with calibrated opacity allows users to maintain orientation without distraction.
2. **Dynamic Spectral Gradients**: Subtle shifts in light reflections communicate state changes much faster than static monochrome pills.
3. **Restraint Over Clutter**: Every elevation layer must serve a clear purpose—elevated modal sheets, tactile floating action triggers, and anchored navigation pills.',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    'Design',
    '4 min',
    'Marcus Thorne',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'Principal UX Architect',
    215,
    false
),
(
    'Realtime Edge Data with Supabase & Modern Mobile Clients',
    'Building lightning-fast offline-first mobile applications with PostgreSQL and row-level security.',
    'realtime-edge-data-supabase',
    'Building a reactive mobile application used to require dedicated WebSocket infrastructure, complex Redis caches, and fragile sync adapters. Supabase combines PostgreSQL, PostgREST, and Realtime into a unified foundation.

### Why Developers Love This Stack
- **Instant RESTful Endpoints**: Define tables and indexes; PostgREST handles serialization, sorting, and pagination with rock-solid reliability.
- **Granular Security via RLS**: Never write boiler-plate authorization logic again. Declarative policies ensure users only query or mutate rows they have permission to access.
- **Resilient Offline Cache**: Coupling Supabase with local persistent caches ensures smooth read and write operations even during spotty cellular coverage.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    'Engineering',
    '5 min',
    'Sophia Chen',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    'Lead Backend Architect',
    512,
    false
),
(
    'The Modern Renaissance of Minimalist Architecture & Living Spaces',
    'Exploring sustainable materials, open-volume spatial planning, and natural daylighting.',
    'renaissance-minimalist-architecture',
    'Modern architecture has moved away from cold, brutalist concrete toward biophilic warmth. Natural oak, breathable lime plasters, and expansive floor-to-ceiling glass pavilions reconnect inhabitants with seasonal daylight rhythms.

When designing living spaces or digital products, the philosophy remains identical: remove the superfluous until only the essential remains, executed with impeccable craftsmanship.',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    'Culture',
    '3 min',
    'Julian Davies',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'Architectural Critic',
    189,
    false
),
(
    'Mastering State and Cache Synchronization in Modern Cross-Platform Apps',
    'Strategies for optimistic updates, zero-latency scroll restoration, and predictive prefetching.',
    'mastering-state-cache-cross-platform',
    'Users expect instant responsiveness. If a tap on a like button or bookmark takes 600ms to register because of a network round-trip, the illusion of direct manipulation is broken.

### Core Principles for 60fps Experience
1. **Optimistic Updates**: Mutate local memory instantly, trigger tactile haptic feedback, and dispatch network mutations asynchronously.
2. **Rollback Gracefully**: If the network request fails, silently retry or display an unobtrusive toast notification with a retry button.
3. **Predictive Prefetching**: When a user scrolls within 200px of an article card, pre-warm the article content and image cache.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    'Engineering',
    '7 min',
    'Sophia Chen',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    'Lead Backend Architect',
    428,
    false
)
ON CONFLICT (slug) DO NOTHING;
