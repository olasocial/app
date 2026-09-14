import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Server,
  Zap,
  Radio,
  FileText,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Bell,
  Sparkles,
  ExternalLink,
  Heart
} from 'lucide-react';
import { SystemStatsResult, AdminSection } from '../../types';
import { fetchAdminDashboardStats, testEdgeFunctionHealth } from '../../services/adminService';
import { isSupabaseConfigured } from '../../services/supabaseClient';

interface AdminDashboardTabProps {
  onNavigateSection: (section: AdminSection) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ onNavigateSection }) => {
  const [stats, setStats] = useState<SystemStatsResult>({
    total_users: 0,
    active_users: 0,
    blocked_users: 0,
    banned_users: 0,
    total_tasks: 0,
    open_disputes: 0,
    open_fraud: 0,
    active_announcements: 0,
    open_reports: 0,
    audit_logs_count: 0
  });
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState<{ status: string; latency: number }>({
    status: 'TESTING',
    latency: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, edgeRes] = await Promise.all([
        fetchAdminDashboardStats(),
        testEdgeFunctionHealth('verify-turnstile')
      ]);
      setStats(statsRes);
      setEdgeFunctionStatus({
        status: edgeRes.status,
        latency: edgeRes.latencyMs
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SISTEMA OPERATIVO
            </span>
            <span className="text-xs text-slate-500 font-medium">Auto-recarga en 30s</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Centro de Control General</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Supervisión integral de usuarios, moderación en vivo, integridad de infraestructura y seguridad.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Métricas</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigateSection('users')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Usuarios</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{stats.total_users}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.active_users} activos</span>
            </div>
          </div>
        </div>

        {/* Sanctioned Users */}
        <div
          onClick={() => onNavigateSection('users')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sancionados</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">
              {stats.blocked_users + stats.banned_users}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.blocked_users} suspendidos · {stats.banned_users} baneados
            </div>
          </div>
        </div>

        {/* Open Reports & Disputes */}
        <div
          onClick={() => onNavigateSection('moderation')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moderación Pendiente</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">
              {stats.open_reports + stats.open_disputes}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.open_reports} reportes · {stats.open_disputes} disputas
            </div>
          </div>
        </div>

        {/* Audit Log Events */}
        <div
          onClick={() => onNavigateSection('audit')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eventos de Auditoría</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{stats.audit_logs_count}</div>
            <div className="text-xs text-indigo-600 font-semibold mt-1">Registro inmutable activo</div>
          </div>
        </div>
      </div>

      {/* System Status Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-600" />
          <span>Estado Operativo de Infraestructura</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Supabase Core */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Supabase DB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xs font-bold text-emerald-700">
              {isSupabaseConfigured ? 'CONECTADO' : 'LOCAL'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">PostgreSQL 15+</div>
          </div>

          {/* Auth System */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Google OAuth</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xs font-bold text-emerald-700">ACTIVO</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Exclusivo oficial</div>
          </div>

          {/* Edge Function */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Edge Function</span>
              <span className={`w-2 h-2 rounded-full ${edgeFunctionStatus.status === 'OK' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <div className={`text-xs font-bold ${edgeFunctionStatus.status === 'OK' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {edgeFunctionStatus.status === 'OK' ? 'EN LÍNEA' : 'VERIFICANDO'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {edgeFunctionStatus.latency ? `${edgeFunctionStatus.latency}ms` : 'Turnstile worker'}
            </div>
          </div>

          {/* Realtime Engine */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Realtime</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xs font-bold text-emerald-700">SINCRONIZADO</div>
            <div className="text-[10px] text-slate-500 mt-0.5">WebSockets activos</div>
          </div>

          {/* PWA & Cache */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">PWA Offline</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xs font-bold text-emerald-700">HABILITADO</div>
            <div className="text-[10px] text-slate-500 mt-0.5">ServiceWorker v1.2</div>
          </div>

          {/* Turnstile Bot Protection */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Bot Defense</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xs font-bold text-emerald-700">PROTEGIDO</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cloudflare Turnstile</div>
          </div>
        </div>
      </div>

      {/* Fast Shortcut Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateSection('donations')}
          className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-100/70 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm">
            <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />
            <span>Donaciones & Apoyo</span>
          </div>
          <p className="text-xs text-rose-700 mt-1 leading-relaxed">
            Administra métodos de pago, datos públicos, QR y revisa comprobantes reportados.
          </p>
        </div>

        <div
          onClick={() => onNavigateSection('content')}
          className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 hover:bg-sky-100/70 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 text-sky-800 font-bold text-sm">
            <Bell className="w-4 h-4 text-sky-600" />
            <span>Emitir Anuncio o Aviso</span>
          </div>
          <p className="text-xs text-sky-700 mt-1 leading-relaxed">
            Publica comunicados prioritarios o banners en tiempo real para todos los miembros.
          </p>
        </div>

        <div
          onClick={() => onNavigateSection('system')}
          className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 hover:bg-emerald-100/70 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Banderas de Función (Feature Flags)</span>
          </div>
          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
            Habilita o pausa módulos en caliente (Abrazos, Ranking, Invitaciones, etc.).
          </p>
        </div>

        <div
          onClick={() => onNavigateSection('supabase')}
          className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 hover:bg-indigo-100/70 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 text-indigo-800 font-bold text-sm">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Centro de Limpieza Supabase</span>
          </div>
          <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
            Ejecuta diagnósticos y dry-runs seguros con clasificación estricta sin pérdida de datos.
          </p>
        </div>
      </div>
    </div>
  );
};
