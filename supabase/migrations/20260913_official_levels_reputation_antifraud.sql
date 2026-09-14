-- ============================================================
-- OLA SOCIAL - SISTEMA OFICIAL DE NIVELES + AYUDA CERTIFICADA
-- REPUTACIÓN + ANTIFRAUDE + DISPUTAS + LEDGER + REALTIME (2026)
-- Conforme a Directivas: Supabase Fuente Única de Verdad,
-- RLS estricta, Idempotencia, RPCs Seguras y Auditoría.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Actualizar perfiles con métricas oficiales
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS level_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS experience_points INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(6,1) DEFAULT 100.0,
  ADD COLUMN IF NOT EXISTS unique_users_helped INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_platforms_supported INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_campaigns_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS community_score NUMERIC(5,2) DEFAULT 10.0;

-- 2. Tabla de Requisitos de Nivel (Configuración editable desde Supabase)
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

-- Seed de los 10 Niveles Oficiales de OLA SOCIAL
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

-- 3. Experience Ledger (Inmutable, Append-Only)
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

-- 4. Reputation Events (Inmutable, Append-Only)
CREATE TABLE IF NOT EXISTS public.reputation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  score_delta NUMERIC(6,1) NOT NULL,
  source_id UUID,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Support Verifications (Abrazos Certificados)
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

-- 6. Badges & User Badges
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
  ('AYUDA_A_NUEVOS_USUARIOS', 'Impulsor de Nuevos', 'Ayudó a más de 5 creadores de Nivel 1 a darse a conocer.', 'UserPlus', 'COMMUNITY'::text),
  ('ALTA_CALIDAD', 'Alta Calidad', 'Recibió calificación perfecta de 5 estrellas en 20 o más tareas consecutivas.', 'Star', 'QUALITY'),
  ('BUENA_CONDUCTA', 'Buena Conducta', 'Cero alertas de fraude y comportamiento comunitario intachable.', 'HeartHandshake', 'QUALITY'),
  ('REFERENTE', 'Referente Comunitario', 'Alcanzó el Nivel 5 o superior con diversidad sobresaliente.', 'Flame', 'SPECIAL')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category;

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_badge UNIQUE (user_id, badge_code)
);

-- 7. Disputes & Dispute Events
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

CREATE TABLE IF NOT EXISTS public.dispute_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. System Config (Editable from Supabase)
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_config (key, value, description)
VALUES
  ('MAX_TASKS_PER_HOUR', '10'::jsonb, 'Límite máximo de tareas que un usuario puede iniciar por hora'),
  ('MAX_TASKS_PER_DAY', '50'::jsonb, 'Límite máximo de tareas diarias por usuario'),
  ('MAX_SAME_CREATOR_PER_DAY', '3'::jsonb, 'Límite máximo de tareas con el mismo creador por día para evitar colusión'),
  ('MAX_SAME_ACTION_PER_DAY', '15'::jsonb, 'Límite máximo de una misma acción en una misma red al día'),
  ('BASE_TASK_XP', '25'::jsonb, 'Puntos de experiencia base por tarea completada y verificada'),
  ('BASE_REPUTATION_GAIN', '15'::jsonb, 'Puntos de reputación otorgados por abrazo verificado'),
  ('REJECTED_REPUTATION_PENALTY', '20'::jsonb, 'Penalización de reputación al ser rechazada una tarea por no cumplir'),
  ('RANKING_WEIGHTS', '{"quality": 0.40, "reputation": 0.25, "diversity": 0.15, "consistency": 0.10, "verified_supports": 0.10}'::jsonb, 'Ponderación matemática para el cálculo del Community Score')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- RPC FUNCTIONS: TRANSACTIONAL, IDEMPOTENT, SERVER-AUTHORITATIVE
-- ============================================================

-- Function: grant_experience (Idempotente vía experience_ledger)
CREATE OR REPLACE FUNCTION public.grant_experience(
  p_user_id UUID,
  p_xp INT,
  p_source_type TEXT,
  p_source_id UUID,
  p_reason TEXT
)
RETURNS INT AS $$
DECLARE
  v_inserted INT;
