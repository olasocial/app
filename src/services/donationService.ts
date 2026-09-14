import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  DonationMethod,
  DonationMethodStatus,
  DonationReport,
  DonationReportStatus,
  DonationSettings,
  DonationStatsSummary
} from '../types';
import { logAdminAction } from './adminService';

// Default initial settings
export const DEFAULT_DONATION_SETTINGS: DonationSettings = {
  id: 'global',
  enabled: true,
  title: 'Apoyar OLA SOCIAL',
  subtitle: 'Tu aporte es voluntario y ayuda a mantener y mejorar OLA SOCIAL.',
  description:
    'Cada contribución permite sostener la infraestructura, servidores, seguridad y evolución continua de la red social solidaria.',
  thank_you_message:
    'Gracias de corazón por considerar apoyar a OLA SOCIAL. Cada grano de arena cuenta.',
  transparency_text:
    'Infraestructura en la nube, servidores de alta disponibilidad, auditorías de seguridad, optimización de velocidad y desarrollo de nuevas herramientas para la comunidad.',
  disclaimer_text:
    'Los aportes son voluntarios. Verifica cuidadosamente los datos del método seleccionado antes de realizar cualquier transferencia o pago.',
  button_position: 'HEADER_AND_MENU'
};

/**
 * Fetch active donation methods visible for regular users
 */
export async function fetchActiveDonationMethods(): Promise<DonationMethod[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('donation_methods')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching active donation methods:', error.message);
      return [];
    }

    return (data as DonationMethod[]) || [];
  } catch (err: any) {
    console.error('Unexpected error fetching donation methods:', err);
    return [];
  }
}

/**
 * Fetch all donation methods for the Admin Panel (excludes ARCHIVED)
 */
export async function fetchAllDonationMethods(): Promise<DonationMethod[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('donation_methods')
      .select('*')
      .neq('status', 'ARCHIVED')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching all donation methods:', error.message);
      return [];
    }

    return (data as DonationMethod[]) || [];
  } catch (err: any) {
    console.error('Unexpected error fetching all donation methods:', err);
    return [];
  }
}

/**
 * Save or update a donation method (Admin only)
 */
export async function saveDonationMethod(
  method: Partial<DonationMethod>
): Promise<{ success: boolean; message: string; data?: DonationMethod }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  if (!method.name || method.name.trim() === '') {
    return { success: false, message: 'El nombre del método es obligatorio.' };
  }

  if (!method.type) {
    return { success: false, message: 'El tipo de método es obligatorio.' };
  }

  const slug =
    method.slug ||
    method.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  try {
    // Attempt RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_save_donation_method', {
      p_method: {
        ...method,
        slug
      }
    });

    if (!rpcError && rpcData) {
      return {
        success: true,
        message: method.id ? 'Método de pago actualizado.' : 'Método de pago creado con éxito.',
        data: rpcData as DonationMethod
      };
    }

    // Direct fallback
    const { data: authUser } = await supabase.auth.getUser();
    const adminId = authUser?.user?.id || null;

    if (method.id) {
      const { data, error } = await supabase
        .from('donation_methods')
        .update({
          name: method.name.trim(),
          slug,
          type: method.type,
          description: method.description || '',
          instructions: method.instructions || '',
          public_data: method.public_data || {},
          currency: method.currency || 'USD',
          icon: method.icon || null,
          logo_url: method.logo_url || null,
          qr_image_url: method.qr_image_url || null,
          status: method.status || 'ACTIVE',
          display_order: method.display_order ?? 1,
          warning_note: method.warning_note || null,
          updated_at: new Date().toISOString(),
          updated_by: adminId
        })
        .eq('id', method.id)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(
        'DONATION_METHOD_UPDATE',
        'DONATION_METHOD',
        method.id,
        `Método de pago actualizado: ${method.name}`
      );

      return {
        success: true,
        message: 'Método de pago actualizado correctamente.',
        data: data as DonationMethod
      };
    } else {
      const { data, error } = await supabase
        .from('donation_methods')
        .insert({
          name: method.name.trim(),
          slug,
          type: method.type,
          description: method.description || '',
          instructions: method.instructions || '',
          public_data: method.public_data || {},
          currency: method.currency || 'USD',
          icon: method.icon || null,
          logo_url: method.logo_url || null,
          qr_image_url: method.qr_image_url || null,
          status: method.status || 'ACTIVE',
          display_order: method.display_order ?? 1,
          warning_note: method.warning_note || null,
          created_by: adminId,
          updated_by: adminId
        })
        .select()
        .single();

      if (error) throw error;

      await logAdminAction(
        'DONATION_METHOD_CREATE',
        'DONATION_METHOD',
        data.id,
        `Nuevo método de pago creado: ${method.name}`
      );

      return {
        success: true,
        message: 'Método de pago creado correctamente.',
        data: data as DonationMethod
      };
    }
  } catch (err: any) {
    console.error('Error saving donation method:', err);
    return { success: false, message: err.message || 'Error al guardar el método de pago.' };
  }
}

