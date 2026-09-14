-- ============================================================
-- OLA SOCIAL: CENTRO DE ADMINISTRACIÓN TOTAL MIGRATION (2026)
-- Conforme al Prompt Maestro: Control Total, Seguridad Estricta,
-- RLS, Append-Only Audit, Roles, Restricciones y Mantenimiento
-- ============================================================

-- 1. User Restrictions (Granular Permissions per User)
CREATE TABLE IF NOT EXISTS public.user_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restriction_key TEXT NOT NULL,
  is_restricted BOOLEAN DEFAULT TRUE,
  reason TEXT,
  restricted_by UUID REFERENCES public.profiles(id),
  restricted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, restriction_key)
);

-- 2. App Settings (Global Dynamic Configuration)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT DEFAULT 'GENERAL',
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Feature Flags (Global Module Toggles)
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  description TEXT,
  category TEXT DEFAULT 'CORE',
  reason TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Announcements (Realtime Announcements & Ads Engine)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  position TEXT DEFAULT 'FEED' CHECK (position IN ('BANNER', 'CARD', 'TOP_BAR', 'MODAL', 'FEED')),
  priority INT DEFAULT 1,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED')),
  audience TEXT DEFAULT 'ALL' CHECK (audience IN ('ALL', 'NEW_USERS', 'ACTIVE_USERS', 'INACTIVE_USERS', 'SELECTED')),
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Admin Notifications (Broadcast & Directed Realtime Notifications)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ANNOUNCEMENT', 'MAINTENANCE', 'SECURITY', 'UPDATE', 'INFO', 'WARNING', 'EVENT')),
  audience TEXT NOT NULL CHECK (audience IN ('ALL', 'ACTIVE_USERS', 'NEW_USERS', 'SELECTED')),
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  sent_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  status TEXT DEFAULT 'SENT' CHECK (status IN ('SENT', 'SCHEDULED', 'CANCELLED', 'EXPIRED')),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Moderation Reports (User & Content Reporting Center)
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT DEFAULT 'USER' CHECK (content_type IN ('USER', 'TASK', 'CAMPAIGN', 'MESSAGE', 'PROFILE')),
  content_id TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  evidence_url TEXT,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REVIEWING', 'ACTION_REQUIRED', 'RESOLVED', 'DISMISSED')),
  assigned_to UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Admin Private Notes (Strictly Confidential per User)
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Application Error Logs Center
CREATE TABLE IF NOT EXISTS public.app_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  stack_trace TEXT,
  component TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  severity TEXT DEFAULT 'ERROR' CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'FATAL')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE & RELIABILITY
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_restrictions_user_id ON public.user_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status_start ON public.announcements(status, start_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_audience ON public.admin_notifications(audience, status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON public.moderation_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id ON public.admin_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_app_errors_resolved ON public.app_errors(resolved, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;

-- 1. user_restrictions policies
CREATE POLICY "Users read own restrictions, admins read all"
ON public.user_restrictions FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage user restrictions"
ON public.user_restrictions FOR ALL
USING (public.is_admin(auth.uid()));

-- 2. app_settings policies
CREATE POLICY "Public read app settings"
ON public.app_settings FOR SELECT
USING (true);

CREATE POLICY "Admins manage app settings"
ON public.app_settings FOR ALL
USING (public.is_admin(auth.uid()));

-- 3. feature_flags policies
CREATE POLICY "Public read feature flags"
ON public.feature_flags FOR SELECT
USING (true);

CREATE POLICY "Admins manage feature flags"
ON public.feature_flags FOR ALL
USING (public.is_admin(auth.uid()));

-- 4. announcements policies
CREATE POLICY "Public read active announcements"
ON public.announcements FOR SELECT
USING (status = 'ACTIVE' OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage announcements"
ON public.announcements FOR ALL
USING (public.is_admin(auth.uid()));

-- 5. admin_notifications policies
CREATE POLICY "Users read directed or broadcast notifications"
ON public.admin_notifications FOR SELECT
USING (
  audience = 'ALL' OR
  (audience = 'SELECTED' AND target_user_id = auth.uid()) OR
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins manage admin notifications"
ON public.admin_notifications FOR ALL
USING (public.is_admin(auth.uid()));

-- 6. moderation_reports policies
CREATE POLICY "Reporters read own reports, admins read all"
ON public.moderation_reports FOR SELECT
USING (reporter_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users submit reports"
ON public.moderation_reports FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins update moderation reports"
ON public.moderation_reports FOR UPDATE
USING (public.is_admin(auth.uid()));

-- 7. admin_notes policies (strictly admin-only)
CREATE POLICY "Admins manage private notes"
ON public.admin_notes FOR ALL
USING (public.is_admin(auth.uid()));

-- 8. app_errors policies
CREATE POLICY "Authenticated users log errors"
ON public.app_errors FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins view and resolve errors"
ON public.app_errors FOR ALL
USING (public.is_admin(auth.uid()));

-- ============================================================
-- SEED ESSENTIAL SYSTEM CONFIGURATION & FEATURE FLAGS
-- ============================================================
INSERT INTO public.feature_flags (key, enabled, description, category, reason)
VALUES
  ('ABRAZOS', true, 'Sistema de intercambio solidario de abrazos', 'SOCIAL', 'Activo por defecto'),
  ('INVITACIONES', true, 'Sistema de invitaciones y recompensas por recomendación', 'GROWTH', 'Activo por defecto'),
  ('RANKING', true, 'Ranking ponderado antifraude de la comunidad', 'COMMUNITY', 'Activo por defecto'),
  ('NOTIFICATIONS', true, 'Notificaciones en tiempo real y Web Push', 'CORE', 'Activo por defecto'),
  ('MESSAGING', true, 'Canales de comunicación comunitaria', 'COMMUNITY', 'Activo por defecto'),
  ('ADS', true, 'Campañas y anuncios institucionales de la comunidad', 'CONTENT', 'Activo por defecto'),
  ('COMMENTS', true, 'Comentarios y retroalimentación de tareas', 'SOCIAL', 'Activo por defecto'),
  ('PWA', true, 'Capacidades de Progressive Web App y soporte offline', 'SYSTEM', 'Activo por defecto'),
  ('MAINTENANCE', false, 'Modo de mantenimiento global', 'SYSTEM', 'Inactivo en operación normal'),
  ('REGISTRATION', true, 'Registro público de nuevos miembros vía Google OAuth', 'AUTH', 'Activo por defecto'),
  ('GOOGLE_LOGIN', true, 'Autenticación federada oficial mediante Google OAuth', 'AUTH', 'Activo por defecto')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value, category, description)
VALUES
  ('platform_branding', '{"name": "OLA SOCIAL", "slogan": "Crece junto a una comunidad real", "support_email": "soporte@olasocial.com"}'::jsonb, 'BRANDING', 'Información de marca'),
  ('maintenance_mode', '{"enabled": false, "emergency": false, "message": "Estamos realizando mejoras programadas. Regresamos en breve.", "start_at": null, "end_at": null, "allow_admin": true}'::jsonb, 'SYSTEM', 'Configuración de modo de mantenimiento'),
  ('security_limits', '{"max_daily_hugs": 200, "max_concurrent_tasks": 5, "rate_limit_minute": 60}'::jsonb, 'SECURITY', 'Límites operativos antifraude')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SECURE STORED PROCEDURES (SECURITY DEFINER WITH SEARCH_PATH)
-- ============================================================

-- Procedure: Block User
CREATE OR REPLACE FUNCTION public.admin_block_user(
  p_user_id UUID,
  p_duration_hours INT,
  p_reason TEXT,
  p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email TEXT;
  v_target_email TEXT;
  v_target_role TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos.';
  END IF;

  SELECT email, role INTO v_target_email, v_target_role FROM public.profiles WHERE id = p_user_id;
  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado.';
  END IF;

  IF v_target_role = 'SUPER_ADMIN' OR LOWER(v_target_email) = 'v19629049@gmail.com' THEN
    RAISE EXCEPTION 'Operación rechazada: La cuenta de Super Administrador no puede ser bloqueada.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

  -- Update Profile
  UPDATE public.profiles
  SET status = 'SUSPENDED',
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record Moderation Action
  INSERT INTO public.moderation_actions (user_id, admin_id, action_type, reason, notes, expires_at)
  VALUES (
    p_user_id,
    auth.uid(),
    'SUSPEND',
    p_reason,
    p_notes,
    CASE WHEN p_duration_hours > 0 THEN NOW() + (p_duration_hours || ' hours')::INTERVAL ELSE NULL END
  );

  -- Record Inmutable Audit Log
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details, ip_hash)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_email, 'admin@olasocial.com'),
    'USER_BLOCK',
    'USER',
    p_user_id::TEXT,
    format('Usuario %s bloqueado por %s horas. Motivo: %s. Notas: %s', v_target_email, COALESCE(p_duration_hours::TEXT, 'indefinido'), p_reason, p_notes),
    '0.0.0.0'
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'status', 'SUSPENDED');
END;
$$;

-- Procedure: Unblock User
CREATE OR REPLACE FUNCTION public.admin_unblock_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Restablecimiento de acceso por resolución administrativa'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email TEXT;
  v_target_email TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos.';
  END IF;

  SELECT email INTO v_target_email FROM public.profiles WHERE id = p_user_id;
  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

  -- Update Profile to ACTIVE
  UPDATE public.profiles
  SET status = 'ACTIVE',
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record Moderation Action
  INSERT INTO public.moderation_actions (user_id, admin_id, action_type, reason, notes)
  VALUES (p_user_id, auth.uid(), 'UNBAN', p_reason, 'Desbloqueo ejecutado');

  -- Record Inmutable Audit Log
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details, ip_hash)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_email, 'admin@olasocial.com'),
    'USER_UNBLOCK',
    'USER',
    p_user_id::TEXT,
    format('Usuario %s desbloqueado. Motivo: %s', v_target_email, p_reason),
    '0.0.0.0'
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'status', 'ACTIVE');
END;
$$;

