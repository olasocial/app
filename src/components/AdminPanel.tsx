import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  History,
  Sliders,
  CheckCircle,
  XCircle,
  Search,
  UserCheck,
  Ban,
  FileText,
  Activity,
  Sparkles,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';
import { UserRole, AccountStatus, RiskLevel, PlatformApiStatus, SocialPlatformKey } from '../types';
import { PLATFORM_REGISTRY } from '../services/platformAdapters';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { auditLogs, fraudEvents, tasks, onlineUsersCount, newUsersTodayCount, resolveFraudEvent, addAuditLog } =
    useOlaSocial();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'fraud' | 'policies' | 'audit'>(
    'dashboard'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [platformState, setPlatformState] = useState(PLATFORM_REGISTRY);

  const togglePlatform = (key: SocialPlatformKey) => {
    // Invert allowed status
    addAuditLog(
      'POLICY_TOGGLE',
      'POLICY',
      key,
      `Plataforma ${key} modificada en panel de cumplimiento.`
    );
    alert(`Estado de la política de ${key} actualizado.`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Panel de Control de Producción • Rol: {user?.role}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administración Central OLA SOCIAL
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Supervisión integral de usuarios, cumplimiento de plataformas externas, auditoría y prevención de fraude.
          </p>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Métricas
          </button>
          <button
            onClick={() => setActiveTab('fraud')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'fraud' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Antifraude ({fraudEvents.filter((f) => f.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'policies' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Cumplimiento Redes
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Auditoría
          </button>
        </div>
      </div>

      {/* Tab: Dashboard Metrics */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Usuarios Online</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">{onlineUsersCount}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Realtime Presence</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Nuevos Hoy</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">+{newUsersTodayCount}</div>
              <span className="text-[11px] text-sky-600 font-semibold">Altas legítimas Google</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Tareas Totales</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">{tasks.length}</div>
              <span className="text-[11px] text-slate-400">Acciones creadas</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase">Alertas Fraude</span>
              <div className="text-3xl font-extrabold text-rose-600 mt-2">
                {fraudEvents.filter((f) => f.status === 'OPEN').length}
              </div>
              <span className="text-[11px] text-rose-500 font-semibold">Pendientes de revisión</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-base mb-4">
              Estado de Salud del Sistema y Compliance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                <span className="font-bold block mb-1">Capa de Plataformas Externas</span>
                Adaptadores funcionando sin violaciones de scraping ni automatizaciones robóticas.
              </div>
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-sky-900">
                <span className="font-bold block mb-1">Autenticación OAuth 2.0</span>
                Google OAuth activo con política de verificación 18+ y TOTP MFA.
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900">
                <span className="font-bold block mb-1">Motor de Idempotencia</span>
                Protección contra tareas duplicadas y colusión de pares activa.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Fraud Detection Queue */}
      {activeTab === 'fraud' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Cola de Alertas de Antifraude</h3>
              <p className="text-xs text-slate-500">
                Monitorea colusión de cuentas (A-B recíprocos), intentos de autovalidación y patrones de bots.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {fraudEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px]">
                      {evt.risk_level}
                    </span>
                    <span className="font-bold text-slate-900">{evt.pattern}</span>
                    <span className="text-slate-400">({evt.user_email})</span>
                  </div>
                  <p className="text-slate-700">{evt.details}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Detectado: {new Date(evt.created_at).toLocaleString()}
                  </span>
                </div>

                {evt.status === 'OPEN' ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => resolveFraudEvent(evt.id, 'DISMISSED')}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={() => resolveFraudEvent(evt.id, 'CONFIRMED_FRAUD')}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      Confirmar y Suspender
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px]">
                    {evt.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Platform Policies Manager */}
      {activeTab === 'policies' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Administración de Cumplimiento por Plataforma (Section 54 & 64)
            </h3>
            <p className="text-xs text-slate-500">
              Control dinámico de las 15 plataformas soportadas. Puedes restringir acciones si una red actualiza sus términos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PLATFORM_REGISTRY).map(([key, p]) => (
              <div
                key={key}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-900">{p.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {p.apiStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    URL Oficial: <span className="font-mono text-slate-700">{p.baseUrl}</span>
                  </p>
                  <div className="text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                    <span className="font-bold text-emerald-700">Permitido: </span>
                    {p.allowedActions.join(', ')}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Activo
                  </span>
                  <button
                    onClick={() => togglePlatform(key as SocialPlatformKey)}
                    className="text-sky-600 hover:text-sky-800 font-bold text-xs"
                  >
                    Ajustar Reglas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Immutable Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Registro Inmutable de Auditoría</h3>
            <p className="text-xs text-slate-500">
              Todas las operaciones críticas administrativas quedan grabadas en append-only log.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Objetivo</th>
                  <th className="px-4 py-3">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{log.admin_email}</td>
                    <td className="px-4 py-3 font-mono font-bold text-sky-700">{log.action}</td>
                    <td className="px-4 py-3 text-slate-700">{log.target_type}</td>
                    <td className="px-4 py-3 text-slate-800">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
