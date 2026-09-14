import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Bell,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ExternalLink,
  Send,
  Eye,
  Radio,
  Zap
} from 'lucide-react';
import {
  Announcement,
  AnnouncementPosition,
  AnnouncementStatus,
  AnnouncementAudience,
  AdminNotification,
  AdminNotificationType
} from '../../types';
import {
  fetchAnnouncementsList,
  saveAnnouncement,
  deleteAnnouncement,
  fetchAdminNotifications,
  broadcastAdminNotification
} from '../../services/adminService';

export const AdminContentTab: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<'announcements' | 'notifications'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Announcement Form Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    image_url: '',
    link_url: '',
    position: 'BANNER',
    priority: 1,
    status: 'ACTIVE',
    audience: 'ALL',
    start_at: new Date().toISOString()
  });

  // Notification Form
  const [newNotification, setNewNotification] = useState<{
    title: string;
    message: string;
    type: AdminNotificationType;
    audience: 'ALL' | 'ACTIVE_USERS' | 'NEW_USERS' | 'SELECTED';
    is_urgent: boolean;
    action_url: string;
  }>({
    title: '',
    message: '',
    type: 'ANNOUNCEMENT',
    audience: 'ALL',
    is_urgent: false,
    action_url: ''
  });
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annRes, notifRes] = await Promise.all([
        fetchAnnouncementsList(),
        fetchAdminNotifications()
      ]);
      setAnnouncements(annRes);
      setNotifications(notifRes);
    } catch (err) {
      console.error('Error loading content data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement.title || !editingAnnouncement.content) return;
    const res = await saveAnnouncement(editingAnnouncement);
    if (res.success) {
      setIsModalOpen(false);
      setEditingAnnouncement({
        title: '',
        content: '',
        image_url: '',
        link_url: '',
        position: 'BANNER',
        priority: 1,
        status: 'ACTIVE',
        audience: 'ALL',
        start_at: new Date().toISOString()
      });
      await loadData();
    } else {
      alert(res.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este anuncio permanentemente?')) return;
    const res = await deleteAnnouncement(id);
    if (res.success) {
      await loadData();
    } else {
      alert(res.message);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotification.title || !newNotification.message) return;
    setSendingNotification(true);
    const res = await broadcastAdminNotification(newNotification);
    setSendingNotification(false);
    if (res.success) {
      alert('Notificación emitida con éxito.');
      setNewNotification({
        title: '',
        message: '',
        type: 'ANNOUNCEMENT',
        audience: 'ALL',
        is_urgent: false,
        action_url: ''
      });
      await loadData();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveSubtab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubtab === 'announcements'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4 text-sky-600" />
          <span>Centro de Anuncios y Avisos</span>
        </button>

        <button
          onClick={() => setActiveSubtab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubtab === 'notifications'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span>Notificaciones Administrativas</span>
        </button>
      </div>

      {/* Announcements Subtab */}
      {activeSubtab === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Gestor de Anuncios y Campañas Comunitarias</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Crea banners, avisos superiores o tarjetas prioritarias que se reflejan en tiempo real en la plataforma.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAnnouncement({
                  title: '',
                  content: '',
                  image_url: '',
                  link_url: '',
                  position: 'BANNER',
                  priority: 1,
                  status: 'ACTIVE',
                  audience: 'ALL',
                  start_at: new Date().toISOString()
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Anuncio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                No hay anuncios registrados actualmente. Haz clic en "Nuevo Anuncio" para crear el primero.
              </div>
            )}
            {announcements.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {a.image_url && (
                    <img
                      src={a.image_url}
                      alt={a.title}
                      className="w-full h-32 object-cover border-b border-slate-100"
                    />
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                        {a.position}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{a.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3">{a.content}</p>

                    <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                      <span>Audiencia: {a.audience}</span>
                      <span>Prioridad: {a.priority}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    {new Date(a.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingAnnouncement(a);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create / Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-900">
                  {editingAnnouncement.id ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
                </h3>

                <form onSubmit={handleSaveAnnouncement} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Título:</label>
                    <input
                      type="text"
                      value={editingAnnouncement.title || ''}
                      onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                      required
                      placeholder="Ej: Nuevo evento de abrazos solidarios"
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contenido:</label>
                    <textarea
                      value={editingAnnouncement.content || ''}
                      onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                      required
                      rows={3}
                      placeholder="Texto del comunicado..."
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Posición:</label>
                      <select
                        value={editingAnnouncement.position || 'BANNER'}
                        onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, position: e.target.value as AnnouncementPosition }))}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="BANNER">Banner Principal</option>
                        <option value="TOP_BAR">Aviso Superior (Top Bar)</option>
                        <option value="CARD">Tarjeta en Feed</option>
                        <option value="MODAL">Modal Emergente</option>
                        <option value="FEED">Publicación en Feed</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Estado:</label>
                      <select
                        value={editingAnnouncement.status || 'ACTIVE'}
                        onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, status: e.target.value as AnnouncementStatus }))}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="DRAFT">Borrador</option>
                        <option value="SCHEDULED">Programado</option>
                        <option value="PAUSED">Pausado</option>
                        <option value="EXPIRED">Expirado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Audiencia:</label>
                      <select
                        value={editingAnnouncement.audience || 'ALL'}
                        onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, audience: e.target.value as AnnouncementAudience }))}
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="ALL">Todos los usuarios</option>
                        <option value="NEW_USERS">Nuevos miembros</option>
                        <option value="ACTIVE_USERS">Miembros activos</option>
                        <option value="INACTIVE_USERS">Inactivos</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Prioridad (1-10):</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={editingAnnouncement.priority ?? 1}
                        onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, priority: Number(e.target.value) }))}
                        className="w-full p-2 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">URL de Imagen (Opcional):</label>
                    <input
                      type="url"
                      value={editingAnnouncement.image_url || ''}
                      onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Enlace de Destino (Opcional):</label>
                    <input
                      type="url"
                      value={editingAnnouncement.link_url || ''}
                      onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, link_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full p-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700"
                    >
                      Guardar Anuncio
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications Subtab */}
      {activeSubtab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Column */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              <span>Emitir Notificación Masiva</span>
            </h2>
            <p className="text-xs text-slate-500">
              Transmite notificaciones con entrega push y alerta visual directa a los usuarios conectados.
            </p>

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la Alerta:</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Ej: Actualización de seguridad aplicada"
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mensaje:</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Escribe el mensaje claro y profesional..."
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Evento:</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value as AdminNotificationType }))}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="ANNOUNCEMENT">Anuncio</option>
                    <option value="SECURITY">Seguridad</option>
                    <option value="UPDATE">Actualización</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="WARNING">Advertencia</option>
                    <option value="EVENT">Evento</option>
                    <option value="INFO">Información</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Audiencia:</label>
                  <select
                    value={newNotification.audience}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, audience: e.target.value as any }))}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="ALL">Todos los Usuarios</option>
                    <option value="ACTIVE_USERS">Usuarios Activos</option>
                    <option value="NEW_USERS">Nuevos Miembros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Enlace de Acción (Opcional):</label>
                <input
                  type="text"
                  value={newNotification.action_url}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, action_url: e.target.value }))}
                  placeholder="/security o https://..."
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200/80">
                <input
                  type="checkbox"
                  id="urgentNotif"
                  checked={newNotification.is_urgent}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, is_urgent: e.target.checked }))}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="urgentNotif" className="text-xs font-bold text-amber-800 cursor-pointer">
                  Marcar como URGENTE (Genera toast emergente y prioridad alta)
                </label>
              </div>

              <button
                type="submit"
                disabled={sendingNotification || !newNotification.title || !newNotification.message}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                {sendingNotification ? 'Transmitiendo...' : 'Transmitir Notificación'}
              </button>
            </form>
          </div>

          {/* History Column */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">Historial de Notificaciones Emitidas</h2>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {notifications.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-10">
                  No hay notificaciones emitidas recientemente.
                </div>
              )}
              {notifications.map((n) => (
                <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                        {n.type}
                      </span>
                      {n.is_urgent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                          URGENTE
                        </span>
                      )}
                      <span className="font-bold text-slate-900">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <span>Audiencia: {n.audience}</span>
                    <span>Estado: {n.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
