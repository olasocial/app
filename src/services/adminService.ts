import { supabase, isSupabaseConfigured, ADMIN_PRIMARY_EMAIL } from './supabaseClient';
import {
  UserProfile,
  AccountStatus,
  UserRole,
  UserRestriction,
  RestrictionKey,
  FeatureFlag,
  AppSetting,
  Announcement,
  AdminNotification,
  ModerationReport,
  AdminNote,
  AppError,
  SystemStatsResult,
  CleanupDryRunResult,
  MaintenanceConfig,
  AdminAuditLog,
  Invitation
} from '../types';

/**
 * Record immutable administrative audit action
 */
export async function logAdminAction(
  action: string,
  targetType: string,
  targetId: string,
  details: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: authData } = await supabase.auth.getUser();
    const adminId = authData?.user?.id || null;
    const adminEmail = authData?.user?.email || ADMIN_PRIMARY_EMAIL;

    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      admin_email: adminEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_hash: '0.0.0.0'
    });
  } catch (err) {
    console.warn('Non-blocking audit log record notice:', err);
  }
}

// ============================================================
// 1. DASHBOARD & SYSTEM STATS
// ============================================================

export async function fetchAdminDashboardStats(): Promise<SystemStatsResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      total_users: 0,
      active_users: 0,
      blocked_users: 0,
      banned_users: 0,
      total_tasks: 0,
      open_disputes: 0,
      open_fraud: 0,
      active_announcements: 0,
      open_reports: 0,
      audit_logs_count: 0
    };
  }

  try {
    // Try RPC first for atomicity
    const { data: rpcStats, error: rpcErr } = await supabase.rpc('admin_get_system_stats');
    if (!rpcErr && rpcStats) {
      return rpcStats as SystemStatsResult;
    }

    // Direct queries fallback
    const [
      usersCount,
      activeCount,
      blockedCount,
      bannedCount,
      tasksCount,
      disputesCount,
      fraudCount,
      announcementsCount,
      reportsCount,
      auditCount
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', AccountStatus.ACTIVE),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', AccountStatus.SUSPENDED),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', AccountStatus.BANNED),
      supabase.from('campaign_tasks').select('id', { count: 'exact', head: true }),
      supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('fraud_events').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('moderation_reports').select('id', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('admin_audit_log').select('id', { count: 'exact', head: true })
    ]);

    return {
      total_users: usersCount.count ?? 0,
      active_users: activeCount.count ?? 0,
      blocked_users: blockedCount.count ?? 0,
      banned_users: bannedCount.count ?? 0,
      total_tasks: tasksCount.count ?? 0,
      open_disputes: disputesCount.count ?? 0,
      open_fraud: fraudCount.count ?? 0,
      active_announcements: announcementsCount.count ?? 0,
      open_reports: reportsCount.count ?? 0,
      audit_logs_count: auditCount.count ?? 0
    };
  } catch (err) {
    console.error('Error fetching admin dashboard stats:', err);
    return {
      total_users: 0,
      active_users: 0,
      blocked_users: 0,
      banned_users: 0,
      total_tasks: 0,
      open_disputes: 0,
      open_fraud: 0,
      active_announcements: 0,
      open_reports: 0,
      audit_logs_count: 0
    };
  }
}

// ============================================================
// 2. USER MANAGEMENT
// ============================================================

export interface UserFilterOptions {
  searchQuery?: string;
  status?: string;
  role?: string;
  limit?: number;
  offset?: number;
}

