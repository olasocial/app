import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserX,
  UserCheck,
  ShieldAlert,
  Shield,
  Clock,
  Award,
  MoreVertical,
  X,
  FileText,
  AlertTriangle,
  Download,
  CheckCircle2,
  RefreshCw,
  Plus,
  Sliders
} from 'lucide-react';
import {
  UserProfile,
  AccountStatus,
  UserRole,
  UserRestriction,
  RestrictionKey,
  AdminNote
} from '../../types';
import {
  fetchUsersList,
  fetchUserFullDetails,
  blockUser,
  unblockUser,
  banUser,
  setUserRestriction,
  addAdminNote,
  adjustUserReputation,
  exportDataWithAudit
} from '../../services/adminService';
import { ConfirmActionModal } from './ConfirmActionModal';

export const AdminUsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetails, setUserDetails] = useState<{
    restrictions: UserRestriction[];
    notes: AdminNote[];
    socialProfiles: any[];
    moderationHistory: any[];
  }>({
    restrictions: [],
    notes: [],
    socialProfiles: [],
    moderationHistory: []
  });
  const [detailTab, setDetailTab] = useState<'restrictions' | 'notes' | 'history' | 'social'>('restrictions');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modals state
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; durationHours: number; reason: string; notes: string }>({
    isOpen: false,
    durationHours: 24,
    reason: '',
    notes: ''
  });
  const [unblockModal, setUnblockModal] = useState<{ isOpen: boolean; reason: string }>({
    isOpen: false,
    reason: ''
  });
  const [banModal, setBanModal] = useState<{ isOpen: boolean; isPermanent: boolean; reason: string; notes: string }>({
    isOpen: false,
    isPermanent: true,
    reason: '',
    notes: ''
  });
  const [repModal, setRepModal] = useState<{ isOpen: boolean; delta: number; reason: string }>({
    isOpen: false,
    delta: 5,
    reason: ''
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUsersList({
        searchQuery,
        status: statusFilter,
        role: roleFilter,
        limit: 50
      });
      setUsers(res.users);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, roleFilter]);

  const handleSelectUser = async (u: UserProfile) => {
    setSelectedUser(u);
    try {
      const details = await fetchUserFullDetails(u.id);
      setUserDetails({
        restrictions: details.restrictions,
        notes: details.notes,
        socialProfiles: details.socialProfiles,
        moderationHistory: details.moderationHistory
      });
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  const handleBlockConfirm = async () => {
    if (!selectedUser || !blockModal.reason.trim()) return;
    setActionLoading(true);
    const res = await blockUser(
      selectedUser.id,
      blockModal.durationHours,
      blockModal.reason,
      blockModal.notes
    );
    setActionLoading(false);
    if (res.success) {
      setBlockModal({ isOpen: false, durationHours: 24, reason: '', notes: '' });
      await loadUsers();
      if (selectedUser) handleSelectUser({ ...selectedUser, status: AccountStatus.SUSPENDED });
    } else {
      alert(res.message);
    }
  };

  const handleUnblockConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await unblockUser(selectedUser.id, unblockModal.reason || 'Resolución administrativa');
    setActionLoading(false);
    if (res.success) {
      setUnblockModal({ isOpen: false, reason: '' });
      await loadUsers();
      if (selectedUser) handleSelectUser({ ...selectedUser, status: AccountStatus.ACTIVE });
    } else {
      alert(res.message);
    }
  };

  const handleBanConfirm = async () => {
    if (!selectedUser || !banModal.reason.trim()) return;
    setActionLoading(true);
    const res = await banUser(selectedUser.id, banModal.isPermanent, banModal.reason, banModal.notes);
    setActionLoading(false);
    if (res.success) {
      setBanModal({ isOpen: false, isPermanent: true, reason: '', notes: '' });
      await loadUsers();
      if (selectedUser) handleSelectUser({ ...selectedUser, status: AccountStatus.BANNED });
    } else {
      alert(res.message);
    }
  };

  const handleReputationConfirm = async () => {
    if (!selectedUser || !repModal.reason.trim()) return;
    setActionLoading(true);
    const res = await adjustUserReputation(selectedUser.id, repModal.delta, repModal.reason);
    setActionLoading(false);
    if (res.success) {
      setRepModal({ isOpen: false, delta: 5, reason: '' });
      await loadUsers();
      if (selectedUser && res.newReputation !== undefined) {
        handleSelectUser({ ...selectedUser, reputation: res.newReputation });
      }
    } else {
      alert(res.message);
    }
  };

  const handleToggleRestriction = async (key: RestrictionKey, currentRestricted: boolean) => {
    if (!selectedUser) return;
    const nextState = !currentRestricted;
    const res = await setUserRestriction(
      selectedUser.id,
      key,
      nextState,
      'Ajuste granular desde Centro de Usuarios'
    );
    if (res.success) {
      const details = await fetchUserFullDetails(selectedUser.id);
      setUserDetails(prev => ({ ...prev, restrictions: details.restrictions }));
    } else {
      alert(res.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newNoteContent.trim()) return;
    setActionLoading(true);
    const res = await addAdminNote(selectedUser.id, newNoteContent.trim());
    setActionLoading(false);
    if (res.success) {
      setNewNoteContent('');
      const details = await fetchUserFullDetails(selectedUser.id);
      setUserDetails(prev => ({ ...prev, notes: details.notes }));
    } else {
      alert(res.message);
    }
  };

  const allRestrictionKeys: { key: RestrictionKey; label: string; desc: string }[] = [
    { key: 'SEND_HUGS', label: 'Envío de Abrazos', desc: 'No podrá ejecutar acciones de apoyo social solidario' },
    { key: 'RECEIVE_INVITATIONS', label: 'Recepción de Invitaciones', desc: 'No podrá recibir enlaces de nuevos miembros' },
    { key: 'CREATE_CAMPAIGNS', label: 'Crear Campañas', desc: 'No podrá publicar nuevos pedidos de apoyo' },
    { key: 'SEND_INVITATIONS', label: 'Emitir Invitaciones', desc: 'Su código de invitación quedará temporalmente inactivo' },
    { key: 'POST_CONTENT', label: 'Publicar Contenido', desc: 'Bloquea envío de enlaces o material público' },
    { key: 'MESSAGING', label: 'Mensajería Interna', desc: 'No podrá enviar mensajes a otros creadores' },
    { key: 'COMMENTS', label: 'Comentarios y Reseñas', desc: 'No podrá calificar o comentar tareas' }
  ];

  return (
    <div className="space-y-6">
      {/* Controls & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuario por nombre, email o UUID..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="SUSPENDED">Suspendido / Bloqueado</option>
              <option value="BANNED">Baneado</option>
              <option value="LIMITED">Limitado</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="ALL">Todos los Roles</option>
              <option value="USER">Usuario</option>
              <option value="MODERATOR">Moderador</option>
              <option value="SUPPORT">Soporte</option>
              <option value="ADMIN">Administrador</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>

            <button
              onClick={() => exportDataWithAudit(users, 'usuarios_ola_social', 'csv', 'USERS')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Exportar usuarios filtrados a CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Mostrando {users.length} de {totalCount} usuarios registrados</span>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Users Table & Detail Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Column */}
        <div className={`${selectedUser ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Usuario</th>
                  <th className="p-3.5">Rol</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Reputación</th>
                  <th className="p-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      {loading ? 'Cargando usuarios...' : 'No se encontraron usuarios coincidentes.'}
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const isSuper = u.role === UserRole.SUPER_ADMIN || u.email.toLowerCase() === 'v19629049@gmail.com';

                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                            alt={u.display_name}
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{u.display_name}</span>
                              {isSuper && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                                  SUPER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === AccountStatus.ACTIVE
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === AccountStatus.SUSPENDED
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {Number(u.reputation || 75).toFixed(1)} pts
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(u);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                          Detalles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Detail Drawer Column */}
        {selectedUser && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-5 sticky top-20">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.username}`}
                  alt={selectedUser.display_name}
                  className="w-12 h-12 rounded-2xl border border-slate-200 object-cover"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {selectedUser.display_name}
                  </h3>
                  <div className="text-xs text-slate-500 truncate max-w-[200px]">{selectedUser.email}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedUser.id}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Reputación</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {Number(selectedUser.reputation || 75).toFixed(1)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Abrazos</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedUser.hugs_done || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Nivel</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedUser.level_number || 1}
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {selectedUser.status === AccountStatus.ACTIVE ? (
                <button
                  onClick={() => setBlockModal({ isOpen: true, durationHours: 24, reason: '', notes: '' })}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors flex items-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Bloquear</span>
                </button>
              ) : (
                <button
                  onClick={() => setUnblockModal({ isOpen: true, reason: '' })}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Desbloquear</span>
                </button>
              )}

              <button
                onClick={() => setBanModal({ isOpen: true, isPermanent: true, reason: '', notes: '' })}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Banear</span>
              </button>

              <button
                onClick={() => setRepModal({ isOpen: true, delta: 5, reason: '' })}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 transition-colors flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Ajustar Rep.</span>
              </button>
            </div>

            {/* Tabs for details */}
            <div className="border-b border-slate-200 flex gap-4 text-xs font-bold">
              <button
                onClick={() => setDetailTab('restrictions')}
                className={`pb-2 transition-colors ${
                  detailTab === 'restrictions'
                    ? 'border-b-2 border-sky-600 text-sky-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Restricciones ({userDetails.restrictions.filter(r => r.is_restricted).length})
              </button>
              <button
                onClick={() => setDetailTab('notes')}
                className={`pb-2 transition-colors ${
                  detailTab === 'notes'
                    ? 'border-b-2 border-sky-600 text-sky-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Notas Privadas ({userDetails.notes.length})
              </button>
              <button
                onClick={() => setDetailTab('history')}
                className={`pb-2 transition-colors ${
                  detailTab === 'history'
                    ? 'border-b-2 border-sky-600 text-sky-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Historial ({userDetails.moderationHistory.length})
              </button>
            </div>

            {/* Tab 1: Granular Restrictions */}
            {detailTab === 'restrictions' && (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <div className="text-[11px] text-slate-500 mb-2">
                  Activa o desactiva permisos específicos individualmente para esta cuenta:
                </div>
                {allRestrictionKeys.map((item) => {
                  const current = userDetails.restrictions.find(r => r.restriction_key === item.key);
                  const isRestricted = Boolean(current?.is_restricted);

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-xs font-bold text-slate-800">{item.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => handleToggleRestriction(item.key, isRestricted)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                          isRestricted
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {isRestricted ? 'RESTRINGIDO' : 'PERMITIDO'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Private Admin Notes */}
            {detailTab === 'notes' && (
              <div className="space-y-3">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Escribe una nota administrativa interna (confidencial)..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    rows={2}
                  />
                  <button
                    type="submit"
                    disabled={!newNoteContent.trim() || actionLoading}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    Guardar Nota
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {userDetails.notes.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-4">
                      No hay notas registradas para este usuario.
                    </div>
                  )}
                  {userDetails.notes.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="text-slate-800">{n.content}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Moderation History */}
            {detailTab === 'history' && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {userDetails.moderationHistory.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-4">
                    Sin sanciones registradas. Historial limpio.
                  </div>
                )}
                {userDetails.moderationHistory.map((m: any) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{m.action_type}</span>
                      <span className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">{m.reason}</div>
                    {m.notes && <div className="text-[11px] text-slate-500 italic mt-0.5">{m.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Block User Modal */}
      {blockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Bloquear Usuario Temporalmente</h3>
            <p className="text-xs text-slate-600">
              Suspende temporalmente el acceso del usuario y bloquea su interacción social mientras conserva sus datos.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Duración:</label>
                <select
                  value={blockModal.durationHours}
                  onChange={(e) => setBlockModal(prev => ({ ...prev, durationHours: Number(e.target.value) }))}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white"
                >
                  <option value={1}>1 hora</option>
                  <option value={6}>6 horas</option>
                  <option value={24}>24 horas (1 día)</option>
                  <option value={168}>7 días (1 semana)</option>
                  <option value={720}>30 días (1 mes)</option>
                  <option value={0}>Indefinido</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo obligatorio:</label>
                <input
                  type="text"
                  value={blockModal.reason}
                  onChange={(e) => setBlockModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ej: Infracción de normas en comentarios"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notas administrativas internas:</label>
                <input
                  type="text"
                  value={blockModal.notes}
                  onChange={(e) => setBlockModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detalles para el equipo de moderación"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBlockModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleBlockConfirm}
                disabled={!blockModal.reason.trim() || actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading ? 'Bloqueando...' : 'Confirmar Bloqueo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Modal */}
      {unblockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Desbloquear Usuario</h3>
            <p className="text-xs text-slate-600">
              Restablece el estado activo de la cuenta y genera el registro en la auditoría inmutable.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Motivo de resolución:</label>
              <input
                type="text"
                value={unblockModal.reason}
                onChange={(e) => setUnblockModal({ isOpen: true, reason: e.target.value })}
                placeholder="Ej: Cumplimiento de plazo de sanción"
                className="w-full p-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUnblockModal({ isOpen: false, reason: '' })}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnblockConfirm}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                {actionLoading ? 'Procesando...' : 'Desbloquear Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal with Strict Confirmation */}
      <ConfirmActionModal
        isOpen={banModal.isOpen}
        title="Banear Usuario de la Plataforma"
        description="Esta acción marca la cuenta como BANEADA y bloquea completamente su acceso al sistema. No elimina registros ni datos históricos."
        confirmPhrase="CONFIRMAR BANEO"
        confirmButtonText="Ejecutar Baneo"
        isDestructive={true}
        onConfirm={handleBanConfirm}
        onClose={() => setBanModal(prev => ({ ...prev, isOpen: false }))}
        isLoading={actionLoading}
      />

      {/* Reputation Modal */}
      {repModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Ajuste Administrativo de Reputación</h3>
            <p className="text-xs text-slate-600">
              Modifica la reputación del usuario con registro auditable y trazabilidad obligatoria.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ajuste en puntos (+/-):</label>
                <input
                  type="number"
                  value={repModal.delta}
                  onChange={(e) => setRepModal(prev => ({ ...prev, delta: Number(e.target.value) }))}
                  step={1}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo obligatorio:</label>
                <input
                  type="text"
                  value={repModal.reason}
                  onChange={(e) => setRepModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ej: Corrección por reporte verificado"
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRepModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleReputationConfirm}
                disabled={!repModal.reason.trim() || actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading ? 'Guardando...' : 'Aplicar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
