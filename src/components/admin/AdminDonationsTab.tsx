import React, { useState, useEffect } from 'react';
import {
  Heart,
  CreditCard,
  Building2,
  Smartphone,
  Coins,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  FileCheck,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Upload,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import {
  DonationMethod,
  DonationMethodType,
  DonationMethodStatus,
  DonationReport,
  DonationReportStatus,
  DonationSettings,
  DonationStatsSummary
} from '../../types';
import {
  fetchAllDonationMethods,
  saveDonationMethod,
  updateDonationMethodStatus,
  fetchDonationSettings,
  updateDonationSettings,
  fetchDonationReports,
  reviewDonationReport,
  fetchDonationStats,
  uploadPublicQRImage,
  DEFAULT_DONATION_SETTINGS
} from '../../services/donationService';
import { supabase } from '../../services/supabaseClient';

export const AdminDonationsTab: React.FC = () => {
  const [subtab, setSubtab] = useState<'summary' | 'methods' | 'settings' | 'reports' | 'stats'>('summary');

  const [methods, setMethods] = useState<DonationMethod[]>([]);
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_DONATION_SETTINGS);
  const [reports, setReports] = useState<DonationReport[]>([]);
  const [stats, setStats] = useState<DonationStatsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reportFilter, setReportFilter] = useState<string>('ALL');

  // Modal / Form state for Creating/Editing Method
  const [isMethodModalOpen, setIsMethodModalOpen] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<Partial<DonationMethod> | null>(null);
  const [methodFormError, setMethodFormError] = useState<string | null>(null);
  const [savingMethod, setSavingMethod] = useState<boolean>(false);
  const [uploadingQr, setUploadingQr] = useState<boolean>(false);

  // Settings form state
  const [settingsState, setSettingsState] = useState<DonationSettings>(DEFAULT_DONATION_SETTINGS);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Report Review state
  const [selectedReport, setSelectedReport] = useState<DonationReport | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [reviewingReport, setReviewingReport] = useState<boolean>(false);

  useEffect(() => {
    loadAllData();

    // Subscribe to realtime changes
    const channel = supabase
      ?.channel('admin_realtime_donations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_methods' }, () => {
        loadMethods();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donation_reports' }, () => {
        loadReports();
        loadStats();
      })
      .subscribe();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadMethods(), loadSettings(), loadReports(), loadStats()]);
    setLoading(false);
  };

  const loadMethods = async () => {
    const data = await fetchAllDonationMethods();
    setMethods(data);
  };

  const loadSettings = async () => {
    const data = await fetchDonationSettings();
    setSettings(data);
    setSettingsState(data);
  };

  const loadReports = async () => {
    const data = await fetchDonationReports(reportFilter);
    setReports(data);
  };

  const loadStats = async () => {
    const data = await fetchDonationStats();
    setStats(data);
  };

  useEffect(() => {
    loadReports();
  }, [reportFilter]);

  // Method Modal Handlers
  const handleOpenAddMethod = () => {
    setEditingMethod({
      name: '',
      type: 'PAYPAL',
      currency: 'USD',
      status: 'ACTIVE',
      display_order: methods.length + 1,
      public_data: {
        account_email: '',
        pay_link: ''
      },
      warning_note: 'Verifica cuidadosamente los datos antes de realizar el aporte.',
      instructions: 'Indica tu alias o correo en el concepto para poder reconocer tu aporte.'
    });
    setMethodFormError(null);
    setIsMethodModalOpen(true);
  };

  const handleOpenEditMethod = (method: DonationMethod) => {
    setEditingMethod({ ...method });
    setMethodFormError(null);
    setIsMethodModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;

    if (!editingMethod.name?.trim()) {
      setMethodFormError('El nombre del método es obligatorio.');
      return;
    }

    setSavingMethod(true);
    setMethodFormError(null);

    try {
      const res = await saveDonationMethod(editingMethod);
      if (res.success) {
        setIsMethodModalOpen(false);
        setEditingMethod(null);
        await loadMethods();
        await loadStats();
      } else {
        setMethodFormError(res.message);
      }
    } catch (err: any) {
      setMethodFormError(err.message || 'Error al guardar método.');
    } finally {
      setSavingMethod(false);
    }
  };

  const handleToggleMethodStatus = async (method: DonationMethod) => {
    const nextStatus: DonationMethodStatus = method.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateDonationMethodStatus(method.id, nextStatus, `Cambio rápido desde el panel`);
    await loadMethods();
    await loadStats();
  };

  const handleArchiveMethod = async (method: DonationMethod) => {
    if (!window.confirm(`¿Estás seguro de archivar el método "${method.name}"? No será visible para los usuarios.`)) {
      return;
    }
    await updateDonationMethodStatus(method.id, 'ARCHIVED', 'Archivado por el administrador');
    await loadMethods();
    await loadStats();
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingMethod) return;
    const file = e.target.files[0];

    setUploadingQr(true);
    setMethodFormError(null);

    const res = await uploadPublicQRImage(file);
    if (res.success && res.url) {
      setEditingMethod({
        ...editingMethod,
        qr_image_url: res.url
      });
    } else {
      setMethodFormError(res.message);
    }
    setUploadingQr(false);
  };

  // Settings Save Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsNotice(null);

    const res = await updateDonationSettings(settingsState);
    if (res.success) {
      setSettingsNotice('Configuración guardada exitosamente.');
      await loadSettings();
    } else {
      setSettingsNotice(`Error: ${res.message}`);
    }
    setSavingSettings(false);
  };

  // Review Report Handler
  const handleReviewReport = async (status: DonationReportStatus) => {
    if (!selectedReport) return;
    setReviewingReport(true);
    const res = await reviewDonationReport(selectedReport.id, status, adminNoteInput);
    if (res.success) {
      setSelectedReport(null);
      setAdminNoteInput('');
      await loadReports();
      await loadStats();
    }
    setReviewingReport(false);
  };

  const getMethodTypeIcon = (type: DonationMethodType) => {
    switch (type) {
      case 'BINANCE_PAY':
        return <Coins className="w-4 h-4 text-amber-500" />;
      case 'PAYPAL':
        return <CreditCard className="w-4 h-4 text-sky-600" />;
      case 'PAGO_MOVIL':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'BANK_TRANSFER':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      default:
        return <Heart className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>Módulo de Donaciones & Aportes Voluntarios</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Apoyo a OLA SOCIAL
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administra métodos de donación (Binance Pay, PayPal, Pago Móvil, Bancos), revisa comprobantes y calibra avisos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={handleOpenAddMethod}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-bold hover:opacity-95 transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar Método</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSubtab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            subtab === 'summary' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setSubtab('methods')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            subtab === 'methods' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Métodos de Pago</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200 text-slate-700">
            {methods.length}
          </span>
        </button>
        <button
          onClick={() => setSubtab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            subtab === 'reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Comprobantes & Reportes</span>
          {stats?.pending_reports_count ? (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500 text-white font-black">
              {stats.pending_reports_count}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setSubtab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            subtab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Configuración Global
        </button>
        <button
          onClick={() => setSubtab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            subtab === 'stats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Estadísticas
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: RESUMEN                                         */}
      {/* ========================================================= */}
      {subtab === 'summary' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Métodos Activos</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats?.active_methods_count ?? 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {stats?.inactive_methods_count ?? 0} inactivos o en borrador
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-600 uppercase">Aportes Pendientes</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {stats?.pending_reports_count ?? 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Requieren revisión de referencia</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase">Aportes Confirmados</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {stats?.confirmed_reports_count ?? 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Revisados por administración</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Reportados</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats?.total_reports_count ?? 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {stats?.rejected_reports_count ?? 0} desestimados
              </span>
            </div>
          </div>

          {/* Currency Totals Breakdown (Real Data Only) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Montos Reales de Aportes (Por Moneda)
            </h3>

            {stats && Object.keys(stats.total_reported_by_currency).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(stats.total_reported_by_currency).map(([currency, reportedAmt]) => {
                  const confirmedAmt = Number(stats.total_confirmed_by_currency[currency] || 0);
                  const reportedNum = Number(reportedAmt || 0);
                  return (
                    <div key={currency} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase">{currency}</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-600">Confirmado:</span>
                        <span className="text-base font-black text-emerald-700">
                          {confirmedAmt.toFixed(2)} {currency}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs text-slate-400 pt-1 border-t border-slate-200">
                        <span>Reportado total:</span>
                        <span className="font-semibold text-slate-600">
                          {reportedNum.toFixed(2)} {currency}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                No hay datos registrados aún. Los montos se calcularán automáticamente al recibir y confirmar comprobantes reales.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: MÉTODOS DE PAGO                                 */}
      {/* ========================================================= */}
      {subtab === 'methods' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Configura los canales oficiales de aporte. Los cambios se reflejan inmediatamente en la aplicación.
            </p>
            <button
              onClick={handleOpenAddMethod}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              + Nuevo Método
            </button>
          </div>

          {methods.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
              <Coins className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No hay métodos de donación configurados.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Crea el primer método oficial (Binance Pay, PayPal, Pago Móvil o Transferencia Bancaria) para que aparezca a los usuarios.
              </p>
              <button
                onClick={handleOpenAddMethod}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700"
              >
                Crear Primer Método
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {methods.map((m) => (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    m.status === 'ACTIVE'
                      ? 'border-slate-200 shadow-2xs'
                      : 'border-slate-200/60 bg-slate-50/70 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100">{getMethodTypeIcon(m.type)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{m.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                            {m.currency}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {m.type.replace('_', ' ')} • Orden: {m.display_order}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.status === 'INACTIVE'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  {m.description && <p className="text-xs text-slate-500 mb-3">{m.description}</p>}

                  {/* Public Data preview */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1 font-mono">
                    {Object.entries(m.public_data || {}).map(([k, v]) => {
                      if (!v) return null;
                      return (
                        <div key={k} className="flex items-baseline justify-between truncate">
                          <span className="text-slate-400 uppercase text-[10px]">{k.replace('_', ' ')}:</span>
                          <span className="font-bold text-slate-800 truncate max-w-[200px]">{String(v)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleMethodStatus(m)}
                      className={`text-xs font-bold flex items-center gap-1 ${
                        m.status === 'ACTIVE' ? 'text-slate-500 hover:text-slate-700' : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      {m.status === 'ACTIVE' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{m.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditMethod(m)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleArchiveMethod(m)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50"
                        title="Archivar método"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: COMPROBANTES / REPORTES                         */}
      {/* ========================================================= */}
      {subtab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-slate-500">
              Comprobantes de aportes reportados voluntariamente por miembros de la comunidad.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Estado:</span>
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="UNDER_REVIEW">En Revisión</option>
                <option value="CONFIRMED">Confirmados</option>
                <option value="REJECTED">Rechazados</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-3.5 py-3">Fecha</th>
                  <th className="px-3.5 py-3">Método</th>
                  <th className="px-3.5 py-3">Monto</th>
                  <th className="px-3.5 py-3">Referencia</th>
                  <th className="px-3.5 py-3">Donante</th>
                  <th className="px-3.5 py-3">Estado</th>
                  <th className="px-3.5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                      No hay comprobantes reportados con este filtro.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-3.5 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {r.method_name}
                      </td>
                      <td className="px-3.5 py-3 font-black text-slate-900 whitespace-nowrap">
                        {r.amount.toFixed(2)} {r.currency}
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-sky-700 select-all whitespace-nowrap">
                        {r.reference}
                      </td>
                      <td className="px-3.5 py-3 text-slate-700 whitespace-nowrap">
                        {r.donor_name || 'Anónimo'}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedReport(r);
                            setAdminNoteInput(r.admin_notes || '');
                          }}
                          className="px-3 py-1 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: CONFIGURACIÓN GLOBAL                            */}
      {/* ========================================================= */}
      {subtab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Configuración Global de Donaciones</h3>
            <p className="text-xs text-slate-500">
              Personaliza los textos, visibilidad del botón y avisos legales sin tocar código fuente.
            </p>
          </div>

          {settingsNotice && (
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 font-semibold">
              {settingsNotice}
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-sm text-slate-900 block">Mostrar Botón "Apoyar OLA SOCIAL"</span>
              <span className="text-xs text-slate-500">
                Si está desactivado, el botón se oculta a usuarios normales sin eliminar los métodos guardados.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settingsState.enabled}
                onChange={(e) => setSettingsState({ ...settingsState, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título Principal del Modal</label>
              <input
                type="text"
                value={settingsState.title}
                onChange={(e) => setSettingsState({ ...settingsState, title: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo Descriptivo</label>
              <input
                type="text"
                value={settingsState.subtitle || ''}
                onChange={(e) => setSettingsState({ ...settingsState, subtitle: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Texto de Agradecimiento</label>
            <textarea
              rows={2}
              value={settingsState.thank_you_message || ''}
              onChange={(e) => setSettingsState({ ...settingsState, thank_you_message: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ¿Para qué se utilizan los aportes? (Transparencia)
            </label>
            <textarea
              rows={3}
              value={settingsState.transparency_text || ''}
              onChange={(e) => setSettingsState({ ...settingsState, transparency_text: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Aviso Legal / Disclaimer de Seguridad</label>
            <textarea
              rows={2}
              value={settingsState.disclaimer_text || ''}
              onChange={(e) => setSettingsState({ ...settingsState, disclaimer_text: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50"
            >
              {savingSettings ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 5: ESTADÍSTICAS REALES                             */}
      {/* ========================================================= */}
      {subtab === 'stats' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              Métricas y Distribución de Canales de Aporte
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Total de Métodos Creados</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{methods.length}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Total de Comprobantes Recibidos</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{reports.length}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Tasa de Confirmación</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {reports.length > 0
                    ? `${Math.round(((stats?.confirmed_reports_count || 0) / reports.length) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR MÉTODO DE DONACIÓN                  */}
      {/* ========================================================= */}
      {isMethodModalOpen && editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-4 relative">
            <button
              onClick={() => setIsMethodModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-slate-900">
              {editingMethod.id ? 'Editar Método de Aporte' : 'Nuevo Método de Aporte'}
            </h3>

            {methodFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {methodFormError}
              </div>
            )}

            <form onSubmit={handleSaveMethod} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Mostrado *</label>
                  <input
                    type="text"
                    required
                    value={editingMethod.name || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                    placeholder="Ej. Binance Pay OLA"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Canal *</label>
                  <select
                    value={editingMethod.type || 'PAYPAL'}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        type: e.target.value as DonationMethodType
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="BINANCE_PAY">Binance Pay</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="PAGO_MOVIL">Pago Móvil</option>
                    <option value="BANK_TRANSFER">Transferencia Bancaria</option>
                    <option value="OTHER">Otro Canal Personalizado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Moneda *</label>
                  <input
                    type="text"
                    required
                    value={editingMethod.currency || 'USD'}
                    onChange={(e) => setEditingMethod({ ...editingMethod, currency: e.target.value.toUpperCase() })}
                    placeholder="USD, VES, EUR, USDT"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Orden de Presentación</label>
                  <input
                    type="number"
                    min="1"
                    value={editingMethod.display_order ?? 1}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, display_order: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={editingMethod.status || 'ACTIVE'}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        status: e.target.value as DonationMethodStatus
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="ACTIVE">Activo (Visible)</option>
                    <option value="INACTIVE">Inactivo (Pausado)</option>
                    <option value="DRAFT">Borrador</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Public Payment Fields based on Type */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase">Datos Públicos de Cobro</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                    Visible para los donantes
                  </span>
                </div>

                {editingMethod.type === 'BINANCE_PAY' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Binance Pay ID / Pay ID *
                      </label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.binance_id || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, binance_id: e.target.value }
                          })
                        }
                        placeholder="Ej. 123456789"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Enlace de Pago Binance Pay (Opcional)
                      </label>
                      <input
                        type="url"
                        value={editingMethod.public_data?.pay_link || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, pay_link: e.target.value }
                          })
                        }
                        placeholder="https://app.binance.com/..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {editingMethod.type === 'PAYPAL' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Correo de Recepción PayPal *
                      </label>
                      <input
                        type="email"
                        value={editingMethod.public_data?.account_email || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, account_email: e.target.value }
                          })
                        }
                        placeholder="pagos@olasocial.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Enlace PayPal.me (Opcional)
                      </label>
                      <input
                        type="url"
                        value={editingMethod.public_data?.pay_link || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, pay_link: e.target.value }
                          })
                        }
                        placeholder="https://paypal.me/..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {editingMethod.type === 'PAGO_MOVIL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Banco *</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.bank_name || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, bank_name: e.target.value }
                          })
                        }
                        placeholder="Ej. Banesco, Mercantil, Venezuela"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teléfono *</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.phone || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, phone: e.target.value }
                          })
                        }
                        placeholder="04121234567"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cédula o RIF *</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.holder_id || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, holder_id: e.target.value }
                          })
                        }
                        placeholder="V-12345678 o J-123456789"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre del Titular *</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.holder_name || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, holder_name: e.target.value }
                          })
                        }
                        placeholder="Nombre y Apellido del Titular"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                )}

                {editingMethod.type === 'BANK_TRANSFER' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Banco *</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.bank_name || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, bank_name: e.target.value }
                          })
                        }
                        placeholder="Ej. Banesco, Chase, Santander"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Cuenta</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.account_type || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, account_type: e.target.value }
                          })
                        }
                        placeholder="Corriente / Ahorros / Checking"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Número de Cuenta / IBAN *</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.account_number || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, account_number: e.target.value }
                          })
                        }
                        placeholder="0134-..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Titular *</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.holder_name || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, holder_name: e.target.value }
                          })
                        }
                        placeholder="Nombre completo"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Documento de Identidad</label>
                      <input
                        type="text"
                        value={editingMethod.public_data?.holder_id || ''}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            public_data: { ...editingMethod.public_data, holder_id: e.target.value }
                          })
                        }
                        placeholder="C.I. / RIF / Pasaporte"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* QR Upload Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Imagen de Código QR (Opcional)</label>
                <div className="flex items-center gap-3">
                  {editingMethod.qr_image_url && (
                    <img
                      src={editingMethod.qr_image_url}
                      alt="Preview QR"
                      className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-slate-50"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleQrUpload}
                    disabled={uploadingQr}
                    className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {uploadingQr && <span className="text-xs text-sky-600 animate-pulse">Subiendo QR...</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instrucciones para el Donante</label>
                <textarea
                  rows={2}
                  value={editingMethod.instructions || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                  placeholder="Pasos específicos que debe seguir el usuario..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nota de Advertencia (Opcional)</label>
                <input
                  type="text"
                  value={editingMethod.warning_note || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, warning_note: e.target.value })}
                  placeholder="Ej. Verifica el destinatario antes de confirmar."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMethodModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMethod}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingMethod ? 'Guardando...' : 'Guardar Método'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVISIÓN DE COMPROBANTE DE DONACIÓN                */}
      {/* ========================================================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-4 relative">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-sky-600" />
              Revisar Comprobante de Aporte
            </h3>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Método:</span>
                <span className="font-extrabold text-slate-800">{selectedReport.method_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Monto Reportado:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {selectedReport.amount.toFixed(2)} {selectedReport.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Referencia:</span>
                <span className="font-mono font-bold text-sky-700 select-all">{selectedReport.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Donante:</span>
                <span className="font-bold text-slate-700">{selectedReport.donor_name || 'Anónimo'}</span>
              </div>
              {selectedReport.user_comment && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Comentario del Usuario:</span>
                  <p className="text-slate-700 italic mt-0.5">{selectedReport.user_comment}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nota Administrativa (Opcional)</label>
              <textarea
                rows={2}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Ej. Referencia bancaria validada en extracto de cuenta."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 resize-none"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                disabled={reviewingReport}
                onClick={() => handleReviewReport('CONFIRMED')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Confirmar Aporte
              </button>
              <button
                type="button"
                disabled={reviewingReport}
                onClick={() => handleReviewReport('UNDER_REVIEW')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                En Revisión
              </button>
              <button
                type="button"
                disabled={reviewingReport}
                onClick={() => handleReviewReport('REJECTED')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
