import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { Invitation } from '../../types';
import { fetchInvitationsAuditList, revokeInvitation } from '../../services/adminService';

export const AdminGrowthTab: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await fetchInvitationsAuditList(100);
      setInvitations(data);
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleRevoke = async (invitationId: string) => {
    const reason = prompt('Motivo obligatorio para revocar la invitación:');
    if (!reason || !reason.trim()) return;

    setActionLoading(true);
    const res = await revokeInvitation(invitationId, reason.trim());
    setActionLoading(false);

    if (res.success) {
      alert('Invitación revocada exitosamente.');
      await loadInvitations();
    } else {
      alert(res.message);
    }
  };

  const filtered = invitations.filter(inv => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invite_code?.toLowerCase().includes(q) ||
      inv.inviter_email?.toLowerCase().includes(q) ||
      inv.invited_email?.toLowerCase().includes(q)
    );
  });

  const totalGenerated = invitations.length;
  const verifiedCount = invitations.filter(i => i.status === 'VERIFIED' || i.status === 'ACTIVATED').length;
  const conversionRate = totalGenerated > 0 ? ((verifiedCount / totalGenerated) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Invitaciones Registradas</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalGenerated}</div>
          <div className="text-xs text-slate-500 mt-0.5">Historial auditado</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Activaciones Exitosas</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{verifiedCount}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-0.5">Usuarios verificados por invitación</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Tasa de Conversión Real</div>
          <div className="text-2xl font-black text-sky-600 mt-1">{conversionRate}%</div>
          <div className="text-xs text-slate-500 mt-0.5">Efectividad de red comunitaria</div>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Auditoría de Invitaciones y Enlaces</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión antifraude de enlaces de recomendación, atribuciones y puntos de reputación otorgados.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar código o email..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={loadInvitations}
              disabled={loading}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Emisor</th>
                <th className="p-3">Invitado</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Reputación</th>
                <th className="p-3">Fecha</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No se encontraron invitaciones coincidentes.
                  </td>
                </tr>
              )}
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-bold text-sky-700">{inv.invite_code}</td>
                  <td className="p-3 text-slate-800 font-medium">
                    {inv.inviter_name || inv.inviter_email || inv.inviter_user_id}
                  </td>
                  <td className="p-3 text-slate-600">
                    {inv.invited_name || inv.invited_email || inv.invited_user_id || 'Pendiente de registro'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'VERIFIED' || inv.status === 'ACTIVATED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'REVOKED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800">
                    +{inv.reputation_awarded || 10} pts
                  </td>
                  <td className="p-3 text-slate-400">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    {inv.status !== 'REVOKED' && (
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        disabled={actionLoading}
                        className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        Revocar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reputation Formula Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
          <Info className="w-4 h-4" />
          <span>Fórmula Oficial de Reputación Comunitaria</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          La reputación se calcula de manera ponderada con base en interacciones genuinas:
          <br />
          <code className="font-mono text-indigo-900 bg-indigo-50/80 px-2 py-1 rounded mt-1 inline-block">
            R = (Abrazos_Validados * 0.45) + (Invitaciones_Activas * 0.25) + (Calificación_Promedio * 0.20) - (Penalizaciones * 0.10)
          </code>
        </p>
        <div className="text-[11px] text-slate-500">
          Cualquier ajuste manual administrativo queda documentado con firma de operador en la tabla de auditoría inmutable.
        </div>
      </div>
    </div>
  );
};
