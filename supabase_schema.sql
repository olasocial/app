-- ============================================================
-- OLA SOCIAL - FULL PRODUCTION SUPABASE POSTGRESQL SCHEMA (2026)
-- Conforme a Directivas: RLS, Auditoría Inmutable, Prevención Antifraude,
-- Super Admin Inmutable e Integración Real con Realtime
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'VERIFIED_USER', 'MODERATOR', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LIMITED', 'SUSPENDED', 'BANNED', 'DELETED')),
  language TEXT NOT NULL DEFAULT 'es',
  country TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  presence TEXT NOT NULL DEFAULT 'OFFLINE' CHECK (presence IN ('ONLINE', 'AWAY', 'OFFLINE')),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  reputation NUMERIC(5,2) DEFAULT 75.00,
  hugs_done INT DEFAULT 0,
  hugs_received INT DEFAULT 0,
  hugs_verified INT DEFAULT 0,
  stars_count INT DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 5.00,
  campaigns_created INT DEFAULT 0,
  campaigns_completed INT DEFAULT 0,
  confidence_level INT DEFAULT 80,
  user_level TEXT DEFAULT 'EXPLORADOR' CHECK (user_level IN ('NUEVO', 'EXPLORADOR', 'COLABORADOR', 'IMPULSOR', 'REFERENTE', 'EMBAJADOR')),
  warnings_count INT DEFAULT 0,
  is_18_confirmed BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Roles Table (Role separation)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('USER', 'VERIFIED_USER', 'MODERATOR', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3. Social Profiles (Locked once confirmed, duplicate prevention constraint)
CREATE TABLE IF NOT EXISTS public.social_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  followers_count INT,
  following_count INT,
  likes_count INT,
  public_metrics JSONB DEFAULT '{}'::jsonb,
  verification_status TEXT DEFAULT 'MANUAL_REVIEW' CHECK (verification_status IN ('MANUAL_REVIEW', 'AUTO_CHECK', 'VERIFIED', 'REJECTED')),
  is_primary BOOLEAN DEFAULT FALSE,
  normalized_identifier TEXT NOT NULL UNIQUE, -- platform::username
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  target_profile_url TEXT NOT NULL,
  target_username TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  campaign_type TEXT DEFAULT 'DISCOVERY' CHECK (campaign_type IN ('DISCOVERY', 'COMMUNITY', 'PROMOTION', 'COLLABORATION')),
  action_type TEXT NOT NULL,
  max_participants INT DEFAULT 50,
  current_participants INT DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'BLOCKED')),
  compliance_status TEXT DEFAULT 'ALLOWED' CHECK (compliance_status IN ('ALLOWED', 'LIMITED', 'REQUIRES_REVIEW', 'BLOCKED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 5. Tasks (Oportunidades de Abrazo)
CREATE TABLE IF NOT EXISTS public.campaign_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFICATION_PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
  priority TEXT DEFAULT 'NORMAL',
  risk_level TEXT DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  assigned_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  evidence_note TEXT,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 6. Task Ratings & Validations
CREATE TABLE IF NOT EXISTS public.task_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.campaign_tasks(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7b. Push Subscriptions (Multi-Device Web Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Admin Audit Log (Append-Only)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Fraud Events
CREATE TABLE IF NOT EXISTS public.fraud_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  pattern TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'CONFIRMED_FRAUD', 'DISMISSED')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Moderation Actions (Bans, suspensions, strikes)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('WARN', 'RATE_LIMIT', 'SUSPEND', 'BAN', 'UNBAN')),
  reason TEXT NOT NULL,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Creator Battles
CREATE TABLE IF NOT EXISTS public.battle_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  creator1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  required_hugs INT DEFAULT 1000000,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'DISPUTED')),
  creator1_pledges INT DEFAULT 0,
  creator2_pledges INT DEFAULT 0,
  scheduled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Donations to OLA SOCIAL
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  donor_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUPER ADMIN PROTECTION & PROMOTION TRIGGERS
-- ============================================================

-- Function: Ensure PRIMARY ADMIN (v19629049@gmail.com) always gets SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.handle_primary_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF LOWER(NEW.email) = 'v19629049@gmail.com' THEN
    NEW.role := 'SUPER_ADMIN';
    NEW.status := 'ACTIVE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_primary_admin_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_primary_admin_role();

-- Function: Block any attempt to delete, ban, or downgrade the Super Admin
CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF LOWER(OLD.email) = 'v19629049@gmail.com' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Operación denegada: No es posible eliminar la cuenta del Super Administrador principal (v19629049@gmail.com).';
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.role != 'SUPER_ADMIN' OR NEW.status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Operación denegada: No es posible degradar ni bloquear la cuenta del Super Administrador principal (v19629049@gmail.com).';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_protect_super_admin
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Helper function: is_admin (Hardened with p_user_id, search_path and dual-table authority check)
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.role IN ('ADMIN', 'SUPER_ADMIN')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_user_id AND p.role IN ('ADMIN', 'SUPER_ADMIN')
  );
