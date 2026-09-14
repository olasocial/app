-- ============================================================
-- OLA SOCIAL - ESQUEMA OFICIAL SUPABASE (PRODUCCIÓN REAL 2026)
-- ADMINISTRADOR ÚNICO INICIAL: v19629049@gmail.com
-- FUENTE ÚNICA DE VERDAD: Supabase PostgreSQL + Auth + RLS + Realtime
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TABLA: public.user_roles
-- Autoridad basada en UUID de auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_roles_user_id UNIQUE (user_id)
);

-- ============================================================
-- 2. TABLA: public.profiles
-- Perfil central del usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'USER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED')),
  bio TEXT,
  risk_level TEXT DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  reputation_score NUMERIC(6,1) NOT NULL DEFAULT 100.0,
  level_number INT NOT NULL DEFAULT 1,
  experience_points INT NOT NULL DEFAULT 0,
  hugs_verified INT NOT NULL DEFAULT 0,
  stars_count INT NOT NULL DEFAULT 0,
  unique_users_helped INT NOT NULL DEFAULT 0,
  unique_platforms_supported INT NOT NULL DEFAULT 0,
  unique_campaigns_completed INT NOT NULL DEFAULT 0,
  presence_status TEXT DEFAULT 'ONLINE' CHECK (presence_status IN ('ONLINE', 'BUSY', 'OFFLINE')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TABLA: public.level_definitions (10 Niveles Oficiales)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.level_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number INT NOT NULL UNIQUE CHECK (level_number BETWEEN 1 AND 10),
  name TEXT NOT NULL,
  description TEXT,
  xp_required INT NOT NULL DEFAULT 0,
  verified_supports_required INT NOT NULL DEFAULT 0,
  unique_users_required INT NOT NULL DEFAULT 0,
  minimum_reputation NUMERIC(6,1) NOT NULL DEFAULT 0.0,
  minimum_quality_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  perks TEXT[] DEFAULT ARRAY[]::TEXT[],
  badge_reward_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibilidad: vista o tabla level_requirements
CREATE TABLE IF NOT EXISTS public.level_requirements (
  level_number INT PRIMARY KEY CHECK (level_number BETWEEN 1 AND 10),
  level_name TEXT NOT NULL,
  min_xp INT NOT NULL,
  min_verified_supports INT NOT NULL,
  min_reputation NUMERIC(6,1) NOT NULL,
  min_unique_users INT DEFAULT 0,
  min_unique_platforms INT DEFAULT 0,
  perks TEXT[] DEFAULT ARRAY[]::TEXT[],
  badge_reward_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de los 10 Niveles Oficiales
INSERT INTO public.level_definitions (level_number, name, description, xp_required, verified_supports_required, unique_users_required, minimum_reputation, minimum_quality_score, perks)
VALUES
  (1, 'NUEVO', 'Paso inicial en la comunidad OLA SOCIAL.', 0, 0, 0, 0.0, 0.0, ARRAY['Acceso a Lobby de ayuda mutua', '1 campaña activa']),
  (2, 'COLABORADOR', 'Primeros abrazos legítimos compartidos.', 100, 3, 2, 100.0, 10.0, ARRAY['Insignia de Colaborador', 'Acceso a tareas prioritarias']),
  (3, 'APOYADOR', 'Consistencia demostrada y reputación sólida.', 300, 10, 3, 200.0, 20.0, ARRAY['Hasta 3 campañas activas', 'Prioridad de revisión']),
  (4, 'IMPULSOR', 'Crecimiento activo y colaboración confiable.', 650, 20, 5, 350.0, 30.0, ARRAY['Mayor visibilidad en el lobby', 'Participación en batallas']),
  (5, 'REFERENTE', 'Pilar comunitario de validación honesta.', 1200, 40, 10, 500.0, 40.0, ARRAY['Distintivo Referente dorado', 'Hasta 5 campañas activas']),
  (6, 'GUÍA', 'Orientador experimentado en diversas redes.', 2000, 70, 15, 650.0, 50.0, ARRAY['Voto consultivo', 'Multiplicador leve de diversidad']),
  (7, 'EMBAJADOR', 'Representante de los valores de OLA SOCIAL.', 3200, 110, 25, 750.0, 60.0, ARRAY['Insignia de Embajador oficial', 'Acceso anticipado']),
  (8, 'LÍDER COMUNITARIO', 'Liderazgo moral y alta tasa de respuesta.', 5000, 160, 40, 825.0, 70.0, ARRAY['Prioridad máxima en ranking', 'Participación en arbitrajes']),
  (9, 'MAESTRO DE APOYO', 'Maestría en colaboración sin artificios.', 7500, 225, 60, 900.0, 80.0, ARRAY['Distintivo Maestro de Apoyo', 'Límites ampliados']),
  (10, 'PULSO SOCIAL', 'Cúspide de la fraternidad digital.', 10500, 300, 80, 950.0, 90.0, ARRAY['Máximo prestigio comunitario', 'Salón de Honor perpetuo'])
ON CONFLICT (level_number) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  xp_required = EXCLUDED.xp_required,
  verified_supports_required = EXCLUDED.verified_supports_required,
  unique_users_required = EXCLUDED.unique_users_required,
  minimum_reputation = EXCLUDED.minimum_reputation,
  minimum_quality_score = EXCLUDED.minimum_quality_score,
  perks = EXCLUDED.perks,
  updated_at = NOW();

INSERT INTO public.level_requirements (level_number, level_name, min_xp, min_verified_supports, min_reputation, min_unique_users, min_unique_platforms, perks)
SELECT level_number, name, xp_required, verified_supports_required, minimum_reputation, unique_users_required, 1, perks
FROM public.level_definitions
ON CONFLICT (level_number) DO UPDATE SET
  level_name = EXCLUDED.level_name,
  min_xp = EXCLUDED.min_xp,
  min_verified_supports = EXCLUDED.min_verified_supports,
  min_reputation = EXCLUDED.min_reputation,
  min_unique_users = EXCLUDED.min_unique_users,
  min_unique_platforms = EXCLUDED.min_unique_platforms,
  perks = EXCLUDED.perks;

-- ============================================================
-- 4. TABLA: public.experience_ledger
-- Inmutable, Append-Only con Idempotencia estricta
-- ============================================================
CREATE TABLE IF NOT EXISTS public.experience_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('TASK_VERIFICATION', 'BONUS', 'BADGE', 'COMMUNITY', 'ADMIN_ADJUSTMENT')),
  source_id TEXT NOT NULL,
  xp_delta INT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_experience_ledger_idempotency UNIQUE (user_id, source_type, source_id)
);

