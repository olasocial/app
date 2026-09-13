import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole, AccountStatus, UserLevel, PresenceStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const ADMIN_PRIMARY_EMAIL = 'casinoconquistado@gmail.com';
export const ADMIN_EMAILS = ['casinoconquistado@gmail.com', 'v19629049@gmail.com'];

/**
 * Fetches user profile from Supabase 'profiles' table.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}

/**
 * Controlled upsert of profile in Supabase upon authenticated login.
 * Guarantees that auth.users.id is the primary key.
 */
export async function upsertUserProfile(
  profileData: Partial<UserProfile> & { id: string; email: string }
): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const isSuperAdminEmail = profileData.email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase();

  const payload: Partial<UserProfile> = {
    ...profileData,
    updated_at: new Date().toISOString()
  };

  // If initial profile creation, set defaults
  if (!payload.role) {
    payload.role = isSuperAdminEmail ? UserRole.SUPER_ADMIN : UserRole.USER;
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile in Supabase:', error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Fetches real community ranking from Supabase profiles ordered by stars and verified hugs.
 */
export async function fetchPublicRankings(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', AccountStatus.ACTIVE)
    .order('stars_count', { ascending: false })
    .limit(20);

  if (error || !data) {
    return [];
  }

  return data as UserProfile[];
}

/**
 * Inserts immutable audit log into Supabase admin_audit_log
 */
export async function recordAuditLog(
  adminId: string,
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  details: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    admin_email: adminEmail,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    created_at: new Date().toISOString()
  });
}