export async function fetchUsersList(options: UserFilterOptions = {}): Promise<{
  users: UserProfile[];
  totalCount: number;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { users: [], totalCount: 0 };
  }

  const { searchQuery, status, role, limit = 25, offset = 0 } = options;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  if (role && role !== 'ALL') {
    query = query.eq('role', role);
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    // Search by UUID, email or display_name
    if (q.match(/^[0-9a-fA-F-]{36}$/)) {
      query = query.eq('id', q);
    } else {
      query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%,username.ilike.%${q}%`);
    }
  }

  const { data, count, error } = await query;
  if (error) {
    console.error('Error fetching users:', error);
    return { users: [], totalCount: 0 };
  }

  return { users: (data as UserProfile[]) || [], totalCount: count || 0 };
}

export async function fetchUserFullDetails(userId: string): Promise<{
  profile: UserProfile | null;
  socialProfiles: any[];
  restrictions: UserRestriction[];
  notes: AdminNote[];
  moderationHistory: any[];
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { profile: null, socialProfiles: [], restrictions: [], notes: [], moderationHistory: [] };
  }

  try {
    const [profRes, socRes, restRes, notesRes, modRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('social_profiles').select('*').eq('user_id', userId),
      supabase.from('user_restrictions').select('*').eq('user_id', userId),
      supabase.from('admin_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('moderation_actions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    return {
      profile: profRes.data as UserProfile | null,
      socialProfiles: socRes.data || [],
      restrictions: (restRes.data as UserRestriction[]) || [],
      notes: (notesRes.data as AdminNote[]) || [],
      moderationHistory: modRes.data || []
    };
  } catch (err) {
    console.error('Error fetching user full details:', err);
    return { profile: null, socialProfiles: [], restrictions: [], notes: [], moderationHistory: [] };
  }
}

export async function blockUser(
  userId: string,
  durationHours: number,
  reason: string,
  notes: string = ''
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('admin_block_user', {
      p_user_id: userId,
      p_duration_hours: durationHours,
      p_reason: reason,
      p_notes: notes
    });

    if (!error) {
      return { success: true, message: 'Usuario bloqueado exitosamente.' };
    }

    // Direct fallback with safety check
    const { data: userRecord } = await supabase.from('profiles').select('email, role').eq('id', userId).single();
    if (userRecord?.role === UserRole.SUPER_ADMIN || userRecord?.email?.toLowerCase() === 'v19629049@gmail.com') {
      return { success: false, message: 'Operación denegada: La cuenta del Super Admin no puede ser bloqueada.' };
    }

    const expiresAt = durationHours > 0 ? new Date(Date.now() + durationHours * 3600000).toISOString() : null;

    await supabase.from('profiles').update({ status: AccountStatus.SUSPENDED, updated_at: new Date().toISOString() }).eq('id', userId);

    const { data: authData } = await supabase.auth.getUser();
    await supabase.from('moderation_actions').insert({
      user_id: userId,
      admin_id: authData?.user?.id,
      action_type: 'SUSPEND',
      reason,
      notes,
      expires_at: expiresAt
    });

    await logAdminAction(
      'USER_BLOCK',
      'USER',
      userId,
      `Bloqueado por ${durationHours || 'indefinido'}h. Motivo: ${reason}`
    );

    return { success: true, message: 'Usuario bloqueado exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al bloquear usuario' };
  }
}

export async function unblockUser(
  userId: string,
  reason: string = 'Resolución de revisión administrativa'
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { error } = await supabase.rpc('admin_unblock_user', {
      p_user_id: userId,
      p_reason: reason
    });

    if (!error) {
      return { success: true, message: 'Usuario desbloqueado exitosamente.' };
    }

    // Direct fallback
    await supabase.from('profiles').update({ status: AccountStatus.ACTIVE, updated_at: new Date().toISOString() }).eq('id', userId);

    const { data: authData } = await supabase.auth.getUser();
    await supabase.from('moderation_actions').insert({
      user_id: userId,
      admin_id: authData?.user?.id,
      action_type: 'UNBAN',
      reason,
      notes: 'Desbloqueo directo'
    });

    await logAdminAction('USER_UNBLOCK', 'USER', userId, `Desbloqueado. Motivo: ${reason}`);
    return { success: true, message: 'Usuario desbloqueado exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al desbloquear usuario' };
  }
}

export async function banUser(
  userId: string,
  isPermanent: boolean,
  reason: string,
  notes: string = ''
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { error } = await supabase.rpc('admin_ban_user', {
      p_user_id: userId,
      p_is_permanent: isPermanent,
      p_reason: reason,
      p_notes: notes
    });

    if (!error) {
      return { success: true, message: 'Usuario baneado exitosamente.' };
    }

    // Direct fallback with protection
    const { data: userRecord } = await supabase.from('profiles').select('email, role').eq('id', userId).single();
    if (userRecord?.role === UserRole.SUPER_ADMIN || userRecord?.email?.toLowerCase() === 'v19629049@gmail.com') {
      return { success: false, message: 'Operación denegada: La cuenta del Super Admin no puede ser baneada.' };
    }

    await supabase.from('profiles').update({ status: AccountStatus.BANNED, updated_at: new Date().toISOString() }).eq('id', userId);

    const { data: authData } = await supabase.auth.getUser();
    await supabase.from('moderation_actions').insert({
      user_id: userId,
      admin_id: authData?.user?.id,
      action_type: 'BAN',
      reason,
      notes
    });

    await logAdminAction(
      'USER_BAN',
      'USER',
      userId,
      `Baneado (${isPermanent ? 'Permanente' : 'Temporal'}). Motivo: ${reason}`
    );

    return { success: true, message: 'Usuario baneado exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al banear usuario' };
  }
}

export async function setUserRestriction(
  userId: string,
  restrictionKey: RestrictionKey,
  isRestricted: boolean,
  reason: string = '',
  durationHours?: number
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { error } = await supabase.rpc('admin_set_user_restriction', {
      p_user_id: userId,
      p_restriction_key: restrictionKey,
      p_is_restricted: isRestricted,
      p_reason: reason,
      p_duration_hours: durationHours || null
    });

    if (!error) {
      return { success: true, message: `Restricción ${restrictionKey} actualizada.` };
    }

    // Direct table upsert fallback
    const { data: authData } = await supabase.auth.getUser();
    const until = durationHours && durationHours > 0 ? new Date(Date.now() + durationHours * 3600000).toISOString() : null;

    await supabase.from('user_restrictions').upsert(
      {
        user_id: userId,
        restriction_key: restrictionKey,
        is_restricted: isRestricted,
        reason,
        restricted_by: authData?.user?.id,
        restricted_until: until,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,restriction_key' }
    );

    await logAdminAction(
      'RESTRICTION_CHANGE',
      'USER',
      userId,
      `Restricción ${restrictionKey} -> ${isRestricted}. Motivo: ${reason}`
    );

    return { success: true, message: `Restricción ${restrictionKey} actualizada.` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al modificar restricción' };
  }
}

export async function addAdminNote(
  userId: string,
  content: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    const adminId = authData?.user?.id;
    if (!adminId) {
      return { success: false, message: 'Sesión administrativa no válida.' };
    }

    const { error } = await supabase.from('admin_notes').insert({
      user_id: userId,
      admin_id: adminId,
      content
    });

    if (error) throw error;

    await logAdminAction('ADMIN_NOTE_ADDED', 'USER', userId, 'Nota administrativa privada registrada');
    return { success: true, message: 'Nota guardada exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al guardar nota' };
  }
}

// ============================================================
// 3. FEATURE FLAGS & MAINTENANCE
// ============================================================

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.from('feature_flags').select('*').order('category');
    if (error) {
      console.warn('Error fetching feature flags:', error);
      return [];
    }
    return (data as FeatureFlag[]) || [];
  } catch (err) {
    return [];
  }
}

export async function toggleFeatureFlag(
  key: string,
  enabled: boolean,
  reason: string = ''
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { error } = await supabase.rpc('admin_toggle_feature_flag', {
      p_key: key,
      p_enabled: enabled,
      p_reason: reason
    });

    if (!error) {
      return { success: true, message: `Bandera ${key} modificada a ${enabled ? 'ACTIVO' : 'INACTIVO'}.` };
    }

    // Direct fallback
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from('feature_flags').update({
      enabled,
      reason,
      updated_by: authData?.user?.id,
      updated_at: new Date().toISOString()
    }).eq('key', key);

    await logAdminAction('FEATURE_FLAG_TOGGLE', 'POLICY', key, `${key} -> ${enabled}. Motivo: ${reason}`);
    return { success: true, message: `Bandera ${key} modificada exitosamente.` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al actualizar bandera' };
  }
}

export async function fetchMaintenanceConfig(): Promise<MaintenanceConfig> {
  const defaultConfig: MaintenanceConfig = {
    enabled: false,
    emergency: false,
    message: 'Estamos realizando mejoras programadas. Regresamos en breve.',
    allow_admin: true
  };

  if (!isSupabaseConfigured || !supabase) return defaultConfig;

  try {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'maintenance_mode').single();
    if (error || !data) return defaultConfig;
    return { ...defaultConfig, ...data.value };
  } catch (err) {
    return defaultConfig;
  }
}

export async function setMaintenanceMode(
  config: MaintenanceConfig
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { error } = await supabase.rpc('admin_set_maintenance_mode', {
      p_enabled: config.enabled,
      p_message: config.message,
      p_start_at: config.start_at || null,
      p_end_at: config.end_at || null,
      p_emergency: config.emergency
    });

    if (!error) {
      return { success: true, message: 'Modo de mantenimiento actualizado.' };
    }

    // Fallback update
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from('app_settings').upsert({
      key: 'maintenance_mode',
      value: config,
      category: 'SYSTEM',
      description: 'Configuración de mantenimiento y emergencia',
      updated_by: authData?.user?.id,
      updated_at: new Date().toISOString()
    });

    await logAdminAction(
      config.emergency ? 'EMERGENCY_MODE_TOGGLE' : 'MAINTENANCE_TOGGLE',
      'SECURITY',
      'SYSTEM',
      `Modo ${config.emergency ? 'EMERGENCIA' : 'Mantenimiento'}: ${config.enabled}. ${config.message}`
    );

    return { success: true, message: 'Modo de mantenimiento actualizado.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error configurando mantenimiento' };
  }
}

// ============================================================
// 4. ANNOUNCEMENTS (ADS & INSTITUTIONAL)
// ============================================================

export async function fetchAnnouncementsList(): Promise<Announcement[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching announcements:', error);
      return [];
    }
    return (data as Announcement[]) || [];
  } catch (err) {
    return [];
  }
}

export async function saveAnnouncement(
  announcement: Partial<Announcement>
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    const payload = {
      ...announcement,
      created_by: authData?.user?.id,
      updated_at: new Date().toISOString()
    };

    if (announcement.id) {
      const { error } = await supabase.from('announcements').update(payload).eq('id', announcement.id);
      if (error) throw error;
      await logAdminAction('ANNOUNCEMENT_UPDATE', 'CONTENT', announcement.id, `Anuncio actualizado: ${announcement.title}`);
    } else {
      const { data, error } = await supabase.from('announcements').insert(payload).select('id').single();
      if (error) throw error;
      await logAdminAction('ANNOUNCEMENT_CREATE', 'CONTENT', data.id, `Anuncio creado: ${announcement.title}`);
    }

    return { success: true, message: 'Anuncio guardado exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al guardar anuncio' };
  }
}

export async function deleteAnnouncement(
  id: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;

    await logAdminAction('ANNOUNCEMENT_DELETE', 'CONTENT', id, 'Anuncio eliminado definitivamente');
    return { success: true, message: 'Anuncio eliminado exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al eliminar anuncio' };
  }
}

// ============================================================
// 5. ADMIN NOTIFICATIONS
// ============================================================

export async function fetchAdminNotifications(): Promise<AdminNotification[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Error fetching admin notifications:', error);
      return [];
    }
    return (data as AdminNotification[]) || [];
  } catch (err) {
    return [];
  }
}

export async function broadcastAdminNotification(
  notification: Partial<AdminNotification>
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();

    const payload = {
      title: notification.title,
      message: notification.message,
      type: notification.type || 'ANNOUNCEMENT',
      audience: notification.audience || 'ALL',
      target_user_id: notification.target_user_id || null,
      is_urgent: Boolean(notification.is_urgent),
      action_url: notification.action_url || null,
      status: 'SENT',
      created_by: authData?.user?.id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('admin_notifications').insert(payload).select('id').single();
    if (error) throw error;

    // Send also to user notifications table so they appear in top bar alerts
    if (payload.audience === 'ALL') {
      // In production, an Edge Function or background worker handles bulk fan-out.
      // We insert a broadcast notification token:
      await supabase.from('notifications').insert({
        user_id: authData?.user?.id, // Sentinel creator copy
        type: `ADMIN_${payload.type}`,
        title: payload.title,
        message: payload.message,
        read: false
      });
    } else if (payload.target_user_id) {
      await supabase.from('notifications').insert({
        user_id: payload.target_user_id,
        type: `ADMIN_${payload.type}`,
        title: payload.title,
        message: payload.message,
        read: false
      });
    }

    await logAdminAction(
      'NOTIFICATION_BROADCAST',
      'COMMUNICATION',
      data.id,
      `Notificación enviada a ${payload.audience}: ${payload.title}`
    );

    return { success: true, message: 'Notificación emitida exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al emitir notificación' };
  }
}

// ============================================================
// 6. MODERATION & REPORTS
// ============================================================

export async function fetchModerationReports(
  statusFilter: string = 'ALL'
): Promise<ModerationReport[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    let query = supabase
      .from('moderation_reports')
      .select(`
        *,
        reporter:profiles!reporter_id(email, display_name),
        reported:profiles!reported_user_id(email, display_name)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback without joins if foreign keys not fully cached
      const simpleRes = await supabase.from('moderation_reports').select('*').order('created_at', { ascending: false });
      return (simpleRes.data as ModerationReport[]) || [];
    }

    return (data || []).map((r: any) => ({
      ...r,
      reporter_name: r.reporter?.display_name,
      reporter_email: r.reporter?.email,
      reported_name: r.reported?.display_name,
      reported_email: r.reported?.email
    })) as ModerationReport[];
  } catch (err) {
    return [];
  }
}