END;
$$;

-- Privilege Escalation Prevention Trigger on Profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Non-admins cannot alter their own role, status, reputation, or levels
  IF NOT public.is_admin(auth.uid()) THEN
    IF NEW.role != OLD.role THEN
      RAISE EXCEPTION 'Escalación de privilegios denegada: no puedes modificar tu propio rol.';
    END IF;
    IF NEW.status != OLD.status AND OLD.status IN ('SUSPENDED', 'BANNED', 'LIMITED') THEN
      RAISE EXCEPTION 'Operación denegada: no puedes modificar tu estado de moderación.';
    END IF;
    IF NEW.reputation != OLD.reputation OR NEW.confidence_level != OLD.confidence_level THEN
      NEW.reputation := OLD.reputation;
      NEW.confidence_level := OLD.confidence_level;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Profiles Policies
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin update any profile" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));

-- Social Profiles Policies
CREATE POLICY "Social profiles public read" ON public.social_profiles FOR SELECT USING (true);
CREATE POLICY "User create own social profile" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User update own social profile" ON public.social_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User delete own social profile" ON public.social_profiles FOR DELETE USING (auth.uid() = user_id);

-- Campaigns Policies
CREATE POLICY "Campaigns public read" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Authenticated user create campaign" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator update own campaign" ON public.campaigns FOR UPDATE USING (auth.uid() = creator_id OR public.is_admin(auth.uid()));

-- Tasks Policies
CREATE POLICY "Tasks public read" ON public.campaign_tasks FOR SELECT USING (true);
CREATE POLICY "Creator insert task" ON public.campaign_tasks FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "User claim or update task" ON public.campaign_tasks FOR UPDATE USING (
  auth.uid() = assigned_user_id 
  OR assigned_user_id IS NULL 
  OR auth.uid() = creator_id 
  OR public.is_admin(auth.uid())
);

-- Notifications Policies
CREATE POLICY "Owner read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Push Subscriptions Policies
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin Audit Log (Append-Only, controlled insertion, strictly no UPDATE or DELETE)
CREATE POLICY "Admins read audit logs" ON public.admin_audit_log FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Audit logs insert controlled" ON public.admin_audit_log FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = admin_id);

-- Fraud Events Policies
CREATE POLICY "Admins read fraud events" ON public.fraud_events FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage fraud events" ON public.fraud_events FOR ALL USING (public.is_admin(auth.uid()));

-- Battles Policies
CREATE POLICY "Battles public read" ON public.battle_events FOR SELECT USING (true);
CREATE POLICY "Admin manage battles" ON public.battle_events FOR ALL USING (public.is_admin(auth.uid()));

-- Realtime Publication for live syncing
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_tasks, public.campaigns, public.notifications, public.battle_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ============================================================
-- 13. OFFICIAL LEVELS, CERTIFIED SUPPORTS, REPUTATION, BADGES & DISPUTES
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS level_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS experience_points INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(6,1) DEFAULT 100.0,
  ADD COLUMN IF NOT EXISTS unique_users_helped INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_platforms_supported INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_campaigns_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS community_score NUMERIC(5,2) DEFAULT 10.0;

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

INSERT INTO public.level_requirements (level_number, level_name, min_xp, min_verified_supports, min_reputation, min_unique_users, min_unique_platforms, perks)
VALUES
  (1, 'NUEVO', 0, 0, 0.0, 0, 0, ARRAY['Acceso básico a lobby', 'Creación de hasta 1 campaña activa']),
  (2, 'COLABORADOR', 100, 3, 100.0, 2, 1, ARRAY['Acceso a tareas prioritarias', 'Insignia de Colaborador en perfil']),
  (3, 'APOYADOR', 300, 10, 200.0, 3, 1, ARRAY['Hasta 3 campañas activas', 'Prioridad de revisión de evidencias']),
  (4, 'IMPULSOR', 650, 20, 350.0, 5, 2, ARRAY['Mayor visibilidad en el lobby', 'Participación en batallas comunitarias']),
  (5, 'REFERENTE', 1200, 40, 500.0, 10, 2, ARRAY['Distintivo Referente dorado', 'Hasta 5 campañas activas simultáneas']),
  (6, 'GUÍA', 2000, 70, 650.0, 15, 3, ARRAY['Capacidad de sugerir directrices', 'Multiplicador leve de diversidad']),
  (7, 'EMBAJADOR', 3200, 110, 750.0, 25, 3, ARRAY['Insignia de Embajador oficial', 'Acceso a canales de prueba anticipada']),
  (8, 'LÍDER COMUNITARIO', 5000, 160, 825.0, 40, 4, ARRAY['Prioridad máxima en ranking', 'Voto consultivo en disputas públicas']),
  (9, 'MAESTRO DE APOYO', 7500, 225, 900.0, 60, 4, ARRAY['Distintivo Maestro de Apoyo', 'Límites ampliados de campañas']),
  (10, 'PULSO SOCIAL', 10500, 300, 950.0, 80, 5, ARRAY['Máximo nivel de prestigio comunitario', 'Reconocimiento permanente en Salón de Honor'])
