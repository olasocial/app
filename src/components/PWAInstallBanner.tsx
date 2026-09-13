import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWAInstallBanner: React.FC = () => {
  const { isStandalone, canInstall, isIOS, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if dismissed in the last 5 days
    const dismissedAt = localStorage.getItem('ola_pwa_install_dismissed_at');
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 5) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  // Do not show if already running in standalone mode or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // Only show if canInstall (Chromium/Android) or isIOS
  if (!canInstall && !isIOS) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('ola_pwa_install_dismissed_at', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      const installed = await promptInstall();
      if (installed) {
        setIsDismissed(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <aside
        aria-label="Instalación de Aplicación"
        className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-md border border-sky-200/90 shadow-xl rounded-2xl p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-900 leading-tight">Instalar OLA SOCIAL</h4>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-700">
                <Sparkles className="w-2.5 h-2.5" /> PWA
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Experiencia móvil completa, notificaciones instantáneas de abrazos y acceso sin navegador.
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {isIOS ? 'Cómo instalar' : 'Instalar ahora'}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Quizás después
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar aviso de instalación"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* iOS Step-by-Step Installation Modal */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center relative">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3 shadow-xs">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Instalar en iPhone o iPad</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4">
              Sigue estos 2 sencillos pasos en Safari para agregar OLA SOCIAL a tu pantalla de inicio:
            </p>

            <div className="space-y-3 text-left bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-700">
                  Toca el botón <strong className="text-slate-900 font-semibold">Compartir</strong> en la barra inferior de Safari.
                  <div className="mt-1 flex items-center gap-1 text-sky-600 font-medium">
                    <Share className="w-3.5 h-3.5" /> Ícono de compartir
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-700">
                  Desliza hacia abajo y selecciona <strong className="text-slate-900 font-semibold">Añadir a pantalla de inicio</strong>.
                  <div className="mt-1 flex items-center gap-1 text-sky-600 font-medium">
                    <PlusSquare className="w-3.5 h-3.5" /> Añadir a pantalla de inicio
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