BEGIN
  IF p_xp <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.experience_ledger (user_id, source_type, source_id, xp_delta, reason)
  VALUES (p_user_id, p_source_type, p_source_id, p_xp, p_reason)
  ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    UPDATE public.profiles
    SET experience_points = COALESCE(experience_points, 0) + p_xp,
        updated_at = NOW()
    WHERE id = p_user_id;
    RETURN p_xp;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: recalculate_reputation
CREATE OR REPLACE FUNCTION public.recalculate_reputation(
  p_user_id UUID,
  p_delta NUMERIC,
  p_reason TEXT,
  p_source_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_new_rep NUMERIC;
BEGIN
  INSERT INTO public.reputation_events (user_id, event_type, score_delta, source_id, reason)
  VALUES (p_user_id, 'DELTA', p_delta, p_source_id, p_reason);

  UPDATE public.profiles
  SET reputation_score = GREATEST(0.0, LEAST(1000.0, COALESCE(reputation_score, 100.0) + p_delta)),
      reputation = GREATEST(0.0, LEAST(100.0, (COALESCE(reputation_score, 100.0) + p_delta) / 10.0)),
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING reputation_score INTO v_new_rep;

  RETURN v_new_rep;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: evaluate_level_up
CREATE OR REPLACE FUNCTION public.evaluate_level_up(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_prof RECORD;
  v_req RECORD;
  v_highest_eligible_level INT := 1;
  v_highest_name TEXT := 'NUEVO';
BEGIN
  SELECT * INTO v_prof FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN 1;
  END IF;

  FOR v_req IN
    SELECT * FROM public.level_requirements
    ORDER BY level_number ASC
  LOOP
    IF (COALESCE(v_prof.experience_points, 0) >= v_req.min_xp)
       AND (COALESCE(v_prof.hugs_verified, 0) >= v_req.min_verified_supports)
       AND (COALESCE(v_prof.reputation_score, 100.0) >= v_req.min_reputation)
       AND (COALESCE(v_prof.unique_users_helped, 0) >= v_req.min_unique_users)
       AND (COALESCE(v_prof.unique_platforms_supported, 0) >= v_req.min_unique_platforms)
    THEN
      v_highest_eligible_level := v_req.level_number;
      v_highest_name := v_req.level_name;
    END IF;
  END LOOP;

  IF v_highest_eligible_level > COALESCE(v_prof.level_number, 1) THEN
    UPDATE public.profiles
    SET level_number = v_highest_eligible_level,
        user_level = v_highest_name,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      p_user_id,
      'LEVEL_UP',
      '¡Subiste de Nivel!',
      'Felicitaciones. Has alcanzado el Nivel ' || v_highest_eligible_level || ' (' || v_highest_name || ').'
    );
  END IF;

  RETURN v_highest_eligible_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: check_and_award_badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_prof RECORD;
BEGIN
  SELECT * INTO v_prof FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- PRIMER_ABRAZO
  IF COALESCE(v_prof.hugs_verified, 0) >= 1 THEN
    INSERT INTO public.user_badges (user_id, badge_code)
    VALUES (p_user_id, 'PRIMER_ABRAZO') ON CONFLICT DO NOTHING;
  END IF;

  -- 10_COLABORACIONES
  IF COALESCE(v_prof.hugs_verified, 0) >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_code)
    VALUES (p_user_id, '10_COLABORACIONES') ON CONFLICT DO NOTHING;
  END IF;

  -- 50_COLABORACIONES
  IF COALESCE(v_prof.hugs_verified, 0) >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_code)
    VALUES (p_user_id, '50_COLABORACIONES') ON CONFLICT DO NOTHING;
  END IF;

  -- 100_COLABORACIONES
  IF COALESCE(v_prof.hugs_verified, 0) >= 100 THEN
    INSERT INTO public.user_badges (user_id, badge_code)
    VALUES (p_user_id, '100_COLABORACIONES') ON CONFLICT DO NOTHING;
  END IF;

  -- COLABORADOR_CONFIABLE
  IF COALESCE(v_prof.hugs_verified, 0) >= 15 AND COALESCE(v_prof.reputation_score, 0) >= 300.0 THEN
    INSERT INTO public.user_badges (user_id, badge_code)
    VALUES (p_user_id, 'COLABORADOR_CONFIABLE') ON CONFLICT DO NOTHING;
  END IF;

  -- APOYO_MULTIPLATAFORMA
  IF COALESCE(v_prof.unique_platforms_supported, 0) >= 4 THEN
    INSERT INTO public.user_badges (user_id, badge_code)
    VALUES (p_user_id, 'APOYO_MULTIPLATAFORMA') ON CONFLICT DO NOTHING;
  END IF;

  -- REFERENTE
  IF COALESCE(v_prof.level_number, 1) >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_code)
    VALUES (p_user_id, 'REFERENTE') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master RPC: complete_verified_task (Transaccional, Idempotente, Concurrente)