/**
 * Update donation method status (ACTIVE, INACTIVE, DRAFT, ARCHIVED)
 */
export async function updateDonationMethodStatus(
  methodId: string,
  status: DonationMethodStatus,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado.' };
  }

  try {
    const { data: authUser } = await supabase.auth.getUser();
    const adminId = authUser?.user?.id || null;

    const { error } = await supabase
      .from('donation_methods')
      .update({
        status,
        updated_at: new Date().toISOString(),
        updated_by: adminId
      })
      .eq('id', methodId);

    if (error) throw error;

    await logAdminAction(
      'DONATION_METHOD_STATUS',
      'DONATION_METHOD',
      methodId,
      `Estado cambiado a ${status}. Motivo: ${reason || 'Actualización administrativa'}`
    );

    return {
      success: true,
      message: `Estado actualizado a ${status}.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al actualizar estado del método.' };
  }
}

/**
 * Fetch global donation settings
 */
export async function fetchDonationSettings(): Promise<DonationSettings> {
  if (!isSupabaseConfigured || !supabase) {
    return DEFAULT_DONATION_SETTINGS;
  }

  try {
    const { data, error } = await supabase
      .from('donation_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_DONATION_SETTINGS;
    }

    return data as DonationSettings;
  } catch (err) {
    return DEFAULT_DONATION_SETTINGS;
  }
}

/**
 * Update global donation settings (Admin only)
 */
export async function updateDonationSettings(
  settings: Partial<DonationSettings>
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado.' };
  }

  try {
    const { data: authUser } = await supabase.auth.getUser();
    const adminId = authUser?.user?.id || null;

    const payload = {
      ...settings,
      id: 'global',
      updated_at: new Date().toISOString(),
      updated_by: adminId
    };

    const { error } = await supabase
      .from('donation_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;

    await logAdminAction(
      'DONATION_SETTINGS_UPDATE',
      'DONATION_SETTINGS',
      'global',
      `Configuración de donaciones actualizada. Habilitado: ${settings.enabled !== false}`
    );

    return { success: true, message: 'Configuración actualizada exitosamente.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al actualizar configuración.' };
  }
}

/**
 * Upload public QR image to donation-public bucket
 */
export async function uploadPublicQRImage(
  file: File
): Promise<{ success: boolean; url?: string; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado.' };
  }

  // Validate MIME and size (max 5MB, images only)
  const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowedMime.includes(file.type)) {
    return { success: false, message: 'Formato inválido. Solo se admiten PNG, JPG, WEBP o SVG.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: 'El archivo excede el límite máximo de 5MB.' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const cleanFileName = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('donation-public')
      .upload(`qr/${cleanFileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // If bucket does not exist or fails, provide clear notice
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('donation-public')
      .getPublicUrl(`qr/${cleanFileName}`);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      message: 'Imagen QR cargada correctamente.'
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al subir la imagen QR.' };
  }
}

/**
 * Upload user payment receipt to donation-receipts-private bucket
 */
export async function uploadReceiptFile(
  file: File,
  userId: string
): Promise<{ success: boolean; path?: string; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado.' };
  }

  const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
  if (!allowedMime.includes(file.type)) {
    return { success: false, message: 'Formato no admitido. Debe ser imagen (PNG, JPG, WEBP) o PDF.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: 'El comprobante supera los 5MB permitidos.' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/${Date.now()}_receipt.${fileExt}`;

    const { error } = await supabase.storage
      .from('donation-receipts-private')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    return {
      success: true,
      path: filePath,
      message: 'Comprobante subido al almacenamiento privado seguro.'
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al guardar el comprobante.' };
  }
}

/**
 * Submit voluntary donation report
 */
export async function submitDonationReport(report: {
  method_id: string;
  method_name: string;
  method_type: any;
  amount: number;
  currency: string;
  reference: string;
  donor_name?: string;
  is_anonymous: boolean;
  user_comment?: string;
  receipt_url?: string;
}): Promise<{ success: boolean; message: string; reportId?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  if (!report.reference || report.reference.trim() === '') {
    return { success: false, message: 'El número o código de referencia es obligatorio.' };
  }

  if (!report.amount || report.amount <= 0 || isNaN(report.amount)) {
    return { success: false, message: 'Ingresa un monto válido mayor a cero.' };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    const { data, error } = await supabase
      .from('donation_reports')
      .insert({
        user_id: userId,
        method_id: report.method_id,
        method_name: report.method_name,
        method_type: report.method_type,
        amount: Number(report.amount.toFixed(2)),
        currency: report.currency || 'USD',
        reference: report.reference.trim(),
        donor_name: report.is_anonymous ? 'Donante Anónimo' : report.donor_name || 'Donante Anónimo',
        is_anonymous: report.is_anonymous !== false,
        receipt_url: report.receipt_url || null,
        user_comment: report.user_comment || null,
        status: 'PENDING'
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      success: true,
      message: '¡Tu reporte de aporte ha sido enviado para revisión! Muchas gracias por apoyar a OLA SOCIAL.',
      reportId: data.id
    };
  } catch (err: any) {
    console.error('Error submitting donation report:', err);
    return { success: false, message: err.message || 'Error al enviar el reporte.' };
  }
}

/**
 * Fetch donation reports for Admin review queue
 */
export async function fetchDonationReports(
  statusFilter: string = 'ALL',
  limit: number = 50
): Promise<DonationReport[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('donation_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching donation reports:', error.message);
      return [];
    }

    return (data as DonationReport[]) || [];
  } catch (err) {
    return [];
  }
}

/**
 * Review a donation report (Admin only)
 */
export async function reviewDonationReport(
  reportId: string,
  status: DonationReportStatus,
  adminNotes?: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase no configurado.' };
  }

  try {
    // Try RPC first
    const { error: rpcError } = await supabase.rpc('admin_review_donation_report', {
      p_report_id: reportId,
      p_status: status,
      p_admin_notes: adminNotes || null
    });

    if (!rpcError) {
      return {
        success: true,
        message: `Reporte dictaminado como ${status}.`
      };
    }

    // Direct fallback
    const { data: authData } = await supabase.auth.getUser();
    const adminId = authData?.user?.id || null;

    const { error } = await supabase
      .from('donation_reports')
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;

    await logAdminAction(
      'DONATION_REPORT_REVIEW',
      'DONATION_REPORT',
      reportId,
      `Reporte dictaminado como ${status}. Nota: ${adminNotes || 'Sin nota'}`
    );

    return {
      success: true,
      message: `Reporte dictaminado como ${status}.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error al dictaminar el reporte.' };
  }
}

/**
 * Fetch real donation statistics (Zero fabricated amounts)
 */
export async function fetchDonationStats(): Promise<DonationStatsSummary> {
  const zeroStats: DonationStatsSummary = {
    active_methods_count: 0,
    inactive_methods_count: 0,
    total_reports_count: 0,
    pending_reports_count: 0,
    confirmed_reports_count: 0,
    rejected_reports_count: 0,
    total_reported_by_currency: {},
    total_confirmed_by_currency: {}
  };

  if (!isSupabaseConfigured || !supabase) {
    return zeroStats;
  }

  try {
    const [methodsRes, reportsRes] = await Promise.all([
      supabase.from('donation_methods').select('id, status'),
      supabase.from('donation_reports').select('id, status, amount, currency')
    ]);

    const methods = methodsRes.data || [];
    const reports = reportsRes.data || [];

    const activeMethods = methods.filter((m) => m.status === 'ACTIVE').length;
    const inactiveMethods = methods.filter((m) => m.status !== 'ACTIVE').length;

    let pendingCount = 0;
    let confirmedCount = 0;
    let rejectedCount = 0;

    const reportedByCurrency: Record<string, number> = {};
    const confirmedByCurrency: Record<string, number> = {};

    reports.forEach((r) => {
      const curr = r.currency || 'USD';
      const amt = Number(r.amount) || 0;

      reportedByCurrency[curr] = (reportedByCurrency[curr] || 0) + amt;

      if (r.status === 'PENDING' || r.status === 'UNDER_REVIEW') {
        pendingCount++;
      } else if (r.status === 'CONFIRMED') {
        confirmedCount++;
        confirmedByCurrency[curr] = (confirmedByCurrency[curr] || 0) + amt;
      } else if (r.status === 'REJECTED') {
        rejectedCount++;
      }
    });

    return {
      active_methods_count: activeMethods,
      inactive_methods_count: inactiveMethods,
      total_reports_count: reports.length,
      pending_reports_count: pendingCount,
      confirmed_reports_count: confirmedCount,
      rejected_reports_count: rejectedCount,
      total_reported_by_currency: reportedByCurrency,
      total_confirmed_by_currency: confirmedByCurrency
    };
  } catch (err) {
    console.error('Error fetching donation stats:', err);
    return zeroStats;
  }
}