-- ============================================================
-- 5. TABLA: public.user_progress
-- Progreso consolidado por usuario (1:1 con auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level_number INT NOT NULL DEFAULT 1 CHECK (level_number BETWEEN 1 AND 10),
  experience_points INT NOT NULL DEFAULT 0,
  verified_support_count INT NOT NULL DEFAULT 0,
  unique_users_helped INT NOT NULL DEFAULT 0,
  unique_platforms_supported INT NOT NULL DEFAULT 0,
  quality_score NUMERIC(5,2) NOT NULL DEFAULT 100.0,
  current_reputation NUMERIC(6,1) NOT NULL DEFAULT 100.0,
  last_level_up_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABLAS: public.reputation_events & public.reputation_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  score_delta NUMERIC(6,1) NOT NULL,
  source_id TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reputation_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(6,1) NOT NULL DEFAULT 100.0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  ratings_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TABLA: public.campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id TEXT PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  creator_avatar TEXT,
  platform TEXT NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_profile_url TEXT NOT NULL,
  target_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'PAUSED', 'FLAGGED', 'CANCELLED')),
  compliance_status TEXT NOT NULL DEFAULT 'ALLOWED' CHECK (compliance_status IN ('ALLOWED', 'WARNING', 'BLOCKED', 'RESTRICTED')),
  current_participants INT DEFAULT 0,
  max_participants INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- 8. TABLA: public.campaign_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaign_tasks (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  creator_avatar TEXT,
  platform TEXT NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  target_profile_url TEXT NOT NULL,
  target_username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFICATION_PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'DISPUTED')),
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  evidence_url TEXT,
  evidence_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'NORMAL',
  risk_level TEXT DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. TABLA: public.verified_supports
-- Abrazos Certificados Oficiales
-- ============================================================
CREATE TABLE IF NOT EXISTS public.verified_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  helper_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  action_type TEXT NOT NULL,
  verification_method TEXT NOT NULL DEFAULT 'RECIPIENT_CONFIRMATION' CHECK (verification_method IN ('RECIPIENT_CONFIRMATION', 'USER_EVIDENCE', 'URL_CHECK', 'PLATFORM_API', 'MANUAL_REVIEW', 'MULTI_SIGNAL')),
  verification_strength TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (verification_strength IN ('LOW', 'MEDIUM', 'CONFIRMED', 'HIGH_TRUST')),
  status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'DISPUTED', 'REVOKED')),
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_verified_supports_task_helper UNIQUE (task_id, helper_user_id),
  CONSTRAINT chk_helper_diff_recipient CHECK (helper_user_id != recipient_user_id)
);

