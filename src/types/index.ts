export enum UserRole {
  USER = 'USER',
  VERIFIED_USER = 'VERIFIED_USER',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  LIMITED = 'LIMITED',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  DELETED = 'DELETED'
}

export enum PlatformApiStatus {
  SUPPORTED_API = 'SUPPORTED_API',
  LIMITED_API = 'LIMITED_API',
  PUBLIC_PROFILE_ONLY = 'PUBLIC_PROFILE_ONLY',
  MANUAL_VERIFICATION = 'MANUAL_VERIFICATION',
  UNSUPPORTED_AUTOMATION = 'UNSUPPORTED_AUTOMATION'
}

export enum TaskStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export enum VerificationStatus {
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  AUTO_CHECK = 'AUTO_CHECK',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum UserLevel {
  NUEVO = 'NUEVO',
  EXPLORADOR = 'EXPLORADOR',
  COLABORADOR = 'COLABORADOR',
  APOYADOR = 'APOYADOR',
  IMPULSOR = 'IMPULSOR',
  REFERENTE = 'REFERENTE',
  GUIA = 'GUÍA',
  EMBAJADOR = 'EMBAJADOR',
  LIDER_COMUNITARIO = 'LÍDER COMUNITARIO',
  MAESTRO_DE_APOYO = 'MAESTRO DE APOYO',
  PULSO_SOCIAL = 'PULSO SOCIAL'
}

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  OFFLINE = 'OFFLINE'
}

export enum NotificationType {
  WELCOME = 'WELCOME',
  NEW_TASK = 'NEW_TASK',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_EXPIRING = 'TASK_EXPIRING',
  TASK_VERIFIED = 'TASK_VERIFIED',
  TASK_REJECTED = 'TASK_REJECTED',
  NEW_RATING = 'NEW_RATING',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  CAMPAIGN_UPDATE = 'CAMPAIGN_UPDATE',
  ADMIN_MESSAGE = 'ADMIN_MESSAGE',
  SECURITY_ALERT = 'SECURITY_ALERT',
  ACCOUNT_WARNING = 'ACCOUNT_WARNING',
  BATTLE_UPDATE = 'BATTLE_UPDATE',
  DONATION_UPDATE = 'DONATION_UPDATE'
}

export type SocialPlatformKey =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'x'
  | 'facebook'
  | 'twitch'
  | 'kick'
  | 'threads'
  | 'snapchat'
  | 'discord'
  | 'telegram'
  | 'linkedin'
  | 'pinterest'
  | 'reddit'
  | 'bluesky';

export type LanguageKey = 'es' | 'en' | 'pt' | 'fr';

export interface SocialProfile {
  id: string;
  user_id: string;
  platform: SocialPlatformKey;
  profile_url: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  followers_count?: number;
  following_count?: number;
  likes_count?: number;
  public_metrics?: Record<string, string | number>;
  verification_status: VerificationStatus;
  is_primary: boolean;
  locked_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  username: string;
  avatar_url: string;
  role: UserRole;
  status: AccountStatus;
  language: LanguageKey;
  country?: string;
  timezone: string;
  presence: PresenceStatus;
  last_seen_at: string;
  reputation: number; // 0 to 100
  hugs_done: number; // Abrazos realizados
  hugs_received: number; // Abrazos recibidos
  hugs_verified: number; // Abrazos validados
  stars_count: number; // Total stars
  rating_avg: number; // 1.0 to 5.0
  campaigns_created: number;
  campaigns_completed: number;
  confidence_level: number; // 0 to 100
  user_level: UserLevel;
  level_number?: number; // 1 to 10
  experience_points?: number; // XP oficial
  reputation_score?: number; // 0 to 1000
  unique_users_helped?: number;
  unique_platforms_supported?: number;
  unique_campaigns_completed?: number;
  community_score?: number;
  warnings_count: number;
  is_18_confirmed: boolean;
  terms_accepted_at: string;
  mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  platform: SocialPlatformKey;
  target_profile_url: string;
  target_username: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  campaign_type: 'DISCOVERY' | 'COMMUNITY' | 'PROMOTION' | 'COLLABORATION';
  action_type: 'VISIT' | 'DISCOVER' | 'WATCH' | 'VOLUNTARY_FOLLOW' | 'COMMUNITY_SHARE';
  max_participants: number;
  current_participants: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'BLOCKED';
  compliance_status: 'ALLOWED' | 'LIMITED' | 'REQUIRES_REVIEW' | 'BLOCKED';
  created_at: string;
  expires_at: string;
}