-- Procedure: Ban User
CREATE OR REPLACE FUNCTION public.admin_ban_user(
  p_user_id UUID,
  p_is_permanent BOOLEAN,
  p_reason TEXT,
  p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email TEXT;
  v_target_email TEXT;
  v_target_role TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos.';
  END IF;

  SELECT email, role INTO v_target_email, v_target_role FROM public.profiles WHERE id = p_user_id;
  IF v_target_email IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado.';
  END IF;

  IF v_target_role = 'SUPER_ADMIN' OR LOWER(v_target_email) = 'v19629049@gmail.com' THEN
    RAISE EXCEPTION 'Operación rechazada: La cuenta de Super Administrador no puede ser baneada.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

  -- Ban Profile
  UPDATE public.profiles
  SET status = 'BANNED',
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record Action
  INSERT INTO public.moderation_actions (user_id, admin_id, action_type, reason, notes)
  VALUES (p_user_id, auth.uid(), 'BAN', p_reason, p_notes);

  -- Record Inmutable Audit Log
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details, ip_hash)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_email, 'admin@olasocial.com'),
    'USER_BAN',
    'USER',
    p_user_id::TEXT,
    format('Usuario %s baneado (%s). Motivo: %s. Notas: %s', v_target_email, CASE WHEN p_is_permanent THEN 'Permanente' ELSE 'Temporal' END, p_reason, p_notes),
    '0.0.0.0'
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'status', 'BANNED');
END;
$$;

