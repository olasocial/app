import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  UserX,
  UserCheck,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { ModerationReport, ReportStatus } from '../../types';
import { fetchModerationReports, updateModerationReport, blockUser } from '../../services/adminService';

export const AdminModerationTab: React.FC = () => {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchModerationReports(statusFilter);
      setReports(data);
    } catch (err) {
      console.error('Error fetching moderation reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (status: ReportStatus) => {
    if (!selectedReport) return;
    setActionLoading(true);
    const res = await updateModerationReport(selectedReport.id, status, resolutionNotes);
    setActionLoading(false);
    if (res.success) {
      setResolutionNotes('');
      setSelectedReport(null);
      await loadReports();
    } else {
      alert(res.message);
    }
  };

  const handleQuickBlock = async (userId: string) => {
    if (!confirm('¿Deseas bloquear al usuario denunciado por 24 horas?')) return;
    setActionLoading(true);
    const res = await blockUser(userId, 24, 'Sanción preventiva por reporte comunitario');
    setActionLoading(false);
    if (res.success) {
      alert('Usuario bloqueado exitosamente.');
      await handleUpdateStatus('ACTION_REQUIRED');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Cola de Moderación y Reportes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de incidentes, evidencias, reportes de usuarios y disputas activas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="OPEN">Abiertos / Pendientes</option>
            <option value="REVIEWING">En Revisión</option>
            <option value="ACTION_REQUIRED">Acción Requerida</option>
            <option value="RESOLVED">Resueltos</option>
            <option value="DISMISSED">Desestimados</option>
          </select>

          <button
            onClick={loadReports}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Reports Grid & Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List Column */}
        <div className={`${selectedReport ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {reports.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="font-bold text-slate-700">Sin reportes pendientes</div>
              <div className="text-xs text-slate-500 mt-1">No hay incidentes reportados en esta categoría.</div>
            </div>
          )}

          {reports.map((report) => {
            const isSelected = selectedReport?.id === report.id;

            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`bg-white rounded-2xl border p-4 shadow-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-100'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                      {report.content_type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {report.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button className="text-xs font-bold text-sky-600 hover:text-sky-700">
                    Revisar
                  </button>
                </div>

                <div className="mt-2 text-xs font-bold text-slate-900">{report.reason}</div>
                {report.details && (
                  <div className="text-xs text-slate-600 mt-1 line-clamp-2">{report.details}</div>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div>
                    Denunciado: <span className="font-semibold text-slate-700">{report.reported_name || report.reported_user_id}</span>
                  </div>
                  {report.reporter_name && (
                    <div>
                      Por: <span className="text-slate-600">{report.reporter_name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Review Detail Panel */}
        {selectedReport && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4 sticky top-20">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detalle de Incidencia</span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedReport.reason}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Usuario Denunciado:</span>
                  <span className="font-bold text-slate-900">{selectedReport.reported_name || selectedReport.reported_user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Denunciante:</span>
                  <span className="font-semibold text-slate-700">{selectedReport.reporter_name || 'Comunidad'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Tipo:</span>
                  <span className="font-bold text-slate-800">{selectedReport.content_type}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Descripción de la denuncia:</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed border border-slate-100">
                  {selectedReport.details || 'Sin detalles adicionales provistos.'}
                </p>
              </div>

              {selectedReport.evidence_url && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Evidencia adjunta:</span>
                  <a
                    href={selectedReport.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver enlace / captura de evidencia</span>
                  </a>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notas de resolución:</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detalles sobre el veredicto o acción aplicada..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Marcar Resuelto</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('DISMISSED')}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Desestimar</span>
                  </button>
                </div>

                <button
                  onClick={() => handleQuickBlock(selectedReport.reported_user_id)}
                  disabled={actionLoading}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Bloquear Usuario 24h</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
