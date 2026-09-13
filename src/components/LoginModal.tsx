import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, AlertTriangle, X, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OlaLogo } from './OlaLogo';
import { TurnstileWidget } from './TurnstileWidget';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, isLoading, authError } = useAuth();

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isVerified = Boolean(turnstileToken);

  const handleGoogleClick = async () => {
    if (!isVerified) {
      setTurnstileError('Primero debes completar la verificación humana.');
      return;
    }

    try {
      setIsRedirecting(true);
      await loginWithGoogle();
    } catch (err: any) {
      setIsRedirecting(false);
      setTurnstileError(err.message || 'No fue posible iniciar sesión con Google.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Brand Logo */}
        <div className="mb-3">
          <OlaLogo variant="hero" animate={true} className="p-0" />
        </div>

        <div className="space-y-1 mb-5">
          <h3 className="text-xl font-extrabold text-slate-900">Acceder a OLA SOCIAL</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Comunidad humana de creadores auténticos. Sin bots, sin automatizaciones engañosas.
          </p>
        </div>

        {/* Turnstile Human Verification */}
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

        {/* Error Notification */}
        {(turnstileError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{turnstileError || authError}</span>
          </div>
        )}

        {/* Google OAuth Button with Strict Human Check Barrier */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={!isVerified || isLoading || isRedirecting}
            onClick={handleGoogleClick}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-3 relative ${
              isVerified && !isLoading && !isRedirecting
                ? 'bg-white border-2 border-slate-300 hover:border-sky-500 hover:bg-slate-50 text-slate-800 hover:shadow-lg active:scale-98 cursor-pointer'
                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            {isRedirecting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Redirigiendo a Google...</span>
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

          {!isVerified && (
            <p className="text-[11px] text-amber-700/90 font-medium">
              El botón de Google se activará al superar la verificación humana.
            </p>
          )}

          {isVerified && (
            <p className="text-[11px] text-emerald-700 font-semibold">
              ✓ Verificación humana lista. Pulsa para autenticar con Google.
            </p>
          )}
        </div>

        {/* Security and Privacy Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Autenticación protegida con Supabase Auth & Google OAuth 2.0</span>
        </div>
      </div>
    </div>
  );
};