-- ============================================================
-- 10. TABLA: public.support_evidence
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verified_support_id UUID REFERENCES public.verified_supports(id) ON DELETE SET NULL,
  task_id TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL DEFAULT 'URL' CHECK (evidence_type IN ('URL', 'SCREENSHOT', 'TEXT_NOTE')),
  storage_path TEXT,
  external_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'VERIFIED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. TABLA: public.support_verifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  validator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result BOOLEAN NOT NULL,
  verification_method TEXT NOT NULL DEFAULT 'RECIPIENT_CONFIRMATION',
  confidence NUMERIC(4,2) DEFAULT 1.0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. TABLA: public.task_ratings (1 a 5 estrellas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  giver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_rating_not_self CHECK (giver_id != receiver_id)
);

-- ============================================================
-- 13. TABLAS: public.support_disputes & public.support_dispute_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accused_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED_HELPER', 'RESOLVED_RECIPIENT', 'RESOLVED', 'ESCALATED', 'REJECTED')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_dispute_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.support_disputes(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. TABLAS: public.fraud_events & public.risk_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fraud_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.risk_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  flags_count INT NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  last_assessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. TABLAS: public.badges & public.user_badges
-- ============================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_badges UNIQUE (user_id, badge_id)
);

-- Badges Iniciales
INSERT INTO public.badges (code, name, description, icon_name, category)
VALUES
  ('PRIMER_ABRAZO', 'Primer Abrazo', 'Completó su primera ayuda legítima en la comunidad.', 'Heart', 'MILESTONE'),
  ('10_COLABORACIONES', 'Colaborador Frecuente', 'Completó 10 ayudas certificadas.', 'ShieldCheck', 'SUPPORT'),
  ('50_COLABORACIONES', 'Colaborador Experto', 'Alcanzó 50 abrazos verificados sin fraudes.', 'Award', 'SUPPORT'),
  ('100_COLABORACIONES', 'Centurión Solidario', '100 acciones de apoyo mutuo certificadas.', 'Trophy', 'HONOR'),
  ('COLABORADOR_CONFIABLE', 'Confianza Absoluta', 'Reputación superior a 500 sin amonestaciones.', 'CheckCircle2', 'REPUTATION'),
  ('MULTIPLATAFORMA', 'Polinizador Social', 'Apoyó creadores en al menos 4 plataformas distintas.', 'Share2', 'DIVERSITY'),
  ('AYUDA_A_NUEVOS', 'Mano Amiga', 'Apoyó a creadores en sus primeros días.', 'Sparkles', 'COMMUNITY'),
  ('REFERENTE', 'Referente Oficial', 'Alcanzó el Nivel 5 de OLA SOCIAL.', 'Crown', 'LEVEL')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 16. TABLAS: public.admin_audit_log & public.moderation_actions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_hash TEXT DEFAULT 'server_secure',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('WARN', 'RATE_LIMIT', 'SUSPEND', 'BAN', 'UNBAN')),
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. TABLA: public.platform_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('anti_fraud_limits', '{"max_mutual_supports_24h": 2, "max_supports_per_day": 30, "min_seconds_between_tasks": 45}'::jsonb, 'Límites comunitarios para prevenir actividad circular y bots'),
  ('xp_rewards', '{"task_verified_xp": 30, "reputation_delta": 2.5, "streak_bonus_xp": 15}'::jsonb, 'Reglas centrales de experiencia y reputación'),
  ('primary_super_admin', '{"email": "v19629049@gmail.com", "role": "SUPER_ADMIN", "status": "ACTIVE"}'::jsonb, 'Configuración canónica del Super Administrador principal')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================================