export async function updateModerationReport(
  reportId: string,
  status: 'OPEN' | 'REVIEWING' | 'ACTION_REQUIRED' | 'RESOLVED' | 'DISMISSED',
  resolutionNotes: string = '',
  assignedTo?: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const payload: any = {
      status,
      resolution_notes: resolutionNotes,
      updated_at: new Date().toISOString()
    };

    if (status === 'RESOLVED' || status === 'DISMISSED') {
      payload.resolved_at = new Date().toISOString();
    }
    if (assignedTo) {
      payload.assigned_to = assignedTo;
    }

    const { error } = await supabase.from('moderation_reports').update(payload).eq('id', reportId);
    if (error) throw error;

    await logAdminAction('REPORT_UPDATE', 'MODERATION', reportId, `Reporte actualizado a ${status}. Notas: ${resolutionNotes}`);
    return { success: true, message: `Reporte actualizado a ${status}.` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al actualizar reporte' };
  }
}

// ============================================================
// 7. INVITATIONS MANAGEMENT
// ============================================================

export async function fetchInvitationsAuditList(
  limit: number = 50
): Promise<Invitation[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching invitations:', error);
      return [];
    }
    return (data as Invitation[]) || [];
  } catch (err) {
    return [];
  }
}

export async function revokeInvitation(
  invitationId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'REVOKED' })
      .eq('id', invitationId);

    if (error) throw error;

    await logAdminAction('INVITATION_REVOKE', 'GROWTH', invitationId, `Invitación revocada: ${reason}`);
    return { success: true, message: 'Invitación revocada exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al revocar invitación' };
  }
}

