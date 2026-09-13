import React from 'react';
import { Home, Share2, Award, Swords, Trophy, Shield, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab
}) => {
  const { user, isAdmin } = useAuth();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-2 safe-area-pb shadow-lg"
      aria-label="Navegación Móvil"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => onSelectTab('lobby')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-1 py-1 rounded-xl transition-all ${
            currentTab === 'lobby'
              ? 'text-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Lobby</span>
        </button>

        <button
          onClick={() => onSelectTab('profiles')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-1 py-1 rounded-xl transition-all ${
            currentTab === 'profiles'
              ? 'text-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Redes</span>
        </button>

        <button
          onClick={() => onSelectTab('progress')}
          className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-1 py-1 rounded-xl transition-all ${
            currentTab === 'progress'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Progreso</span>
          {user && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
              {user.level_number || 1}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('battles')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-1 py-1 rounded-xl transition-all ${
            currentTab === 'battles'
              ? 'text-rose-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Swords className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Batallas</span>
        </button>

        <button
          onClick={() => onSelectTab('ranking')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-1 py-1 rounded-xl transition-all ${
            currentTab === 'ranking'
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Ranking</span>
        </button>

        <button
          onClick={() => onSelectTab('invitations')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-1 py-1 rounded-xl transition-all ${
            currentTab === 'invitations'
              ? 'text-teal-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Invitar</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-1 py-1 rounded-xl transition-all ${
              currentTab === 'admin'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
};