-- 18. TABLA: public.social_profiles & public.notifications & public.battle_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_profiles (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  public_metrics JSONB DEFAULT '{}'::jsonb,
  verification_status TEXT DEFAULT 'AUTO_CHECK',
  is_primary BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  normalized_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_social_profile_platform_user UNIQUE (user_id, platform, username)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.battle_events (
  id TEXT PRIMARY KEY,
  creator1_id TEXT NOT NULL,
  creator1_name TEXT NOT NULL,
  creator1_avatar TEXT,
  creator1_pledges INT DEFAULT 0,
  creator2_id TEXT NOT NULL,
  creator2_name TEXT NOT NULL,
  creator2_avatar TEXT,
  creator2_pledges INT DEFAULT 0,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. REGLA CRÍTICA Y PROTECCIÓN INMUTABLE DEL SUPER ADMIN
-- Administrador único: v19629049@gmail.com
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_primary_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(NEW.email) = 'v19629049@gmail.com' THEN
    NEW.role := 'SUPER_ADMIN';
    NEW.status := 'ACTIVE';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_primary_admin_role ON public.profiles;
CREATE TRIGGER trigger_primary_admin_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_primary_admin_role();

-- Proteger contra DELETE, BAN, SUSPEND o ROLE DOWNGRADE
CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(OLD.email) = 'v19629049@gmail.com' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Operación denegada: No es posible eliminar al Super Administrador principal (v19629049@gmail.com).';
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.role != 'SUPER_ADMIN' OR NEW.status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Operación denegada: No es posible degradar ni suspender al Super Administrador principal (v19629049@gmail.com).';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_super_admin ON public.profiles;
CREATE TRIGGER trigger_protect_super_admin
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin();

-- Bootstrap función de Super Admin
CREATE OR REPLACE FUNCTION public.bootstrap_primary_super_admin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_uid UUID;
  v_result JSONB;
BEGIN
  SELECT id INTO v_admin_uid
  FROM auth.users
  WHERE LOWER(email) = 'v19629049@gmail.com'
  LIMIT 1;

  IF v_admin_uid IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'WAITING_FIRST_OAUTH',
      'email', 'v19629049@gmail.com',
      'message', 'El usuario v19629049@gmail.com aún no ha iniciado sesión por primera vez en auth.users. El trigger automático lo elevará a SUPER_ADMIN de forma inmediata.'
    );
  END IF;

  -- Upsert perfil
  INSERT INTO public.profiles (
    id, email, username, display_name, role, status, reputation_score, level_number, experience_points
  )
  VALUES (
    v_admin_uid,
    'v19629049@gmail.com',
    'superadmin',
    'Administrador Principal OLA',
    'SUPER_ADMIN',
    'ACTIVE',
    1000.0,
    10,
    10500
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'SUPER_ADMIN',
    status = 'ACTIVE',
    updated_at = NOW();

  -- Upsert user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin_uid, 'SUPER_ADMIN')
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'SUPER_ADMIN',
    updated_at = NOW();

  -- Upsert user_progress
  INSERT INTO public.user_progress (user_id, level_number, experience_points, current_reputation)
  VALUES (v_admin_uid, 10, 10500, 1000.0)
  ON CONFLICT (user_id) DO UPDATE SET
    level_number = 10,
    experience_points = 10500,
    current_reputation = 1000.0,
    updated_at = NOW();

  -- Registrar en log
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details)
  VALUES (v_admin_uid, 'v19629049@gmail.com', 'BOOTSTRAP_SUPER_ADMIN', 'USER', v_admin_uid::text, 'Super Admin asegurado e inicializado en base de datos');

  RETURN jsonb_build_object(
    'status', 'SUCCESS',
    'user_id', v_admin_uid,
    'email', 'v19629049@gmail.com',
    'role', 'SUPER_ADMIN'
  );
END;
$$;

-- Trigger para auth.users para bootstrap en cuanto se registre
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin BOOLEAN;
  v_role TEXT;
BEGIN
  v_is_super_admin := LOWER(NEW.email) = 'v19629049@gmail.com';
  v_role := CASE WHEN v_is_super_admin THEN 'SUPER_ADMIN' ELSE 'USER' END;

  -- Crear Perfil
  INSERT INTO public.profiles (
    id, email, username, display_name, avatar_url, role, status, reputation_score, level_number, experience_points
  )
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(NEW.email, '@', 1),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    v_role,
    'ACTIVE',
    CASE WHEN v_is_super_admin THEN 1000.0 ELSE 100.0 END,
    CASE WHEN v_is_super_admin THEN 10 ELSE 1 END,
    CASE WHEN v_is_super_admin THEN 10500 ELSE 0 END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN v_is_super_admin THEN 'SUPER_ADMIN' ELSE profiles.role END,
    status = CASE WHEN v_is_super_admin THEN 'ACTIVE' ELSE profiles.status END;

  -- Crear Rol
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = CASE WHEN v_is_super_admin THEN 'SUPER_ADMIN' ELSE user_roles.role END;

  -- Crear Progreso
  INSERT INTO public.user_progress (user_id, level_number, experience_points, current_reputation)
  VALUES (NEW.id, CASE WHEN v_is_super_admin THEN 10 ELSE 1 END, CASE WHEN v_is_super_admin THEN 10500 ELSE 0 END, CASE WHEN v_is_super_admin THEN 1000.0 ELSE 100.0 END)
  ON CONFLICT (user_id) DO NOTHING;

  -- Crear Reputation Score
  INSERT INTO public.reputation_scores (user_id, score)
  VALUES (NEW.id, CASE WHEN v_is_super_admin THEN 1000.0 ELSE 100.0 END)
  ON CONFLICT (user_id) DO NOTHING;

  -- Crear Risk Score
  INSERT INTO public.risk_scores (user_id, risk_score, flags_count, risk_level)
  VALUES (NEW.id, 0.0, 0, 'LOW')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- 20. RPC TRANSACCIONAL: complete_verified_support()