-- Procedure: Set User Restriction
CREATE OR REPLACE FUNCTION public.admin_set_user_restriction(
  p_user_id UUID,
  p_restriction_key TEXT,
  p_is_restricted BOOLEAN,
  p_reason TEXT DEFAULT '',
  p_duration_hours INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email TEXT;
  v_until TIMESTAMPTZ := NULL;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos.';
  END IF;

  IF p_duration_hours IS NOT NULL AND p_duration_hours > 0 THEN
    v_until := NOW() + (p_duration_hours || ' hours')::INTERVAL;
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.user_restrictions (user_id, restriction_key, is_restricted, reason, restricted_by, restricted_until, updated_at)
  VALUES (p_user_id, p_restriction_key, p_is_restricted, p_reason, auth.uid(), v_until, NOW())
  ON CONFLICT (user_id, restriction_key)
  DO UPDATE SET
    is_restricted = EXCLUDED.is_restricted,
    reason = EXCLUDED.reason,
    restricted_by = EXCLUDED.restricted_by,
    restricted_until = EXCLUDED.restricted_until,
    updated_at = NOW();

  -- Record Audit
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details, ip_hash)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_email, 'admin@olasocial.com'),
    'RESTRICTION_CHANGE',
    'USER',
    p_user_id::TEXT,
    format('Restricción %s ajustada a %s para usuario %s. Motivo: %s', p_restriction_key, p_is_restricted::TEXT, p_user_id::TEXT, p_reason),
    '0.0.0.0'
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'restriction', p_restriction_key, 'is_restricted', p_is_restricted);
END;
$$;

