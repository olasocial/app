import { createClient } from '@supabase/supabase-js';
import {
  UserProfile,
  UserRole,
  AccountStatus,
  UserLevel,
  PresenceStatus,
  LevelRequirement,
  ExperienceEntry,
  ReputationEvent,
  SupportVerification,
  Badge,
  Dispute,
  SystemConfigItem,
  Invitation,
  MfaFactor,
  MfaEnrollResult
} from '../types';

// OLA SOCIAL Official Supabase Production Configuration
export const REAL_SUPABASE_URL = 'https://ocyjnplyywvctqikjrrh.supabase.co';
export const REAL_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeWpucGx5eXd2Y3RxaWtqcnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTUwMjksImV4cCI6MjEwNDg3MTAyOX0.fGuMchZ34b6wWLQ0MyMnGg5SRKaE4Ojx1Qb0wx67Nt0';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || REAL_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || REAL_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
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

export const ADMIN_PRIMARY_EMAIL = 'v19629049@gmail.com';
export const ADMIN_EMAILS = ['v19629049@gmail.com'];

/**
 * Checks whether an email belongs to a designated platform administrator.
 */
export function isSuperAdminEmailAddress(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase());
}

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

  const isSuperAdminEmail = isSuperAdminEmailAddress(profileData.email);

  const payload: Partial<UserProfile> = {
    ...profileData,
    level_number: profileData.level_number ?? 1,
    experience_points: profileData.experience_points ?? 0,
    reputation_score: profileData.reputation_score ?? 100.0,
    unique_users_helped: profileData.unique_users_helped ?? 0,
    unique_platforms_supported: profileData.unique_platforms_supported ?? 0,
    unique_campaigns_completed: profileData.unique_campaigns_completed ?? 0,
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
 * Fetches real community ranking from Supabase profiles ordered by category.
 */
export async function fetchPublicRankings(
  category: 'abrazadores' | 'creadores' | 'invitadores' | 'reputacion' = 'reputacion'
): Promise<UserProfile[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('status', AccountStatus.ACTIVE);

  switch (category) {
    case 'abrazadores':
      query = query.order('hugs_done', { ascending: false }).order('hugs_verified', { ascending: false });
      break;
    case 'creadores':
      query = query.order('campaigns_created', { ascending: false }).order('hugs_received', { ascending: false });
      break;
    case 'invitadores':
      query = query.order('invitation_score', { ascending: false }).order('unique_users_helped', { ascending: false });
      break;
    case 'reputacion':
    default:
      query = query.order('reputation_score', { ascending: false }).order('stars_count', { ascending: false });
      break;
  }

  const { data, error } = await query.limit(30);

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

/**
 * Fetches Level Requirements configuration from Supabase
 */
export async function fetchLevelRequirements(): Promise<LevelRequirement[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('level_requirements')
    .select('*')
    .order('level_number', { ascending: true });

  if (error || !data) {
    console.warn('Could not load level_requirements from Supabase:', error);
    return [];
  }

  return data as LevelRequirement[];
}

/**
 * Fetches Experience Ledger entries for a specific user
 */
export async function fetchUserExperienceLedger(userId: string): Promise<ExperienceEntry[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('experience_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as ExperienceEntry[];
}

/**
 * Fetches Reputation Events for a specific user
 */
export async function fetchUserReputationEvents(userId: string): Promise<ReputationEvent[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('reputation_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as ReputationEvent[];
}

/**
 * Fetches all available badges and user badges
 */
export async function fetchUserBadges(userId: string): Promise<Badge[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data: userBadgesData } = await supabase
    .from('user_badges')
    .select('badge_code, awarded_at')
    .eq('user_id', userId);

  const { data: badgesData } = await supabase
    .from('badges')
    .select('*');

  if (!badgesData) return [];

  const awardedMap = new Map<string, string>();
  if (userBadgesData) {
    userBadgesData.forEach((ub: any) => awardedMap.set(ub.badge_code, ub.awarded_at));
  }

  return badgesData.map((b: any) => ({
    ...b,
    awarded_at: awardedMap.get(b.code)
  })) as Badge[];
}

/**
 * Fetches verified supports (Abrazos Certificados)
 */
export async function fetchSupportVerifications(limit = 50): Promise<SupportVerification[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('support_verifications')
    .select('*')
    .order('certified_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as SupportVerification[];
}

/**
 * Fetches community disputes
 */
export async function fetchDisputes(): Promise<Dispute[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Dispute[];
}

/**
 * Calls complete_verified_task PostgreSQL RPC
 */
export async function callCompleteVerifiedTask(
  taskId: string,
  isValid: boolean,
  feedback?: string
): Promise<{ success: boolean; message: string; new_level?: number; xp_awarded?: number }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no está disponible' };
  }

  const { data, error } = await supabase.rpc('complete_verified_task', {
    p_task_id: taskId,
    p_is_valid: isValid,
    p_feedback: feedback || null
  });

  if (error) {
    console.error('RPC complete_verified_task error:', error);
    return { success: false, message: error.message };
  }

  return data as { success: boolean; message: string; new_level?: number; xp_awarded?: number };
}

/**
 * Reports a task dispute to moderation
 */
export async function callReportTaskDispute(
  taskId: string,
  reason: string,
  evidenceUrl?: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no está disponible' };
  }

  const { error } = await supabase.rpc('report_task_dispute', {
    p_task_id: taskId,
    p_reason: reason,
    p_evidence_url: evidenceUrl || null
  });

  if (error) {
    console.error('RPC report_task_dispute error:', error);
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Disputa registrada para revisión de moderación' };
}

/**
 * Resolves a dispute (Admin only)
 */
export async function callResolveDispute(
  disputeId: string,
  resolution: string,
  notes: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no está disponible' };
  }

  const { data, error } = await supabase.rpc('resolve_dispute', {
    p_dispute_id: disputeId,
    p_resolution: resolution,
    p_notes: notes
  });

  if (error) {
    console.error('RPC resolve_dispute error:', error);
    return { success: false, message: error.message };
  }

  return data as { success: boolean; message: string };
}

/**
 * Creates a fraud event with anti-collusion penalty
 */
export async function callCreateFraudEvent(
  userId: string,
  pattern: string,
  riskLevel: string,
  details: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no está disponible' };
  }

  const { error } = await supabase.rpc('create_fraud_event', {
    p_user_id: userId,
    p_pattern: pattern,
    p_risk_level: riskLevel,
    p_details: details
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Evento de riesgo registrado' };
}

// ============================================================
// REAL MFA (TOTP) VIA SUPABASE AUTH
// ============================================================

/**
 * Enrolls a new TOTP factor in Supabase Auth.
 * Returns factorId, QR code SVG string/URI, and secret for manual input.
 */
export async function enrollMfaTotp(
  friendlyName: string = 'Autenticador Principal'
): Promise<{ data: MfaEnrollResult | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: 'Supabase no está disponible' };
  }

  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        id: data.id,
        type: 'totp',
        totp: {
          qr_code: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri
        }
      },
      error: null
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error al iniciar inscripción 2FA' };
  }
}