-- Valida autenticación, tarea, antifraude, otorga XP e idempotencia
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_verified_support(
  p_task_id TEXT,
  p_approved BOOLEAN,
  p_reason TEXT DEFAULT NULL,
  p_stars INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_super_admin BOOLEAN;
  v_task RECORD;
  v_helper_id UUID;
  v_recipient_id UUID;
  v_recent_mutual_count INT;
  v_new_xp INT;
  v_new_rep NUMERIC(6,1);
  v_new_supports INT;
  v_new_level INT;
  v_helper_progress RECORD;
BEGIN
  -- 1. Comprobar autenticación
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado: se requiere sesión activa para validar tareas.';
  END IF;

  -- Comprobar si es Super Admin
  SELECT (role = 'SUPER_ADMIN') INTO v_is_super_admin
  FROM public.user_roles
  WHERE user_id = v_caller_id;

  -- 2. Comprobar tarea
  SELECT * INTO v_task
  FROM public.campaign_tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarea no encontrada: %', p_task_id;
  END IF;

  v_helper_id := v_task.assigned_user_id;
  v_recipient_id := v_task.creator_id;

  IF v_helper_id IS NULL THEN
    RAISE EXCEPTION 'La tarea no tiene un ayudante asignado.';
  END IF;

  -- 3. Comprobar permisos del validador: debe ser el creador de la campaña o Super Admin
  IF v_caller_id != v_recipient_id AND NOT COALESCE(v_is_super_admin, FALSE) THEN
    RAISE EXCEPTION 'Permiso denegado: Únicamente el receptor del apoyo o un administrador pueden certificar la tarea.';
  END IF;

  -- 4. No permitir auto-validación
  IF v_caller_id = v_helper_id THEN
    RAISE EXCEPTION 'Auto-validación prohibida: un usuario no puede certificarse a sí mismo.';
  END IF;

  -- 5. Comprobar estado de la tarea
  IF v_task.status NOT IN ('SUBMITTED', 'VERIFICATION_PENDING', 'IN_PROGRESS', 'DISPUTED') THEN
    RAISE EXCEPTION 'Estado de tarea incompatible para validación: %', v_task.status;
  END IF;

  -- 6. Registrar en support_verifications
  INSERT INTO public.support_verifications (
    task_id, validator_user_id, result, verification_method, confidence, reason
  )
  VALUES (
    p_task_id, v_caller_id, p_approved, 'RECIPIENT_CONFIRMATION', 1.0, COALESCE(p_reason, 'Certificación por receptor')
  );

  -- Si es RECHAZADO:
  IF NOT p_approved THEN
    UPDATE public.campaign_tasks
    SET status = 'REJECTED', completed_at = NOW()
    WHERE id = p_task_id;

    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      v_helper_id,
      'TASK_REJECTED',
      'Abrazo no confirmado',
      'El receptor indicó que no pudo verificar la interacción: ' || COALESCE(p_reason, 'Evidencia no encontrada')
    );

    RETURN jsonb_build_object(
      'success', TRUE,
      'status', 'REJECTED',
      'message', 'El abrazo ha sido marcado como no verificado.'
    );
  END IF;

  -- 7. REGLA ANTIFRAUDE / ANTI-CÍRCULO
  -- Contar cuántas veces v_helper_id ayudó a v_recipient_id en las últimas 24 horas
  SELECT COUNT(*) INTO v_recent_mutual_count
  FROM public.verified_supports
  WHERE helper_user_id = v_helper_id
    AND recipient_user_id = v_recipient_id
    AND created_at >= NOW() - INTERVAL '24 hours';

  IF v_recent_mutual_count >= 5 AND NOT COALESCE(v_is_super_admin, FALSE) THEN
    -- Registrar evento de riesgo pero no crashear
    INSERT INTO public.fraud_events (user_id, event_type, severity, description, evidence)
    VALUES (
      v_helper_id,
      'CIRCULAR_ACTIVITY_DETECTED',
      'MEDIUM',
      'Interacción reiterada entre los mismos 2 usuarios en 24h superó el umbral seguro.',
      jsonb_build_object('recipient_id', v_recipient_id, 'task_id', p_task_id, 'count_24h', v_recent_mutual_count)
    );
  END IF;

  -- 8. Registrar Abrazo Certificado (verified_supports) con Idempotencia
  INSERT INTO public.verified_supports (
    task_id, helper_user_id, recipient_user_id, platform, action_type,
    verification_method, verification_strength, status, verified_at, verified_by
  )
  VALUES (
    p_task_id, v_helper_id, v_recipient_id, v_task.platform, v_task.action_type,
    'RECIPIENT_CONFIRMATION', 'CONFIRMED', 'VERIFIED', NOW(), v_caller_id
  )
  ON CONFLICT (task_id, helper_user_id) DO NOTHING;

  -- 9. Registrar XP en experience_ledger con Idempotencia estricta
  INSERT INTO public.experience_ledger (
    user_id, source_type, source_id, xp_delta, reason, metadata
  )
  VALUES (
    v_helper_id,
    'TASK_VERIFICATION',
    p_task_id,
    30,
    'Abrazo Certificado hacia ' || v_task.creator_name,
    jsonb_build_object('platform', v_task.platform, 'action_type', v_task.action_type)
  )
  ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

  -- 10. Registrar evento de reputación
  INSERT INTO public.reputation_events (
    user_id, event_type, score_delta, source_id, reason
  )
  VALUES (
    v_helper_id,
    'TASK_VERIFIED_HUG',
    2.5,
    p_task_id,
    'Certificación de abrazo legítimo con 5 estrellas'
  );

  -- 11. Registrar Rating
  INSERT INTO public.task_ratings (
    task_id, giver_id, receiver_id, stars, feedback
  )
  VALUES (
    p_task_id, v_helper_id, v_recipient_id, LEAST(5, GREATEST(1, p_stars)), COALESCE(p_reason, 'Abrazo certificado con excelencia')
  )
  ON CONFLICT (task_id) DO NOTHING;

  -- 12. Actualizar user_progress del ayudante
  INSERT INTO public.user_progress (user_id, experience_points, verified_support_count, current_reputation)
  VALUES (v_helper_id, 30, 1, 102.5)
  ON CONFLICT (user_id) DO UPDATE SET
    experience_points = public.user_progress.experience_points + 30,
    verified_support_count = public.user_progress.verified_support_count + 1,
    current_reputation = LEAST(1000.0, public.user_progress.current_reputation + 2.5),
    updated_at = NOW();

  -- Obtener progreso consolidado
  SELECT * INTO v_helper_progress
  FROM public.user_progress
  WHERE user_id = v_helper_id;

  -- 13. Recalcular nivel según level_definitions
  SELECT COALESCE(MAX(level_number), 1) INTO v_new_level
  FROM public.level_definitions
  WHERE is_active = TRUE
    AND xp_required <= v_helper_progress.experience_points
    AND verified_supports_required <= v_helper_progress.verified_support_count
    AND minimum_reputation <= v_helper_progress.current_reputation;

  IF v_new_level > v_helper_progress.level_number THEN
    UPDATE public.user_progress
    SET level_number = v_new_level, last_level_up_at = NOW()
    WHERE user_id = v_helper_id;

    -- Notificar ascenso de nivel
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      v_helper_id,
      'LEVEL_UP',
      '¡Subiste de Nivel!',
      'Felicitaciones, has alcanzado el Nivel ' || v_new_level || ' en OLA SOCIAL.'
    );
  END IF;

  -- 14. Actualizar tabla public.profiles
  UPDATE public.profiles
  SET experience_points = v_helper_progress.experience_points,
      hugs_verified = v_helper_progress.verified_support_count,
      stars_count = profiles.stars_count + LEAST(5, GREATEST(1, p_stars)),
      reputation_score = v_helper_progress.current_reputation,
      level_number = GREATEST(profiles.level_number, v_new_level),
      updated_at = NOW()
  WHERE id = v_helper_id;

  -- 15. Otorgar Badge de Primer Abrazo si aplica
  IF v_helper_progress.verified_support_count = 1 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT v_helper_id, id FROM public.badges WHERE code = 'PRIMER_ABRAZO'
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  -- 16. Actualizar estado de la tarea
  UPDATE public.campaign_tasks
  SET status = 'VERIFIED', completed_at = NOW()
  WHERE id = p_task_id;

  -- 17. Notificar al ayudante
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    v_helper_id,
    'TASK_VERIFIED',
    '¡Abrazo Certificado!',
    'Tu apoyo a ' || v_task.creator_name || ' ha sido certificado. Has ganado +30 XP y +2.5 puntos de reputación.'
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'status', 'VERIFIED',
    'xp_awarded', 30,
    'reputation_delta', 2.5,
    'new_level', v_new_level,
    'message', '¡Abrazo validado y experiencia concedida exitosamente!'
  );