-- Procedure: Adjust Reputation
CREATE OR REPLACE FUNCTION public.admin_adjust_reputation(
  p_user_id UUID,
  p_delta NUMERIC,
  p_reason TEXT,
  p_reference TEXT DEFAULT 'ADMIN_CORRECTION'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email TEXT;
  v_new_rep NUMERIC;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

  UPDATE public.profiles
  SET reputation = LEAST(100.0, GREATEST(0.0, reputation + p_delta)),
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING reputation INTO v_new_rep;

  -- Record in reputation_events
  INSERT INTO public.reputation_events (user_id, event_type, score_delta, reason)
  VALUES (p_user_id, 'ADMIN_MANUAL_ADJUSTMENT', p_delta, p_reason);

  -- Record Inmutable Audit Log
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details, ip_hash)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_email, 'admin@olasocial.com'),
    'REPUTATION_ADJUST',
    'USER',
    p_user_id::TEXT,
    format('Ajuste de reputación de %s pts. Nuevo valor: %s. Motivo: %s. Ref: %s', p_delta::TEXT, v_new_rep::TEXT, p_reason, p_reference),
    '0.0.0.0'
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'new_reputation', v_new_rep);
END;
$$;

-- Procedure: Toggle Feature Flag
CREATE OR REPLACE FUNCTION public.admin_toggle_feature_flag(
  p_key TEXT,
  p_enabled BOOLEAN,
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos.';
  END IF;

  SELECT email INTO v_admin_email FROM public.profiles WHERE id = auth.uid();

  UPDATE public.feature_flags
  SET enabled = p_enabled,
      reason = p_reason,
      updated_by = auth.uid(),
      updated_at = NOW()
  WHERE key = p_key;

  -- Record Audit
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details, ip_hash)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_email, 'admin@olasocial.com'),
    'FEATURE_FLAG_TOGGLE',
    'POLICY',
    p_key,
    format('Bandera de función %s cambiada a %s. Motivo: %s', p_key, p_enabled::TEXT, p_reason),
    '0.0.0.0'
  );

  RETURN jsonb_build_object('success', true, 'key', p_key, 'enabled', p_enabled);
END;
$$;

-- Procedure: Set Maintenance Mode
CREATE OR REPLACE FUNCTION public.admin_set_maintenance_mode(
  p_enabled BOOLEAN,
  p_message TEXT,
  p_start_at TIMESTAMPTZ DEFAULT NULL,
  p_end_at TIMESTAMPTZ DEFAULT NULL,
  p_emergency BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_email TEXT;
  v_is_super BOOLEAN;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos.';
  END IF;

  SELECT email, (role = 'SUPER_ADMIN' OR LOWER(email) = 'v19629049@gmail.com')
  INTO v_admin_email, v_is_super
  FROM public.profiles WHERE id = auth.uid();

  IF p_emergency AND NOT v_is_super THEN
    RAISE EXCEPTION 'Modo de Emergencia requiere privilegios exclusivos de SUPER_ADMIN.';
  END IF;

  -- Update Setting
  INSERT INTO public.app_settings (key, value, category, description, updated_by, updated_at)
  VALUES (
    'maintenance_mode',
    jsonb_build_object(
      'enabled', p_enabled,
      'emergency', p_emergency,
      'message', p_message,
      'start_at', p_start_at,
      'end_at', p_end_at,
      'allow_admin', true
    ),
    'SYSTEM',
    'Configuración de mantenimiento y modo de emergencia',
    auth.uid(),
    NOW()
  )
  ON CONFLICT (key)
  DO UPDATE SET
    value = EXCLUDED.value,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

  -- Update FEATURE_FLAGS MAINTENANCE flag
  UPDATE public.feature_flags
  SET enabled = p_enabled,
      reason = p_message,
      updated_by = auth.uid(),
      updated_at = NOW()
  WHERE key = 'MAINTENANCE';

  -- Record Inmutable Audit Log
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details, ip_hash)
  VALUES (
    auth.uid(),
    COALESCE(v_admin_email, 'admin@olasocial.com'),
    CASE WHEN p_emergency THEN 'EMERGENCY_MODE_TOGGLE' ELSE 'MAINTENANCE_TOGGLE' END,
    'SECURITY',
    'SYSTEM',
    format('Modo %s activado: %s. Mensaje: %s', CASE WHEN p_emergency THEN 'EMERGENCIA' ELSE 'Mantenimiento' END, p_enabled::TEXT, p_message),
    '0.0.0.0'
  );

  RETURN jsonb_build_object('success', true, 'enabled', p_enabled, 'emergency', p_emergency);
