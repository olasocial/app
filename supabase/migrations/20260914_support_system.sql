-- ============================================================
-- MIGRATION: 20260914_support_system.sql
-- SISTEMA OFICIAL "APOYAR OLA SOCIAL" — DONACIONES Y APORTES
-- ============================================================

-- 1. TABLA: donation_methods (Métodos de Donación Administrables)
CREATE TABLE IF NOT EXISTS public.donation_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PAYPAL', 'BINANCE_PAY', 'PAGO_MOVIL', 'BANK_TRANSFER', 'OTHER')),
  description TEXT,
  instructions TEXT,
  public_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  currency TEXT NOT NULL DEFAULT 'USD',
  icon TEXT,
  logo_url TEXT,
  qr_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
  display_order INTEGER NOT NULL DEFAULT 1,
  warning_note TEXT DEFAULT 'Verifica cuidadosamente los datos del método antes de realizar cualquier aporte o transferencia.',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. TABLA: donation_reports (Reportes Voluntarios de Aportes)
CREATE TABLE IF NOT EXISTS public.donation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  method_id UUID REFERENCES public.donation_methods(id) ON DELETE RESTRICT,
  method_name TEXT NOT NULL,
  method_type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  reference TEXT NOT NULL,
  donor_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  receipt_url TEXT,
  user_comment TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'REJECTED', 'CANCELLED')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA: donation_settings (Configuración Global del Módulo de Apoyo)
