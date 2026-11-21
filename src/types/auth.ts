export interface UserProfile {
  id: string;
  name: string;
  phoneNumber?: string;
  countryCode?: string;
  avatarUrl: string;
  role?: string;
  bio?: string;
  createdAt: string;
  email?: string;
  isAdmin?: boolean;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

// Preset avatars fully removed per user request: only adding option allowed
export const PRESET_AVATARS: { id: string; label: string; url: string }[] = [];

// Clean neutral fallback avatar icon when no custom photo is added
export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';
