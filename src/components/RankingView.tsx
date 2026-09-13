import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Heart, Award, ShieldCheck, Sparkles, Users, Loader2 } from 'lucide-react';
import { UserProfile, UserLevel } from '../types';
import { fetchPublicRankings } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const RankingView: React.FC = () => {
  const { user } = useAuth();
  const [rankingUsers, setRankingUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadRankings = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPublicRankings();
        if (isMounted) {
          // If logged in user exists and isn't yet in list, include them if they have stats
          if (data.length === 0 && user) {
            setRankingUsers([user]);
          } else {
            setRankingUsers(data);
          }
        }
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRankings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-amber-950 ring-4 ring-amber-100 shadow-md';
    if (rank === 2) return 'bg-slate-300 text-slate-900 ring-4 ring-slate-100 shadow-sm';
    if (rank === 3) return 'bg-amber-600 text-white ring-4 ring-amber-100 shadow-sm';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-200" />
            <span>Puntuación Ponderada Anti-Spam</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ranking de Creadores y Reputación
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
            Calculado exclusivamente a partir de abrazos humanos verificados, sin compra de seguidores ni granjas automatizadas.
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0">
          <div className="text-xs text-amber-100 font-semibold">Creadores Activos</div>
          <div className="text-3xl font-black mt-0.5">{rankingUsers.length}</div>
          <div className="text-[10px] text-amber-200 mt-0.5">Comunidad 100% Real</div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Consultando ranking en tiempo real en Supabase...</p>
        </div>
      ) : rankingUsers.length === 0 ? (
        /* Real Empty State - Zero Simulated Records */
        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Aún no hay creadores en el ranking</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Sé el primero en vincular tus perfiles sociales, publicar o completar campañas de abrazos legítimos y ganar estrellas.
            </p>
          </div>
        </div>
      ) : (
        /* Real Users List */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="divide-y divide-slate-100">
            {rankingUsers.map((u, index) => {
              const rank = index + 1;
              const weightedScore = (u.hugs_verified || 0) * 10 + (u.stars_count || 0);

              return (
                <div
                  key={u.id}
                  className="py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 hover:bg-slate-50/60 rounded-2xl px-2 sm:px-3 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0 ${getRankBadge(
                        rank
                      )}`}
                    >
                      {rank}
                    </div>

                    {/* Avatar */}
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username || 'creator'}`}
                      alt={u.display_name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-slate-200 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate max-w-[160px] sm:max-w-none">
                          {u.display_name}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                          Nivel {u.level_number || 1} • {u.user_level || 'EXPLORADOR'}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 truncate">@{u.username || u.email.split('@')[0]}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-t-0 pl-11 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Abrazos</span>
                      <span className="font-extrabold text-slate-800 text-xs sm:text-sm">{u.hugs_verified || 0}</span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Estrellas</span>
                      <span className="font-extrabold text-amber-500 text-xs sm:text-sm flex items-center gap-1">
                        <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-amber-400 shrink-0" />
                        {u.stars_count || 0}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Reputación</span>
                      <span className="font-extrabold text-emerald-600 text-xs sm:text-sm">
                        {(u.reputation_score !== undefined ? u.reputation_score : 100).toFixed(1)}
                      </span>
                    </div>

                    <div className="pl-3 border-l border-slate-200 sm:border-slate-100 text-right">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Score</span>
                      <span className="font-black text-rose-600 text-sm sm:text-base">{weightedScore}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