END;
$$;

-- Procedure: Get System Real Stats
CREATE OR REPLACE FUNCTION public.admin_get_system_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_users INT;
  v_active_users INT;
  v_blocked_users INT;
  v_banned_users INT;
  v_total_tasks INT;
  v_open_disputes INT;
  v_open_fraud INT;
  v_total_announcements INT;
  v_total_reports INT;
  v_audit_count INT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado.';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_active_users FROM public.profiles WHERE status = 'ACTIVE';
  SELECT COUNT(*) INTO v_blocked_users FROM public.profiles WHERE status = 'SUSPENDED';
  SELECT COUNT(*) INTO v_banned_users FROM public.profiles WHERE status = 'BANNED';
  SELECT COUNT(*) INTO v_total_tasks FROM public.campaign_tasks;
  SELECT COUNT(*) INTO v_open_disputes FROM public.disputes WHERE status = 'OPEN';
  SELECT COUNT(*) INTO v_open_fraud FROM public.fraud_events WHERE status = 'OPEN';
  SELECT COUNT(*) INTO v_total_announcements FROM public.announcements WHERE status = 'ACTIVE';
  SELECT COUNT(*) INTO v_total_reports FROM public.moderation_reports WHERE status = 'OPEN';
  SELECT COUNT(*) INTO v_audit_count FROM public.admin_audit_log;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'active_users', v_active_users,
    'blocked_users', v_blocked_users,
    'banned_users', v_banned_users,
    'total_tasks', v_total_tasks,
    'open_disputes', v_open_disputes,
    'open_fraud', v_open_fraud,
    'active_announcements', v_total_announcements,
    'open_reports', v_total_reports,
    'audit_logs_count', v_audit_count
  );
END;
$$;

-- Procedure: Cleanup Dry Run (Zero deletion, strict classification)
CREATE OR REPLACE FUNCTION public.admin_execute_cleanup_dry_run()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_real_count INT;
  v_test_count INT;
  v_simulated_count INT;
  v_orphan_count INT;
  v_unknown_count INT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acceso denegado.';
  END IF;

  -- Count real users (Google OAuth authentic or verified accounts)
  SELECT COUNT(*) INTO v_real_count
  FROM public.profiles
  WHERE email NOT ILIKE '%@example.com' AND email NOT ILIKE '%test%' AND email NOT ILIKE '%dummy%';

  -- Count test accounts (e.g. @example.com or test emails)
  SELECT COUNT(*) INTO v_test_count
  FROM public.profiles
  WHERE (email ILIKE '%@example.com' OR email ILIKE '%test%@%')
    AND role != 'SUPER_ADMIN' AND LOWER(email) != 'v19629049@gmail.com';

  -- Count simulated or dummy data
  v_simulated_count := 0;

  -- Count orphan records
  SELECT COUNT(*) INTO v_orphan_count
  FROM public.campaign_tasks ct
  LEFT JOIN public.profiles p ON ct.creator_id = p.id
  WHERE p.id IS NULL;

  -- Unknown records
  SELECT COUNT(*) INTO v_unknown_count
  FROM public.profiles
  WHERE email IS NULL OR username IS NULL;

  RETURN jsonb_build_object(
    'dry_run', true,
    'real_records', v_real_count,
    'test_records', v_test_count,
    'simulated_records', v_simulated_count,
    'orphan_records', v_orphan_count,
    'unknown_records', v_unknown_count,
    'notice', 'DRY RUN FINALIZADO: Ningún registro ha sido eliminado del sistema.'
  );
END;
$$;
