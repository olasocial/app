import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  TURNSTILE_SITE_KEY,
  verifyTurnstileTokenServerSide,
  isTurnstileProductionConfigured
} from '../services/turnstileService';

interface TurnstileWidgetProps {
  onVerifySuccess: (token: string) => void;
  onVerifyExpired: () => void;
  onVerifyError: (errorMsg: string) => void;
}

export type TurnstileState = 'IDLE' | 'VERIFYING' | 'VERIFIED' | 'EXPIRED' | 'ERROR';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (err: any) => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerifySuccess,
  onVerifyExpired,
  onVerifyError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [state, setState] = useState<TurnstileState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;

      try {
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        const id = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          callback: async (token: string) => {
            if (!isMounted) return;
            setState('VERIFYING');
            setErrorMessage(null);

            // Server-side verification
            const verifyResult = await verifyTurnstileTokenServerSide(token);
            if (!isMounted) return;

            if (verifyResult.success) {
              setState('VERIFIED');
              onVerifySuccess(token);
            } else {
              setState('ERROR');
              const err = verifyResult.message || 'No pudimos verificar que eres una persona.';
              setErrorMessage(err);
              onVerifyError(err);
            }
          },
          'expired-callback': () => {
            if (!isMounted) return;
            setState('EXPIRED');
            setErrorMessage('La verificación humana expiró. Completa nuevamente la verificación.');
            onVerifyExpired();
          },
          'error-callback': (err: any) => {
            if (!isMounted) return;
            setState('ERROR');
            const errText = 'Error en el widget de verificación humana. Inténtalo de nuevo.';
            setErrorMessage(errText);
            onVerifyError(errText);
          }
        });

        widgetIdRef.current = id;
      } catch (e) {
        console.error('Turnstile render error:', e);
      }
    };

    // Check if turnstile script is already present
    const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
    if (window.turnstile) {
      renderWidget();
    } else if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) renderWidget();
      };
      script.onerror = () => {
        if (isMounted) {
          setState('ERROR');
          setErrorMessage('No se pudo cargar Cloudflare Turnstile. Comprueba tu conexión.');
          onVerifyError('No se pudo cargar Cloudflare Turnstile.');
        }
      };
      document.head.appendChild(script);
    } else {
      // Script is loading
      existingScript.addEventListener('load', () => {
        if (isMounted) renderWidget();
      });
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [onVerifySuccess, onVerifyExpired, onVerifyError]);

  const handleManualRetry = () => {
    setState('IDLE');
    setErrorMessage(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
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
