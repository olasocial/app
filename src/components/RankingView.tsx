import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Heart, Award, ShieldCheck, Sparkles, Filter } from 'lucide-react';
import { UserLevel } from '../types';

interface RankUser {
  rank: number;
  id: string;
  name: string;
  username: string;
  avatar: string;
  confirmedHugs: number;
  starsCount: number;
  avgRating: number;
  userLevel: UserLevel;
  weightedScore: number;
}

export const RankingView: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

  const rankData: RankUser[] = [
    {
      rank: 1,
      id: 'u-1',
      name: 'Elena Creadora Viajera',
      username: 'elena_viajes',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      confirmedHugs: 842,
      starsCount: 4180,
      avgRating: 4.96,
      userLevel: UserLevel.EMBAJADOR,
      weightedScore: 9840
    },
    {
      rank: 2,
      id: 'u-2',
      name: 'Carlos Tech Verde',
      username: 'carlostechverde',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      confirmedHugs: 730,
      starsCount: 3620,
      avgRating: 4.95,
      userLevel: UserLevel.EMBAJADOR,
      weightedScore: 8910
    },
    {
      rank: 3,
      id: 'u-3',
      name: 'Marina Arte & Olas',
      username: 'marina_arte_olas',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      confirmedHugs: 690,
      starsCount: 3410,
      avgRating: 4.94,
      userLevel: UserLevel.REFERENTE,
      weightedScore: 8450
    },
    {
      rank: 4,
      id: 'u-4',
      name: 'Mateo Creador Visual',
      username: 'mateo_visual',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      confirmedHugs: 512,
      starsCount: 2510,
      avgRating: 4.9,
      userLevel: UserLevel.IMPULSOR,
      weightedScore: 6820
    },
    {
      rank: 5,
      id: 'u-5',
      name: 'Lucía Gastronomía Viva',
      username: 'lucia_cocina',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      confirmedHugs: 480,
      starsCount: 2360,
      avgRating: 4.92,
      userLevel: UserLevel.IMPULSOR,
      weightedScore: 6390
    }
  ];

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
            Ranking de Mejores Abrazadores
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
            La posición se calcula a partir de la tasa de validación real, estrellas recibidas y antigüedad humana, nunca por cantidad mecánica de spam.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-2xl backdrop-blur-xs">
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'all' ? 'bg-white text-orange-700 shadow-xs' : 'text-white/80'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'month' ? 'bg-white text-orange-700 shadow-xs' : 'text-white/80'
            }`}
          >
            Este Mes
          </button>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rankData.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all text-center relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${getRankBadge(
                  item.rank
                )}`}
              >
                #{item.rank}
              </span>
            </div>

            <img
              src={item.avatar}
              alt={item.name}
              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-slate-50 shadow-md mb-3"
            />

            <h3 className="font-extrabold text-slate-900 text-base">{item.name}</h3>
            <p className="text-xs text-sky-600 font-medium">@{item.username}</p>

            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{item.userLevel}</span>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-bold text-slate-800">{item.confirmedHugs}</div>
                <div className="text-[10px] text-slate-400">Validados</div>
              </div>
              <div>
                <div className="font-bold text-amber-600 flex items-center justify-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  <span>{item.avgRating}</span>
                </div>
                <div className="text-[10px] text-slate-400">Rating</div>
              </div>
              <div>
                <div className="font-bold text-emerald-600">{item.weightedScore}</div>
                <div className="text-[10px] text-slate-400">Puntos</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table for Full Ranking */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-base">Tabla General de la Comunidad</h3>
          <span className="text-xs text-slate-400">Actualizado en tiempo real</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Posición</th>
                <th className="px-6 py-4">Creador / Usuario</th>
                <th className="px-6 py-4">Nivel</th>
                <th className="px-6 py-4 text-center">Abrazos Validados</th>
                <th className="px-6 py-4 text-center">Estrellas</th>
                <th className="px-6 py-4 text-center">Rating</th>
                <th className="px-6 py-4 text-right">Puntuación Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-extrabold text-slate-900">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        row.rank <= 3 ? 'font-black text-amber-700 bg-amber-100' : 'text-slate-600'
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={row.avatar}
                        alt={row.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{row.name}</div>
                        <div className="text-[11px] text-slate-400">@{row.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{row.userLevel}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900">
                    {row.confirmedHugs}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-amber-500">
                    {row.starsCount}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">
                    ★ {row.avgRating}
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-emerald-600">
                    {row.weightedScore} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
