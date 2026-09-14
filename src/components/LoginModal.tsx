import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  Loader2,
  KeyRound,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OlaLogo } from './OlaLogo';
import { TurnstileWidget } from './TurnstileWidget';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    loginWithGoogle,
    verifyMfaCode,
    mfaNeedsVerification,
    isLoading,
    authError,
    clearAuthError
  } = useAuth();

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');

  // Check URL or storage for invite ref code
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Search in URL query or hash
    const params = new URLSearchParams(window.location.search);
    let code = params.get('ref');

    if (!code && window.location.hash.includes('?')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
      code = hashParams.get('ref');
    }

    if (code) {
      const cleanCode = code.trim().toUpperCase();
      setInviteCode(cleanCode);
      sessionStorage.setItem('ola_ref_code', cleanCode);
    } else {
      const stored = sessionStorage.getItem('ola_ref_code');
      if (stored) setInviteCode(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isVerified = Boolean(turnstileToken);

  const handleGoogleClick = async () => {
    if (!isVerified) {
      setTurnstileError('Primero debes completar la verificación humana de Cloudflare.');
      return;
    }

    try {
      setIsSubmitting(true);
      clearAuthError();
      await loginWithGoogle();
    } catch (err: any) {
      setIsSubmitting(false);
      setTurnstileError(err?.message || 'No fue posible conectar con Google OAuth.');
    }
  };

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length < 6) return;

    setIsSubmitting(true);
    clearAuthError();

    try {
      const verified = await verifyMfaCode(totpCode.trim());
      if (verified) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-100 relative text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Brand Logo */}
        <div className="mb-3">
          <OlaLogo variant="hero" animate={true} className="p-0" />
        </div>

        <div className="space-y-1 mb-5">
          <h3 className="text-xl font-extrabold text-slate-900">
            Acceder a OLA SOCIAL
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            "Crece junto a una comunidad real." Identidad única respaldada por Google OAuth sin cuentas duplicadas ni bots.
          </p>
        </div>

        {/* Invitation Referral Badge if present */}
        {inviteCode && (
          <div className="mb-4 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Invitación activa: <strong className="font-mono text-teal-700">{inviteCode}</strong></span>
          </div>
        )}

        {/* Turnstile Human Verification (Mandatory Bot Barrier) */}
        <div className="mb-5">
          <TurnstileWidget
            onVerifySuccess={(token) => {
              setTurnstileToken(token);
              setTurnstileError(null);
            }}
            onVerifyExpired={() => {
              setTurnstileToken(null);
              setTurnstileError('La verificación humana expiró. Completa nuevamente el desafío.');
            }}
            onVerifyError={(err) => {
              setTurnstileToken(null);
              setTurnstileError(err);
            }}
          />
        </div>

        {/* Notifications & Error feedback */}
        {(turnstileError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{turnstileError || authError}</span>
          </div>
        )}

        {/* 2FA TOTP CHALLENGE (If user session requires second factor) */}
        {mfaNeedsVerification ? (
          <form onSubmit={handleTotpVerify} className="space-y-4 text-left">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Verificación en Dos Pasos (2FA TOTP)</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Abre tu aplicación autenticadora (Google Authenticator, Authy) e introduce el código de 6 dígitos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 text-center">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-widest font-mono font-bold py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={totpCode.length < 6 || isSubmitting}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                totpCode.length === 6 && !isSubmitting
                  ? 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando código TOTP...</span>
                </>
              ) : (
                <span>Validar y Entrar</span>
              )}
            </button>
          </form>
        ) : (
          /* SOLE AUTHENTICATION METHOD: GOOGLE OAUTH */
          <div className="space-y-3">
            <button
              type="button"
              id="google-oauth-login-button"
              disabled={!isVerified || isLoading || isSubmitting}
              onClick={handleGoogleClick}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-3 relative ${
                isVerified && !isLoading && !isSubmitting
                  ? 'bg-white border-2 border-slate-300 hover:border-sky-500 hover:bg-slate-50 text-slate-800 hover:shadow-lg active:scale-98 cursor-pointer'
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Conectando con Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </>
              )}
            </button>

            {!isVerified ? (
              <p className="text-[11px] text-amber-700/90 font-medium text-center">
                El botón se activará al completar la verificación humana de arriba.
              </p>
            ) : (
              <p className="text-[11px] text-emerald-700 font-semibold text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verificación humana completada. Listo para continuar.</span>
              </p>
            )}
          </div>
        )}

        {/* Security and Single-Identity Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Autenticación oficial Supabase Auth • Google OAuth • Una persona = Una cuenta</span>
        </div>
      </div>
    </div>
  );
};
