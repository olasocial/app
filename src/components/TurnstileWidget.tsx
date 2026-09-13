import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  TURNSTILE_SITE_KEY,
  verifyTurnstileTokenServerSide,
  isTurnstileProductionConfigured,
  loadTurnstile
} from '../services/turnstileService';

interface TurnstileWidgetProps {
  onVerifySuccess: (token: string) => void;
  onVerifyExpired: () => void;
  onVerifyError: (errorMsg: string) => void;
}

export type TurnstileState = 'IDLE' | 'VERIFYING' | 'VERIFIED' | 'EXPIRED' | 'ERROR';

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerifySuccess,
  onVerifyExpired,
  onVerifyError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isRenderingRef = useRef<boolean>(false);
  const [state, setState] = useState<TurnstileState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Store latest callbacks in refs to avoid re-triggering effect on parent re-renders
  const callbacksRef = useRef({
    onVerifySuccess,
    onVerifyExpired,
    onVerifyError
  });

  useEffect(() => {
    callbacksRef.current = {
      onVerifySuccess,
      onVerifyExpired,
      onVerifyError
    };
  });

  const safeRemoveWidget = () => {
    const id = widgetIdRef.current;
    if (!id) return;
    widgetIdRef.current = null;

    if (typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.remove === 'function') {
      try {
        window.turnstile.remove(id);
      } catch {
        // Suppress benign internal turnstile DOM detachment warnings
      }
    }
  };

  const renderWidget = async () => {
    if (!isMountedRef.current || !containerRef.current) return;
    if (widgetIdRef.current || isRenderingRef.current) return;

    isRenderingRef.current = true;
    try {
      const turnstile = await loadTurnstile();
      if (!isMountedRef.current || !containerRef.current) return;

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const id = turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'light',
        callback: async (token: string) => {
          if (!isMountedRef.current) return;
          setState('VERIFYING');
          setErrorMessage(null);

          const verifyResult = await verifyTurnstileTokenServerSide(token);
          if (!isMountedRef.current) return;

          if (verifyResult.success) {
            setState('VERIFIED');
            callbacksRef.current.onVerifySuccess(token);
          } else {
            setState('ERROR');
            const err = verifyResult.message || 'No pudimos verificar que eres una persona.';
            setErrorMessage(err);
            callbacksRef.current.onVerifyError(err);
          }
        },
        'expired-callback': () => {
          if (!isMountedRef.current) return;
          setState('EXPIRED');
          setErrorMessage('La verificación humana expiró. Completa nuevamente la verificación.');
          callbacksRef.current.onVerifyExpired();
        },
        'error-callback': () => {
          if (!isMountedRef.current) return;
          setState('ERROR');
          const errText = 'Error en el widget de verificación humana. Inténtalo de nuevo.';
          setErrorMessage(errText);
          callbacksRef.current.onVerifyError(errText);
        }
      });

      widgetIdRef.current = id;
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setState('ERROR');
      const errText = err?.message || 'No se pudo cargar Cloudflare Turnstile. Comprueba tu conexión.';
      setErrorMessage(errText);
      callbacksRef.current.onVerifyError(errText);
    } finally {
      isRenderingRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    renderWidget();

    return () => {
      isMountedRef.current = false;
      safeRemoveWidget();
    };
  }, []);

  const handleManualRetry = () => {
    setState('IDLE');
    setErrorMessage(null);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        return;
      } catch {
        safeRemoveWidget();
      }
    }
    renderWidget();
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>Verificación Humana Obligatoria</span>
        </div>

        {state === 'VERIFIED' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verificado</span>
          </span>
        ) : state === 'VERIFYING' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Validando...</span>
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-medium">Cloudflare Turnstile</span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 text-left">
        Para proteger la comunidad contra bots y granjas de interacción, resuelve el desafío antes de iniciar sesión.
      </p>

      {/* Turnstile widget container */}
      <div className="flex justify-center min-h-[65px] items-center">
        <div ref={containerRef} className="my-1" />
      </div>

      {state === 'VERIFIED' && (
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Verificación humana completada. Ya puedes continuar con Google.</span>
        </div>
      )}

      {(state === 'ERROR' || state === 'EXPIRED') && (
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium space-y-1.5">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage || 'Error en la verificación humana.'}</span>
          </div>
          <button
            type="button"
            onClick={handleManualRetry}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 underline"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reintentar verificación</span>
          </button>
        </div>
      )}

      {!isTurnstileProductionConfigured && (
        <div className="text-[10px] text-slate-400 text-center">
          Entorno de verificación: Modo protegido (Testing / Dev)
        </div>
      )}
    </div>
  );
};