// ============================================================
// 8. REPUTATION MANAGEMENT
// ============================================================

export async function adjustUserReputation(
  userId: string,
  delta: number,
  reason: string,
  reference: string = 'ADMIN_ADJUSTMENT'
): Promise<{ success: boolean; message: string; newReputation?: number }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { data, error } = await supabase.rpc('admin_adjust_reputation', {
      p_user_id: userId,
      p_delta: delta,
      p_reason: reason,
      p_reference: reference
    });

    if (!error && data) {
      return {
        success: true,
        message: `Reputación ajustada (${delta > 0 ? '+' : ''}${delta}).`,
        newReputation: data.new_reputation
      };
    }

    // Direct fallback
    const { data: prof } = await supabase.from('profiles').select('reputation').eq('id', userId).single();
    const current = Number(prof?.reputation || 75.0);
    const updated = Math.min(100.0, Math.max(0.0, current + delta));

    await supabase.from('profiles').update({ reputation: updated, updated_at: new Date().toISOString() }).eq('id', userId);
    await supabase.from('reputation_events').insert({
      user_id: userId,
      event_type: 'ADMIN_MANUAL_ADJUSTMENT',
      score_delta: delta,
      reason
    });

    await logAdminAction('REPUTATION_ADJUST', 'USER', userId, `Ajuste ${delta} pts. Nuevo: ${updated}. Motivo: ${reason}`);
    return { success: true, message: `Reputación ajustada a ${updated} pts.`, newReputation: updated };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al ajustar reputación' };
  }
}

