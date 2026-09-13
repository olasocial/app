import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  Star,
  Users,
  Eye,
  TrendingUp,
  Award,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  Filter,
  AlertTriangle,
  PlusCircle,
  MessageCircle,
  Search,
  ArrowUpDown,
  Compass,
  Flame,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';
import { Task, TaskStatus, SocialPlatformKey } from '../types';
import { PLATFORM_REGISTRY } from '../services/platformAdapters';
import { OlaLogo } from './OlaLogo';

interface LobbyViewProps {
  onOpenCreateCampaign: () => void;
  onOpenSocialProfiles: () => void;
  onOpenInvitations?: () => void;
  isScrolled: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  onOpenCreateCampaign,
  onOpenSocialProfiles,
  onOpenInvitations,
  isScrolled
}) => {
  const { user } = useAuth();
  const {
    tasks,
    campaigns,
    onlineUsersCount,
    newUsersTodayCount,
    peopleDiscoveringCount,
    startTask,
    declareTaskCompleted,
    validateHug
  } = useOlaSocial();

  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [activeLobbyTab, setActiveLobbyTab] = useState<'tasks' | 'creators'>('tasks');

  const [selectedTaskToDeclare, setSelectedTaskToDeclare] = useState<Task | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Validation modal state
  const [selectedTaskToValidate, setSelectedTaskToValidate] = useState<Task | null>(null);
  const [validationStars, setValidationStars] = useState<number>(5);
  const [validationComment, setValidationComment] = useState('');

  // Tasks needing validation by current user (received hugs)
  const pendingReceivedTasks = tasks.filter(
    (t) => t.creator_id === user?.id && t.status === TaskStatus.VERIFICATION_PENDING
  );

  // Filtered and sorted available tasks
  const availableTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.creator_id === user?.id) return false;
        const isStatusOk =
          t.status === TaskStatus.AVAILABLE ||
          (t.status === TaskStatus.IN_PROGRESS && t.assigned_user_id === user?.id);
        if (!isStatusOk) return false;
        if (platformFilter !== 'all' && t.platform !== platformFilter) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchCreator = t.creator_name.toLowerCase().includes(q);
          const matchUsername = t.target_username.toLowerCase().includes(q);
          const matchDesc = t.description.toLowerCase().includes(q);
          if (!matchTitle && !matchCreator && !matchUsername && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        const campA = campaigns.find((c) => c.id === a.campaign_id);
        const campB = campaigns.find((c) => c.id === b.campaign_id);
        return (campB?.current_participants || 0) - (campA?.current_participants || 0);
      });
  }, [tasks, campaigns, user?.id, platformFilter, searchTerm, sortBy]);

  // Unique Creators for Creator Directory
  const communityCreators = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        username: string;
        avatar: string;
        platform: SocialPlatformKey;
        profileUrl: string;
        campaignCount: number;
      }
    >();

    campaigns.forEach((c) => {
      if (!map.has(c.creator_id)) {
        map.set(c.creator_id, {
          id: c.creator_id,
          name: c.creator_name,
          username: c.target_username,
          avatar:
            c.creator_avatar ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          platform: c.platform,
          profileUrl: c.target_profile_url,
          campaignCount: 1
        });
      } else {
        const existing = map.get(c.creator_id)!;
        existing.campaignCount += 1;
      }
    });

    return Array.from(map.values()).filter((c) => {
      if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
      }
      return true;
    });
  }, [campaigns, platformFilter, searchTerm]);

  const handleStart = (taskId: string, targetUrl: string) => {
    const res = startTask(taskId);
    setActionFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
    if (res.success) {
      // Open external official profile safely in new tab
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeclareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskToDeclare) return;

    const res = declareTaskCompleted(selectedTaskToDeclare.id, evidenceNote, evidenceUrl);
    setActionFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
    setSelectedTaskToDeclare(null);
    setEvidenceNote('');
    setEvidenceUrl('');
  };

  const handleValidateSubmit = (confirmed: boolean) => {
    if (!selectedTaskToValidate) return;
    const feedback = validationComment || (confirmed ? `Calificación: ${validationStars} estrellas` : 'Interacción no confirmada');
    validateHug(selectedTaskToValidate.id, confirmed, feedback);
    setSelectedTaskToValidate(null);
    setValidationComment('');
    setValidationStars(5);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Dynamic Hero Section with Real Animated Logo (Smooth collapse as user scrolls) */}
      <div
        className={`transition-all duration-500 ease-out ${
          isScrolled
            ? 'opacity-80 scale-98 py-2'
            : 'opacity-100 scale-100 py-6'
        }`}
      >
        <OlaLogo variant="hero" animate={true} />
      </div>

      {/* Greeting and Overview Bar */}
      <div className="bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Interacciones 100% Humanas y Voluntarias</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ¡Hola, {user?.display_name}!
            </h2>
            <p className="mt-1 text-sky-100 text-sm sm:text-base max-w-xl">
              Bienvenido a tu espacio de comunidad. Descubre talentos independientes, intercambia apoyo genuino y cuida tu reputación sin bots ni trampas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateCampaign}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-sky-700 font-bold text-sm shadow-md hover:bg-sky-50 transition-all hover:scale-[1.02] active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Crear Campaña</span>
            </button>
            <button
              onClick={onOpenSocialProfiles}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-700/60 hover:bg-sky-700 text-white font-semibold text-sm border border-white/30 backdrop-blur-xs transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>Mis Redes Protegidas</span>
            </button>
          </div>
        </div>

        {/* Real-time stats pills */}
        <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 backdrop-blur-2xs">
            <Users className="w-5 h-5 text-emerald-300" />
            <div>
              <div className="font-extrabold text-white text-base sm:text-lg">{onlineUsersCount}</div>
              <div className="text-sky-100 text-xs">Usuarios online ahora</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 backdrop-blur-2xs">
            <TrendingUp className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-extrabold text-white text-base sm:text-lg">+{newUsersTodayCount}</div>
              <div className="text-sky-100 text-xs">Nuevos usuarios hoy</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 backdrop-blur-2xs">
            <Eye className="w-5 h-5 text-cyan-300" />
            <div>
              <div className="font-extrabold text-white text-base sm:text-lg">{peopleDiscoveringCount}</div>
              <div className="text-sky-100 text-xs">Personas descubriéndote</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Cards per Prompt Specification */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Abrazos Realizados */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-sky-600 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Realizados</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">{user?.hugs_done ?? 0}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Abrazos dados</p>
        </div>

        {/* Card 2: Abrazos Recibidos */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-teal-600 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Recibidos</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">{user?.hugs_received ?? 0}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Apoyos hacia ti</p>
        </div>

        {/* Card 3: Abrazos Validados */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-emerald-600 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Validados</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">{user?.hugs_verified ?? 0}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Confirmados</p>
        </div>

        {/* Card 4: Estrellas */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-amber-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Estrellas</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">{user?.stars_count ?? 0}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Prom: {user?.rating_avg || '5.0'}★</p>
        </div>

        {/* Card 5: Nivel */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-100 shadow-xs sm:shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between text-rose-500 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Nivel</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
            </div>
          </div>
          <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 truncate">
            Nivel {user?.level_number || 1}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            {user?.experience_points || 0} XP • Rep: {user?.reputation_score !== undefined ? user.reputation_score.toFixed(1) : '100.0'}
          </p>
        </div>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold underline ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Pending Hugs to Validate (Received by User) */}
      {pendingReceivedTasks.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-amber-900">
              Abrazos recibidos pendientes de tu validación ({pendingReceivedTasks.length})
            </h3>
          </div>
          <p className="text-xs text-amber-800 mb-4">
            Otros creadores o usuarios han interactuado de forma auténtica contigo. Revisa y califica la experiencia para confirmar su reputación.
          </p>

          <div className="space-y-3">
            {pendingReceivedTasks.map((pt) => (
              <div
                key={pt.id}
                className="bg-white rounded-2xl p-4 border border-amber-100 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {pt.assigned_user_name || 'Usuario'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold uppercase">
                      {pt.platform}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{pt.title}</p>
                  {pt.evidence_note && (
                    <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700">
                      <span className="font-semibold text-slate-900">Mensaje/Evidencia declarada: </span>
                      "{pt.evidence_note}"
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedTaskToValidate(pt)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap"
                >
                  Validar este Abrazo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Invitations Banner */}
      {user && (
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-teal-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm sm:text-base text-white">
                  Invita Creadores Genuinos y Gana Reputación
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-800/80 text-teal-200 border border-teal-600/40">
                  +25 pts por validado
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tu código de creador es <strong className="text-amber-300 font-mono">{user.invite_code || 'OLA-COMUNIDAD'}</strong>. Comparte tu enlace y expande la red.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenInvitations}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-xs shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            Gestionar Invitaciones
          </button>
        </div>
      )}

      {/* Collaborative Growth Pillars Section (ABRAZAR+ Vision) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>Filosofía de Crecimiento Comunitario</span>
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
          "Crece junto a una comunidad real"
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          ABRAZAR+ elimina los algoritmos engañosos y las granjas de bots. Aquí el crecimiento se fundamenta en 3 principios de apoyo mutuo y humano:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center mb-3">
              1
            </div>
            <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide">Descubrimiento Genuino</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Conoce canales, videos y perfiles de creadores independientes en TikTok, YouTube, Instagram, Twitch, Kick y más.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center mb-3">
              2
            </div>
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wide">Abrazos Voluntarios</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Cada interacción es libre y auténtica. Apoya cuando un contenido conecte contigo, sin promesas mecánicas ni penalizaciones.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide">Reputación y Nivel</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Acumula XP verificado, sube de nivel y desbloquea insignias comunitarias que impulsan tu propia visibilidad orgánica.
            </p>
          </div>
        </div>
      </div>

      {/* Discovery Stream / Available Tasks (Oportunidades de Abrazo) */}
      <div className="space-y-4">
        {/* Navigation Tabs between Opportunities and Creator Directory */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-2xl w-fit">
            <button
              onClick={() => setActiveLobbyTab('tasks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLobbyTab === 'tasks'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Oportunidades de Abrazo ({availableTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveLobbyTab('creators')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLobbyTab === 'creators'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-sky-600" />
              <span>Directorio de Creadores ({communityCreators.length})</span>
            </button>
          </div>

          {/* Sort Selector */}
          {activeLobbyTab === 'tasks' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
              >
                <option value="recent">Más recientes</option>
                <option value="popular">Más abrazados</option>
              </select>
            </div>
          )}
        </div>

        {/* Search Bar & Platform Filters Row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por creador, @usuario o tema de contenido..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Platform Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 touch-pan-x flex-nowrap shrink-0">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                platformFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todas
            </button>
            {Object.keys(PLATFORM_REGISTRY).map((k) => (
              <button
                key={k}
                onClick={() => setPlatformFilter(k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  platformFilter === k
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {PLATFORM_REGISTRY[k as SocialPlatformKey].name}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW 1: Available Tasks Cards */}
        {activeLobbyTab === 'tasks' && (
          <>
            {availableTasks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">
                  {tasks.length === 0
                    ? 'No hay tareas de apoyo activas en este momento'
                    : 'No hay tareas que coincidan con la búsqueda'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {tasks.length === 0
                    ? 'Sé el primero en impulsar tu contenido creando una campaña comunitaria con apoyo real.'
                    : 'Intenta cambiar el término de búsqueda o selecciona otra plataforma.'}
                </p>
                {tasks.length === 0 && (
                  <button
                    onClick={onOpenCreateCampaign}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 text-white font-bold text-xs shadow-md hover:bg-sky-700 transition-all hover:scale-[1.02] active:scale-98"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Crear Campaña</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {availableTasks.map((task) => {
                  const platformInfo = PLATFORM_REGISTRY[task.platform];
                  const isInProgress = task.status === TaskStatus.IN_PROGRESS && task.assigned_user_id === user?.id;
                  const matchingCampaign = campaigns.find((c) => c.id === task.campaign_id);
                  const currentHugs = matchingCampaign?.current_participants ?? 0;
                  const maxHugs = matchingCampaign?.max_participants ?? 25;
                  const progressPct = Math.min(100, Math.round((currentHugs / Math.max(1, maxHugs)) * 100));

                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-3xl border border-slate-100 shadow-xs sm:shadow-sm hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header with Creator Info & Platform Tag */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={task.creator_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                              alt={task.creator_name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-100 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {task.creator_name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">@{task.target_username}</div>
                            </div>
                          </div>

                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wider shrink-0"
                            style={{ backgroundColor: platformInfo?.color || '#0284c7' }}
                          >
                            {platformInfo?.name || task.platform}
                          </span>
                        </div>

                        {/* Title and Description */}
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                          {task.description}
                        </p>

                        {/* Campaign Voluntary Progress Bar */}
                        <div className="mt-3.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                            <span>Abrazos comunitarios</span>
                            <span className="text-sky-700 font-bold">
                              {currentHugs} / {maxHugs} ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-teal-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Type & Compliance Notice */}
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                          <span className="truncate">{task.action_type}</span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <a
                          href={task.target_profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors p-1"
                        >
                          <span>Ver perfil</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {isInProgress ? (
                          <button
                            onClick={() => setSelectedTaskToDeclare(task)}
                            className="px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors touch-manipulation"
                          >
                            Declarar realizado
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStart(task.id, task.target_profile_url)}
                            className="px-3.5 py-2 min-h-[38px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors touch-manipulation"
                          >
                            Dar Abrazo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VIEW 2: Creator Directory */}
        {activeLobbyTab === 'creators' && (
          <div className="space-y-4">
            {communityCreators.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700">No se encontraron creadores</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Intenta cambiar el filtro de plataforma o el término de búsqueda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityCreators.map((creator) => {
                  const platformInfo = PLATFORM_REGISTRY[creator.platform];
                  return (
                    <div
                      key={creator.id}
                      className="bg-white rounded-3xl border border-slate-100 shadow-xs sm:shadow-sm hover:shadow-md p-5 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{creator.name}</h4>
                              <CheckCircle className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            </div>
                            <p className="text-xs text-slate-500 truncate">@{creator.username}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wider shrink-0"
                            style={{ backgroundColor: platformInfo?.color || '#0284c7' }}
                          >
                            {platformInfo?.name || creator.platform}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {creator.campaignCount} campaña{creator.campaignCount > 1 ? 's' : ''} activa
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          Creador verificado de la comunidad ABRAZAR+. Comparte contenido original y apoya activamente a otros creadores.
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <a
                          href={creator.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors"
                        >
                          <span>Visitar Canal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => {
                            setSearchTerm(creator.name);
                            setActiveLobbyTab('tasks');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Ver Campañas
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Declare Task Completed */}
      {selectedTaskToDeclare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Declarar Acción Realizada</h3>
              <button
                onClick={() => setSelectedTaskToDeclare(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-sky-50 rounded-2xl p-3 mb-4 text-xs text-sky-800 break-all">
              <p className="font-bold">{selectedTaskToDeclare.title}</p>
              <p className="text-sky-700 mt-0.5 text-[11px]">Destino: {selectedTaskToDeclare.target_profile_url}</p>
            </div>

            <form onSubmit={handleDeclareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota o Comentario de tu interacción auténtica *
                </label>
                <textarea
                  required
                  rows={3}
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  placeholder="Escribe brevemente qué te pareció el contenido o video..."
                  className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-3 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL de evidencia pública o captura opcional
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-base sm:text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Las capturas se usan únicamente para validar el cumplimiento humano de la tarea.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskToDeclare(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  Confirmar Declaración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Validate Received Hug */}
      {selectedTaskToValidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Validar Abrazo Recibido</h3>
              <button
                onClick={() => setSelectedTaskToValidate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              ¿Recibiste el apoyo declarado por{' '}
              <strong className="text-slate-900">{selectedTaskToValidate.assigned_user_name}</strong>?
            </p>

            {selectedTaskToValidate.evidence_note && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-700 mb-4">
                <span className="font-bold text-slate-900 block mb-1">Evidencia declarada:</span>
                "{selectedTaskToValidate.evidence_note}"
              </div>
            )}

            {/* Stars Rating Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Calificación de calidad humana:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setValidationStars(star)}
                    className="p-1.5 rounded-xl hover:bg-amber-50 transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= validationStars
                          ? 'text-amber-500 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {validationStars} / 5
                </span>
              </div>
            </div>

            {/* Optional Feedback */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ¿Qué te pareció la interacción? (Opcional)
              </label>
              <input
                type="text"
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                placeholder="Un mensaje de agradecimiento o retroalimentación..."
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleValidateSubmit(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition-colors"
              >
                No recibí este apoyo
              </button>

              <button
                type="button"
                onClick={() => handleValidateSubmit(true)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Sí, recibí el apoyo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
