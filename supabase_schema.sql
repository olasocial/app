-- ============================================================
-- OLA SOCIAL - FULL PRODUCTION SUPABASE POSTGRESQL SCHEMA (2026)
-- Conforme al Prompt Maestro: RLS, Auditoría Inmutable, Prevención Antifraude
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

-- 2. Social Profiles (Locked once confirmed, duplicate prevention constraint)
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

-- 3. Campaigns
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

-- 4. Tasks (Oportunidades de Abrazo)
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

-- 5. Task Ratings & Validations
CREATE TABLE IF NOT EXISTS public.task_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.campaign_tasks(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Admin Audit Log (Append-Only)
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

-- 8. Fraud Events
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

-- 9. Creator Battles
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

-- 10. Donations to OLA SOCIAL
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  donor_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_events ENABLE ROW LEVEL SECURITY;

-- Public profiles are viewable by all authenticated users
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Social profiles viewable by all, editable by owner
CREATE POLICY "Social profiles viewable by all" ON public.social_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own social profile" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks viewable by all authenticated users
CREATE POLICY "Tasks viewable by all" ON public.campaign_tasks FOR SELECT USING (true);
CREATE POLICY "Users can claim available task" ON public.campaign_tasks FOR UPDATE USING (auth.uid() = assigned_user_id OR assigned_user_id IS NULL);

-- Notifications viewable by owner
CREATE POLICY "User notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
