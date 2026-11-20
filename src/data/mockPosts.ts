import { Post } from '../types/blog';

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'The Architectural Shift in Mobile Intelligence: Agentic Systems on Device',
    subtitle: 'How local neural engines and autonomous agent loops are reshaping mobile experiences in 2026 and beyond.',
    slug: 'architectural-shift-mobile-intelligence-2026',
    content: `The landscape of mobile engineering is undergoing its most radical transformation since the transition from desktop web to touch screens. With neural processing units (NPUs) now standard in modern smartphones, we are moving past client-server request-response paradigms toward truly autonomous agentic loops running directly on user devices.

### 1. From Passive Views to Proactive Co-Pilots
Traditional applications wait for user touch events, render loading spinners, and ping remote REST or GraphQL APIs. Next-generation mobile architectures reverse this dynamic:
- Context engines continuously synthesize local ambient signals (location, calendar cadence, cognitive load).
- On-device distilled LLMs evaluate high-frequency micro-intent without sending private data over the wire.
- Background workflows orchestrate sync with distributed cloud backends like Supabase only when high-durability consensus is needed.

### 2. High-Performance Fluidity in React Native
React Native’s latest architecture eliminates bridge serialization bottlenecks. High-frame-rate tactile physics and gesture-driven transitions feel native and instant. When building next-generation clients, state synchronization occurs optimistically in local memory while edge handlers stream verified cryptographic state in the background.

### 3. Privacy, Ownership, and the Distributed Web
Users are demanding absolute control over their digital footprint. By leveraging local databases coupled with edge-computed synchronization, developers achieve sub-10ms response times while guaranteeing zero-knowledge encryption.`,
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    category: 'AI & Tech',
    read_time: '6 min',
    author_name: 'Elena Vance',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    author_role: 'Design Technologist',
    likes_count: 384,
    is_featured: true,
    created_at: '2026-11-18T10:15:00Z',
  },
  {
    id: 'post-2',
    title: 'Designing for the Spatial Era: Beyond the Flat Glass Paradigm',
    subtitle: 'Tactile elevation, chromatic depth, and micro-physics for future-facing interfaces.',
    slug: 'designing-for-spatial-era',
    content: `Flat design stripped interfaces down to clinical simplicity, but human cognition thrives on physical hierarchy and spatial cues. Today’s top design systems embrace subtle frosted depth, layered dimensional lighting, and physics-informed haptics.

### The Anatomy of Modern Depth
1. Frosted Translucency: Using dynamic blur with calibrated opacity allows users to maintain orientation without distraction.
2. Dynamic Spectral Gradients: Subtle shifts in light reflections communicate state changes much faster than static monochrome pills.
3. Restraint Over Clutter: Every elevation layer must serve a clear purpose—elevated modal sheets, tactile floating action triggers, and anchored navigation pills.`,
    cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    category: 'Design',
    read_time: '4 min',
    author_name: 'Marcus Thorne',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    author_role: 'Principal UX Architect',
    likes_count: 215,
    is_featured: false,
    created_at: '2026-11-17T14:30:00Z',
  },
  {
    id: 'post-3',
    title: 'Realtime Edge Data with Supabase & Modern Mobile Clients',
    subtitle: 'Building lightning-fast offline-first mobile applications with PostgreSQL and row-level security.',
    slug: 'realtime-edge-data-supabase',
    content: `Building a reactive mobile application used to require dedicated WebSocket infrastructure, complex Redis caches, and fragile sync adapters. Supabase combines PostgreSQL, PostgREST, and Realtime into a unified foundation.

### Why Developers Love This Stack
- Instant RESTful Endpoints: Define tables and indexes; PostgREST handles serialization, sorting, and pagination with rock-solid reliability.
- Granular Security via RLS: Never write boiler-plate authorization logic again. Declarative policies ensure users only query or mutate rows they have permission to access.
- Resilient Offline Cache: Coupling Supabase with local persistent caches ensures smooth read and write operations even during spotty cellular coverage.`,
    cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    category: 'Engineering',
    read_time: '5 min',
    author_name: 'Sophia Chen',
    author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    author_role: 'Lead Backend Architect',
    likes_count: 512,
    is_featured: false,
    created_at: '2026-11-16T08:45:00Z',
  },
  {
    id: 'post-4',
    title: 'The Modern Renaissance of Minimalist Architecture & Living Spaces',
    subtitle: 'Exploring sustainable materials, open-volume spatial planning, and natural daylighting.',
    slug: 'renaissance-minimalist-architecture',
    content: `Modern architecture has moved away from cold, brutalist concrete toward biophilic warmth. Natural oak, breathable lime plasters, and expansive floor-to-ceiling glass pavilions reconnect inhabitants with seasonal daylight rhythms.

When designing living spaces or digital products, the philosophy remains identical: remove the superfluous until only the essential remains, executed with impeccable craftsmanship.`,
    cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    category: 'Culture',
    read_time: '3 min',
    author_name: 'Julian Davies',
    author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    author_role: 'Architectural Critic',
    likes_count: 189,
    is_featured: false,
    created_at: '2026-11-15T19:20:00Z',
  },
  {
    id: 'post-5',
    title: 'Mastering State and Cache Synchronization in Modern Cross-Platform Apps',
    subtitle: 'Strategies for optimistic updates, zero-latency scroll restoration, and predictive prefetching.',
    slug: 'mastering-state-cache-cross-platform',
    content: `Users expect instant responsiveness. If a tap on a like button or bookmark takes 600ms to register because of a network round-trip, the illusion of direct manipulation is broken.

### Core Principles for 60fps Experience
1. Optimistic Updates: Mutate local memory instantly, trigger tactile feedback, and dispatch network mutations asynchronously.
2. Rollback Gracefully: If the network request fails, silently retry or display an unobtrusive toast notification with a retry button.
3. Predictive Prefetching: When a user scrolls within 200px of an article card, pre-warm the article content and image cache.`,
    cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    category: 'Engineering',
    read_time: '7 min',
    author_name: 'Sophia Chen',
    author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    author_role: 'Lead Backend Architect',
    likes_count: 428,
    is_featured: false,
    created_at: '2026-11-14T11:00:00Z',
  },
];