/**
 * Challenges and verifies a 6-digit TOTP code.
 * Upon successful verification, advances the session to AAL2.
 */
export async function challengeAndVerifyMfa(
  factorId: string,
  code: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase no está disponible' };
  }

  try {
    const challengeRes = await supabase.auth.mfa.challenge({ factorId });
    if (challengeRes.error) {
      return { success: false, error: challengeRes.error.message };
    }

    const verifyRes = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeRes.data.id,
      code: code.trim()
    });

    if (verifyRes.error) {
      return { success: false, error: verifyRes.error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Código TOTP incorrecto o expirado' };
  }
}

/**
 * Lists all registered MFA factors for the current session.
 */
export async function listUserMfaFactors(): Promise<{ all: MfaFactor[]; totp: MfaFactor[] }> {
  if (!isSupabaseConfigured || !supabase) {
    return { all: [], totp: [] };
  }

  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) return { all: [], totp: [] };

    const totpFactors: MfaFactor[] = (data.totp || []).map((f: any) => ({
      id: f.id,
      friendly_name: f.friendly_name || 'Autenticador',
      factor_type: 'totp',
      status: f.status,
      created_at: f.created_at,
      updated_at: f.updated_at
    }));

    return {
      all: totpFactors,
      totp: totpFactors
    };
  } catch (err) {
    console.error('Error listing MFA factors:', err);
    return { all: [], totp: [] };
  }
}