// ============================================================
// 9. AUDIT LOG & ERROR LOGS
// ============================================================

export async function fetchAdminAuditLogs(
  limitOrOptions: number | { limit?: number; action?: string } = 100,
  actionFilter?: string
): Promise<AdminAuditLog[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    let limit = 100;
    let action = actionFilter;

    if (typeof limitOrOptions === 'object' && limitOrOptions !== null) {
      limit = limitOrOptions.limit || 100;
      action = limitOrOptions.action || actionFilter;
    } else if (typeof limitOrOptions === 'number') {
      limit = limitOrOptions;
    }

    let query = supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (action && action !== 'ALL') {
      query = query.eq('action', action);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching audit logs:', error);
      return [];
    }
    return (data as AdminAuditLog[]) || [];
  } catch (err) {
    return [];
  }
}

export const fetchAuditLogs = fetchAdminAuditLogs;

export async function fetchAppErrors(): Promise<AppError[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('app_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return [];
    }
    return (data as AppError[]) || [];
  } catch (err) {
    return [];
  }
}

export async function resolveAppError(
  id: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado' };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase.from('app_errors').update({
      resolved: true,
      resolved_by: authData?.user?.id,
      resolved_at: new Date().toISOString()
    }).eq('id', id);

    if (error) throw error;
    return { success: true, message: 'Incidencia marcada como resuelta.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al resolver incidencia' };
  }
}

