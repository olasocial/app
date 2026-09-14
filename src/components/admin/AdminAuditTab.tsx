import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders
} from 'lucide-react';
import { AdminAuditLog, AppError } from '../../types';
import {
  fetchAuditLogs,
  fetchAppErrors,
  resolveAppError,
  exportDataWithAudit
} from '../../services/adminService';

export const AdminAuditTab: React.FC = () => {
  const [subtab, setSubtab] = useState<'audit' | 'errors'>('audit');
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [errors, setErrors] = useState<AppError[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (subtab === 'audit') {
        const data = await fetchAuditLogs({
          action: actionFilter,
          limit: 100
        });
        setLogs(data);
      } else {
        const errData = await fetchAppErrors();
        setErrors(errData);
      }
    } catch (err) {
      console.error('Error loading audit/errors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subtab, actionFilter]);

  const handleResolveError = async (id: string) => {
    const res = await resolveAppError(id);
    if (res.success) {
      await loadData();
    } else {
      alert(res.message);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.reason?.toLowerCase().includes(q) ||
      log.admin_email?.toLowerCase().includes(q) ||
      log.target_user_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Subtab Toggle */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setSubtab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subtab === 'audit'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-600" />
          <span>Registro de Auditoría Inmutable (Append-Only)</span>
        </button>

        <button
          onClick={() => setSubtab('errors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subtab === 'errors'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          <span>Centro de Errores de Aplicación</span>
        </button>
      </div>

      {subtab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Bitácora de Auditoría</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro inmutable garantizado por PostgreSQL. Ningún administrador puede alterar o borrar eventos.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en auditoría..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700"
              >
                <option value="ALL">Todas las Acciones</option>
                <option value="USER_BLOCK">Bloqueos</option>
                <option value="USER_UNBLOCK">Desbloqueos</option>
                <option value="USER_BAN">Baneos</option>
                <option value="REPUTATION_ADJUST">Ajustes Reputación</option>
                <option value="RESTRICTION_CHANGE">Restricciones</option>
                <option value="FLAG_TOGGLE">Banderas de Función</option>
                <option value="MAINTENANCE_TOGGLE">Mantenimiento</option>
                <option value="ANNOUNCEMENT_CREATE">Anuncios</option>
              </select>

              <button
                onClick={() => exportDataWithAudit(filteredLogs, 'auditoria_ola_social', 'csv', 'AUDIT_LOGS')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                title="Exportar a CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={loadData}
                disabled={loading}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="p-3">Acción</th>
                  <th className="p-3">Operador</th>
                  <th className="p-3">Destino / Entidad</th>
                  <th className="p-3">Motivo</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {loading ? 'Cargando auditoría...' : 'No hay registros de auditoría para mostrar.'}
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {log.admin_email || 'Operador Autorizado'}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px] truncate max-w-[140px]">
                      {log.target_user_id || log.entity_id || 'Global'}
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-[200px]">
                      {log.reason || 'Sin motivo especificado'}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2 py-1 text-sky-600 hover:bg-sky-50 rounded-lg font-bold"
                      >
                        Ver Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Errors Subtab */}
      {subtab === 'errors' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Centro de Errores de la Plataforma</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Seguimiento de fallos no capturados en frontend, edge functions o peticiones con fallas de red.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {errors.length === 0 && (
              <div className="p-8 text-center text-slate-400 border border-slate-100 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <div className="font-bold text-slate-700">Sistema sin errores reportados</div>
                <div className="text-xs text-slate-500 mt-0.5">Todo el flujo de frontend y backend se ejecuta limpiamente.</div>
              </div>
            )}
            {errors.map((err) => (
              <div
                key={err.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        err.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : err.severity === 'ERROR'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {err.severity}
                    </span>
                    <span className="font-bold text-slate-900">{err.error_name}</span>
                    <span className="text-slate-400 text-[10px]">{new Date(err.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700">{err.error_message}</p>
                  {err.stack_trace && (
                    <pre className="text-[10px] bg-slate-900 text-slate-200 p-2 rounded-lg font-mono overflow-x-auto max-h-24">
                      {err.stack_trace}
                    </pre>
                  )}
                </div>

                <div className="shrink-0">
                  {err.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => handleResolveError(err.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                    >
                      Marcar Resuelto
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resuelto</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Detalles de Operación #{selectedLog.id}</h3>
            <div className="space-y-2 text-xs">
              <div>
                <strong>Acción:</strong> {selectedLog.action}
              </div>
              <div>
                <strong>Operador:</strong> {selectedLog.admin_email}
              </div>
              <div>
                <strong>Motivo:</strong> {selectedLog.reason}
              </div>
              {selectedLog.changes_diff && (
                <div>
                  <strong>Diff / Payload:</strong>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto mt-1 max-h-60">
                    {JSON.stringify(selectedLog.changes_diff, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
