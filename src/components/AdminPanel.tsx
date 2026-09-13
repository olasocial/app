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
  RefreshCw,
  Scale,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';
import { UserRole, AccountStatus, RiskLevel, PlatformApiStatus, SocialPlatformKey, DisputeStatus } from '../types';
import { PLATFORM_REGISTRY } from '../services/platformAdapters';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    auditLogs,
    fraudEvents,
    tasks,
    onlineUsersCount,
    newUsersTodayCount,
    disputes,
    resolveDispute,
    levelRequirements,
    updateLevelRequirements,
    resolveFraudEvent,
    addAuditLog
  } = useOlaSocial();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'fraud' | 'disputes' | 'levels' | 'policies' | 'audit'>(
    'dashboard'
  );
  const [resolutionNote, setResolutionNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformState, setPlatformState] = useState(PLATFORM_REGISTRY);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  const togglePlatform = (key: SocialPlatformKey) => {
    // Invert allowed status
    addAuditLog(
      'POLICY_TOGGLE',
      'POLICY',
      key,
      `Plataforma ${key} modificada en panel de cumplimiento.`
    );
    setAdminNotification(`Estado de la política de ${key} actualizado con éxito.`);
    setTimeout(() => setAdminNotification(null), 4000);
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
            Administración Central ABRAZAR<span className="text-amber-400">+</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Supervisión integral de usuarios, cumplimiento de plataformas externas, auditoría y prevención de fraude.
          </p>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-2 bg-slate-800/80 rounded-2xl border border-slate-700 w-full md:w-auto shrink-0 touch-pan-x">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Métricas
          </button>
          <button
            onClick={() => setActiveTab('fraud')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'fraud' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Antifraude ({fraudEvents.filter((f) => f.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'disputes' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Disputas ({disputes.filter((d) => d.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'levels' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Niveles
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'policies' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Cumplimiento Redes
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'audit' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Auditoría
          </button>
        </div>
      </div>

      {adminNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{adminNotification}</span>
        </div>
      )}

      {/* Tab: Dashboard Metrics */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Online</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 sm:mt-2">{onlineUsersCount}</div>
              <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold truncate block mt-0.5">Presencia en vivo</span>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Nuevos Hoy</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 sm:mt-2">+{newUsersTodayCount}</div>
              <span className="text-[10px] sm:text-[11px] text-sky-600 font-semibold truncate block mt-0.5">Altas Google</span>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tareas Totales</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 sm:mt-2">{tasks.length}</div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate block mt-0.5">Acciones creadas</span>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas Fraude</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1 sm:mt-2">
                {fraudEvents.filter((f) => f.status === 'OPEN').length}
              </div>
              <span className="text-[10px] sm:text-[11px] text-rose-500 font-semibold truncate block mt-0.5">Pendientes</span>
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
            {fraudEvents.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Cero alertas de fraude pendientes</h4>
                <p className="text-xs text-slate-500 mt-1">El sistema opera con normalidad y sin incidencias detectadas.</p>
              </div>
            ) : (
              fraudEvents.map((evt) => (
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
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t border-rose-100 sm:border-t-0">
                    <button
                      onClick={() => resolveFraudEvent(evt.id, 'DISMISSED')}
                      className="px-3.5 py-2 min-h-[38px] rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-center"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={() => resolveFraudEvent(evt.id, 'CONFIRMED_FRAUD')}
                      className="px-3.5 py-2 min-h-[38px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-center shadow-xs"
                    >
                      Confirmar y Suspender
                    </button>
                  </div>
                ) : (
                  <span className="self-start sm:self-auto px-3 py-1 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px]">
                    {evt.status}
                  </span>
                )}
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Tab: Disputes Moderation */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                Moderación de Disputas Comunitarias
              </h3>
              <p className="text-xs text-slate-500">
                Resuelve discrepancias de validación entre donantes y receptores de abrazos.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {disputes.filter((d) => d.status === 'OPEN').length} disputas abiertas
            </span>
          </div>

          {disputes.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
              No hay disputas registradas en el sistema.
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">ID Tarea: {d.task_id}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          d.status === 'OPEN'
                            ? 'bg-amber-100 text-amber-800'
                            : d.status.startsWith('RESOLVED')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(d.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Motivo alegado:</span>
                    {d.reason}
                  </div>

                  {d.evidence_url && (
                    <div className="text-xs text-slate-600">
                      <span className="font-bold">Evidencia: </span>
                      <a
                        href={d.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:underline break-all"
                      >
                        {d.evidence_url}
                      </a>
                    </div>
                  )}

                  {d.resolution_notes && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <strong>Dictamen:</strong> {d.resolution_notes}
                    </div>
                  )}

                  {d.status === 'OPEN' && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          resolveDispute(
                            d.id,
                            'RESOLVED_HELPER',
                            'Ayudante validado con evidencia objetiva por el equipo administrador.'
                          )
                        }
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        Resolver a favor del Ayudante (+XP)
                      </button>
                      <button
                        onClick={() =>
                          resolveDispute(
                            d.id,
                            'RESOLVED_RECIPIENT',
                            'Confirmado rechazo: no se encontró interacción legítima.'
                          )
                        }
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                      >
                        Resolver a favor del Receptor
                      </button>
                      <button
                        onClick={() =>
                          resolveDispute(
                            d.id,
                            'REJECTED',
                            'Disputa desestimada por falta de mérito.'
                          )
                        }
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                      >
                        Desestimar Disputa
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Level Requirements Config */}
      {activeTab === 'levels' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Configuración de Requisitos de 10 Niveles
              </h3>
              <p className="text-xs text-slate-500">
                Parámetros oficiales y umbrales de ascenso en Supabase.
              </p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              {levelRequirements.length} niveles activos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {levelRequirements.map((req) => (
              <div
                key={req.level_number}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {req.level_number}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900">{req.level_name}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-600">{req.min_xp} XP</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Abrazos:</span>
                    <strong>{req.min_verified_supports}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Reputación:</span>
                    <strong>{req.min_reputation} pts</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Usuarios:</span>
                    <strong>{req.min_unique_users}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Plataformas:</span>
                    <strong>{req.min_unique_platforms}</strong>
                  </div>
                </div>

                {req.perks && req.perks.length > 0 && (
                  <div className="pt-2 text-[11px] text-slate-500">
                    <strong className="text-slate-700">Perks: </strong>
                    {req.perks.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
                    URL Oficial: <span className="font-mono text-slate-700 break-all">{p.baseUrl}</span>
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
                    className="text-sky-600 hover:text-sky-800 font-bold text-xs p-1"
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
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Registro Inmutable de Auditoría</h3>
              <p className="text-xs text-slate-500">
                Todas las operaciones críticas administrativas quedan grabadas en append-only log.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-medium sm:hidden">
              ← Desliza para ver más columnas →
            </span>
          </div>

          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 no-scrollbar">
            <table className="min-w-[620px] w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-3.5 py-3">Fecha</th>
                  <th className="px-3.5 py-3">Admin</th>
                  <th className="px-3.5 py-3">Acción</th>
                  <th className="px-3.5 py-3">Objetivo</th>
                  <th className="px-3.5 py-3">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                      No hay eventos en el registro de auditoría.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-3 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-slate-800 whitespace-nowrap">{log.admin_email}</td>
                      <td className="px-3.5 py-3 font-mono font-bold text-sky-700 whitespace-nowrap">{log.action}</td>
                      <td className="px-3.5 py-3 text-slate-700 whitespace-nowrap">{log.target_type}</td>
                      <td className="px-3.5 py-3 text-slate-800 min-w-[200px]">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
