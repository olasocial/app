import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SocialProfile,
  Campaign,
  Task,
  TaskStatus,
  NotificationItem,
  NotificationType,
  AdminAuditLog,
  FraudEvent,
  BattleEvent,
  RiskLevel,
  UserLevel,
  UserRole,
  VerificationStatus,
  SocialPlatformKey
} from '../types';
import { useAuth } from './AuthContext';
import { AntiFraudEngine } from '../services/antiFraudEngine';
import confetti from 'canvas-confetti';

interface OlaSocialContextType {
  socialProfiles: SocialProfile[];
  campaigns: Campaign[];
  tasks: Task[];
  notifications: NotificationItem[];
  onlineUsersCount: number;
  newUsersTodayCount: number;
  peopleDiscoveringCount: number;
  activeBattles: BattleEvent[];
  auditLogs: AdminAuditLog[];
  fraudEvents: FraudEvent[];
  // Actions
  addSocialProfile: (profile: Omit<SocialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'locked_at' | 'verification_status'>) => { success: boolean; message: string };
  requestProfileChange: (profileId: string, reason: string) => void;
  createCampaign: (campaignData: Partial<Campaign>) => { success: boolean; message: string };
  startTask: (taskId: string) => { success: boolean; message: string };
  declareTaskCompleted: (taskId: string, evidenceNote: string, evidenceUrl?: string) => { success: boolean; message: string };
  validateHug: (taskId: string, confirmed: boolean, stars: number, feedback?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  makeDonation: (amount: number, donorName: string, message?: string) => void;
  pledgeBattle: (battleId: string, creatorId: string) => { success: boolean; message: string };
  addAuditLog: (action: string, targetType: AdminAuditLog['target_type'], targetId: string, details: string) => void;
  resolveFraudEvent: (eventId: string, action: 'CONFIRMED_FRAUD' | 'DISMISSED') => void;
}

const OlaSocialContext = createContext<OlaSocialContextType | undefined>(undefined);

export const OlaSocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateProfile } = useAuth();

  // Social Profiles registered by users
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([
    {
      id: 'sp-1',
      user_id: user?.id || 'admin-root-001',
      platform: 'youtube',
      profile_url: 'https://www.youtube.com/@olasocial',
      username: 'olasocial',
      display_name: 'Ola Social Oficial',
      followers_count: 14200,
      following_count: 50,
      likes_count: 85000,
      verification_status: VerificationStatus.VERIFIED,
      is_primary: true,
      locked_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sp-2',
      user_id: user?.id || 'admin-root-001',
      platform: 'instagram',
      profile_url: 'https://www.instagram.com/olasocial_comunidad',
      username: 'olasocial_comunidad',
      display_name: 'Ola Social Comunidad',
      followers_count: 28400,
      verification_status: VerificationStatus.MANUAL_REVIEW,
      is_primary: false,
      locked_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // Initial Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 'camp-1',
      creator_id: 'creator-marina',
      creator_name: 'Marina Arte & Olas',
      creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      platform: 'tiktok',
      target_profile_url: 'https://www.tiktok.com/@marina_arte_olas',
      target_username: 'marina_arte_olas',
      title: 'Nuevo mural de arte marino y concientización',
      description: 'Descubre el proceso artístico de pintar la gran ola del océano con materiales ecológicos.',
      thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
      campaign_type: 'DISCOVERY',
      action_type: 'DISCOVER',
      max_participants: 50,
      current_participants: 34,
      status: 'ACTIVE',
      compliance_status: 'ALLOWED',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 86400000).toISOString()
    },
    {
      id: 'camp-2',
      creator_id: 'creator-carlos',
      creator_name: 'Carlos Tech Verde',
      creator_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      platform: 'youtube',
      target_profile_url: 'https://www.youtube.com/@carlostechverde',
      target_username: 'carlostechverde',
      title: 'Tutorial: Energía solar casera y conectividad',
      description: 'Aprende paso a paso cómo montar paneles solares sostenibles para alimentar tu estación de trabajo.',
      thumbnail_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop&q=80',
      campaign_type: 'COMMUNITY',
      action_type: 'WATCH',
      max_participants: 100,
      current_participants: 68,
      status: 'ACTIVE',
      compliance_status: 'ALLOWED',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 8 * 86400000).toISOString()
    },
    {
      id: 'camp-3',
      creator_id: 'creator-elena',
      creator_name: 'Elena Creadora Viajera',
      creator_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      platform: 'instagram',
      target_profile_url: 'https://www.instagram.com/elena_viajes',
      target_username: 'elena_viajes',
      title: 'Guía de senderos ecológicos comunitarios',
      description: 'Fotografías y reseñas culturales de reservas naturales comunitarias.',
      thumbnail_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop&q=80',
      campaign_type: 'DISCOVERY',
      action_type: 'VISIT',
      max_participants: 75,
      current_participants: 41,
      status: 'ACTIVE',
      compliance_status: 'ALLOWED',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 4 * 86400000).toISOString()
    }
  ]);

  // Tasks (Oportunidades de abrazo)
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      campaign_id: 'camp-1',
      creator_id: 'creator-marina',
      creator_name: 'Marina Arte & Olas',
      creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      target_profile_url: 'https://www.tiktok.com/@marina_arte_olas',
      target_username: 'marina_arte_olas',
      platform: 'tiktok',
      action_type: 'Descubrir video de mural marino',
      title: 'Descubre y apoya con un abrazo el arte de Marina',
      description: 'Visita su perfil en TikTok, mira el video del nuevo mural y deja un comentario auténtico si te inspira.',
      status: TaskStatus.AVAILABLE,
      priority: 'HIGH',
      risk_level: RiskLevel.LOW,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: 'task-2',
      campaign_id: 'camp-2',
      creator_id: 'creator-carlos',
      creator_name: 'Carlos Tech Verde',
      creator_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      target_profile_url: 'https://www.youtube.com/@carlostechverde',
      target_username: 'carlostechverde',
      platform: 'youtube',
      action_type: 'Conocer canal de tecnología verde',
      title: 'Conoce el canal sobre energía limpia de Carlos',
      description: 'Mira su último tutorial de paneles solares en YouTube de forma voluntaria y humana.',
      status: TaskStatus.AVAILABLE,
      priority: 'NORMAL',
      risk_level: RiskLevel.LOW,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: 'task-3',
      campaign_id: 'camp-3',
      creator_id: 'creator-elena',
      creator_name: 'Elena Creadora Viajera',
      creator_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      target_profile_url: 'https://www.instagram.com/elena_viajes',
      target_username: 'elena_viajes',
      platform: 'instagram',
      action_type: 'Visitar perfil fotográfico',
      title: 'Explora los senderos ecológicos de Elena en Instagram',
      description: 'Conoce sus fotografías de viajes comunitarios e interactúa voluntariamente.',
      status: TaskStatus.AVAILABLE,
      priority: 'NORMAL',
      risk_level: RiskLevel.LOW,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString()
    },
    // A sample pending verification received by the user
    {
      id: 'task-pending-validate-1',
      campaign_id: 'camp-user-default',
      creator_id: user?.id || 'admin-root-001',
      creator_name: user?.display_name || 'Tú',
      creator_avatar: user?.avatar_url || '',
      target_profile_url: 'https://www.youtube.com/@olasocial',
      target_username: 'olasocial',
      platform: 'youtube',
      action_type: 'Visitar y descubrir canal',
      title: 'Abrazo recibido de Sofía Rodríguez',
      description: 'Sofía visitó tu canal oficial y declaró haber visto tu video de bienvenida con un comentario positivo.',
      status: TaskStatus.VERIFICATION_PENDING,
      priority: 'HIGH',
      risk_level: RiskLevel.LOW,
      assigned_user_id: 'user-sofia-002',
      assigned_user_name: 'Sofía Rodríguez',
      assigned_at: new Date(Date.now() - 3600000).toISOString(),
      submitted_at: new Date(Date.now() - 1800000).toISOString(),
      evidence_note: 'Vi tu video sobre la gran ola social, me encantó la explicación y el diseño de la comunidad.',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      user_id: user?.id || 'admin-root-001',
      type: NotificationType.WELCOME,
      title: '¡Bienvenido a Ola Social!',
      message: 'Abrazos que conectan personas. Descubre creadores auténticos sin bots ni atajos artificiales.',
      read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'notif-2',
      user_id: user?.id || 'admin-root-001',
      type: NotificationType.NEW_TASK,
      title: 'Tienes un abrazo pendiente por validar',
      message: 'Sofía Rodríguez ha declarado un abrazo hacia tu canal oficial de YouTube.',
      read: false,
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ]);

  // Battles
  const [activeBattles, setActiveBattles] = useState<BattleEvent[]>([
    {
      id: 'battle-1',
      title: 'Gran Encuentro de Creadores Culturales 2026',
      creator1_id: 'creator-valeria',
      creator1_name: 'Valeria Música Viva',
      creator1_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      creator2_id: 'creator-diego',
      creator2_name: 'Diego Fotografía Urbana',
      creator2_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      required_hugs: 1000000, // Section 29 prerequisite
      status: 'LIVE',
      creator1_pledges: 1420,
      creator2_pledges: 1395,
      scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      evidence_status: VerificationStatus.VERIFIED,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]);

  // Admin audit logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([
    {
      id: 'audit-1',
      admin_id: 'admin-root-001',
      admin_email: 'v19629049@gmail.com',
      action: 'PLATFORM_COMPLIANCE_AUDIT',
      target_type: 'POLICY',
      target_id: 'tiktok',
      details: 'Revisión periódica de políticas 2026. Regla estricta contra bots y autolikes aplicada.',
      ip_hash: 'sha256-a94f82c',
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  // Fraud detection events
  const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([
    {
      id: 'fraud-1',
      user_id: 'user-susp-99',
      user_email: 'bot_auto_attempt@example.com',
      pattern: 'BOT_BEHAVIOR',
      risk_level: RiskLevel.CRITICAL,
      status: 'OPEN',
      details: 'Intento de envío de 40 tareas en menos de 30 segundos bloqueado por Rate Limit Engine.',
      created_at: new Date(Date.now() - 14400000).toISOString()
    }
  ]);

  // Live presence and counters
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(38);
  const [newUsersTodayCount, setNewUsersTodayCount] = useState<number>(142);
  const [peopleDiscoveringCount, setPeopleDiscoveringCount] = useState<number>(19);

  // Subtle real-time presence fluctuation to reflect human community
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsersCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(15, prev + delta);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const addAuditLog = (
    action: string,
    targetType: AdminAuditLog['target_type'],
    targetId: string,
    details: string
  ) => {
    const log: AdminAuditLog = {
      id: `audit-${Date.now()}`,
      admin_id: user?.id || 'admin-root-001',
      admin_email: user?.email || 'v19629049@gmail.com',
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_hash: `sha256-${Math.random().toString(36).substring(2, 9)}`,
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const addSocialProfile = (
    newProf: Omit<SocialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'locked_at' | 'verification_status'>
  ) => {
    // Check duplicate platform + normalized username
    const normalizedIdentifier = `${newProf.platform}::${newProf.username.toLowerCase()}`;
    const exists = socialProfiles.some(
      (p) => `${p.platform}::${p.username.toLowerCase()}` === normalizedIdentifier
    );

    if (exists) {
      return { success: false, message: 'Este perfil ya está registrado en OLA SOCIAL.' };
    }

    const created: SocialProfile = {
      ...newProf,
      id: `sp-${Date.now()}`,
      user_id: user?.id || 'admin-root-001',
      verification_status: VerificationStatus.MANUAL_REVIEW,
      locked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSocialProfiles((prev) => [...prev, created]);
    addAuditLog('SOCIAL_PROFILE_REGISTER', 'USER', created.id, `Perfil añadido: ${newProf.platform}/@${newProf.username}`);
    return { success: true, message: 'Perfil registrado y protegido exitosamente.' };
  };

  const requestProfileChange = (profileId: string, reason: string) => {
    addAuditLog('PROFILE_CHANGE_REQUEST', 'USER', profileId, `Motivo: ${reason}`);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: user?.id || 'admin-root-001',
        type: NotificationType.ADMIN_MESSAGE,
        title: 'Solicitud de cambio de perfil enviada',
        message: 'Un moderador de OLA SOCIAL revisará tu solicitud de corrección.',
        read: false,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const createCampaign = (campaignData: Partial<Campaign>) => {
    if (!user) return { success: false, message: 'Debes iniciar sesión' };

    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      creator_id: user.id,
      creator_name: user.display_name,
      creator_avatar: user.avatar_url,
      platform: campaignData.platform || 'youtube',
      target_profile_url: campaignData.target_profile_url || '',
      target_username: campaignData.target_username || '',
      title: campaignData.title || 'Nueva Campaña de Descubrimiento',
      description: campaignData.description || '',
      thumbnail_url: campaignData.thumbnail_url,
      campaign_type: campaignData.campaign_type || 'DISCOVERY',
      action_type: campaignData.action_type || 'DISCOVER',
      max_participants: campaignData.max_participants || 50,
      current_participants: 0,
      status: 'ACTIVE',
      compliance_status: 'ALLOWED',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString()
    };

    setCampaigns((prev) => [newCamp, ...prev]);

    // Also spawn a task for users to discover
    const newTask: Task = {
      id: `task-${Date.now()}`,
      campaign_id: newCamp.id,
      creator_id: user.id,
      creator_name: user.display_name,
      creator_avatar: user.avatar_url,
      target_profile_url: newCamp.target_profile_url,
      target_username: newCamp.target_username,
      platform: newCamp.platform,
      action_type: newCamp.action_type,
      title: newCamp.title,
      description: newCamp.description,
      status: TaskStatus.AVAILABLE,
      priority: 'NORMAL',
      risk_level: RiskLevel.LOW,
      created_at: new Date().toISOString(),
      expires_at: newCamp.expires_at
    };
    setTasks((prev) => [newTask, ...prev]);

    updateProfile({ campaigns_created: (user.campaigns_created || 0) + 1 });
    addAuditLog('CAMPAIGN_CREATE', 'CAMPAIGN', newCamp.id, `Campaña: ${newCamp.title}`);

    return { success: true, message: 'Campaña creada con éxito y en cumplimiento estricto.' };
  };

  const startTask = (taskId: string) => {
    if (!user) return { success: false, message: 'Debes iniciar sesión' };

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Tarea no encontrada' };

    // Anti-fraud checks
    if (task.creator_id === user.id) {
      return { success: false, message: 'No puedes realizar una tarea dirigida a tu propio perfil.' };
    }

    // Rate limits check
    const rateCheck = AntiFraudEngine.checkRateLimit(
      user.id,
      task.platform,
      task.creator_id,
      tasks.filter((t) => t.assigned_user_id === user.id)
    );
    if (!rateCheck.allowed) {
      return { success: false, message: rateCheck.reason || 'Límite alcanzado.' };
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: TaskStatus.IN_PROGRESS,
              assigned_user_id: user.id,
              assigned_user_name: user.display_name,
              assigned_at: new Date().toISOString()
            }
          : t
      )
    );

    return { success: true, message: 'Oportunidad asignada. Puedes visitar el perfil oficial.' };
  };

  const declareTaskCompleted = (taskId: string, evidenceNote: string, evidenceUrl?: string) => {
    if (!user) return { success: false, message: 'Debes iniciar sesión' };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: TaskStatus.VERIFICATION_PENDING,
              submitted_at: new Date().toISOString(),
              evidence_note: evidenceNote,
              evidence_url: evidenceUrl
            }
          : t
      )
    );

    updateProfile({ hugs_done: (user.hugs_done || 0) + 1 });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: user.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Abrazo enviado con éxito',
        message: 'Has declarado tu acción auténtica. El beneficiario recibirá la notificación para validarla.',
        read: false,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    return { success: true, message: 'Acción declarada correctamente. Queda en estado de validación humana.' };
  };

  const validateHug = (taskId: string, confirmed: boolean, stars: number, feedback?: string) => {
    if (!user) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: confirmed ? TaskStatus.VERIFIED : TaskStatus.REJECTED
            }
          : t
      )
    );

    if (confirmed) {
      updateProfile({
        hugs_verified: (user.hugs_verified || 0) + 1,
        hugs_received: (user.hugs_received || 0) + 1,
        stars_count: (user.stars_count || 0) + stars
      });

      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    addAuditLog(
      confirmed ? 'TASK_VALIDATED' : 'TASK_REJECTED',
      'TASK',
      taskId,
      `Validación: ${confirmed ? 'Confirmada con ' + stars + ' estrellas' : 'Rechazada'}. Feedback: ${feedback || 'N/A'}`
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const makeDonation = (amount: number, donorName: string, message?: string) => {
    addAuditLog(
      'DONATION_RECEIVED',
      'USER',
      user?.id || 'anon',
      `Donación voluntaria a OLA SOCIAL de $${amount} USD por ${donorName}. Mensaje: ${message || ''}`
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: user?.id || 'admin-root-001',
        type: NotificationType.DONATION_UPDATE,
        title: '¡Gracias por apoyar a OLA SOCIAL!',
        message: `Tu contribución voluntaria de $${amount} USD ayuda a mantener los servidores independientes y libres de bots.`,
        read: false,
        created_at: new Date().toISOString()
      },
      ...prev
    ]);

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 }
    });
  };

  const pledgeBattle = (battleId: string, creatorId: string) => {
    setActiveBattles((prev) =>
      prev.map((b) => {
        if (b.id === battleId) {
          if (creatorId === b.creator1_id) {
            return { ...b, creator1_pledges: b.creator1_pledges + 1 };
          }
          if (creatorId === b.creator2_id) {
            return { ...b, creator2_pledges: b.creator2_pledges + 1 };
          }
        }
        return b;
      })
    );

    confetti({ particleCount: 40, spread: 50 });
    return { success: true, message: 'Compromiso de apoyo voluntario registrado en la batalla.' };
  };

  const resolveFraudEvent = (eventId: string, action: 'CONFIRMED_FRAUD' | 'DISMISSED') => {
    setFraudEvents((prev) =>
      prev.map((f) => (f.id === eventId ? { ...f, status: action } : f))
    );
    addAuditLog('FRAUD_RESOLVED', 'SECURITY', eventId, `Resolución: ${action}`);
  };

  return (
    <OlaSocialContext.Provider
      value={{
        socialProfiles,
        campaigns,
        tasks,
        notifications,
        onlineUsersCount,
        newUsersTodayCount,
        peopleDiscoveringCount,
        activeBattles,
        auditLogs,
        fraudEvents,
        addSocialProfile,
        requestProfileChange,
        createCampaign,
        startTask,
        declareTaskCompleted,
        validateHug,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        makeDonation,
        pledgeBattle,
        addAuditLog,
        resolveFraudEvent
      }}
    >
      {children}
    </OlaSocialContext.Provider>
  );
};

export const useOlaSocial = () => {
  const context = useContext(OlaSocialContext);
  if (!context) {
    throw new Error('useOlaSocial must be used within an OlaSocialProvider');
  }
  return context;
};