END;
$$;

-- ============================================================
-- 21. ROW LEVEL SECURITY (RLS) POLÍTICAS ESTRICTAS
-- ============================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_dispute_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_events ENABLE ROW LEVEL SECURITY;

-- Helper función: Comprobar si el usuario actual es Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN'
  );
$$;

-- PROFILES
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone"
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile basics" ON public.profiles;
CREATE POLICY "Users can update own profile basics"
ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR public.is_super_admin()
) WITH CHECK (
  auth.uid() = id OR public.is_super_admin()
);

-- USER_ROLES
DROP POLICY IF EXISTS "Roles readable by authenticated users" ON public.user_roles;
CREATE POLICY "Roles readable by authenticated users"
ON public.user_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only super admin can modify roles" ON public.user_roles;
CREATE POLICY "Only super admin can modify roles"
ON public.user_roles FOR ALL USING (public.is_super_admin());

-- LEVEL_DEFINITIONS
DROP POLICY IF EXISTS "Levels readable by everyone" ON public.level_definitions;
CREATE POLICY "Levels readable by everyone"
ON public.level_definitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only super admin can modify levels" ON public.level_definitions;
CREATE POLICY "Only super admin can modify levels"
ON public.level_definitions FOR ALL USING (public.is_super_admin());

-- LEVEL_REQUIREMENTS
DROP POLICY IF EXISTS "Level requirements readable by everyone" ON public.level_requirements;
CREATE POLICY "Level requirements readable by everyone"
ON public.level_requirements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only super admin can modify level requirements" ON public.level_requirements;
CREATE POLICY "Only super admin can modify level requirements"
ON public.level_requirements FOR ALL USING (public.is_super_admin());

