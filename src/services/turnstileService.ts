import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface TurnstileVerificationResult {
  success: boolean;
  message?: string;
  challenge_ts?: string;
  hostname?: string;
}

export interface TurnstileRenderOptions {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (err?: any) => void;
  size?: 'normal' | 'compact' | 'flexible';
}

export interface TurnstileApi {
  render: (container: HTMLElement | string, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  getResponse?: (widgetId?: string) => string | undefined;
  isExpired?: (widgetId?: string) => boolean;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __olaTurnstileCallback?: () => void;
  }
}

// Cloudflare Turnstile Site Key configuration
// Cloudflare official test keys:
// 1x00000000000000000000AA : Always passes (recommended test key)
// 2x00000000000000000000AB : Always blocks
const ENV_TURNSTILE_SITE_KEY =
  import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY ||
  import.meta.env.VITE_TURNSTILE_SITE_KEY;
export const CLOUDFLARE_TEST_SITE_KEY = '1x00000000000000000000AA';

export const TURNSTILE_SITE_KEY =
  ENV_TURNSTILE_SITE_KEY && ENV_TURNSTILE_SITE_KEY.length > 10
    ? ENV_TURNSTILE_SITE_KEY
    : CLOUDFLARE_TEST_SITE_KEY;

export const isTurnstileProductionConfigured = Boolean(
  ENV_TURNSTILE_SITE_KEY &&
  ENV_TURNSTILE_SITE_KEY !== CLOUDFLARE_TEST_SITE_KEY &&
  ENV_TURNSTILE_SITE_KEY.length > 10
);

export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__olaTurnstileCallback&render=explicit';

let turnstileLoaderPromise: Promise<TurnstileApi> | null = null;

/**
 * Singleton Turnstile script loader.
 * Loads Cloudflare Turnstile api.js using explicit render and resolves only when
 * window.turnstile.render is available. Never calls the ready method to avoid race
 * conditions with async/defer script tags.
 */
export function loadTurnstile(timeoutMs = 12000): Promise<TurnstileApi> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Turnstile loader requires a browser DOM environment.'));
  }

  // 1. If window.turnstile with render method already exists, resolve immediately
  if (window.turnstile && typeof window.turnstile.render === 'function') {
    return Promise.resolve(window.turnstile);
  }

  // 2. If already loading, return existing singleton promise
  if (turnstileLoaderPromise) {
    return turnstileLoaderPromise;
  }

  turnstileLoaderPromise = new Promise<TurnstileApi>((resolve, reject) => {
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (pollInterval) clearInterval(pollInterval);
    };

    const tryResolve = () => {
      if (window.turnstile && typeof window.turnstile.render === 'function') {
        cleanup();
        resolve(window.turnstile);
        return true;
      }
      return false;
    };

    if (tryResolve()) return;

    // Callback fired by Cloudflare Turnstile upon initialization
    window.__olaTurnstileCallback = () => {
      if (tryResolve()) return;
      let attempts = 0;
      const callbackPoll = setInterval(() => {
        attempts++;
        if (tryResolve() || attempts > 20) {
          clearInterval(callbackPoll);
        }
      }, 50);
    };

    // Check if script tag is already attached
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]'
    );

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        cleanup();
        turnstileLoaderPromise = null;
        reject(new Error('Error de red al cargar Cloudflare Turnstile.'));
      };

      document.head.appendChild(script);
    }

    // Polling fallback
    pollInterval = setInterval(() => {
      tryResolve();
    }, 100);

    timeoutTimer = setTimeout(() => {
      cleanup();
      if (!tryResolve()) {
        turnstileLoaderPromise = null;
        reject(new Error('Tiempo de espera agotado al cargar Cloudflare Turnstile.'));
      }
    }, timeoutMs);
  });

  return turnstileLoaderPromise;
}


/**
 * Validates a Cloudflare Turnstile token server-side via Supabase Edge Function
 * ensuring that the client cannot bypass human verification.
 */
export async function verifyTurnstileTokenServerSide(
  token: string
): Promise<TurnstileVerificationResult> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return {
      success: false,
      message: 'Token de verificación humana inválido o no recibido.'
    };
  }

  try {
    const cleanToken = token.trim();

    // In local development, utilize local dev server verification middleware (/api/verify-turnstile)
    if (import.meta.env.DEV) {
      try {
        const response = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: cleanToken })
        });

        if (response.ok) {
          const result = await response.json();
          if (result && typeof result.success === 'boolean') {
            return {
              success: result.success,
              message: result.success
                ? 'Verificación humana completada exitosamente.'
                : 'Verificación de seguridad no superada.',
              challenge_ts: result.challenge_ts,
              hostname: result.hostname
            };
          }
        }
      } catch (devErr) {
        console.warn('Local verify-turnstile middleware error, attempting Edge Function fallback:', devErr);
      }
    }

    // Primary Production: Verify via Supabase Edge Function 'verify-turnstile'
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-turnstile', {
          body: { token: cleanToken }
        });

        if (!error && data && typeof data.success === 'boolean') {
          return {
            success: data.success,
            message: data.success ? 'Verificación humana completada.' : (data.error || 'Fallo de verificación.'),
            challenge_ts: data.challenge_ts,
            hostname: data.hostname
          };
        }

        if (error) {
          console.warn('Supabase Edge Function verify-turnstile reported error:', error);
          const errorMsg = String(error.message || error);
          if (errorMsg.includes('404') || errorMsg.includes('Failed to send a request') || (error as any).status === 404) {
            return {
              success: false,
              message: 'La función verify-turnstile no está desplegada en Supabase (404). Despliégala con: npx supabase functions deploy verify-turnstile --project-ref ocyjnplyywvctqikjrrh --no-verify-jwt'
            };
          }
        }
      } catch (edgeErr: any) {
        console.warn('Supabase Edge Function verify-turnstile unavailable, attempting fallback:', edgeErr);
      }
    }

    // Secondary fallback: Verify via backend API endpoint (/api/verify-turnstile)
    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken })
      });

      if (response.ok) {
        const result = await response.json();
        if (result && typeof result.success === 'boolean') {
          return {
            success: result.success,
            message: result.success
              ? 'Verificación humana completada exitosamente.'
              : 'Verificación de seguridad no superada.',
            challenge_ts: result.challenge_ts,
            hostname: result.hostname
          };
        }
      }
    } catch {
      // Backend middleware not reachable
    }

    return {
      success: false,
      message: 'No se pudo contactar al servidor de verificación de Cloudflare. Reintente en un momento.'
    };
  } catch (err: any) {
    console.error('Error invoking turnstile verification:', err);
    return {
      success: false,
      message: 'Error de comunicación con el servicio de verificación humana.'
    };
  }
}