ON CONFLICT (level_number) DO UPDATE SET
  level_name = EXCLUDED.level_name,
  min_xp = EXCLUDED.min_xp,
  min_verified_supports = EXCLUDED.min_verified_supports,
  min_reputation = EXCLUDED.min_reputation,
  min_unique_users = EXCLUDED.min_unique_users,
  min_unique_platforms = EXCLUDED.min_unique_platforms,
  perks = EXCLUDED.perks;

CREATE TABLE IF NOT EXISTS public.experience_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID,
  xp_delta INT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_exp_user_source UNIQUE (user_id, source_type, source_id)
);

CREATE TABLE IF NOT EXISTS public.reputation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  score_delta NUMERIC(6,1) NOT NULL,
  source_id UUID,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.campaign_tasks(id) ON DELETE CASCADE UNIQUE,
  giver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('RECIPIENT_CONFIRMATION', 'USER_EVIDENCE', 'URL_CHECK', 'PLATFORM_API', 'MANUAL_REVIEW', 'AUTOMATED_SIGNAL', 'MULTI_SIGNAL')),
  verification_strength INT NOT NULL DEFAULT 3 CHECK (verification_strength BETWEEN 1 AND 5),
  evidence_type TEXT CHECK (evidence_type IN ('SCREENSHOT', 'URL', 'TEXT_CONFIRMATION', 'PLATFORM_REFERENCE', 'MANUAL_REVIEW')),
  evidence_url TEXT,
  evidence_note TEXT,
  stars INT NOT NULL DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  feedback TEXT,
  is_certified BOOLEAN NOT NULL DEFAULT TRUE,
  certified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badges (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MILESTONE', 'QUALITY', 'DIVERSITY', 'SPECIAL')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.badges (code, name, description, icon, category)
VALUES
  ('PRIMER_ABRAZO', 'Primer Abrazo', 'Completó exitosamente su primera colaboración certificada.', 'Sparkles', 'MILESTONE'),
  ('10_COLABORACIONES', '10 Colaboraciones', 'Alcanzó 10 ayudas verificadas por otros creadores.', 'Award', 'MILESTONE'),
  ('50_COLABORACIONES', '50 Colaboraciones', 'Consolidó 50 ayudas comunitarias verificadas.', 'Medal', 'MILESTONE'),
  ('100_COLABORACIONES', 'Centenario de Apoyo', 'Superó las 100 colaboraciones humanas certificadas.', 'Trophy', 'MILESTONE'),
  ('COLABORADOR_CONFIABLE', 'Colaborador Confiable', 'Mantiene un índice de validación superior al 95% y reputación > 300.', 'ShieldCheck', 'QUALITY'),
  ('APOYO_MULTIPLATAFORMA', 'Apoyo Multiplataforma', 'Ha ayudado en al menos 4 redes sociales distintas.', 'Globe', 'DIVERSITY'),
  ('AYUDA_A_NUEVOS_USUARIOS', 'Impulsor de Nuevos', 'Ayudó a más de 5 creadores de Nivel 1 a darse a conocer.', 'UserPlus', 'MILESTONE'),
  ('ALTA_CALIDAD', 'Alta Calidad', 'Recibió calificación perfecta de 5 estrellas en 20 o más tareas consecutivas.', 'Star', 'QUALITY'),
  ('BUENA_CONDUCTA', 'Buena Conducta', 'Cero alertas de fraude y comportamiento comunitario intachable.', 'HeartHandshake', 'QUALITY'),
  ('REFERENTE', 'Referente Comunitario', 'Alcanzó el Nivel 5 o superior con diversidad sobresaliente.', 'Flame', 'SPECIAL')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_badge UNIQUE (user_id, badge_code)
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.campaign_tasks(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accused_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED_HELPER', 'RESOLVED_RECIPIENT', 'REJECTED', 'ESCALATED')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.level_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read level_requirements" ON public.level_requirements FOR SELECT USING (true);
CREATE POLICY "Owner read experience_ledger" ON public.experience_ledger FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Owner read reputation_events" ON public.reputation_events FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Public read support_verifications" ON public.support_verifications FOR SELECT USING (true);
CREATE POLICY "Public read badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Public read user_badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Public read system_config" ON public.system_config FOR SELECT USING (true);
CREATE POLICY "Participants and admin read disputes" ON public.disputes FOR SELECT USING (
  auth.uid() = reporter_id OR auth.uid() = accused_id OR public.is_admin(auth.uid())
);