CREATE TABLE IF NOT EXISTS public.donation_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  title TEXT NOT NULL DEFAULT 'Apoyar OLA SOCIAL',
  subtitle TEXT DEFAULT 'Tu aporte es voluntario y ayuda a mantener y mejorar OLA SOCIAL.',
  description TEXT DEFAULT 'Cada contribución permite sostener la infraestructura, servidores, seguridad y evolución continua de la red social solidaria.',
  thank_you_message TEXT DEFAULT 'Gracias de corazón por considerar apoyar a OLA SOCIAL. Cada grano de arena cuenta.',
  transparency_text TEXT DEFAULT 'Infraestructura en la nube, servidores de alta disponibilidad, auditorías de seguridad, optimización de velocidad y desarrollo de nuevas herramientas para la comunidad.',
  disclaimer_text TEXT DEFAULT 'Los aportes son voluntarios. Verifica cuidadosamente los datos del método seleccionado antes de realizar cualquier transferencia o pago.',
  button_position TEXT NOT NULL DEFAULT 'HEADER_AND_MENU' CHECK (button_position IN ('HEADER_AND_MENU', 'HEADER_ONLY', 'MENU_ONLY', 'HIDDEN')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Fila inicial por defecto de configuración
INSERT INTO public.donation_settings (
  id, enabled, title, subtitle, description, thank_you_message, transparency_text, disclaimer_text, button_position
) VALUES (
  'global',
  TRUE,
  'Apoyar OLA SOCIAL',
  'Tu aporte es voluntario y ayuda a mantener y mejorar OLA SOCIAL.',
  'Cada contribución permite sostener la infraestructura, servidores, seguridad y evolución continua de la red social solidaria.',
  'Gracias de corazón por considerar apoyar a OLA SOCIAL. Cada grano de arena cuenta.',
  'Infraestructura en la nube, servidores de alta disponibilidad, auditorías de seguridad, optimización de velocidad y desarrollo de nuevas herramientas para la comunidad.',
  'Los aportes son voluntarios. Verifica cuidadosamente los datos del método seleccionado antes de realizar cualquier transferencia o pago.',
  'HEADER_AND_MENU'
) ON CONFLICT (id) DO NOTHING;

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_donation_methods_status_order ON public.donation_methods(status, display_order);
CREATE INDEX IF NOT EXISTS idx_donation_reports_status ON public.donation_reports(status);
CREATE INDEX IF NOT EXISTS idx_donation_reports_user ON public.donation_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_reports_created ON public.donation_reports(created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.donation_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: donation_methods
DROP POLICY IF EXISTS "Public can view active donation methods" ON public.donation_methods;
CREATE POLICY "Public can view active donation methods"
ON public.donation_methods
FOR SELECT
USING (status = 'ACTIVE' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage donation methods" ON public.donation_methods;
CREATE POLICY "Admins can manage donation methods"
ON public.donation_methods
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- POLÍTICAS: donation_reports
DROP POLICY IF EXISTS "Users can insert their own donation report" ON public.donation_reports;
CREATE POLICY "Users can insert their own donation report"
ON public.donation_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.donation_reports;
CREATE POLICY "Users can view their own reports"
ON public.donation_reports
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update donation reports" ON public.donation_reports;
CREATE POLICY "Admins can update donation reports"
ON public.donation_reports
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- POLÍTICAS: donation_settings
DROP POLICY IF EXISTS "Public can view donation settings" ON public.donation_settings;
CREATE POLICY "Public can view donation settings"
ON public.donation_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can update donation settings" ON public.donation_settings;
CREATE POLICY "Admins can update donation settings"
ON public.donation_settings
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. STORAGE BUCKETS
DO $$
BEGIN
  -- Bucket público para QRs e iconos de métodos de donación
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('donation-public', 'donation-public', true)
  ON CONFLICT (id) DO NOTHING;

  -- Bucket privado para comprobantes de pago de usuarios
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('donation-receipts-private', 'donation-receipts-private', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 7. PROCEDIMIENTO ALMACENADO SEGURO: admin_save_donation_method
CREATE OR REPLACE FUNCTION public.admin_save_donation_method(p_method JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_id UUID;
  v_name TEXT;
  v_slug TEXT;
  v_type TEXT;
  v_currency TEXT;
  v_display_order INT;
  v_res JSONB;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren privilegios de administrador.';
  END IF;

  v_name := TRIM(COALESCE(p_method->>'name', ''));
  IF v_name = '' THEN
    RAISE EXCEPTION 'El nombre del método de donación es obligatorio.';
  END IF;

  v_type := UPPER(TRIM(COALESCE(p_method->>'type', 'OTHER')));
  v_currency := UPPER(TRIM(COALESCE(p_method->>'currency', 'USD')));
  v_display_order := COALESCE((p_method->>'display_order')::INT, 1);
  v_slug := COALESCE(p_method->>'slug', LOWER(REGEXP_REPLACE(v_name, '[^a-zA-Z0-9]+', '-', 'g')));

  IF p_method->>'id' IS NOT NULL AND (p_method->>'id') != '' THEN
    v_id := (p_method->>'id')::UUID;
    UPDATE public.donation_methods
    SET
      name = v_name,
      slug = v_slug,
      type = v_type,
      description = p_method->>'description',
      instructions = p_method->>'instructions',
      public_data = COALESCE(p_method->'public_data', '{}'::jsonb),
      currency = v_currency,
      icon = p_method->>'icon',
      logo_url = p_method->>'logo_url',
      qr_image_url = p_method->>'qr_image_url',
      status = COALESCE(p_method->>'status', 'ACTIVE'),
      display_order = v_display_order,
      warning_note = p_method->>'warning_note',
      updated_at = now(),
      updated_by = v_admin_id
    WHERE id = v_id;

    INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
    VALUES (v_admin_id, 'DONATION_METHOD_UPDATE', 'DONATION_METHOD', v_id::text, 'Método de pago actualizado: ' || v_name);
  ELSE
    INSERT INTO public.donation_methods (
      name, slug, type, description, instructions, public_data,
      currency, icon, logo_url, qr_image_url, status, display_order, warning_note,
      created_by, updated_by
    ) VALUES (
      v_name, v_slug, v_type, p_method->>'description', p_method->>'instructions',
      COALESCE(p_method->'public_data', '{}'::jsonb), v_currency, p_method->>'icon',
      p_method->>'logo_url', p_method->>'qr_image_url',
      COALESCE(p_method->>'status', 'ACTIVE'), v_display_order, p_method->>'warning_note',
      v_admin_id, v_admin_id
    ) RETURNING id INTO v_id;

    INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
    VALUES (v_admin_id, 'DONATION_METHOD_CREATE', 'DONATION_METHOD', v_id::text, 'Nuevo método de pago creado: ' || v_name);
  END IF;

  SELECT row_to_json(m)::jsonb INTO v_res FROM public.donation_methods m WHERE m.id = v_id;
  RETURN v_res;
END;
$$;

-- 8. PROCEDIMIENTO ALMACENADO SEGURO: admin_review_donation_report
CREATE OR REPLACE FUNCTION public.admin_review_donation_report(
  p_report_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_res JSONB;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren privilegios de administrador.';
  END IF;

  IF p_status NOT IN ('PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'REJECTED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Estado de reporte inválido: %', p_status;
  END IF;

  UPDATE public.donation_reports
  SET
    status = p_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_report_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (
    v_admin_id,
    'DONATION_REPORT_REVIEW',
    'DONATION_REPORT',
    p_report_id::text,
    'Reporte de donación revisado con estado: ' || p_status || CASE WHEN p_admin_notes IS NOT NULL THEN ' | Nota: ' || p_admin_notes ELSE '' END
  );

  SELECT row_to_json(r)::jsonb INTO v_res FROM public.donation_reports r WHERE r.id = p_report_id;
  RETURN v_res;
END;
$$;

-- 9. REALTIME PUBLICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_methods;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_reports;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_settings;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