/**
 * Unenrolls an MFA factor.
 */
export async function unenrollMfaFactor(
  factorId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase no está disponible' };
  }

  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al desvincular factor 2FA' };
  }
}

/**
 * Gets Authenticator Assurance Level (AAL) for the current session.
 */
export async function getAuthAssuranceLevel(): Promise<{
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { currentLevel: null, nextLevel: null };
  }

  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return { currentLevel: null, nextLevel: null };
    return {
      currentLevel: data.currentLevel as 'aal1' | 'aal2',
      nextLevel: data.nextLevel as 'aal1' | 'aal2'
    };
  } catch (err) {
    return { currentLevel: null, nextLevel: null };
  }
}

// ============================================================
// REAL INVITATION SYSTEM
// ============================================================

/**
 * Fetches invitations generated by a specific user.
 */
export async function fetchUserInvitations(userId: string): Promise<Invitation[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Invitation[];
  } catch (err) {
    console.error('Error fetching user invitations:', err);
    return [];
  }
}

/**
 * Attributes a new user registration to an invitation code.
 */
export async function attributeInviteCode(
  inviteCode: string,
  newUserId: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  const normalizedCode = inviteCode.trim().toUpperCase();

  try {
    // 1. Find profile that owns this invite code
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('invite_code', normalizedCode)
      .single();

    if (inviterError || !inviterProfile) {
      return { success: false, message: 'Código de invitación no encontrado' };
    }

    // 2. Prevent self-invitation
    if (inviterProfile.id === newUserId) {
      return { success: false, message: 'No es posible auto-invitarse' };
    }

    // 3. Insert or record invitation record
    const { error: insertError } = await supabase
      .from('invitations')
      .insert({
        inviter_user_id: inviterProfile.id,
        invited_user_id: newUserId,
        invite_code: normalizedCode,
        status: 'registered',
        reputation_awarded: 0,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      // If already exists or constraint violation, ignore safely
      console.warn('Invitation insert warning:', insertError.message);
    }

    // 4. Update invited_by on the new user's profile
    await supabase
      .from('profiles')
      .update({ invited_by: inviterProfile.id })
      .eq('id', newUserId);

    return { success: true, message: `Invitación atribuida a ${inviterProfile.display_name}` };
  } catch (err: any) {
    console.error('Error attributing invite code:', err);
    return { success: false, message: err.message || 'Error al procesar invitación' };
  }
}

/**
 * Fetches all community invitations for Admin management.
 */
export async function fetchAllInvitationsAdmin(): Promise<Invitation[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        inviter:profiles!inviter_user_id(email, display_name),
        invited:profiles!invited_user_id(email, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((item: any) => ({
      ...item,
      inviter_email: item.inviter?.email,
      inviter_name: item.inviter?.display_name,
      invited_email: item.invited?.email,
      invited_name: item.invited?.display_name
    })) as Invitation[];
  } catch (err) {
    console.error('Error fetching admin invitations:', err);
    return [];
  }
}

/**
 * Updates an invitation status (Admin only)
 */
export async function adminUpdateInvitation(
  invitationId: string,
  status: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no disponible' };
  }

  try {
    const { error } = await supabase
      .from('invitations')
      .update({ status })
      .eq('id', invitationId);

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: `Invitación actualizada a ${status}` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ============================================================
// REAL PLATFORM COUNTERS (ZERO MOCK NUMBERS)
// ============================================================

/**
 * Fetches accurate counts directly from Supabase profiles table.
 */
export async function fetchLivePlatformStats(): Promise<{
  registeredCount: number;
  activeCount: number;
  newTodayCount: number;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { registeredCount: 0, activeCount: 0, newTodayCount: 0 };
  }

  try {
    const [regRes, actRes, newTodayRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', AccountStatus.ACTIVE),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 86400000).toISOString())
    ]);

    return {
      registeredCount: regRes.count ?? 0,
      activeCount: actRes.count ?? 0,
      newTodayCount: newTodayRes.count ?? 0
    };
  } catch (err) {
    console.error('Error fetching live stats:', err);
    return { registeredCount: 0, activeCount: 0, newTodayCount: 0 };
  }
}