export interface Task {
  id: string;
  campaign_id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  target_profile_url: string;
  target_username: string;
  platform: SocialPlatformKey;
  action_type: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  risk_level: RiskLevel;
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_at?: string;
  submitted_at?: string;
  evidence_note?: string;
  evidence_url?: string;
  created_at: string;
  expires_at: string;
}

export interface TaskRating {
  id: string;
  task_id: string;
  giver_id: string;
  receiver_id: string;
  stars: number; // 1 to 5
  feedback?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: 'USER' | 'TASK' | 'CAMPAIGN' | 'POLICY' | 'BATTLE' | 'SECURITY';
  target_id: string;
  details: string;
  ip_hash: string;
  created_at: string;
}

export interface FraudEvent {
  id: string;
  user_id: string;
  user_email: string;
  pattern: 'CIRCULAR_EXCHANGE' | 'DUPLICATE_ACCOUNT' | 'RAPID_SUBMISSION' | 'SUSPECT_EVIDENCE' | 'BOT_BEHAVIOR';
  risk_level: RiskLevel;
  status: 'OPEN' | 'INVESTIGATING' | 'CONFIRMED_FRAUD' | 'DISMISSED';
  details: string;
  created_at: string;
}

export interface BattleEvent {
  id: string;
  title: string;
  creator1_id: string;
  creator1_name: string;
  creator1_avatar: string;
  creator2_id: string;
  creator2_name: string;
  creator2_avatar: string;
  required_hugs: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'DISPUTED';
  creator1_pledges: number;
  creator2_pledges: number;
  scheduled_at: string;
  evidence_status: VerificationStatus;
  created_at: string;
}

export interface PlatformPolicyVersion {
  platform: SocialPlatformKey;
  display_name: string;
  logo_url: string;
  enabled: boolean;
  api_status: PlatformApiStatus;
  allowed_actions: string[];
  blocked_actions: string[];
  last_reviewed_at: string;
  policy_source_url: string;
  notes: string;
}

export type AuditLogEntry = AdminAuditLog;
export type CampaignTask = Task;

// ==========================================
// SISTEMA OFICIAL DE NIVELES & AYUDA CERTIFICADA
// ==========================================

export interface LevelRequirement {
  level_number: number;
  level_name: string;
  min_xp: number;
  min_verified_supports: number;
  min_reputation: number;
  min_unique_users: number;
  min_unique_platforms: number;
  perks: string[];
  badge_reward_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExperienceEntry {
  id: string;
  user_id: string;
  source_type: string;
  source_id?: string;
  xp_delta: number;
  reason: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ReputationEvent {
  id: string;
  user_id: string;
  event_type: string;
  score_delta: number;
  source_id?: string;
  reason: string;
  created_at: string;
}

export type VerificationMethod =
  | 'RECIPIENT_CONFIRMATION'
  | 'USER_EVIDENCE'
  | 'URL_CHECK'
  | 'PLATFORM_API'
  | 'MANUAL_REVIEW'
  | 'AUTOMATED_SIGNAL'
  | 'MULTI_SIGNAL';

export type EvidenceType =
  | 'SCREENSHOT'
  | 'URL'
  | 'TEXT_CONFIRMATION'
  | 'PLATFORM_REFERENCE'
  | 'MANUAL_REVIEW';

export interface SupportVerification {
  id: string;
  task_id: string;
  giver_id: string;
  receiver_id: string;
  campaign_id?: string;
  platform: SocialPlatformKey;
  verification_method: VerificationMethod;
  verification_strength: number; // 1 to 5
  evidence_type?: EvidenceType;
  evidence_url?: string;
  evidence_note?: string;
  stars: number;
  feedback?: string;
  is_certified: boolean;
  certified_at: string;
}

export interface Badge {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'MILESTONE' | 'QUALITY' | 'DIVERSITY' | 'SPECIAL';
  created_at?: string;
  awarded_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_code: string;
  awarded_at: string;
}

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_HELPER'
  | 'RESOLVED_RECIPIENT'
  | 'REJECTED'
  | 'ESCALATED';

export interface Dispute {
  id: string;
  task_id: string;
  reporter_id: string;
  accused_id: string;
  reason: string;
  evidence_url?: string;
  status: DisputeStatus;
  resolution_notes?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
  reporter_name?: string;
  accused_name?: string;
}

export interface DisputeEvent {
  id: string;
  dispute_id: string;
  actor_id?: string;
  action: string;
  notes?: string;
  created_at: string;
}

export interface SystemConfigItem {
  key: string;
  value: any;
  description?: string;
  updated_at?: string;
}