-- EXPERIENCE_LEDGER (Inmutable - solo insertable vía RPC / super admin)
DROP POLICY IF EXISTS "Users can read own experience ledger" ON public.experience_ledger;
CREATE POLICY "Users can read own experience ledger"
ON public.experience_ledger FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Only super admin can insert experience ledger directly" ON public.experience_ledger;
CREATE POLICY "Only super admin can insert experience ledger directly"
ON public.experience_ledger FOR INSERT WITH CHECK (public.is_super_admin());

-- USER_PROGRESS
DROP POLICY IF EXISTS "Progress readable by everyone" ON public.user_progress;
CREATE POLICY "Progress readable by everyone"
ON public.user_progress FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only system and super admin can modify user progress" ON public.user_progress;
CREATE POLICY "Only system and super admin can modify user progress"
ON public.user_progress FOR ALL USING (public.is_super_admin());

-- REPUTATION_EVENTS
DROP POLICY IF EXISTS "Users can read own reputation events" ON public.reputation_events;
CREATE POLICY "Users can read own reputation events"
ON public.reputation_events FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin());

-- REPUTATION_SCORES
DROP POLICY IF EXISTS "Reputation scores readable by everyone" ON public.reputation_scores;
CREATE POLICY "Reputation scores readable by everyone"
ON public.reputation_scores FOR SELECT USING (true);

-- CAMPAIGNS
DROP POLICY IF EXISTS "Campaigns readable by everyone" ON public.campaigns;
CREATE POLICY "Campaigns readable by everyone"
ON public.campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can create campaigns"
ON public.campaigns FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators or super admin can update campaigns" ON public.campaigns;
CREATE POLICY "Creators or super admin can update campaigns"
ON public.campaigns FOR UPDATE TO authenticated
USING (auth.uid() = creator_id OR public.is_super_admin());

-- CAMPAIGN_TASKS
DROP POLICY IF EXISTS "Tasks readable by everyone" ON public.campaign_tasks;
CREATE POLICY "Tasks readable by everyone"
ON public.campaign_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can insert tasks" ON public.campaign_tasks;
CREATE POLICY "Creators can insert tasks"
ON public.campaign_tasks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = creator_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Assigned users or creators or super admin can update tasks" ON public.campaign_tasks;
CREATE POLICY "Assigned users or creators or super admin can update tasks"
ON public.campaign_tasks FOR UPDATE TO authenticated
USING (
  auth.uid() = assigned_user_id OR
  auth.uid() = creator_id OR
  public.is_super_admin() OR
  (status = 'AVAILABLE' AND assigned_user_id IS NULL)
);

-- VERIFIED_SUPPORTS
DROP POLICY IF EXISTS "Verified supports readable by everyone" ON public.verified_supports;
CREATE POLICY "Verified supports readable by everyone"
ON public.verified_supports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only super admin can direct insert verified supports" ON public.verified_supports;
CREATE POLICY "Only super admin can direct insert verified supports"
ON public.verified_supports FOR INSERT WITH CHECK (public.is_super_admin());

