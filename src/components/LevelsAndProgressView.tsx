import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Shield,
  Star,
  Award,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Users,
  Share2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  FileCheck2,
  Sliders,
  Scale,
  MessageSquare,
  Lock,
  Unlock,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';
import { useI18n } from '../context/I18nContext';
import { LevelRequirement, DisputeStatus } from '../types';

export const LevelsAndProgressView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t, formatNumber } = useI18n();
  const {
    levelRequirements,
    experienceLedger,
    reputationEvents,
    supportVerifications,
    badges,
    disputes,
    reportDispute,
    resolveDispute
  } = useOlaSocial();

  const [activeTab, setActiveTab] = useState<'levels' | 'badges' | 'verified' | 'ledger' | 'disputes' | 'rules'>('levels');
  const [selectedDisputeResolution, setSelectedDisputeResolution] = useState<{
    disputeId: string;
    resolution: DisputeStatus;
    notes: string;
  } | null>(null);
  const [newDisputeData, setNewDisputeData] = useState<{
    taskId: string;
    reason: string;
    evidenceUrl: string;
  }>({
    taskId: '',
    reason: '',
    evidenceUrl: ''
  });
  const [disputeMessage, setDisputeMessage] = useState<string | null>(null);

  const currentLevelNum = user?.level_number || 1;
  const currentXP = user?.experience_points || 0;
  const currentRep = user?.reputation_score !== undefined ? user.reputation_score : 100.0;
  const verifiedCount = user?.hugs_verified || 0;
  const uniqueUsersCount = user?.unique_users_helped || 0;
  const uniquePlatformsCount = user?.unique_platforms_supported || 0;

  // Find current level and next level
  const currentLevel = levelRequirements.find((r) => r.level_number === currentLevelNum) || levelRequirements[0];
  const nextLevel = levelRequirements.find((r) => r.level_number === currentLevelNum + 1);

  // Calculate XP progress towards next level
  const currentLevelBaseXP = currentLevel ? currentLevel.min_xp : 0;
  const nextLevelTargetXP = nextLevel ? nextLevel.min_xp : currentLevelBaseXP + 1000;
  const xpNeeded = Math.max(0, nextLevelTargetXP - currentLevelBaseXP);
  const xpProgress = Math.max(0, currentXP - currentLevelBaseXP);
  const xpPercent = nextLevel ? Math.min(100, Math.max(0, Math.round((xpProgress / (xpNeeded || 1)) * 100))) : 100;

  // Reputation tier label
  const getReputationBadge = (score: number) => {
    if (score >= 900) return { label: 'Sobresaliente', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (score >= 700) return { label: 'Muy Buena', color: 'bg-sky-100 text-sky-800 border-sky-300' };
    if (score >= 400) return { label: 'Estable', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'Bajo Observación', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  const repBadge = getReputationBadge(currentRep);

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisputeData.taskId || !newDisputeData.reason) {
      setDisputeMessage('Por favor completa el ID de la tarea y el motivo.');
      return;
    }

    const res = await reportDispute(
      newDisputeData.taskId,
      newDisputeData.reason,
      newDisputeData.evidenceUrl
    );

    setDisputeMessage(res.message);
    if (res.success) {
      setNewDisputeData({ taskId: '', reason: '', evidenceUrl: '' });
    }
  };

  const handleResolveSubmit = async () => {
    if (!selectedDisputeResolution) return;
    const res = await resolveDispute(
      selectedDisputeResolution.disputeId,
      selectedDisputeResolution.resolution,
      selectedDisputeResolution.notes
    );
    setDisputeMessage(res.message);
    setSelectedDisputeResolution(null);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Overview Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-sky-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Nivel Oficial {currentLevelNum}: {currentLevel?.level_name}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${repBadge.color}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('levels.reputation_score')}: {formatNumber(currentRep)} / 1000 ({repBadge.label})
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t('levels.title')}
            </h1>
            <p className="text-sm text-sky-200/90 max-w-2xl leading-relaxed">
              {t('levels.subtitle')}
            </p>
          </div>

          {/* User Quick Metrics Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black text-amber-400">{currentXP}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">{t('levels.experience_points')}</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black text-sky-400">{verifiedCount}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">{t('levels.min_hugs')}</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">{uniqueUsersCount}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">{t('lobby.badge_community')}</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black text-purple-400">{uniquePlatformsCount}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">{t('profiles.channel_name_label')}</div>
            </div>
          </div>
        </div>

        {/* Progress bar to next level */}
        {nextLevel && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-sky-200">
                {t('levels.next_level')}: <strong className="text-white">{t('nav.level_num', { num: nextLevel.level_number })} ({nextLevel.level_name})</strong>
              </span>
              <span className="text-amber-300 font-bold">
                {currentXP} / {nextLevel.min_xp} XP ({xpPercent}%)
              </span>
            </div>
            <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
              <span>Faltan: <strong>{Math.max(0, nextLevel.min_xp - currentXP)} XP</strong></span>
              <span>•</span>
              <span>{t('levels.min_hugs')}: <strong>{Math.max(0, nextLevel.min_verified_supports - verifiedCount)} más</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'levels'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('levels.title')}
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'badges'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('levels.benefits')} ({badges.filter((b) => b.awarded_at).length})
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'verified'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('levels.min_hugs')}
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'ledger'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('levels.experience_points')} & {t('levels.reputation_score')}
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'disputes'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Disputas & Arbitraje ({disputes.length})
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'rules'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Reglas Antifraude
        </button>
      </div>

      {/* Tab 1: 10 Levels Hierarchy */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              Escalafón Oficial de 10 Niveles de OLA SOCIAL
            </h2>
            <span className="text-xs text-slate-500">
              Desbloquea beneficios conforme aumente tu reputación y constancia.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {levelRequirements.map((req) => {
              const isCurrent = req.level_number === currentLevelNum;
              const isUnlocked = currentLevelNum >= req.level_number;

              return (
                <div
                  key={req.level_number}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-sky-50/70 border-sky-400 shadow-md ring-2 ring-sky-300'
                      : isUnlocked
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50/80 border-slate-200/80 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base ${
                          isCurrent
                            ? 'bg-sky-600 text-white shadow-sm'
                            : isUnlocked
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {req.level_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">
                            {req.level_name}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-600 text-white">
                              Tu Nivel Actual
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {req.min_xp} XP mínimos • {req.min_verified_supports} abrazos certificados
                        </div>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <span className="p-1 rounded-full text-emerald-600 bg-emerald-50 inline-flex">
                          <CheckCircle2 className="w-5 h-5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded-full text-slate-400 bg-slate-100 inline-flex">
                          <Lock className="w-5 h-5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Requirements bar */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <div className="font-bold text-slate-900">{req.min_reputation} pts</div>
                      <div className="text-[10px] text-slate-400">Reputación mín.</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <div className="font-bold text-slate-900">{req.min_unique_users}</div>
                      <div className="text-[10px] text-slate-400">Usuarios únicos</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <div className="font-bold text-slate-900">{req.min_unique_platforms}</div>
                      <div className="text-[10px] text-slate-400">Redes distintas</div>
                    </div>
                  </div>

                  {/* Perks */}
                  {req.perks && req.perks.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Beneficios:
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {req.perks.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Badges Gallery */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Insignias Oficiales de OLA SOCIAL
            </h2>
            <span className="text-xs text-slate-500">
              Gana insignias por diversidad, constancia y ayuda genuina.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((badge) => {
              const isEarned = Boolean(badge.awarded_at);

              return (
                <div
                  key={badge.id || badge.code}
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    isEarned
                      ? 'bg-white border-amber-300 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3 ${
                      isEarned
                        ? 'bg-amber-100 text-amber-600 shadow-xs ring-4 ring-amber-50'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {badge.icon_name === 'trophy' && <Trophy className="w-7 h-7" />}
                    {badge.icon_name === 'shield' && <Shield className="w-7 h-7" />}
                    {badge.icon_name === 'star' && <Star className="w-7 h-7" />}
                    {badge.icon_name === 'flame' && <Flame className="w-7 h-7" />}
                    {badge.icon_name === 'heart' && <Award className="w-7 h-7" />}
                    {!['trophy', 'shield', 'star', 'flame', 'heart'].includes(badge.icon_name) && (
                      <Award className="w-7 h-7" />
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm">{badge.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{badge.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center">
                    {isEarned ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Desbloqueada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Lock className="w-3 h-3" />
                        Por desbloquear
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Abrazos Certificados Stream */}
      {activeTab === 'verified' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Registro de Abrazos Certificados
            </h2>
            <span className="text-xs text-slate-500">
              Interacciones reales y validadas por la comunidad en Supabase.
            </span>
          </div>

          {supportVerifications.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <FileCheck2 className="w-10 h-10 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700">Aún no hay abrazos certificados registrados</div>
              <p className="text-xs max-w-sm mx-auto">
                Ve al Lobby, completa una tarea y solicita la validación del creador para certificar el primer abrazo.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
              {supportVerifications.map((v) => (
                <div key={v.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-sky-100 text-sky-800">
                        {v.platform}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        Acción: {v.action_type}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Certificado
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      {v.feedback ? `"${v.feedback}"` : 'Evidencia revisada y validada satisfactoriamente.'}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {new Date(v.certified_at).toLocaleString('es-ES')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-amber-600">+{v.xp_awarded} XP</div>
                      <div className="text-[11px] text-emerald-600 font-bold">+{v.reputation_delta} Rep</div>
                    </div>
                    {v.evidence_url && (
                      <a
                        href={v.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-slate-50 transition-colors"
                        title="Ver evidencia"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: User XP & Reputation Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* XP Ledger */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Historial de Experiencia (XP Ledger)
              </h3>
              {experienceLedger.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  No hay movimientos de XP registrados en tu cuenta aún.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {experienceLedger.map((entry) => (
                    <div key={entry.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{entry.reason}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(entry.created_at).toLocaleString('es-ES')}
                        </div>
                      </div>
                      <div className="text-right font-bold text-amber-600">
                        +{entry.xp_amount} XP
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reputation Events */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Eventos de Reputación
              </h3>
              {reputationEvents.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  No hay cambios de reputación registrados aún.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {reputationEvents.map((evt) => (
                    <div key={evt.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{evt.reason}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(evt.created_at).toLocaleString('es-ES')}
                        </div>
                      </div>
                      <div
                        className={`text-right font-bold ${
                          evt.score_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {evt.score_delta >= 0 ? `+${evt.score_delta}` : evt.score_delta} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Disputes & Arbitration */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="p-6 bg-amber-50/70 rounded-3xl border border-amber-200/80 space-y-2">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              Tribunal Comunitario & Arbitraje
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Si realizaste una ayuda de buena fe con evidencia legítima y fue rechazada injustamente,
              o si recibiste una evidencia fraudulenta, puedes abrir una disputa. Los moderadores
              examinarán la evidencia de forma imparcial.
            </p>
          </div>

          {/* New Dispute Form */}
          <form
            onSubmit={handleCreateDispute}
            className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-2xs"
          >
            <h4 className="font-bold text-slate-900 text-sm">Reportar Nueva Disputa</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID de la Tarea en Disputa
                </label>
                <input
                  type="text"
                  placeholder="task-..."
                  value={newDisputeData.taskId}
                  onChange={(e) => setNewDisputeData({ ...newDisputeData, taskId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL de Evidencia Pública (Captura o enlace)
                </label>
                <input
                  type="url"
                  placeholder="https://imgur.com/..."
                  value={newDisputeData.evidenceUrl}
                  onChange={(e) => setNewDisputeData({ ...newDisputeData, evidenceUrl: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Explicación de los hechos
              </label>
              <textarea
                rows={3}
                placeholder="Describe detalladamente qué ocurrió y por qué consideras incorrecta la resolución..."
                value={newDisputeData.reason}
                onChange={(e) => setNewDisputeData({ ...newDisputeData, reason: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {disputeMessage && (
              <div className="p-3 rounded-xl bg-slate-100 text-xs font-medium text-slate-700">
                {disputeMessage}
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
            >
              Presentar Disputa
            </button>
          </form>

          {/* Active Disputes List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Disputas Registradas</h4>
            {disputes.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                No hay disputas activas en la comunidad.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {disputes.map((d) => (
                  <div key={d.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">Tarea: {d.task_id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'OPEN'
                              ? 'bg-amber-100 text-amber-800'
                              : d.status.startsWith('RESOLVED')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(d.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <strong>Motivo:</strong> {d.reason}
                    </p>

                    {d.resolution_notes && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/60">
                        <strong>Resolución del Moderador:</strong> {d.resolution_notes}
                      </div>
                    )}

                    {isAdmin && d.status === 'OPEN' && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() =>
                            setSelectedDisputeResolution({
                              disputeId: d.id,
                              resolution: 'RESOLVED_HELPER',
                              notes: 'Evidencia verificada como válida por el equipo de moderación.'
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Aprobar Ayudante
                        </button>
                        <button
                          onClick={() =>
                            setSelectedDisputeResolution({
                              disputeId: d.id,
                              resolution: 'REJECTED',
                              notes: 'Evidencia insuficiente o no coincidente.'
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Desestimar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Rules & Antifraud */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                1. Ayuda 100% Humana y Directa
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                OLA SOCIAL prohíbe terminantemente la utilización de bots, scripts de auto-clic o emuladores
                para interactuar en plataformas de terceros. Cada abrazo debe ser realizado personalmente
                por un ser humano con su cuenta legítima.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                2. Diversidad de Apoyo & Anti-Colusión
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Para subir a los niveles 4 al 10, no basta con interactuar siempre con los mismos 2 amigos.
                El algoritmo exige un mínimo de usuarios únicos ayudados y presencia en múltiples redes
                sociales para evitar círculos cerrados de auto-favorecimiento.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                3. Certificación Cruzada
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El XP y la reputación no se otorgan de forma instantánea al hacer clic en enviar. El receptor
                comprueba la interacción genuina y emite la certificación. En caso de discrepancia, el tribunal
                de arbitraje actúa con base en evidencias objetivas.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                4. Sanciones por Fraude y Pérdida de Reputación
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El envío de evidencias falsas, capturas recicladas o desmarcar interacciones tras ser validadas
                acarrea penalizaciones directas de hasta -100 puntos de reputación y descenso inmediato de nivel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Resolution Modal (for Admin) */}
      {selectedDisputeResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Confirmar Resolución de Disputa</h3>
            <p className="text-xs text-slate-600">
              Resolución elegida: <strong>{selectedDisputeResolution.resolution}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nota oficial de moderación
              </label>
              <textarea
                rows={3}
                value={selectedDisputeResolution.notes}
                onChange={(e) =>
                  setSelectedDisputeResolution({
                    ...selectedDisputeResolution,
                    notes: e.target.value
                  })
                }
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedDisputeResolution(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleResolveSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700"
              >
                Aplicar Resolución
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