CREATE OR REPLACE FUNCTION public.complete_verified_task(
  p_task_id UUID,
  p_is_valid BOOLEAN,
  p_feedback TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
  v_giver RECORD;
  v_caller_id UUID := auth.uid();
  v_is_caller_admin BOOLEAN := FALSE;
  v_already_certified BOOLEAN := FALSE;
  v_xp_awarded INT := 0;
  v_base_xp INT := 25;
  v_new_level INT;
  v_unique_users INT;
  v_unique_platforms INT;
  v_unique_camps INT;
BEGIN
  -- 1. Obtener la tarea
  SELECT * INTO v_task FROM public.campaign_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Tarea no encontrada');
  END IF;

  -- 2. Verificar autorización (Creador o Admin)
  SELECT public.is_admin(v_caller_id) INTO v_is_caller_admin;
  IF v_caller_id IS NOT NULL AND v_caller_id != v_task.creator_id AND NOT v_is_caller_admin THEN
    RETURN jsonb_build_object('success', false, 'message', 'No autorizado para validar esta colaboración');
  END IF;

  -- 3. Evitar autovalidación fraudulenta
  IF v_task.assigned_user_id = v_task.creator_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Autovalidación prohibida por directiva antifraude');
  END IF;

  -- 4. CASO RECHAZO
  IF NOT p_is_valid THEN
    UPDATE public.campaign_tasks
    SET status = 'REJECTED',
        updated_at = NOW()
    WHERE id = p_task_id;

    IF v_task.assigned_user_id IS NOT NULL THEN
      PERFORM public.recalculate_reputation(
        v_task.assigned_user_id,
        -15.0,
        'Abrazo no verificado: ' || COALESCE(p_feedback, 'Evidencia insuficiente'),
        p_task_id
      );

      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        v_task.assigned_user_id,
        'TASK_REJECTED',
        'Abrazo no confirmado',
        'Tu colaboración no pudo ser validada: ' || COALESCE(p_feedback, 'Interacción no encontrada')
      );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'REJECTED', 'message', 'Colaboración marcada como rechazada');
  END IF;

  -- 5. CASO VALIDACIÓN EXITOSA (Abrazo Certificado)
  -- Idempotencia: Verificar si ya existe en support_verifications
  SELECT EXISTS (SELECT 1 FROM public.support_verifications WHERE task_id = p_task_id) INTO v_already_certified;
  IF v_already_certified THEN
    RETURN jsonb_build_object('success', true, 'status', 'VERIFIED', 'message', 'Colaboración ya certificada previamente (Idempotente)');
  END IF;

  -- Actualizar estado de la tarea
  UPDATE public.campaign_tasks
  SET status = 'VERIFIED',
      updated_at = NOW()
  WHERE id = p_task_id;

  -- Insertar en support_verifications
  INSERT INTO public.support_verifications (
    task_id,
    giver_id,
    receiver_id,
    campaign_id,
    platform,
    verification_method,
    verification_strength,
    evidence_type,
    evidence_url,
    evidence_note,
    stars,
    feedback,
    is_certified,
    certified_at
  ) VALUES (
    p_task_id,
    v_task.assigned_user_id,
    v_task.creator_id,
    v_task.campaign_id,
    v_task.platform,
    'RECIPIENT_CONFIRMATION',
    4,
    CASE WHEN v_task.evidence_url IS NOT NULL THEN 'URL' ELSE 'TEXT_CONFIRMATION' END,
    v_task.evidence_url,
    v_task.evidence_note,
    5,
    COALESCE(p_feedback, 'Abrazo legítimo y verificado'),
    TRUE,
    NOW()
  );

  -- Calcular métricas de diversidad en tiempo real para el asignado
  SELECT COUNT(DISTINCT receiver_id) INTO v_unique_users
  FROM public.support_verifications WHERE giver_id = v_task.assigned_user_id;

  SELECT COUNT(DISTINCT platform) INTO v_unique_platforms
  FROM public.support_verifications WHERE giver_id = v_task.assigned_user_id;

  SELECT COUNT(DISTINCT campaign_id) INTO v_unique_camps
  FROM public.support_verifications WHERE giver_id = v_task.assigned_user_id;

  -- Actualizar contadores en profiles
  UPDATE public.profiles
  SET hugs_verified = COALESCE(hugs_verified, 0) + 1,
      stars_count = COALESCE(stars_count, 0) + 5,
      unique_users_helped = v_unique_users,
      unique_platforms_supported = v_unique_platforms,
      unique_campaigns_completed = v_unique_camps,
      updated_at = NOW()
  WHERE id = v_task.assigned_user_id;

  -- Actualizar abrazos recibidos en el receptor
  UPDATE public.profiles
  SET hugs_received = COALESCE(hugs_received, 0) + 1,
      updated_at = NOW()
  WHERE id = v_task.creator_id;

  -- Otorgar XP al ayudante de forma segura
  SELECT public.grant_experience(
    v_task.assigned_user_id,
    v_base_xp,
    'TASK_VERIFIED',
    p_task_id,
    'Abrazo certificado validado con éxito'
  ) INTO v_xp_awarded;

  -- Aumentar reputación al ayudante (+15 pts)
  PERFORM public.recalculate_reputation(
    v_task.assigned_user_id,
    15.0,
    'Abrazo certificado validado',
    p_task_id
  );

  -- Aumentar reputación al receptor por confirmar honestamente (+3 pts)
  PERFORM public.recalculate_reputation(
    v_task.creator_id,
    3.0,
    'Confirmación de colaboración recibida',
    p_task_id
  );

  -- Evaluar subida de nivel del ayudante
  SELECT public.evaluate_level_up(v_task.assigned_user_id) INTO v_new_level;

  -- Evaluar insignias
  PERFORM public.check_and_award_badges(v_task.assigned_user_id);

  -- Notificación de éxito
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    v_task.assigned_user_id,
    'TASK_VERIFIED',
    '¡Abrazo Certificado Exitosamente!',
    'Tu colaboración ha sido validada. Ganaste ' || v_base_xp || ' XP y 5 estrellas de reputación.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', 'VERIFIED',
    'xp_awarded', v_xp_awarded,
    'new_level', v_new_level,
    'unique_users_helped', v_unique_users,
    'message', 'Abrazo certificado con éxito e incorporado a la reputación comunitaria'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: create_fraud_event
