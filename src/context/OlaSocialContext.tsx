import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  fetchLevelRequirements,
  fetchUserExperienceLedger,
  fetchUserReputationEvents,
  fetchUserBadges,
  fetchSupportVerifications,
  fetchDisputes,
  callCompleteVerifiedTask,
  callReportTaskDispute,
  callResolveDispute
} from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { pwaManager } from '../services/pwaManager';
import {
  CampaignTask,
  TaskStatus,
  SocialProfile,
  Campaign,
  NotificationItem,
  NotificationType,
  BattleEvent,
  AuditLogEntry,
  FraudEvent,
  RiskLevel,
  VerificationStatus,
  LevelRequirement,
  ExperienceEntry,
  ReputationEvent,
  SupportVerification,
  Badge,
  Dispute,
  DisputeStatus
} from '../types';
import { INITIAL_COMMUNITY_CAMPAIGNS, INITIAL_COMMUNITY_TASKS } from '../data/seedData';

export const OFFICIAL_LEVEL_REQUIREMENTS: LevelRequirement[] = [
  {
    level_number: 1,
    level_name: 'NUEVO',
    min_xp: 0,
    min_verified_supports: 0,
    min_reputation: 0,
    min_unique_users: 0,
    min_unique_platforms: 0,
    perks: ['Acceso básico a lobby', 'Creación de hasta 1 campaña activa']
  },
  {
    level_number: 2,
    level_name: 'COLABORADOR',
    min_xp: 100,
    min_verified_supports: 3,
    min_reputation: 100,
    min_unique_users: 2,
    min_unique_platforms: 1,
    perks: ['Acceso a tareas prioritarias', 'Insignia de Colaborador en perfil']
  },
  {
    level_number: 3,
    level_name: 'APOYADOR',
    min_xp: 300,
    min_verified_supports: 10,
    min_reputation: 200,
    min_unique_users: 3,
    min_unique_platforms: 1,
    perks: ['Hasta 3 campañas activas', 'Prioridad de revisión de evidencias']
  },
  {
    level_number: 4,
    level_name: 'IMPULSOR',
    min_xp: 650,
    min_verified_supports: 20,
    min_reputation: 350,
    min_unique_users: 5,
    min_unique_platforms: 2,
    perks: ['Mayor visibilidad en el lobby', 'Participación en batallas comunitarias']
  },
  {
    level_number: 5,
    level_name: 'REFERENTE',
    min_xp: 1200,
    min_verified_supports: 40,
    min_reputation: 500,
    min_unique_users: 10,
    min_unique_platforms: 2,
    perks: ['Distintivo Referente dorado', 'Hasta 5 campañas activas simultáneas']
  },
  {
    level_number: 6,
    level_name: 'GUÍA',
    min_xp: 2000,
    min_verified_supports: 70,
    min_reputation: 650,
    min_unique_users: 15,
    min_unique_platforms: 3,
    perks: ['Capacidad de sugerir directrices', 'Multiplicador leve de diversidad']
  },
  {
    level_number: 7,
    level_name: 'EMBAJADOR',
    min_xp: 3200,
    min_verified_supports: 110,
    min_reputation: 750,
    min_unique_users: 25,
    min_unique_platforms: 3,
    perks: ['Insignia de Embajador oficial', 'Acceso a canales de prueba anticipada']
  },
  {
    level_number: 8,
    level_name: 'LÍDER COMUNITARIO',
    min_xp: 5000,
    min_verified_supports: 160,
    min_reputation: 825,
    min_unique_users: 40,
    min_unique_platforms: 4,
    perks: ['Prioridad máxima en ranking', 'Voto consultivo en disputas públicas']
  },
  {
    level_number: 9,
    level_name: 'MAESTRO DE APOYO',
    min_xp: 7500,
    min_verified_supports: 225,
    min_reputation: 900,
    min_unique_users: 60,
    min_unique_platforms: 4,
    perks: ['Distintivo Maestro de Apoyo', 'Límites ampliados de campañas']
  },
  {
    level_number: 10,
    level_name: 'PULSO SOCIAL',
    min_xp: 10500,
    min_verified_supports: 300,
    min_reputation: 950,
    min_unique_users: 80,
    min_unique_platforms: 5,
    perks: ['Máximo nivel de prestigio comunitario', 'Reconocimiento permanente en Salón de Honor']
  }
];