-- SUPPORT_EVIDENCE
DROP POLICY IF EXISTS "Evidence readable by involved users or admin" ON public.support_evidence;
CREATE POLICY "Evidence readable by involved users or admin"
ON public.support_evidence FOR SELECT TO authenticated
USING (auth.uid() = submitted_by OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can insert evidence for their tasks" ON public.support_evidence;
CREATE POLICY "Users can insert evidence for their tasks"
ON public.support_evidence FOR INSERT TO authenticated
WITH CHECK (auth.uid() = submitted_by);

-- SUPPORT_VERIFICATIONS
DROP POLICY IF EXISTS "Verifications readable by involved users or admin" ON public.support_verifications;
CREATE POLICY "Verifications readable by involved users or admin"
ON public.support_verifications FOR SELECT TO authenticated
USING (auth.uid() = validator_user_id OR public.is_super_admin());

-- TASK_RATINGS
DROP POLICY IF EXISTS "Ratings readable by everyone" ON public.task_ratings;
CREATE POLICY "Ratings readable by everyone"
ON public.task_ratings FOR SELECT USING (true);

-- SUPPORT_DISPUTES
DROP POLICY IF EXISTS "Disputes readable by involved parties or admin" ON public.support_disputes;
CREATE POLICY "Disputes readable by involved parties or admin"
ON public.support_disputes FOR SELECT TO authenticated
USING (auth.uid() = reporter_id OR auth.uid() = accused_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can insert disputes" ON public.support_disputes;
CREATE POLICY "Users can insert disputes"
ON public.support_disputes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Only super admin can resolve disputes" ON public.support_disputes;
CREATE POLICY "Only super admin can resolve disputes"
ON public.support_disputes FOR UPDATE TO authenticated
USING (public.is_super_admin());

-- FRAUD_EVENTS
DROP POLICY IF EXISTS "Only admins can read fraud events" ON public.fraud_events;
CREATE POLICY "Only admins can read fraud events"
ON public.fraud_events FOR SELECT TO authenticated
USING (public.is_super_admin());

DROP POLICY IF EXISTS "Only admins can update fraud events" ON public.fraud_events;
CREATE POLICY "Only admins can update fraud events"
ON public.fraud_events FOR UPDATE TO authenticated
USING (public.is_super_admin());

-- BADGES
DROP POLICY IF EXISTS "Badges readable by everyone" ON public.badges;
CREATE POLICY "Badges readable by everyone"
ON public.badges FOR SELECT USING (true);

-- USER_BADGES
DROP POLICY IF EXISTS "User badges readable by everyone" ON public.user_badges;
CREATE POLICY "User badges readable by everyone"
ON public.user_badges FOR SELECT USING (true);

-- ADMIN_AUDIT_LOG
DROP POLICY IF EXISTS "Only super admin can read audit logs" ON public.admin_audit_log;
CREATE POLICY "Only super admin can read audit logs"
ON public.admin_audit_log FOR SELECT TO authenticated
USING (public.is_super_admin());

DROP POLICY IF EXISTS "Authenticated users can insert audit log through secure channels" ON public.admin_audit_log;
CREATE POLICY "Authenticated users can insert audit log through secure channels"
ON public.admin_audit_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = admin_id OR public.is_super_admin());

-- PLATFORM_SETTINGS
DROP POLICY IF EXISTS "Platform settings readable by authenticated" ON public.platform_settings;
CREATE POLICY "Platform settings readable by authenticated"
ON public.platform_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only super admin can modify platform settings" ON public.platform_settings;
CREATE POLICY "Only super admin can modify platform settings"
ON public.platform_settings FOR ALL USING (public.is_super_admin());

-- SOCIAL_PROFILES
DROP POLICY IF EXISTS "Social profiles readable by everyone" ON public.social_profiles;
CREATE POLICY "Social profiles readable by everyone"
ON public.social_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own social profiles" ON public.social_profiles;
CREATE POLICY "Users can manage own social profiles"
ON public.social_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin())
WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can read and update own notifications" ON public.notifications;
CREATE POLICY "Users can read and update own notifications"
ON public.notifications FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- BATTLE_EVENTS
DROP POLICY IF EXISTS "Battle events readable by everyone" ON public.battle_events;
CREATE POLICY "Battle events readable by everyone"
ON public.battle_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can pledge battle" ON public.battle_events;
CREATE POLICY "Authenticated users can pledge battle"
ON public.battle_events FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 22. REALTIME CONFIGURATION
-- Habilitar Realtime exclusivamente para las tablas necesarias
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verified_supports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reputation_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moderation_actions;
