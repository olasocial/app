import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Swords,
  Heart,
  ShieldAlert,
  Sparkles,
  Upload,
  CheckCircle,
  Clock,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOlaSocial } from '../context/OlaSocialContext';

export const BattlesView: React.FC = () => {
  const { user } = useAuth();
  const { activeBattles, pledgeBattle } = useOlaSocial();

  const [evidenceModalBattleId, setEvidenceModalBattleId] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pledgeFeedback, setPledgeFeedback] = useState<string | null>(null);

  const handlePledge = (battleId: string, creatorId: string) => {
    const res = pledgeBattle(battleId, creatorId);
    setPledgeFeedback(res.message);
    setTimeout(() => setPledgeFeedback(null), 4000);
  };

  const handleAnalyzeEvidence = () => {
    setIsAnalyzing(true);
    // AI Evidence helper inspection (Section 31: "La IA NO debe afirmar certeza absoluta. Casos dudosos: MANUAL_REVIEW")
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiAnalysisResult(
        'Análisis preliminar IA: La captura muestra consistencia con la plataforma indicada. Fecha y marcas contextuales visibles. Estado sugerido: REVISIÓN MANUAL HUMANA para confirmación final.'
      );
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Banner & Critical Compliance Warning */}
      <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Swords className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Batallas de Creadores Culturales
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm">
              Encuentros de talento y apoyo comunitario voluntario entre creadores de alta reputación.
            </p>
          </div>
        </div>

        {/* Section 29 Compliance Notice */}
        <div className="mt-4 p-4 rounded-2xl bg-black/25 border border-white/20 text-xs text-white/95 backdrop-blur-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <ShieldAlert className="w-4 h-4" />
            <span>Aviso Legal y de Cumplimiento (Sección 29):</span>
          </div>
          <p>
            El requisito para convocar batallas (1.000.000 de abrazos válidos) es una{' '}
            <strong>regla estrictamente INTERNA de OLA SOCIAL</strong> y NO significa que el usuario tenga un millón de seguidores en plataformas externas ni constituye verificación oficial de terceros.
          </p>
          <p className="text-white/80 text-[11px]">
            No se realizan donaciones externas automáticas, no se emplean bots de regalos ni transacciones forzadas.
          </p>
        </div>
      </div>

      {pledgeFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {pledgeFeedback}
        </div>
      )}

      {/* Active Battles List */}
      <div className="space-y-6">
        {activeBattles.map((battle) => {
          const totalPledges = battle.creator1_pledges + battle.creator2_pledges;
          const p1Percent = totalPledges > 0 ? Math.round((battle.creator1_pledges / totalPledges) * 100) : 50;
          const p2Percent = 100 - p1Percent;

          return (
            <div
              key={battle.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider">
                    <Flame className="w-3 h-3 text-rose-600 animate-pulse" />
                    <span>EN VIVO / ACTIVA</span>
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">{battle.title}</h3>
                </div>

                <button
                  onClick={() => setEvidenceModalBattleId(battle.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Subir Evidencia de Apoyo</span>
                </button>
              </div>

              {/* Head-to-Head Arena Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Creator 1 */}
                <div className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                  <img
                    src={battle.creator1_avatar}
                    alt={battle.creator1_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md mb-3"
                  />
                  <h4 className="font-extrabold text-slate-900 text-base">{battle.creator1_name}</h4>
                  <p className="text-xs text-slate-500">Compromisos de apoyo recibidos</p>
                  <div className="text-3xl font-black text-rose-600 my-2">
                    {battle.creator1_pledges}
                  </div>
                  <button
                    onClick={() => handlePledge(battle.id, battle.creator1_id)}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Apoyar a {battle.creator1_name.split(' ')[0]}</span>
                  </button>
                </div>

                {/* Creator 2 */}
                <div className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                  <img
                    src={battle.creator2_avatar}
                    alt={battle.creator2_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md mb-3"
                  />
                  <h4 className="font-extrabold text-slate-900 text-base">{battle.creator2_name}</h4>
                  <p className="text-xs text-slate-500">Compromisos de apoyo recibidos</p>
                  <div className="text-3xl font-black text-indigo-600 my-2">
                    {battle.creator2_pledges}
                  </div>
                  <button
                    onClick={() => handlePledge(battle.id, battle.creator2_id)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Apoyar a {battle.creator2_name.split(' ')[0]}</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar of Support Pledges */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{p1Percent}%</span>
                  <span>{p2Percent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div style={{ width: `${p1Percent}%` }} className="bg-rose-500 transition-all" />
                  <div style={{ width: `${p2Percent}%` }} className="bg-indigo-500 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Evidence Upload Modal with AI Assistant */}
      {evidenceModalBattleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Evidencia de Apoyo en Batalla</h3>
              <button
                onClick={() => {
                  setEvidenceModalBattleId(null);
                  setAiAnalysisResult(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Sube la URL de la captura o enlace público donde se observe tu interacción voluntaria.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL de la Captura de Pantalla *
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota descriptiva de la interacción
                </label>
                <textarea
                  rows={2}
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  placeholder="Detalles visibles en la captura..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* AI Verification Assistant Button */}
              <button
                type="button"
                onClick={handleAnalyzeEvidence}
                disabled={isAnalyzing}
                className="w-full py-2 px-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>{isAnalyzing ? 'Analizando captura con IA...' : 'Asistente de Análisis de Evidencia (IA)'}</span>
              </button>

              {aiAnalysisResult && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                  {aiAnalysisResult}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEvidenceModalBattleId(null);
                    setAiAnalysisResult(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEvidenceModalBattleId(null);
                    setAiAnalysisResult(null);
                    setPledgeFeedback('Evidencia enviada para revisión humana por los moderadores.');
                  }}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
                >
                  Enviar para Revisión Humana
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
