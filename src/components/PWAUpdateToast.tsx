import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWAUpdateToast: React.FC = () => {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) {
    return null;
  }

  return (
    <aside
      aria-label="Actualización disponible"
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
            Nueva versión disponible
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-snug">
            Actualiza OLA SOCIAL para disfrutar de mejoras y sincronización instantánea.
          </p>
        </div>

        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 text-xs font-extrabold shadow-md transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>
    </aside>
  );
};