// ============================================================
// 10. CLEANUP CENTER (SAFE DRY-RUN & CONTROLLED PURGE)
// ============================================================

export async function runCleanupDryRun(): Promise<CleanupDryRunResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      dry_run: true,
      real_records: 0,
      test_records: 0,
      simulated_records: 0,
      orphan_records: 0,
      unknown_records: 0,
      notice: 'Supabase no conectado'
    };
  }

  try {
    const { data, error } = await supabase.rpc('admin_execute_cleanup_dry_run');
    if (!error && data) {
      return data as CleanupDryRunResult;
    }

    // Direct fallback calculation
    const [realUsers, testUsers, orphanTasks] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).not('email', 'ilike', '%@example.com'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).ilike('email', '%@example.com'),
      supabase.from('campaign_tasks').select('id', { count: 'exact', head: true }).is('creator_id', null)
    ]);

    return {
      dry_run: true,
      real_records: realUsers.count || 0,
      test_records: testUsers.count || 0,
      simulated_records: 0,
      orphan_records: orphanTasks.count || 0,
      unknown_records: 0,
      notice: 'DRY RUN COMPLETADO: 0 registros eliminados. Sistema protegido contra borrado destructivo.'
    };
  } catch (err: any) {
    return {
      dry_run: true,
      real_records: 0,
      test_records: 0,
      simulated_records: 0,
      orphan_records: 0,
      unknown_records: 0,
      notice: err.message || 'Error en Dry Run'
    };
  }
}

// ============================================================
// 11. EDGE FUNCTION HEALTH TEST
// ============================================================

export async function testEdgeFunctionHealth(
  functionName: string = 'verify-turnstile'
): Promise<{ status: 'OK' | 'ERROR'; latencyMs: number; details: string }> {
  const startTime = Date.now();
  try {
    const res = await fetch(`https://ocyjnplyywvctqikjrrh.supabase.co/functions/v1/${functionName}`, {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });

    const latencyMs = Date.now() - startTime;
    if (res.ok || res.status === 204 || res.status === 200 || res.status === 400) {
      return { status: 'OK', latencyMs, details: `Respuesta HTTP ${res.status} (CORS y endpoint activos)` };
    }
    return { status: 'ERROR', latencyMs, details: `Código HTTP inesperado: ${res.status}` };
  } catch (err: any) {
    return { status: 'ERROR', latencyMs: Date.now() - startTime, details: err.message || 'Fallo de conexión' };
  }
}

// ============================================================
// 12. DATA EXPORT HELPER (CSV / JSON WITH AUDIT LOG)
// ============================================================

export async function exportDataWithAudit(
  data: any[],
  filename: string,
  format: 'csv' | 'json',
  entityType: string
): Promise<void> {
  if (!data || data.length === 0) return;

  await logAdminAction(
    'DATA_EXPORT',
    'SYSTEM',
    entityType,
    `Exportación de ${data.length} registros en formato ${format.toUpperCase()}`
  );

  let content = '';
  let mimeType = 'text/plain';

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  } else {
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    content = csvRows.join('\n');
    mimeType = 'text/csv';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