CREATE OR REPLACE FUNCTION public.create_fraud_event(
  p_user_id UUID,
  p_pattern TEXT,
  p_risk_level TEXT,
  p_details TEXT
)
RETURNS UUID AS $$
DECLARE
  v_email TEXT;
  v_event_id UUID;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE id = p_user_id;

  INSERT INTO public.fraud_events (user_id, user_email, pattern, risk_level, status, details)
  VALUES (p_user_id, COALESCE(v_email, 'unknown@olasocial.org'), p_pattern, p_risk_level, 'OPEN', p_details)
  RETURNING id INTO v_event_id;

  -- Afectar reputación preventivamente si riesgo ALTO o CRÍTICO
  IF p_risk_level IN ('HIGH', 'CRITICAL') THEN
    PERFORM public.recalculate_reputation(p_user_id, -30.0, 'Alerta de riesgo de colusión o actividad anómala', v_event_id);
  END IF;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: report_task_dispute
CREATE OR REPLACE FUNCTION public.report_task_dispute(
  p_task_id UUID,
  p_reason TEXT,
  p_evidence_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_task RECORD;
  v_caller_id UUID := auth.uid();
  v_accused_id UUID;
  v_dispute_id UUID;
BEGIN
  SELECT * INTO v_task FROM public.campaign_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarea no encontrada para iniciar disputa';
  END IF;

  IF v_caller_id = v_task.creator_id THEN
    v_accused_id := v_task.assigned_user_id;
  ELSE
    v_accused_id := v_task.creator_id;
  END IF;

  UPDATE public.campaign_tasks
  SET status = 'DISPUTED',
      updated_at = NOW()
  WHERE id = p_task_id;

  INSERT INTO public.disputes (task_id, reporter_id, accused_id, reason, evidence_url, status)
  VALUES (p_task_id, v_caller_id, v_accused_id, p_reason, p_evidence_url, 'OPEN')
  RETURNING id INTO v_dispute_id;

  INSERT INTO public.dispute_events (dispute_id, actor_id, action, notes)
  VALUES (v_dispute_id, v_caller_id, 'OPENED', 'Disputa reportada: ' || p_reason);

  RETURN v_dispute_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: resolve_dispute (Solo Admin)
CREATE OR REPLACE FUNCTION public.resolve_dispute(
  p_dispute_id UUID,
  p_resolution TEXT, -- 'RESOLVED_HELPER', 'RESOLVED_RECIPIENT', 'REJECTED'
  p_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_disp RECORD;
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Solo moderadores autorizados pueden resolver disputas');
  END IF;

  SELECT * INTO v_disp FROM public.disputes WHERE id = p_dispute_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Disputa no encontrada');
  END IF;

  UPDATE public.disputes
  SET status = p_resolution,
      resolution_notes = p_notes,
      resolved_by = v_admin_id,
      resolved_at = NOW()
  WHERE id = p_dispute_id;

  INSERT INTO public.dispute_events (dispute_id, actor_id, action, notes)
  VALUES (p_dispute_id, v_admin_id, p_resolution, p_notes);

  IF p_resolution = 'RESOLVED_HELPER' THEN
    PERFORM public.complete_verified_task(v_disp.task_id, TRUE, 'Resuelto favorablemente por moderación: ' || p_notes);
  ELSIF p_resolution = 'RESOLVED_RECIPIENT' THEN
    PERFORM public.complete_verified_task(v_disp.task_id, FALSE, 'Resuelto en favor del receptor por moderación: ' || p_notes);
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Disputa resuelta exitosamente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
-- ============================================================
ALTER TABLE public.level_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- level_requirements policies
CREATE POLICY "Public read level_requirements" ON public.level_requirements FOR SELECT USING (true);
CREATE POLICY "Admin manage level_requirements" ON public.level_requirements FOR ALL USING (public.is_admin(auth.uid()));

-- experience_ledger policies (Read-only for owner and admin, no updates/deletes)
CREATE POLICY "Owner read experience_ledger" ON public.experience_ledger FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- reputation_events policies (Read-only for owner and admin)
CREATE POLICY "Owner read reputation_events" ON public.reputation_events FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- support_verifications policies (Public read for transparency)
CREATE POLICY "Public read support_verifications" ON public.support_verifications FOR SELECT USING (true);
CREATE POLICY "Admin manage support_verifications" ON public.support_verifications FOR ALL USING (public.is_admin(auth.uid()));

-- badges policies
CREATE POLICY "Public read badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admin manage badges" ON public.badges FOR ALL USING (public.is_admin(auth.uid()));

-- user_badges policies
CREATE POLICY "Public read user_badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Admin manage user_badges" ON public.user_badges FOR ALL USING (public.is_admin(auth.uid()));

-- disputes policies
CREATE POLICY "Participants and admin read disputes" ON public.disputes FOR SELECT USING (
  auth.uid() = reporter_id OR auth.uid() = accused_id OR public.is_admin(auth.uid())
);
CREATE POLICY "Authenticated user create dispute" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admin manage disputes" ON public.disputes FOR ALL USING (public.is_admin(auth.uid()));

-- dispute_events policies
CREATE POLICY "Dispute participants read events" ON public.dispute_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_id AND (d.reporter_id = auth.uid() OR d.accused_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);
CREATE POLICY "Admin manage dispute_events" ON public.dispute_events FOR ALL USING (public.is_admin(auth.uid()));

-- system_config policies
CREATE POLICY "Public read system_config" ON public.system_config FOR SELECT USING (true);
CREATE POLICY "Admin manage system_config" ON public.system_config FOR ALL USING (public.is_admin(auth.uid()));

-- Publication for Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE
    public.support_verifications,
    public.user_badges,
    public.disputes,
    public.level_requirements;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