interface OlaSocialContextType {
  socialProfiles: SocialProfile[];
  campaigns: Campaign[];
  tasks: CampaignTask[];
  notifications: NotificationItem[];
  activeBattles: BattleEvent[];
  auditLogs: AuditLogEntry[];
  fraudEvents: FraudEvent[];
  levelRequirements: LevelRequirement[];
  experienceLedger: ExperienceEntry[];
  reputationEvents: ReputationEvent[];
  supportVerifications: SupportVerification[];
  badges: Badge[];
  disputes: Dispute[];
  onlineUsersCount: number;
  newUsersTodayCount: number;
  peopleDiscoveringCount: number;
  isLoadingData: boolean;
  isOnline: boolean;
  activeToastNotification: NotificationItem | null;
  dismissToastNotification: () => void;

  // Actions
  startTask: (taskId: string, targetProfileUrl?: string) => { success: boolean; message: string };
  declareTaskCompleted: (
    taskId: string,
    evidenceUrl?: string,
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  validateHug: (
    taskId: string,
    isValid: boolean,
    feedback?: string
  ) => Promise<{ success: boolean; message: string }>;
  createCampaign: (
    campaignData: Omit<
      Campaign,
      'id' | 'creator_id' | 'creator_name' | 'creator_avatar' | 'status' | 'current_participants' | 'created_at' | 'expires_at' | 'compliance_status'
    >
  ) => Promise<{ success: boolean; message: string; campaignId?: string }>;
  addSocialProfile: (
    profileData: Partial<SocialProfile>
  ) => { success: boolean; message: string };
  requestProfileChange: (profileId: string, reason: string) => void;
  resolveFraudEvent: (eventId: string, resolution: 'DISMISSED' | 'CONFIRMED_FRAUD') => Promise<void>;
  addAuditLog: (
    action: string,
    targetType: 'USER' | 'TASK' | 'CAMPAIGN' | 'POLICY' | 'BATTLE' | 'SECURITY',
    targetId: string,
    details: string
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  pledgeBattle: (battleId: string, creatorId: string) => { success: boolean; message: string };
  reportDispute: (
    taskId: string,
    reason: string,
    evidenceUrl?: string
  ) => Promise<{ success: boolean; message: string }>;
  resolveDispute: (
    disputeId: string,
    resolution: DisputeStatus,
    notes: string
  ) => Promise<{ success: boolean; message: string }>;
  updateLevelRequirements: (reqs: LevelRequirement[]) => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const OlaSocialContext = createContext<OlaSocialContextType | undefined>(undefined);

export const OlaSocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, refreshProfile } = useAuth();

  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_COMMUNITY_CAMPAIGNS);
  const [tasks, setTasks] = useState<CampaignTask[]>(INITIAL_COMMUNITY_TASKS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeBattles, setActiveBattles] = useState<BattleEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);
  const [levelRequirements, setLevelRequirements] = useState<LevelRequirement[]>(OFFICIAL_LEVEL_REQUIREMENTS);
  const [experienceLedger, setExperienceLedger] = useState<ExperienceEntry[]>([]);
  const [reputationEvents, setReputationEvents] = useState<ReputationEvent[]>([]);
  const [supportVerifications, setSupportVerifications] = useState<SupportVerification[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [activeToastNotification, setActiveToastNotification] = useState<NotificationItem | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(14);
  const [newUsersTodayCount, setNewUsersTodayCount] = useState<number>(38);
  const [peopleDiscoveringCount, setPeopleDiscoveringCount] = useState<number>(126);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Load real data from Supabase
  const loadDataFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsLoadingData(true);

    try {
      // 1. Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('campaign_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (!tasksError && tasksData && tasksData.length > 0) {
        setTasks(tasksData as CampaignTask[]);
      }

      // 2. Campaigns
      const { data: campaignsData, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (!campError && campaignsData && campaignsData.length > 0) {
        setCampaigns(campaignsData as Campaign[]);
      }

      // 3. User Social Profiles & Notifications & Personal Ledger/Reputation
      if (user) {
        const { data: profilesData } = await supabase
          .from('social_profiles')
          .select('*')
          .eq('user_id', user.id);
        if (profilesData) setSocialProfiles(profilesData as SocialProfile[]);

        const { data: notifsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (notifsData) setNotifications(notifsData as NotificationItem[]);

        const ledgerData = await fetchUserExperienceLedger(user.id);
        if (ledgerData.length > 0) setExperienceLedger(ledgerData);

        const repData = await fetchUserReputationEvents(user.id);
        if (repData.length > 0) setReputationEvents(repData);

        const badgesData = await fetchUserBadges(user.id);
        if (badgesData.length > 0) setBadges(badgesData);
      }

      // 4. Battles
      const { data: battlesData } = await supabase
        .from('battle_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (battlesData) setActiveBattles(battlesData as BattleEvent[]);

      // 5. Level Requirements
      const reqsData = await fetchLevelRequirements();
      if (reqsData.length > 0) {
        setLevelRequirements(reqsData);
      }

      // 6. Support Verifications (Abrazos Certificados)
      const verifs = await fetchSupportVerifications(60);
      if (verifs.length > 0) setSupportVerifications(verifs);

      // 7. Disputes
      const dispData = await fetchDisputes();
      if (dispData.length > 0) setDisputes(dispData);

      // 8. Admin data
      if (isAdmin) {
        const { data: auditData } = await supabase
          .from('admin_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (auditData) setAuditLogs(auditData as AuditLogEntry[]);

        const { data: fraudData } = await supabase
          .from('fraud_events')
          .select('*')
          .order('created_at', { ascending: false });
        if (fraudData) setFraudEvents(fraudData as FraudEvent[]);
      }

      // 9. Real Active User Count from Profiles
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (userCount !== null) {
        setOnlineUsersCount(Math.max(1, userCount));
        setNewUsersTodayCount(userCount);
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, isAdmin]);

  // Initial load
  useEffect(() => {
    loadDataFromSupabase();
  }, [loadDataFromSupabase]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('ola-social-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as CampaignTask, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as CampaignTask) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCampaigns((prev) => [payload.new as Campaign, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCampaigns((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Campaign) : c))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_events' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setActiveBattles((prev) => [payload.new as BattleEvent, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setActiveBattles((prev) =>
              prev.map((b) => (b.id === payload.new.id ? (payload.new as BattleEvent) : b))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_verifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSupportVerifications((prev) => [payload.new as SupportVerification, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'disputes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDisputes((prev) => [payload.new as Dispute, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDisputes((prev) =>
              prev.map((d) => (d.id === payload.new.id ? (payload.new as Dispute) : d))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  // Realtime User Notifications (Deduplicated, bidirectional read-state sync & foreground toasts)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    const notifChannel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as NotificationItem;
            setNotifications((prev) => {
              // Deduplicate by ID
              if (prev.some((n) => n.id === newNotif.id)) {
                return prev;
              }
              return [newNotif, ...prev];
            });

            // Trigger foreground notification banner
            setActiveToastNotification(newNotif);

            // Trigger system notification if app is in background or minimized
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
              pwaManager.showSystemNotification(newNotif.title, {
                body: newNotif.message,
                tag: newNotif.id
              });
            }

            // Haptic feedback if supported
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([40, 30, 40]);
              } catch {
                // Ignore
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as NotificationItem;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotif.id ? { ...n, ...updatedNotif } : n))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setNotifications((prev) => prev.filter((n) => n.id !== oldId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(notifChannel);
    };
  }, [user]);

  // Synchronize App Badge API with unread notifications count
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    pwaManager.updateAppBadge(unreadCount);
  }, [notifications]);

  // Network Online / Offline Detection and Automatic Resync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Resync notifications silently from Supabase without aggressive polling
      if (isSupabaseConfigured && supabase && user) {
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) {
              setNotifications((prev) => {
                const map = new Map<string, NotificationItem>();
                (data as NotificationItem[]).forEach((item) => map.set(item.id, item));
                prev.forEach((item) => {
                  if (!map.has(item.id)) map.set(item.id, item);
                });
                return Array.from(map.values()).sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              });
            }
          });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Realtime Presence Channel for genuine online count
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    const presenceChannel = supabase.channel('online-presence', {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const activeCount = Object.keys(state).length;
        setOnlineUsersCount(Math.max(1, activeCount));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: user.id,
            displayName: user.display_name,
            onlineAt: new Date().toISOString()
          });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user]);

  // Actions
  const startTask = (taskId: string, targetProfileUrl?: string) => {
    if (!user) {
      return { success: false, message: 'Debes iniciar sesión para dar un abrazo.' };
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Tarea no encontrada.' };

    if (task.creator_id === user.id) {
      return { success: false, message: 'No puedes darte un abrazo a tu propia campaña.' };
    }

    const updatedTask: CampaignTask = {
      ...task,
      assigned_user_id: user.id,
      assigned_user_name: user.display_name,
      status: TaskStatus.IN_PROGRESS,
      assigned_at: new Date().toISOString()
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('campaign_tasks')
        .update({
          assigned_user_id: user.id,
          status: TaskStatus.IN_PROGRESS,
          assigned_at: updatedTask.assigned_at
        })
        .eq('id', taskId)
        .then();
    }

    if (targetProfileUrl) {
      window.open(targetProfileUrl, '_blank', 'noopener,noreferrer');
    }

    return { success: true, message: '¡Tarea iniciada! Conoce el perfil y deja tu interacción sincera.' };
  };

  const declareTaskCompleted = async (
    taskId: string,
    evidenceUrl?: string,
    notes?: string
  ) => {
    if (!user) return { success: false, message: 'No autenticado.' };

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Tarea no encontrada.' };

    const updatedTask: CampaignTask = {
      ...task,
      status: TaskStatus.SUBMITTED,
      evidence_url: evidenceUrl,
      evidence_note: notes,
      submitted_at: new Date().toISOString()
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('campaign_tasks')
        .update({
          status: TaskStatus.SUBMITTED,
          evidence_url: evidenceUrl,
          evidence_note: notes,
          submitted_at: updatedTask.submitted_at
        })
        .eq('id', taskId);

      // Notify the campaign creator
      await supabase.from('notifications').insert({
        user_id: task.creator_id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Nuevo Abrazo recibido',
        message: `${user.display_name} ha declarado completado un abrazo en tu campaña.`,
        read: false
      });
    }

    return { success: true, message: 'Abrazo enviado a validación. El creador confirmará la recepción.' };
  };

  const validateHug = async (taskId: string, isValid: boolean, feedback?: string) => {
    if (!user) return { success: false, message: 'No autenticado.' };

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Tarea no encontrada.' };

    if (task.creator_id !== user.id && !isAdmin) {
      return { success: false, message: 'Solo el creador receptor o un moderador puede validar este abrazo.' };
    }

    // Try transactional server-side RPC first
    if (isSupabaseConfigured && supabase) {
      try {
        const rpcResult = await callCompleteVerifiedTask(taskId, isValid, feedback);
        if (rpcResult && rpcResult.success) {
          // Refresh profile, tasks, and verifications
          await refreshProfile();
          const { data: updatedTaskData } = await supabase
            .from('campaign_tasks')
            .select('*')
            .eq('id', taskId)
            .single();

          if (updatedTaskData) {
            setTasks((prev) => prev.map((t) => (t.id === taskId ? (updatedTaskData as CampaignTask) : t)));
          }

          const verifs = await fetchSupportVerifications(60);
          if (verifs.length > 0) setSupportVerifications(verifs);

          return {
            success: true,
            message: isValid
              ? `¡Abrazo certificado con éxito! +${rpcResult.xp_awarded || 30} XP otorgados.`
              : 'Abrazo marcado como no verificado.'
          };
        }
      } catch (rpcErr) {
        console.warn('RPC complete_verified_task failed or not yet deployed, falling back to direct update:', rpcErr);
      }
    }

    // Fallback direct execution
    const nextStatus = isValid ? TaskStatus.VERIFIED : TaskStatus.REJECTED;

    const updatedTask: CampaignTask = {
      ...task,
      status: nextStatus
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('campaign_tasks')
        .update({ status: nextStatus })
        .eq('id', taskId);

      if (task.assigned_user_id) {
        if (isValid) {
          // Insert Support Verification
          await supabase.from('support_verifications').insert({
            task_id: taskId,
            campaign_id: task.campaign_id,
            giver_id: task.assigned_user_id,
            receiver_id: task.creator_id,
            platform: task.platform,
            action_type: task.action_type,
            evidence_url: task.evidence_url,
            is_valid: true,
            feedback: feedback || 'Abrazo legítimo certificado',
            xp_awarded: 30,
            reputation_delta: 2.5
          });

          // Insert rating
          await supabase.from('task_ratings').insert({
            task_id: taskId,
            giver_id: task.assigned_user_id,
            receiver_id: task.creator_id,
            stars: 5,
            feedback: feedback || 'Abrazo legítimo y verificado'
          });

          // Update giver profile
          const { data: giverProfile } = await supabase
            .from('profiles')
            .select('hugs_verified, stars_count, experience_points, level_number, reputation_score')
            .eq('id', task.assigned_user_id)
            .single();

          if (giverProfile) {
            const nextXP = (giverProfile.experience_points || 0) + 30;
            const nextVerified = (giverProfile.hugs_verified || 0) + 1;
            const nextRep = Math.min(1000, (giverProfile.reputation_score || 100) + 2.5);

            await supabase
              .from('profiles')
              .update({
                hugs_verified: nextVerified,
                stars_count: (giverProfile.stars_count || 0) + 5,
                experience_points: nextXP,
                reputation_score: nextRep
              })
              .eq('id', task.assigned_user_id);
          }
        }

        // Notify the giver
        await supabase.from('notifications').insert({
          user_id: task.assigned_user_id,
          type: isValid ? NotificationType.TASK_VERIFIED : NotificationType.TASK_REJECTED,
          title: isValid ? '¡Abrazo Certificado!' : 'Abrazo No Confirmado',
          message: isValid
            ? `Tu abrazo hacia ${task.creator_name} fue verificado. Ganaste +30 XP y reputación.`
            : `Tu evidencia no pudo ser confirmada: ${feedback || 'Interacción no encontrada'}.`,
          read: false
        });
      }
    }

    await refreshProfile();
    return {
      success: true,
      message: isValid ? '¡Abrazo validado y experiencia concedida!' : 'Abrazo marcado como no verificado.'
    };
  };

  const reportDispute = async (
    taskId: string,
    reason: string,
    evidenceUrl?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Debes iniciar sesión para reportar una disputa.' };

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Tarea no encontrada.' };

    const opponentId = user.id === task.creator_id ? (task.assigned_user_id || 'system') : task.creator_id;

    // Call RPC or insert
    const rpcRes = await callReportTaskDispute(taskId, reason, evidenceUrl);

    // Update local task status to DISPUTED
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: TaskStatus.DISPUTED } : t))
    );

    // Also insert dispute record directly if needed
    if (isSupabaseConfigured && supabase) {
      const { data: newDisp } = await supabase
        .from('disputes')
        .insert({
          task_id: taskId,
          reporter_id: user.id,
          accused_id: opponentId,
          reason,
          evidence_url: evidenceUrl,
          status: 'OPEN'
        })
        .select()
        .single();

      if (newDisp) {
        setDisputes((prev) => [newDisp as Dispute, ...prev]);
      }
    }

    return { success: true, message: 'Disputa registrada. Un moderador revisará ambas evidencias.' };
  };

  const resolveDispute = async (
    disputeId: string,
    resolution: DisputeStatus,
    notes: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || !isAdmin) {
      return { success: false, message: 'Solo los administradores o moderadores pueden resolver disputas.' };
    }

    const rpcRes = await callResolveDispute(disputeId, resolution, notes);

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: resolution,
              resolution_notes: notes,
              resolved_by: user.id,
              resolved_at: new Date().toISOString()
            }
          : d
      )
    );

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('disputes')
        .update({
          status: resolution,
          resolution_notes: notes,
          resolved_by: user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', disputeId);
    }

    await loadDataFromSupabase();
    return { success: true, message: rpcRes.message || 'Disputa resuelta correctamente.' };
  };

  const updateLevelRequirements = async (reqs: LevelRequirement[]) => {
    setLevelRequirements(reqs);

    if (isSupabaseConfigured && supabase && isAdmin) {
      for (const req of reqs) {
        await supabase
          .from('level_requirements')
          .upsert(req, { onConflict: 'level_number' });
      }
    }
  };

  const createCampaign = async (
    campaignData: Omit<
      Campaign,
      'id' | 'creator_id' | 'creator_name' | 'creator_avatar' | 'status' | 'current_participants' | 'created_at' | 'expires_at' | 'compliance_status'
    >
  ) => {
    if (!user) return { success: false, message: 'Debes iniciar sesión.' };

    const newCampaignId = `camp-${Date.now()}`;
    const newCamp: Campaign = {
      ...campaignData,
      id: newCampaignId,
      creator_id: user.id,
      creator_name: user.display_name,
      creator_avatar: user.avatar_url,
      current_participants: 0,
      status: 'ACTIVE',
      compliance_status: 'ALLOWED',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    setCampaigns((prev) => [newCamp, ...prev]);

    // Create tasks for this campaign
    const newTasks: CampaignTask[] = [];
    const taskCount = Math.min(newCamp.max_participants || 5, 5);
    for (let i = 0; i < taskCount; i++) {
      newTasks.push({
        id: `task-${Date.now()}-${i}`,
        campaign_id: newCampaignId,
        creator_id: user.id,
        creator_name: user.display_name,
        creator_avatar: user.avatar_url,
        platform: campaignData.platform,
        action_type: campaignData.action_type,
        title: campaignData.title,
        description: campaignData.description,
        target_profile_url: campaignData.target_profile_url,
        target_username: campaignData.target_username,
        status: TaskStatus.AVAILABLE,
        priority: 'NORMAL',
        risk_level: RiskLevel.LOW,
        created_at: new Date().toISOString(),
        expires_at: newCamp.expires_at
      });
    }

    setTasks((prev) => [...newTasks, ...prev]);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('campaigns').insert(newCamp);
      await supabase.from('campaign_tasks').insert(newTasks);
    }

    return { success: true, message: 'Campaña creada y publicada en el Lobby.', campaignId: newCampaignId };
  };

  const addSocialProfile = (
    profileData: Partial<SocialProfile>
  ): { success: boolean; message: string } => {
    if (!user) return { success: false, message: 'No autenticado.' };

    if (!profileData.platform || !profileData.profile_url || !profileData.username) {
      return { success: false, message: 'Información de perfil incompleta.' };
    }

    const normalizedIdentifier = `${profileData.platform}::${profileData.username.toLowerCase().trim()}`;
    const alreadyExists = socialProfiles.some(
      (p) => p.platform === profileData.platform && p.username.toLowerCase() === profileData.username?.toLowerCase()
    );

    if (alreadyExists) {
      return {
        success: false,
        message: 'Este perfil ya se encuentra registrado en tu cuenta de OLA SOCIAL.'
      };
    }

    const newProfile: SocialProfile = {
      id: `sp-${Date.now()}`,
      user_id: user.id,
      platform: profileData.platform,
      profile_url: profileData.profile_url,
      username: profileData.username,
      display_name: profileData.display_name || profileData.username,
      avatar_url: profileData.avatar_url || user.avatar_url,
      followers_count: profileData.followers_count || 0,
      following_count: profileData.following_count || 0,
      likes_count: profileData.likes_count || 0,
      public_metrics: {},
      verification_status: VerificationStatus.AUTO_CHECK,
      is_primary: !!profileData.is_primary,
      locked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSocialProfiles((prev) => [
      ...prev.map((p) => (newProfile.is_primary ? { ...p, is_primary: false } : p)),
      newProfile
    ]);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('social_profiles')
        .insert({
          ...newProfile,
          normalized_identifier: normalizedIdentifier
        })
        .then();
    }

    return { success: true, message: 'Perfil social vinculado y bloqueado con éxito.' };
  };

  const requestProfileChange = (profileId: string, reason: string) => {
    if (!user) return;
    if (isSupabaseConfigured && supabase) {
      supabase.from('admin_audit_log').insert({
        admin_id: user.id,
        admin_email: user.email,
        action: 'REQUEST_PROFILE_CHANGE',
        target_type: 'USER',
        target_id: profileId,
        details: `Solicitud de modificación de perfil bloqueado: ${reason}`
      }).then();
    }
  };

  const resolveFraudEvent = async (eventId: string, resolution: 'DISMISSED' | 'CONFIRMED_FRAUD') => {
    setFraudEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: resolution } : e))
    );

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('fraud_events')
        .update({ status: resolution })
        .eq('id', eventId);
    }
  };

  const addAuditLog = (
    action: string,
    targetType: 'USER' | 'TASK' | 'CAMPAIGN' | 'POLICY' | 'BATTLE' | 'SECURITY',
    targetId: string,
    details: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      admin_id: user?.id || 'system',
      admin_email: user?.email || 'system@olasocial.app',
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_hash: 'client_audit',
      created_at: new Date().toISOString()
    };

    setAuditLogs((prev) => [newEntry, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('admin_audit_log').insert(newEntry).then();
    }
  };

  const markNotificationAsRead = (id: string) => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, read_at: nowIso } : n))
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('notifications').update({ read: true, read_at: nowIso }).eq('id', id).then();
    }
  };

  const markAllNotificationsAsRead = () => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: nowIso })));

    if (isSupabaseConfigured && supabase && user) {
      supabase.from('notifications').update({ read: true, read_at: nowIso }).eq('user_id', user.id).then();
    }
  };

  const pledgeBattle = (battleId: string, creatorId: string) => {
    if (!user) return { success: false, message: 'Debes iniciar sesión.' };

    setActiveBattles((prev) =>
      prev.map((b) => {
        if (b.id !== battleId) return b;
        return {
          ...b,
          creator1_pledges: b.creator1_id === creatorId ? b.creator1_pledges + 1 : b.creator1_pledges,
          creator2_pledges: b.creator2_id === creatorId ? b.creator2_pledges + 1 : b.creator2_pledges
        };
      })
    );

    if (isSupabaseConfigured && supabase) {
      const battle = activeBattles.find((b) => b.id === battleId);
      if (battle) {
        const isC1 = battle.creator1_id === creatorId;
        supabase
          .from('battle_events')
          .update({
            creator1_pledges: isC1 ? battle.creator1_pledges + 1 : battle.creator1_pledges,
            creator2_pledges: !isC1 ? battle.creator2_pledges + 1 : battle.creator2_pledges
          })
          .eq('id', battleId)
          .then();
      }
    }

    return { success: true, message: 'Compromiso de apoyo registrado con éxito.' };
  };

  const refreshAllData = async () => {
    await loadDataFromSupabase();
  };

  return (
    <OlaSocialContext.Provider
      value={{
        socialProfiles,
        campaigns,
        tasks,
        notifications,
        activeBattles,
        auditLogs,
        fraudEvents,
        levelRequirements,
        experienceLedger,
        reputationEvents,
        supportVerifications,
        badges,
        disputes,
        onlineUsersCount,
        newUsersTodayCount,
        peopleDiscoveringCount,
        isLoadingData,
        isOnline,
        activeToastNotification,
        dismissToastNotification: () => setActiveToastNotification(null),
        startTask,
        declareTaskCompleted,
        validateHug,
        createCampaign,
        addSocialProfile,
        requestProfileChange,
        resolveFraudEvent,
        addAuditLog,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        pledgeBattle,
        reportDispute,
        resolveDispute,
        updateLevelRequirements,
        refreshAllData
      }}
    >
      {children}
    </OlaSocialContext.Provider>
  );
};

export const useOlaSocial = () => {
  const context = useContext(OlaSocialContext);
  if (!context) {
    throw new Error('useOlaSocial debe ser utilizado dentro de un OlaSocialProvider');
  }
  return context;
};
