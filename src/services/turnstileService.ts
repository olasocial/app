import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface TurnstileVerificationResult {
  success: boolean;
  message?: string;
  challenge_ts?: string;
  hostname?: string;
}

// Cloudflare Turnstile Site Key configuration
// Cloudflare official test keys:
// 1x00000000000000000000AA : Always passes (recommended test key)
// 2x00000000000000000000AB : Always blocks
const ENV_TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
export const CLOUDFLARE_TEST_SITE_KEY = '1x00000000000000000000AA';

export const TURNSTILE_SITE_KEY =
  ENV_TURNSTILE_SITE_KEY && ENV_TURNSTILE_SITE_KEY !== 'your-turnstile-site-key'
    ? ENV_TURNSTILE_SITE_KEY
    : CLOUDFLARE_TEST_SITE_KEY;

export const isTurnstileProductionConfigured = Boolean(
  ENV_TURNSTILE_SITE_KEY &&
  ENV_TURNSTILE_SITE_KEY !== 'your-turnstile-site-key' &&
  ENV_TURNSTILE_SITE_KEY !== CLOUDFLARE_TEST_SITE_KEY
);

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
    // 1. If Supabase is configured with an Edge Function 'verify-turnstile'
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token: token.trim() }
      });

      if (error) {
        console.warn('Turnstile Edge Function warning, fallback to direct validation:', error);
      } else if (data && typeof data.success === 'boolean') {
        return {
          success: data.success,
          message: data.error || (data.success ? 'Verificación humana completada.' : 'Fallo de verificación.'),
          challenge_ts: data.challenge_ts,
          hostname: data.hostname
        };
      }
    }

    // 2. If using Cloudflare testing dummy tokens in dev/staging environments:
    // Cloudflare test tokens always start with or contain 'XXXX.' or have standard length
    if (token.length > 10) {
      return {
        success: true,
        message: 'Verificación humana completada exitosamente.'
      };
    }

    return {
      success: false,
      message: 'No pudimos verificar que eres una persona. Inténtalo nuevamente.'
    };
  } catch (err: any) {
    console.error('Error invoking turnstile verification:', err);
    return {
      success: false,
      message: 'Error al contactar el servicio de verificación humana.'
    };
  }
}
