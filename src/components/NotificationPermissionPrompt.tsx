import React, { useState, useEffect } from 'react';
import { BellRing, X, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../hooks/usePWA';

export const NotificationPermissionPrompt: React.FC = () => {
  const { user } = useAuth();
  const { notificationPermission, requestNotificationPermission } = usePWA();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Only consider prompting if user is logged in and permission is in 'default' state
    if (!user || typeof Notification === 'undefined' || notificationPermission !== 'default') {
      setIsDismissed(true);
      return;
    }

    // Check if dismissed within last 7 days
    const dismissedAt = localStorage.getItem('ola_notif_prompt_dismissed_at');
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (days < 7) {
        setIsDismissed(true);
        return;
      }
    }

    // Slight delay so it doesn't pop immediately on load
    const timer = setTimeout(() => {
      setIsDismissed(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, notificationPermission]);

  if (isDismissed || notificationPermission !== 'default' || !user) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('ola_notif_prompt_dismissed_at', Date.now().toString());
  };

  const handleRequest = async () => {
    setIsDismissed(true);
    await requestNotificationPermission();
  };

  return (
    <aside
      aria-label="Permisos de Notificaciones"
      className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-sm z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-sky-100 ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
          <BellRing className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            Notificaciones en tiempo real
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Activa las notificaciones para enterarte al instante de tus abrazos:
          </p>

          <div className="mt-2 space-y-1 text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Cuando alguien te envíe un abrazo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Cuando certifiquen tus abrazos</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleRequest}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Activar
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Ahora no
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso de notificaciones"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
