import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole, AccountStatus, UserLevel, PresenceStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const ADMIN_PRIMARY_EMAIL = 'v19629049@gmail.com';

// Mock initial data for resilient offline / zero-config state
export const createDefaultProfile = (email: string, displayName?: string): UserProfile => {
  const isAdmin = email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase();
  const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');

  return {
    id: isAdmin ? 'admin-root-001' : `user-${Math.random().toString(36).substring(2, 9)}`,
    email,
    display_name: displayName || (isAdmin ? 'Administrador Ola Social' : username),
    username,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
    role: isAdmin ? UserRole.SUPER_ADMIN : UserRole.USER,
    status: AccountStatus.ACTIVE,
    language: 'es',
    country: 'América Latina',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    presence: PresenceStatus.ONLINE,
    last_seen_at: new Date().toISOString(),
    reputation: isAdmin ? 100 : 75,
    hugs_done: isAdmin ? 420 : 12,
    hugs_received: isAdmin ? 380 : 8,
    hugs_verified: isAdmin ? 375 : 7,
    stars_count: isAdmin ? 1850 : 35,
    rating_avg: 4.9,
    campaigns_created: isAdmin ? 8 : 1,
    campaigns_completed: isAdmin ? 7 : 1,
    confidence_level: 95,
    user_level: isAdmin ? UserLevel.EMBAJADOR : UserLevel.EXPLORADOR,
    warnings_count: 0,
    is_18_confirmed: true,
    terms_accepted_at: new Date().toISOString(),
    mfa_enabled: isAdmin,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  };
};
